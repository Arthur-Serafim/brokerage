import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const password = await bcrypt.hash("password123", 10);

  // Create user
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: { 
      email: "test@example.com", 
      password 
    },
  });

  console.log("👤 Created user:", user.email);

  // Create symbols
  const symbols = [
    { symbol: "AAPL", name: "Apple Inc.", price: 182.45 },
    { symbol: "TSLA", name: "Tesla Inc.", price: 248.11 },
    { symbol: "NVDA", name: "NVIDIA Corp.", price: 465.3 },
    { symbol: "AMZN", name: "Amazon.com Inc.", price: 128.4 },
    { symbol: "GOOGL", name: "Alphabet Inc.", price: 139.92 },
    { symbol: "MSFT", name: "Microsoft Corp.", price: 378.91 },
  ];

  for (const s of symbols) {
    await prisma.symbol.upsert({
      where: { symbol: s.symbol },
      update: { price: s.price },
      create: s,
    });
    console.log("📈 Created symbol:", s.symbol);
  }

  // Create balance history
  const existingBalances = await prisma.balance.count({ 
    where: { userId: user.id } 
  });
  
  if (existingBalances === 0) {
    const now = new Date();
    await prisma.balance.createMany({
      data: [
        { 
          userId: user.id, 
          balance: 12500, 
          date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
        },
        { 
          userId: user.id, 
          balance: 13200, 
          date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
        },
        { 
          userId: user.id, 
          balance: 14100, 
          date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) // yesterday
        },
        { 
          userId: user.id, 
          balance: 15300, 
          date: now // today
        },
      ],
    });
    console.log("💰 Created balance history for user");
  }

  // Create positions
  const existingPositions = await prisma.position.count({ 
    where: { userId: user.id } 
  });

  if (existingPositions === 0) {
    await prisma.position.createMany({
      data: [
        {
          userId: user.id,
          symbol: "AAPL",
          name: "Apple Inc.",
          shares: 10,
          avgPrice: 175.50,
          currentPrice: 182.45,
        },
        {
          userId: user.id,
          symbol: "TSLA",
          name: "Tesla Inc.",
          shares: 5,
          avgPrice: 240.00,
          currentPrice: 248.11,
        },
        {
          userId: user.id,
          symbol: "NVDA",
          name: "NVIDIA Corp.",
          shares: 3,
          avgPrice: 450.00,
          currentPrice: 465.30,
        },
      ],
    });
    console.log("📊 Created positions for user");
  }

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });