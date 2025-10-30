import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const user = await getCurrentUser(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { positionId, shares } = await req.json();

    if (!positionId || !shares || shares <= 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    if (!Number.isInteger(shares)) {
      return NextResponse.json(
        { error: "Shares must be a whole number" },
        { status: 400 }
      );
    }

    const position = await prisma.position.findUnique({
      where: { id: positionId },
    });

    if (!position || position.userId !== user.id) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      );
    }

    if (position.shares < shares) {
      return NextResponse.json(
        {
          error: "Insufficient shares",
          details: {
            requested: shares,
            available: position.shares,
          },
        },
        { status: 400 }
      );
    }

    const saleValue = position.currentPrice * shares;

    if (position.shares === shares) {
      await prisma.position.delete({
        where: { id: positionId },
      });
    } else {
      await prisma.position.update({
        where: { id: positionId },
        data: {
          shares: position.shares - shares,
        },
      });
    }

    const latestWalletBalance = await prisma.walletBalance.findFirst({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });

    if (!latestWalletBalance) {
      return NextResponse.json(
        { error: "No wallet balance found" },
        { status: 400 }
      );
    }

    const newWalletBalance = latestWalletBalance.balance + saleValue;
    await prisma.walletBalance.create({
      data: {
        userId: user.id,
        balance: newWalletBalance,
        date: new Date(),
      },
    });

    const latestBrokerageValue = await prisma.brokerageValue.findFirst({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });

    const newBrokerageValue = Math.max(
      0,
      (latestBrokerageValue?.value || 0) - saleValue
    );
    await prisma.brokerageValue.create({
      data: {
        userId: user.id,
        value: newBrokerageValue,
        date: new Date(),
      },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "SELL",
        symbol: position.symbol,
        shares,
        pricePerShare: position.currentPrice,
        amount: saleValue,
        from: "BROKERAGE",
        to: "WALLET",
        description: `Sold ${shares} shares of ${position.symbol} at $${position.currentPrice.toFixed(2)} per share`,
      },
    });

    return NextResponse.json({
      success: true,
      newWalletBalance,
      newBrokerageValue,
      sale: {
        symbol: position.symbol,
        shares,
        pricePerShare: position.currentPrice,
        totalValue: saleValue,
      },
    });
  } catch (error) {
    console.error("Sell error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}