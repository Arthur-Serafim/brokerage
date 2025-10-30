"use client";

import { useState } from "react";
import { useBrokerage } from "@/hooks/use-brokerage";
import { useSymbols } from "@/hooks/use-symbols";
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
import { TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/contexts/AuthContext";

export default function Home() {
  const { user: authUser, isLoading: authLoading } = useMe();
  const { user, buyAsset } = useBrokerage();
  const {
    data: symbolsData,
    isLoading: symbolsLoading,
    isError,
  } = useSymbols();

  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [shares, setShares] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  if (authLoading) {
    return (
      <main className="p-10">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  if (!authUser || !user) {
    return null;
  }

  const balanceHistory = user.balanceHistory;

  if (balanceHistory.length === 0) {
    return (
      <main className="p-10">
        <p>No balance history found.</p>
      </main>
    );
  }

  const totalBalance = balanceHistory[balanceHistory.length - 1].balance;
  const dailyChange =
    balanceHistory.length > 1
      ? balanceHistory[balanceHistory.length - 1].balance -
        balanceHistory[balanceHistory.length - 2].balance
      : 0;
  const changePct =
    balanceHistory.length > 1
      ? (
          (dailyChange / balanceHistory[balanceHistory.length - 2].balance) *
          100
        ).toFixed(2)
      : "0.00";

  const handleBuy = () => {
    const selected = symbolsData?.data.find((s) => s.symbol === selectedSymbol);
    if (!selected) return;

    buyAsset(selected.symbol, selected.name, selected.price, Number(shares));

    setSelectedSymbol("");
    setShares("");
    setDialogOpen(false);
  };

  return (
    <main className="p-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Your brokerage wallet overview
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 md:mt-0">Buy Assets</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buy Asset</DialogTitle>
            </DialogHeader>

            <div className="space-y-2 py-2">
              {symbolsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : isError ? (
                <p className="text-red-500">Failed to load symbols.</p>
              ) : (
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="w-full border rounded p-2"
                >
                  <option value="">Select Symbol</option>
                  {symbolsData?.data.map((s) => (
                    <option key={s.symbol} value={s.symbol}>
                      {s.symbol} — {s.name} (${s.price.toFixed(2)})
                    </option>
                  ))}
                </select>
              )}

              <Input
                placeholder="Shares"
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button onClick={handleBuy} disabled={!selectedSymbol || !shares}>
                Confirm Purchase
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Wallet Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Wallet Balance</CardTitle>
          <div
            className={`flex items-center gap-2 text-sm font-medium ${
              Number(changePct) >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            {Number(changePct) >= 0 ? "+" : ""}
            {changePct}%
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-4">
            ${totalBalance.toLocaleString()}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={balanceHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickLine={false} />
              <YAxis tickLine={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="black"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {user.positions.length === 0 ? (
            <p className="text-muted-foreground">
              No positions yet. Buy some assets to get started!
            </p>
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
                {user.positions.map((p) => {
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
