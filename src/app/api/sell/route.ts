import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import currency from "currency.js";
import { Prisma } from "@prisma/client";

const USD = (value: number) => currency(value, { precision: 2 });

class InsufficientSharesError extends Error {
  constructor(
    public requested: number,
    public available: number
  ) {
    super("Insufficient shares");
    this.name = "InsufficientSharesError";
  }
}

class PositionNotFoundError extends Error {
  constructor() {
    super("Position not found");
    this.name = "PositionNotFoundError";
  }
}

class WalletNotFoundError extends Error {
  constructor() {
    super("No wallet balance found. Please contact support.");
    this.name = "WalletNotFoundError";
  }
}

const sellAssetSchema = z.object({
  positionId: z.string().min(1, "Position ID is required"),
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
    const validation = sellAssetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { positionId, shares } = validation.data;

    const result = await prisma.$transaction(
      async (tx) => {
        // Get and validate position
        const position = await tx.position.findUnique({
          where: { id: positionId },
        });

        if (!position || position.userId !== user.id) {
          throw new PositionNotFoundError();
        }

        if (position.shares < shares) {
          throw new InsufficientSharesError(shares, position.shares);
        }

        // Calculate sale value using currency.js
        const pricePerShare = USD(position.currentPrice);
        const saleValue = pricePerShare.multiply(shares);

        // Update or delete position
        if (position.shares === shares) {
          await tx.position.delete({
            where: { id: positionId },
          });
        } else {
          await tx.position.update({
            where: { id: positionId },
            data: {
              shares: position.shares - shares,
            },
          });
        }

        // Get latest wallet balance
        const latestWalletBalance = await tx.walletBalance.findFirst({
          where: { userId: user.id },
          orderBy: { date: "desc" },
        });

        if (!latestWalletBalance) {
          throw new WalletNotFoundError();
        }

        // Update wallet balance
        const currentBalance = USD(latestWalletBalance.balance);
        const newWalletBalance = currentBalance.add(saleValue);

        await tx.walletBalance.create({
          data: {
            userId: user.id,
            balance: newWalletBalance.value,
            date: new Date(),
          },
        });

        // Get latest brokerage value
        const latestBrokerageValue = await tx.brokerageValue.findFirst({
          where: { userId: user.id },
          orderBy: { date: "desc" },
        });

        // Update brokerage value
        const currentBrokerageValue = USD(latestBrokerageValue?.value || 0);
        const newBrokerageValue = currentBrokerageValue.subtract(saleValue);
        const finalBrokerageValue = USD(Math.max(0, newBrokerageValue.value));

        await tx.brokerageValue.create({
          data: {
            userId: user.id,
            value: finalBrokerageValue.value,
            date: new Date(),
          },
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            userId: user.id,
            type: "SELL",
            symbol: position.symbol,
            shares,
            pricePerShare: pricePerShare.value,
            amount: saleValue.value,
            from: "BROKERAGE",
            to: "WALLET",
            description: `Sold ${shares} shares of ${position.symbol} at ${pricePerShare.format()} per share`,
          },
        });

        return {
          newWalletBalance: newWalletBalance.value,
          newBrokerageValue: finalBrokerageValue.value,
          sale: {
            symbol: position.symbol,
            shares,
            pricePerShare: pricePerShare.value,
            totalValue: saleValue.value,
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
    console.error("Sell error:", error);

    if (error instanceof InsufficientSharesError) {
      return NextResponse.json(
        {
          error: error.message,
          details: {
            requested: error.requested,
            available: error.available,
          },
        },
        { status: 400 }
      );
    }

    if (error instanceof PositionNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
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