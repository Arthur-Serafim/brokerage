"use client";

import { useQuery } from "@tanstack/react-query";
import { useMe } from "@/contexts/AuthContext";

interface Transaction {
  id: string;
  type: string;
  symbol: string | null;
  shares: number | null;
  pricePerShare: number | null;
  amount: number;
  from: string;
  to: string;
  description: string;
  createdAt: string;
}

export function useTransactions() {
  const { user } = useMe();

  return useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const res = await fetch("/api/transactions", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch transactions");
      }

      return res.json() as Promise<Transaction[]>;
    },
    enabled: !!user,
  });
}