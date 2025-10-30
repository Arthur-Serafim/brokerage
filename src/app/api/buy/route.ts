import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import currency from "currency.js";
import { Prisma } from "@prisma/client";

const USD = (value: number) => currency(value, { precision: 2 });

// Custom error classes
class InsufficientFundsError extends Error {
  constructor(
    public required: number,
    public available: number,
    public shortfall: number
  ) {
    super("Insufficient funds");
    this.name = "InsufficientFundsError";
  }
}

class WalletNotFoundError extends Error {
  constructor() {
    super("No wallet balance found. Please contact support.");
    this.name = "WalletNotFoundError";
  }
}

const buyAssetSchema = z.object({
  symbol: z
    .string()
    .min(1, "Symbol is required")
    .max(10, "Symbol must be 10 characters or less")
    .regex(/^[A-Z]+$/, "Symbol must contain only uppercase letters"),
  name: z.string().min(1, "Name is required"),
  price: z
    .number()
    .positive("Price must be positive")
    .finite("Price must be a valid number"),
  shares: z
    .number()
    .int("Shares must be a whole number")
    .positive("Shares must be positive"),
});

export async function POST(req: Request) {
  const user = await getCurrentUser(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validation = buyAssetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { symbol, name, price, shares } = validation.data;

    const result = await prisma.$transaction(
      async (tx) => {
        const pricePerShare = USD(price);
        const totalCost = pricePerShare.multiply(shares);

        // Get and lock wallet balance to prevent race conditions
        const latestWalletBalance = await tx.walletBalance.findFirst({
          where: { userId: user.id },
          orderBy: { date: "desc" },
        });

        if (!latestWalletBalance) {
          throw new WalletNotFoundError();
        }

        const availableBalance = USD(latestWalletBalance.balance);

        if (availableBalance.value < totalCost.value) {
          const shortfall = totalCost.subtract(availableBalance);
          throw new InsufficientFundsError(
            totalCost.value,
            availableBalance.value,
            shortfall.value
          );
        }

        // Handle position update/creation
        const existingPosition = await tx.position.findFirst({
          where: { userId: user.id, symbol },
        });

        if (existingPosition) {
          const existingAvgPrice = USD(existingPosition.avgPrice);
          const existingShares = existingPosition.shares;
          const totalShares = existingShares + shares;

          const existingValue = existingAvgPrice.multiply(existingShares);
          const totalValue = existingValue.add(totalCost);
          const newAvgPrice = totalValue.divide(totalShares);

          await tx.position.update({
            where: { id: existingPosition.id },
            data: {
              shares: totalShares,
              avgPrice: newAvgPrice.value,
              currentPrice: pricePerShare.value,
            },
          });
        } else {
          await tx.position.create({
            data: {
              userId: user.id,
              symbol,
              name,
              shares,
              avgPrice: pricePerShare.value,
              currentPrice: pricePerShare.value,
            },
          });
        }

        // Update wallet balance
        const newWalletBalance = availableBalance.subtract(totalCost);
        await tx.walletBalance.create({
          data: {
            userId: user.id,
            balance: newWalletBalance.value,
            date: new Date(),
          },
        });

        // Update brokerage value
        const latestBrokerageValue = await tx.brokerageValue.findFirst({
          where: { userId: user.id },
          orderBy: { date: "desc" },
        });

        const currentBrokerageValue = USD(latestBrokerageValue?.value || 0);
        const newBrokerageValue = currentBrokerageValue.add(totalCost);

        await tx.brokerageValue.create({
          data: {
            userId: user.id,
            value: newBrokerageValue.value,
            date: new Date(),
          },
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            userId: user.id,
            type: "BUY",
            symbol,
            shares,
            pricePerShare: pricePerShare.value,
            amount: totalCost.value,
            from: "WALLET",
            to: "BROKERAGE",
            description: `Bought ${shares} shares of ${symbol} at ${pricePerShare.format()} per share`,
          },
        });

        return {
          newWalletBalance: newWalletBalance.value,
          newBrokerageValue: newBrokerageValue.value,
          purchase: {
            symbol,
            shares,
            pricePerShare: pricePerShare.value,
            totalCost: totalCost.value,
          },
        };
      },
      {
        maxWait: 5000, // 5 seconds max wait
        timeout: 10000, // 10 seconds timeout
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Buy error:", error);

    if (error instanceof InsufficientFundsError) {
      return NextResponse.json(
        {
          error: error.message,
          details: {
            required: error.required,
            available: error.available,
            shortfall: error.shortfall,
          },
        },
        { status: 400 }
      );
    }

    if (error instanceof WalletNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}