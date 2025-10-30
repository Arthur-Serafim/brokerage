"use client";

import { useMarketstack } from "@/hooks/useMarketstack";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function TickersPage() {
  const { data, isLoading, isError } = useMarketstack("tickers", {
    limit: "50",
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold tracking-tight mb-6">
          Market Tickers
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-24 mb-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-40 mb-2" />
                <Skeleton className="h-4 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-60 text-red-500">
        <p className="font-medium">Failed to load tickers.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-semibold tracking-tight mb-6">
        Market Tickers
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.data.map((t) => (
          <Card
            key={t.symbol}
            className="hover:shadow-md transition-shadow duration-200"
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium">{t.symbol}</CardTitle>
              {t.exchange && <Badge variant="secondary">{t.exchange}</Badge>}
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
