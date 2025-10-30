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

    if (!symbol || !name || !price || !shares || shares <= 0) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    const totalCost = price * shares;

    // Get current balance
    const latestBalance = await prisma.balance.findFirst({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });

    if (!latestBalance || latestBalance.balance < totalCost) {
      return NextResponse.json(
        { error: "Insufficient funds" },
        { status: 400 }
      );
    }

    // Check if position exists
    const existingPosition = await prisma.position.findFirst({
      where: { userId: user.id, symbol },
    });

    if (existingPosition) {
      // Update existing position (calculate new average price)
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

    // Create new balance record
    const newBalance = latestBalance.balance - totalCost;
    await prisma.balance.create({
      data: {
        userId: user.id,
        balance: newBalance,
        date: new Date(),
      },
    });

    return NextResponse.json({ success: true, newBalance });
  } catch (error) {
    console.error("Buy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}