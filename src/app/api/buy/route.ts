import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const user = await getCurrentUser(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { symbol, name, price, shares } = await req.json();

    // Validate input
    if (!symbol || !name || !price || !shares || shares <= 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    if (!Number.isInteger(shares)) {
      return NextResponse.json(
        { error: "Shares must be a whole number" },
        { status: 400 }
      );
    }

    const totalCost = price * shares;

    // Get current wallet balance
    const latestWalletBalance = await prisma.walletBalance.findFirst({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });

    if (!latestWalletBalance) {
      return NextResponse.json(
        { error: "No wallet balance found. Please contact support." },
        { status: 400 }
      );
    }

    // CRITICAL: Validate sufficient funds
    if (latestWalletBalance.balance < totalCost) {
      return NextResponse.json(
        {
          error: "Insufficient funds",
          details: {
            required: totalCost,
            available: latestWalletBalance.balance,
            shortfall: totalCost - latestWalletBalance.balance,
          },
        },
        { status: 400 }
      );
    }

    // Check if position exists
    const existingPosition = await prisma.position.findFirst({
      where: { userId: user.id, symbol },
    });

    if (existingPosition) {
      // Update existing position
      const totalShares = existingPosition.shares + shares;
      const totalValue =
        existingPosition.avgPrice * existingPosition.shares + totalCost;
      const newAvgPrice = totalValue / totalShares;

      await prisma.position.update({
        where: { id: existingPosition.id },
        data: {
          shares: totalShares,
          avgPrice: newAvgPrice,
          currentPrice: price,
        },
      });
    } else {
      // Create new position
      await prisma.position.create({
        data: {
          userId: user.id,
          symbol,
          name,
          shares,
          avgPrice: price,
          currentPrice: price,
        },
      });
    }

    // Update wallet balance (decrease)
    const newWalletBalance = latestWalletBalance.balance - totalCost;
    await prisma.walletBalance.create({
      data: {
        userId: user.id,
        balance: newWalletBalance,
        date: new Date(),
      },
    });

    // Get current brokerage value
    const latestBrokerageValue = await prisma.brokerageValue.findFirst({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });

    // Update brokerage value (increase)
    const newBrokerageValue = (latestBrokerageValue?.value || 0) + totalCost;
    await prisma.brokerageValue.create({
      data: {
        userId: user.id,
        value: newBrokerageValue,
        date: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      newWalletBalance,
      newBrokerageValue,
      purchase: {
        symbol,
        shares,
        pricePerShare: price,
        totalCost,
      },
    });
  } catch (error) {
    console.error("Buy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}