import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const symbols = await prisma.symbol.findMany({
    orderBy: { symbol: "asc" },
  });

  return NextResponse.json({ data: symbols });
}