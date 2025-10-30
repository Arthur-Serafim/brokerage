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
import { useMemo } from "react";
import currency from "currency.js";

const COLORS = {
  wallet: "#3b82f6",
  brokerage: "#10b981",
} as const;

interface Position {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
}

const calculateChange = (
  data: Array<{ balance?: number; value?: number }>,
  key: "balance" | "value"
) => {
  if (data.length < 2) {
    return { current: 0, change: 0, changePct: "0.00" };
  }

  const currentValue = currency(data[data.length - 1][key] || 0);
  const previousValue = currency(data[data.length - 2][key] || 0);
  const changeValue = currentValue.subtract(previousValue);

  const changePercentage =
    previousValue.value > 0
      ? changeValue.divide(previousValue).multiply(100).format({ symbol: "" })
      : "0.00";

  return {
    current: currentValue.value,
    change: changeValue.value,
    changePct: changePercentage,
  };
};

export default function Home() {
  const { user: authUser, isLoading: authLoading } = useMe();
  const { user, buyAsset, sellPosition } = useBrokerage();
  const [, setDialogOperationType] = useQueryState("dialogOperationType");
  const [positionId, setPositionId] = useQueryState("positionId");

  const handleBuyAsset = (
    symbol: string,
    name: string,
    price: number,
    shares: number
  ) => {
    buyAsset(symbol, name, price, shares);
  };

  const handleSellClick = (position: Position) => {
    setPositionId(position.id);
    setDialogOperationType("sell");
  };

  const handleSell = async (positionId: string, shares: number) => {
    await sellPosition(positionId, shares);
  };

  // Memoize calculations
  const portfolioMetrics = useMemo(() => {
    if (!user) return null;

    const walletBalances = user.walletBalances || [];
    const brokerageValues = user.brokerageValues || [];
    const positions = user.positions || [];

    // Calculate wallet metrics
    const walletMetrics = calculateChange(walletBalances, "balance");

    // Calculate brokerage metrics
    const brokerageMetrics = calculateChange(brokerageValues, "value");

    // Calculate total portfolio
    const totalPortfolio = currency(walletMetrics.current).add(
      brokerageMetrics.current
    );

    // Calculate distribution
    const walletPercentage =
      totalPortfolio.value > 0
        ? currency(walletMetrics.current)
            .divide(totalPortfolio)
            .multiply(100)
            .format({ symbol: "" })
        : "0.0";

    const brokeragePercentage =
      totalPortfolio.value > 0
        ? currency(brokerageMetrics.current)
            .divide(totalPortfolio)
            .multiply(100)
            .format({ symbol: "" })
        : "0.0";

    const distributionData = [
      {
        name: "Wallet",
        value: walletMetrics.current,
        percentage: walletPercentage,
      },
      {
        name: "Brokerage",
        value: brokerageMetrics.current,
        percentage: brokeragePercentage,
      },
    ];

    // Calculate P&L for positions
    const positionsWithPnL = positions.map((position) => {
      const avgPrice = currency(position.avgPrice);
      const currentPrice = currency(position.currentPrice);
      const shares = position.shares;

      const totalCost = avgPrice.multiply(shares);
      const currentValue = currentPrice.multiply(shares);
      const profitAndLoss = currentValue.subtract(totalCost);

      const profitAndLossPercentage =
        totalCost.value > 0
          ? profitAndLoss.divide(totalCost).multiply(100).format({ symbol: "" })
          : "0.00";

      return {
        ...position,
        pnl: profitAndLoss.value,
        pnlPct: profitAndLossPercentage,
        isProfitable: profitAndLoss.value >= 0,
      };
    });

    return {
      wallet: walletMetrics,
      brokerage: brokerageMetrics,
      totalPortfolio: totalPortfolio.value,
      distributionData,
      positions: positionsWithPnL,
      hasData: walletBalances.length > 0 || brokerageValues.length > 0,
    };
  }, [user]);

  const selectedPosition = useMemo(
    () =>
      portfolioMetrics?.positions.find(
        (item) => item.id === positionId
      ) as Position,
    [positionId, portfolioMetrics]
  );

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

  if (!authUser || !user || !portfolioMetrics) {
    return null;
  }

  const walletBalances = user.walletBalances || [];
  const brokerageValues = user.brokerageValues || [];

  // Empty state
  if (!portfolioMetrics.hasData) {
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
          <Button size="lg" onClick={() => setDialogOperationType("buy")}>
            <ShoppingCart className="mr-2 h-5 w-5" />
            Buy Your First Asset
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-6 md:p-10 space-y-6">
      <BuyAssetDialog onBuy={handleBuyAsset} />
      <SellPositionDialog position={selectedPosition} onSell={handleSell} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your portfolio performance
          </p>
        </div>
        <Button onClick={() => setDialogOperationType("buy")}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Buy Assets
        </Button>
      </div>

      {/* Total Portfolio Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            <CardTitle>Total Portfolio Value</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <div className="text-4xl font-bold mb-2">
                  {currency(portfolioMetrics.totalPortfolio).format()}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total portfolio value
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS.wallet }}
                    />
                    <div>
                      <p className="font-medium">Wallet Balance</p>
                      <p className="text-sm text-muted-foreground">
                        {portfolioMetrics.distributionData[0].percentage}% of
                        portfolio
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {currency(portfolioMetrics.wallet.current).format()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS.brokerage }}
                    />
                    <div>
                      <p className="font-medium">Brokerage Value</p>
                      <p className="text-sm text-muted-foreground">
                        {portfolioMetrics.distributionData[1].percentage}% of
                        portfolio
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {currency(portfolioMetrics.brokerage.current).format()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              {portfolioMetrics.totalPortfolio > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={portfolioMetrics.distributionData}
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
                      formatter={(value: number) => [currency(value).format()]}
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

      <div className="grid md:grid-cols-2 gap-6">
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
                    Number(portfolioMetrics.wallet.changePct) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {Number(portfolioMetrics.wallet.changePct) >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>
                    {Number(portfolioMetrics.wallet.changePct) >= 0 ? "+" : ""}
                    {portfolioMetrics.wallet.changePct}%
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-6">
              {currency(portfolioMetrics.wallet.current).format()}
            </div>
            {walletBalances.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={walletBalances}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="timestamp"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(timestamp) =>
                      new Date(timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
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
                    formatter={(value: number) => [
                      currency(value).format(),
                      "Balance",
                    ]}
                    labelFormatter={(timestamp) =>
                      new Date(timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    }
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
                    Number(portfolioMetrics.brokerage.changePct) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {Number(portfolioMetrics.brokerage.changePct) >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>
                    {Number(portfolioMetrics.brokerage.changePct) >= 0
                      ? "+"
                      : ""}
                    {portfolioMetrics.brokerage.changePct}%
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-6">
              {currency(portfolioMetrics.brokerage.current).format()}
            </div>
            {brokerageValues.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={brokerageValues}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="timestamp"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(timestamp) =>
                      new Date(timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
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
                    formatter={(value: number) => [
                      currency(value).format(),
                      "Value",
                    ]}
                    labelFormatter={(timestamp) =>
                      new Date(timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    }
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {portfolioMetrics.positions.length === 0 ? (
            <div className="text-center py-16">
              <div className="rounded-full bg-muted/50 p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <LineChartIcon className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No positions yet</h3>
              <p className="text-muted-foreground mb-6">
                Start investing by buying your first asset
              </p>
              <Button onClick={() => setDialogOperationType("buy")}>
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
                  {portfolioMetrics.positions.map((position) => (
                    <TableRow key={position.id}>
                      <TableCell className="font-medium">
                        {position.symbol}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {position.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {position.shares}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {currency(position.avgPrice).format()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {currency(position.currentPrice).format()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className={`inline-flex flex-col items-end ${
                            position.isProfitable
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          <span className="font-semibold">
                            {position.isProfitable ? "+" : ""}
                            {currency(position.pnl).format()}
                          </span>
                          <span className="text-xs">
                            {position.isProfitable ? "+" : ""}
                            {position.pnlPct}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSellClick(position)}
                        >
                          <TrendingDown className="h-4 w-4 mr-1" />
                          Sell
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
