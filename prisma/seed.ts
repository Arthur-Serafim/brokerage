import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const password = await bcrypt.hash("password123", 10);

  // Delete existing data for fresh seed
  console.log("🗑️  Cleaning existing data...");
  await prisma.position.deleteMany();
  await prisma.brokerageValue.deleteMany();
  await prisma.walletBalance.deleteMany();
  await prisma.symbol.deleteMany();
  await prisma.user.deleteMany();

  // Create user
  console.log("👤 Creating user...");
  const user = await prisma.user.create({
    data: {
      email: "test@example.com",
      password,
    },
  });
  console.log("✅ Created user:", user.email);

  // Create symbols
  console.log("📈 Creating symbols...");
  const symbols = [
    { symbol: "AAPL", name: "Apple Inc.", price: 182.45 },
    { symbol: "TSLA", name: "Tesla Inc.", price: 248.11 },
    { symbol: "NVDA", name: "NVIDIA Corp.", price: 465.3 },
    { symbol: "AMZN", name: "Amazon.com Inc.", price: 128.4 },
    { symbol: "GOOGL", name: "Alphabet Inc.", price: 139.92 },
    { symbol: "MSFT", name: "Microsoft Corp.", price: 378.91 },
  ];

  for (const s of symbols) {
    await prisma.symbol.create({
      data: s,
    });
    console.log(`  ✅ ${s.symbol} - ${s.name}`);
  }

  // Create wallet balance history (7 days) - starting with $100,000
  console.log("💰 Creating wallet balance history...");
  const now = new Date();
  const initialBalance = 100000;
  const walletBalances = [];
  
  for (let i = 6; i >= 0; i--) {
    const balance = initialBalance - i * 2000; // Decreasing from 100k to 88k
    walletBalances.push({
      userId: user.id,
      balance: balance,
      date: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
    });
  }

  await prisma.walletBalance.createMany({
    data: walletBalances,
  });
  
  const currentBalance = walletBalances[walletBalances.length - 1].balance;
  console.log(`✅ Created ${walletBalances.length} wallet balance entries`);
  console.log(`   Starting: $${initialBalance.toLocaleString()}`);
  console.log(`   Current:  $${currentBalance.toLocaleString()}`);

  // Create brokerage value history (7 days)
  console.log("📊 Creating brokerage value history...");
  const brokerageValues = [];
  
  for (let i = 6; i >= 0; i--) {
    brokerageValues.push({
      userId: user.id,
      value: (6 - i) * 2000, // Growing from 0 to 12k
      date: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
    });
  }

  await prisma.brokerageValue.createMany({
    data: brokerageValues,
  });
  
  const currentBrokerageValue = brokerageValues[brokerageValues.length - 1].value;
  console.log(`✅ Created ${brokerageValues.length} brokerage value entries`);
  console.log(`   Current value: $${currentBrokerageValue.toLocaleString()}`);

  // Create positions
  console.log("📊 Creating positions...");
  const positions = [
    {
      userId: user.id,
      symbol: "AAPL",
      name: "Apple Inc.",
      shares: 10,
      avgPrice: 175.5,
      currentPrice: 182.45,
    },
    {
      userId: user.id,
      symbol: "TSLA",
      name: "Tesla Inc.",
      shares: 5,
      avgPrice: 240.0,
      currentPrice: 248.11,
    },
    {
      userId: user.id,
      symbol: "NVDA",
      name: "NVIDIA Corp.",
      shares: 3,
      avgPrice: 450.0,
      currentPrice: 465.3,
    },
  ];

  await prisma.position.createMany({
    data: positions,
  });
  
  console.log(`✅ Created ${positions.length} positions`);
  positions.forEach(p => {
    const value = p.shares * p.currentPrice;
    console.log(`   ${p.symbol}: ${p.shares} shares = $${value.toLocaleString()}`);
  });

  console.log("\n✅ Seeding complete!");
  console.log("=" .repeat(50));
  console.log("📧 Login credentials:");
  console.log("   Email:    test@example.com");
  console.log("   Password: password123");
  console.log("=" .repeat(50));
  console.log("💰 Portfolio Summary:");
  console.log(`   Wallet Balance:    $${currentBalance.toLocaleString()}`);
  console.log(`   Brokerage Value:   $${currentBrokerageValue.toLocaleString()}`);
  console.log(`   Total Portfolio:   $${(currentBalance + currentBrokerageValue).toLocaleString()}`);
  console.log("=" .repeat(50));
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });