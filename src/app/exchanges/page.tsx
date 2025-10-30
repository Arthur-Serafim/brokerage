"use client";

import { useMarketstack } from "@/hooks/useMarketstack";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExchangesPage() {
  const { data, isLoading, isError } = useMarketstack("exchanges", {
    limit: "50",
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold tracking-tight mb-6">
          Exchanges
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-28 mb-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
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
        <p className="font-medium">Failed to load exchanges.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-semibold tracking-tight mb-6">Exchanges</h1>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.data.map((ex) => (
          <Card
            key={ex.mic}
            className="hover:shadow-md transition-shadow duration-200"
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium">{ex.name}</CardTitle>
              {ex.acronym && <Badge variant="secondary">{ex.acronym}</Badge>}
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {ex.country || "Unknown Country"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                MIC: {ex.mic} {ex.city && `· ${ex.city}`}
              </p>
              {ex.website && (
                <a
                  href={ex.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline mt-2 inline-block"
                >
                  Visit Website
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
