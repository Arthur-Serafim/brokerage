"use client";

import { useMarketstack } from "@/hooks/useMarketstack";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function TimezonesPage() {
  const { data, isLoading, isError } = useMarketstack("timezones");

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold tracking-tight mb-6">
          Timezones
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-32 mb-2" />
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
        <p className="font-medium">Failed to load timezones.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-semibold tracking-tight mb-6">Timezones</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.data.map((tz) => (
          <Card
            key={tz.timezone}
            className="hover:shadow-md transition-shadow duration-200"
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium break-all">
                {tz.timezone}
              </CardTitle>
              <Badge variant="secondary">{tz.abbr}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                DST Abbreviation:{" "}
                <span className="font-medium text-foreground">
                  {tz.abbr_dst}
                </span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
