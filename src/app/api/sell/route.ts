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

    // Validate input
    if (!positionId || !shares || shares <= 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    if (!Number.isInteger(shares)) {
      return NextResponse.json(
        { error: "Shares must be a whole number" },
        { status: 400 }
      );
    }

    // Get the position
    const position = await prisma.position.findUnique({
      where: { id: positionId },
    });

    if (!position || position.userId !== user.id) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      );
    }

    // Validate sufficient shares
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

    // Calculate sale value (using current price)
    const saleValue = position.currentPrice * shares;

    // Update or delete position
    if (position.shares === shares) {
      // Sell all shares - delete position
      await prisma.position.delete({
        where: { id: positionId },
      });
    } else {
      // Partial sell - update position
      await prisma.position.update({
        where: { id: positionId },
        data: {
          shares: position.shares - shares,
        },
      });
    }

    // Get current wallet balance
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

    // Update wallet balance (increase)
    const newWalletBalance = latestWalletBalance.balance + saleValue;
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

    // Update brokerage value (decrease)
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