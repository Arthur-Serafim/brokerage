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

interface BrokerageValue {
  id: string;
  date: string;
  value: number;
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

  // Fetch wallet balance history
  const { data: walletBalances = [] } = useQuery({
    queryKey: ["wallet-balances"],
    queryFn: async () => {
      const res = await fetch("/api/wallet-balances", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch balances");
      }

      const balances = (await res.json()) as Balance[];

      // Add timestamp for chart
      return balances.map((b) => ({
        ...b,
        timestamp: new Date(b.date).getTime(),
      }));
    },
    enabled: !!user,
  });

  // Fetch brokerage value history
  const { data: brokerageValues = [] } = useQuery({
    queryKey: ["brokerage-values"],
    queryFn: async () => {
      const res = await fetch("/api/brokerage-values", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch brokerage values");
      }

      const values = (await res.json()) as BrokerageValue[];

      // Add timestamp for chart
      return values.map((v) => ({
        ...v,
        timestamp: new Date(v.date).getTime(),
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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to buy asset");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-balances"] });
      queryClient.invalidateQueries({ queryKey: ["brokerage-values"] });
    },
  });

  // Sell position mutation
  const sellPosition = useMutation({
    mutationFn: async ({
      positionId,
      shares,
    }: {
      positionId: string;
      shares: number;
    }) => {
      const res = await fetch("/api/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positionId, shares }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to sell position");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-balances"] });
      queryClient.invalidateQueries({ queryKey: ["brokerage-values"] });
    },
  });

  return {
    user: user
      ? {
          positions,
          walletBalances,
          brokerageValues,
        }
      : null,
    buyAsset: (symbol: string, name: string, price: number, shares: number) =>
      buyAsset.mutate({ symbol, name, price, shares }),
    sellPosition: (positionId: string, shares: number) =>
      sellPosition.mutateAsync({ positionId, shares }),
  };
}