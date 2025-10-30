"use client";

import { useQueryState } from "nuqs";
import { useBrokerage } from "@/hooks/use-brokerage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  LineChart as LineChartIcon,
  ShoppingCart,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/contexts/AuthContext";
import { BuyAssetDialog } from "@/components/buy-asset-dialog";
import { SellPositionDialog } from "@/components/sell-position-dialog";
import { useState } from "react";

const COLORS = {
  wallet: "#3b82f6",
  brokerage: "#10b981",
};

interface Position {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
}

export default function Home() {
  const { user: authUser, isLoading: authLoading } = useMe();
  const { user, buyAsset, sellPosition } = useBrokerage();
  const [, setBuyDialog] = useQueryState("buy");
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(
    null
  );
  const [sellDialogOpen, setSellDialogOpen] = useState(false);

  const handleBuyAsset = (
    symbol: string,
    name: string,
    price: number,
    shares: number
  ) => {
    buyAsset(symbol, name, price, shares);
  };

  const handleSellClick = (position: Position) => {
    setSelectedPosition(position);
    setSellDialogOpen(true);
  };

  const handleSell = async (positionId: string, shares: number) => {
    await sellPosition(positionId, shares);
  };

  // Loading state
  if (authLoading) {
    return (
      <main className="max-w-7xl mx-auto p-6 md:p-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-64 w-full" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </main>
    );
  }

  if (!authUser || !user) {
    return null;
  }

  const walletBalances = user.walletBalances || [];
  const brokerageValues = user.brokerageValues || [];
  const positions = user.positions || [];

  // Complete empty state
  if (walletBalances.length === 0 && brokerageValues.length === 0) {
    return (
      <main className="max-w-7xl mx-auto p-6 md:p-10">
        <BuyAssetDialog onBuy={handleBuyAsset} />

        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="rounded-full bg-muted/50 p-8 mb-6">
            <ShoppingCart className="h-16 w-16 text-muted-foreground" />
          </div>
          <h2 className="text-3xl font-bold mb-3">Welcome to Marketstack</h2>
          <p className="text-muted-foreground text-center mb-8 max-w-md">
            Start your investment journey by buying your first asset
          </p>
          <Button size="lg" onClick={() => setBuyDialog("open")}>
            <ShoppingCart className="mr-2 h-5 w-5" />
            Buy Your First Asset
          </Button>
        </div>
      </main>
    );
  }

  // Calculations
  const currentWalletBalance =
    walletBalances.length > 0
      ? walletBalances[walletBalances.length - 1].balance
      : 0;
  const walletChange =
    walletBalances.length > 1
      ? walletBalances[walletBalances.length - 1].balance -
        walletBalances[walletBalances.length - 2].balance
      : 0;
  const walletChangePct =
    walletBalances.length > 1 &&
    walletBalances[walletBalances.length - 2].balance > 0
      ? (
          (walletChange / walletBalances[walletBalances.length - 2].balance) *
          100
        ).toFixed(2)
      : "0.00";

  const currentBrokerageValue =
    brokerageValues.length > 0
      ? brokerageValues[brokerageValues.length - 1].value
      : 0;
  const brokerageChange =
    brokerageValues.length > 1
      ? brokerageValues[brokerageValues.length - 1].value -
        brokerageValues[brokerageValues.length - 2].value
      : 0;
  const brokerageChangePct =
    brokerageValues.length > 1 &&
    brokerageValues[brokerageValues.length - 2].value > 0
      ? (
          (brokerageChange /
            brokerageValues[brokerageValues.length - 2].value) *
          100
        ).toFixed(2)
      : "0.00";

  const totalPortfolio = currentWalletBalance + currentBrokerageValue;

  // Portfolio distribution data
  const distributionData = [
    {
      name: "Wallet",
      value: currentWalletBalance,
      percentage:
        totalPortfolio > 0
          ? ((currentWalletBalance / totalPortfolio) * 100).toFixed(1)
          : "0",
    },
    {
      name: "Brokerage",
      value: currentBrokerageValue,
      percentage:
        totalPortfolio > 0
          ? ((currentBrokerageValue / totalPortfolio) * 100).toFixed(1)
          : "0",
    },
  ];

  return (
    <main className="max-w-7xl mx-auto p-6 md:p-10 space-y-6">
      <BuyAssetDialog onBuy={handleBuyAsset} />
      <SellPositionDialog
        position={selectedPosition}
        open={sellDialogOpen}
        onOpenChange={setSellDialogOpen}
        onSell={handleSell}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your portfolio performance
          </p>
        </div>
        <Button onClick={() => setBuyDialog("open")}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Buy Assets
        </Button>
      </div>

      {/* Total Portfolio with Distribution */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            <CardTitle>Total Portfolio Value</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Total value and breakdown */}
            <div className="space-y-6">
              <div>
                <div className="text-4xl font-bold mb-2">
                  $
                  {totalPortfolio.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total portfolio value
                </p>
              </div>

              <div className="space-y-4">
                {/* Wallet */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS.wallet }}
                    />
                    <div>
                      <p className="font-medium">Wallet Balance</p>
                      <p className="text-sm text-muted-foreground">
                        {distributionData[0].percentage}% of portfolio
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ${currentWalletBalance.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Brokerage */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS.brokerage }}
                    />
                    <div>
                      <p className="font-medium">Brokerage Value</p>
                      <p className="text-sm text-muted-foreground">
                        {distributionData[1].percentage}% of portfolio
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ${currentBrokerageValue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Pie chart */}
            <div className="flex items-center justify-center">
              {totalPortfolio > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell fill={COLORS.wallet} />
                      <Cell fill={COLORS.brokerage} />
                    </Pie>
                    <Tooltip
                      formatter={(value: number) =>
                        `$${value.toLocaleString()}`
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground">
                  <p>No portfolio data yet</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Wallet Balance Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Wallet Balance</CardTitle>
              </div>
              {walletBalances.length > 1 && (
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    Number(walletChangePct) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {Number(walletChangePct) >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>
                    {Number(walletChangePct) >= 0 ? "+" : ""}
                    {walletChangePct}%
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-6">
              ${currentWalletBalance.toLocaleString()}
            </div>
            {walletBalances.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={walletBalances}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke={COLORS.wallet}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Brokerage Value Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LineChartIcon className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Brokerage Value</CardTitle>
              </div>
              {brokerageValues.length > 1 && (
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    Number(brokerageChangePct) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {Number(brokerageChangePct) >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>
                    {Number(brokerageChangePct) >= 0 ? "+" : ""}
                    {brokerageChangePct}%
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-6">
              ${currentBrokerageValue.toLocaleString()}
            </div>
            {brokerageValues.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={brokerageValues}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={COLORS.brokerage}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <div className="text-center py-16">
              <div className="rounded-full bg-muted/50 p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <LineChartIcon className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No positions yet</h3>
              <p className="text-muted-foreground mb-6">
                Start investing by buying your first asset
              </p>
              <Button onClick={() => setBuyDialog("open")}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Buy Your First Asset
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Shares</TableHead>
                    <TableHead className="text-right">Avg. Price</TableHead>
                    <TableHead className="text-right">Current Price</TableHead>
                    <TableHead className="text-right">P&L</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((p) => {
                    const pnl = (p.currentPrice - p.avgPrice) * p.shares;
                    const pnlPct = (
                      (pnl / (p.avgPrice * p.shares)) *
                      100
                    ).toFixed(2);
                    const isProfitable = pnl >= 0;

                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.symbol}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {p.name}
                        </TableCell>
                        <TableCell className="text-right">{p.shares}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          ${p.avgPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${p.currentPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div
                            className={`inline-flex flex-col items-end ${
                              isProfitable ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            <span className="font-semibold">
                              {isProfitable ? "+" : ""}${pnl.toFixed(2)}
                            </span>
                            <span className="text-xs">
                              {isProfitable ? "+" : ""}
                              {pnlPct}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSellClick(p)}
                          >
                            <TrendingDown className="h-4 w-4 mr-1" />
                            Sell
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
