"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDownLeft,
  ArrowUpRight,
  History,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useTransactions } from "@/hooks/use-transactions";

export default function TransactionsPage() {
  const { data: transactions = [], isLoading } = useTransactions();

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto p-6 md:p-10 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-96 w-full" />
      </main>
    );
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "BUY":
        return <TrendingUp className="h-4 w-4" />;
      case "SELL":
        return <TrendingDown className="h-4 w-4" />;
      case "DEPOSIT":
        return <ArrowDownLeft className="h-4 w-4" />;
      case "WITHDRAWAL":
        return <ArrowUpRight className="h-4 w-4" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getTransactionBadgeVariant = (type: string) => {
    switch (type) {
      case "BUY":
        return "default";
      case "SELL":
        return "secondary";
      case "DEPOSIT":
        return "outline";
      case "WITHDRAWAL":
        return "outline";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFlowBadge = (from: string, to: string) => {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span className="font-medium">{from}</span>
        <ArrowUpRight className="h-3 w-3" />
        <span className="font-medium">{to}</span>
      </div>
    );
  };

  return (
    <main className="max-w-7xl mx-auto p-6 md:p-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Transaction History
        </h1>
        <p className="text-muted-foreground mt-1">
          View all your trading activity and transfers
        </p>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <CardTitle className="text-lg">All Transactions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-16">
              <div className="rounded-full bg-muted/50 p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <History className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                No transactions yet
              </h3>
              <p className="text-muted-foreground">
                Your transaction history will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Flow</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => {
                    const isMoneyIn = tx.to === "WALLET";
                    const amountColor = isMoneyIn
                      ? "text-green-600"
                      : "text-red-600";

                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(tx.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getTransactionBadgeVariant(tx.type)}
                            className="flex items-center gap-1 w-fit"
                          >
                            {getTransactionIcon(tx.type)}
                            <span>{tx.type}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{tx.description}</p>
                            {tx.symbol && tx.shares && (
                              <p className="text-sm text-muted-foreground">
                                {tx.shares} shares @ $
                                {tx.pricePerShare?.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getFlowBadge(tx.from, tx.to)}</TableCell>
                        <TableCell
                          className={`text-right font-semibold ${amountColor}`}
                        >
                          {isMoneyIn ? "+" : "-"}$
                          {tx.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
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
