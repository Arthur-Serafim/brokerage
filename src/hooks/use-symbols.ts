"use client";

import { useQuery } from "@tanstack/react-query";

interface Symbol {
  id: string;
  symbol: string;
  name: string;
  price: number;
  updatedAt: string;
}

export function useSymbols() {
  return useQuery({
    queryKey: ["symbols"],
    queryFn: async () => {
      const res = await fetch("/api/symbols", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch symbols");
      }

      return res.json() as Promise<{ data: Symbol[] }>;
    },
  });
}