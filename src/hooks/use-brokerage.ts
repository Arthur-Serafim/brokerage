"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMe } from "@/contexts/AuthContext";

interface Position {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
}

interface Balance {
  id: string;
  date: string;
  balance: number;
}

export function useBrokerage() {
  const { user } = useMe();
  const queryClient = useQueryClient();

  // Fetch positions
  const { data: positions = [] } = useQuery({
    queryKey: ["positions"],
    queryFn: async () => {
      const res = await fetch("/api/positions", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch positions");
      }

      return res.json() as Promise<Position[]>;
    },
    enabled: !!user,
  });

  // Fetch balance history
  const { data: balanceHistory = [] } = useQuery({
    queryKey: ["balances"],
    queryFn: async () => {
      const res = await fetch("/api/balances", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch balances");
      }

      const balances = await res.json() as Balance[];
      
      // Format dates for chart
      return balances.map((b) => ({
        ...b,
        date: new Date(b.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      }));
    },
    enabled: !!user,
  });

  // Buy asset mutation
  const buyAsset = useMutation({
    mutationFn: async ({
      symbol,
      name,
      price,
      shares,
    }: {
      symbol: string;
      name: string;
      price: number;
      shares: number;
    }) => {
      const res = await fetch("/api/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, name, price, shares }),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to buy asset");
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["balances"] });
    },
  });

  return {
    user: user
      ? {
          positions,
          balanceHistory,
        }
      : null,
    buyAsset: (symbol: string, name: string, price: number, shares: number) =>
      buyAsset.mutate({ symbol, name, price, shares }),
  };
}