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
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/contexts/AuthContext";
import { BuyAssetDialog } from "@/components/buy-asset-dialog";

export default function Home() {
  const { user: authUser, isLoading: authLoading } = useMe();
  const { user, buyAsset } = useBrokerage();
  const [, setBuyDialog] = useQueryState("buy");

  const handleBuyAsset = (
    symbol: string,
    name: string,
    price: number,
    shares: number
  ) => {
    buyAsset(symbol, name, price, shares);
  };

  // Loading state
  if (authLoading) {
    return (
      <main className="p-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-32 mt-4 md:mt-0" />
        </div>
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </main>
    );
  }

  if (!authUser) {
    return null;
  }

  // Check if user data is still loading
  if (!user) {
    return (
      <main className="p-10 space-y-8">
        <Skeleton className="h-40 w-full" />
      </main>
    );
  }

  const walletBalances = user.walletBalances || [];
  const brokerageValues = user.brokerageValues || [];
  const positions = user.positions || [];

  // Complete empty state - no data at all
  if (walletBalances.length === 0 && brokerageValues.length === 0) {
    return (
      <main className="p-10">
        <BuyAssetDialog onBuy={handleBuyAsset} />

        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="rounded-full bg-muted p-6 mb-6">
            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome to Marketstack</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            You don't have any balance history yet. Start by buying your first
            asset to begin tracking your portfolio.
          </p>
          <Button size="lg" onClick={() => setBuyDialog("open")}>
            Buy Your First Asset
          </Button>
        </div>
      </main>
    );
  }

  // Wallet calculations
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

  // Brokerage calculations
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

  // Total portfolio
  const totalPortfolio = currentWalletBalance + currentBrokerageValue;

  return (
    <main className="p-10 space-y-8">
      {/* Buy Asset Dialog */}
      <BuyAssetDialog onBuy={handleBuyAsset} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Your brokerage wallet overview
          </p>
        </div>

        <Button className="mt-4 md:mt-0" onClick={() => setBuyDialog("open")}>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Buy Assets
        </Button>
      </div>

      {/* Total Portfolio */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">Total Portfolio Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">
            $
            {totalPortfolio.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div>
              <p className="text-muted-foreground">Wallet Balance</p>
              <p className="font-semibold">
                ${currentWalletBalance.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Brokerage Value</p>
              <p className="font-semibold">
                ${currentBrokerageValue.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wallet Balance Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              <CardTitle>Wallet Balance</CardTitle>
            </div>
            {walletBalances.length > 1 && (
              <div
                className={`flex items-center gap-2 text-sm font-medium ${
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
                {Number(walletChangePct) >= 0 ? "+" : ""}
                {walletChangePct}%
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-4">
              ${currentWalletBalance.toLocaleString()}
            </div>
            {walletBalances.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={walletBalances}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No wallet history yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Brokerage Value Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <LineChartIcon className="h-5 w-5" />
              <CardTitle>Brokerage Value</CardTitle>
            </div>
            {brokerageValues.length > 1 && (
              <div
                className={`flex items-center gap-2 text-sm font-medium ${
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
                {Number(brokerageChangePct) >= 0 ? "+" : ""}
                {brokerageChangePct}%
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-4">
              ${currentBrokerageValue.toLocaleString()}
            </div>
            {brokerageValues.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={brokerageValues}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No brokerage history yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <div className="text-center py-12">
              <div className="rounded-full bg-muted p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <LineChartIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No positions yet</h3>
              <p className="text-muted-foreground mb-4">
                Start investing by buying your first asset
              </p>
              <Button onClick={() => setBuyDialog("open")}>
                Buy Your First Asset
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Avg. Price</TableHead>
                  <TableHead className="text-right">Current Price</TableHead>
                  <TableHead className="text-right">P&L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((p) => {
                  const pnl = (p.currentPrice - p.avgPrice) * p.shares;
                  const pnlColor = pnl >= 0 ? "text-green-600" : "text-red-600";
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.symbol}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell className="text-right">{p.shares}</TableCell>
                      <TableCell className="text-right">
                        ${p.avgPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${p.currentPrice.toFixed(2)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${pnlColor}`}
                      >
                        {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
