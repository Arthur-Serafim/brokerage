"use client"

import { useQuery } from "@tanstack/react-query"

const BASE_URL = "https://api.marketstack.com/v1"
const API_KEY = process.env.NEXT_PUBLIC_MARKETSTACK_API_KEY

async function fetchMarketstack(endpoint: string, params: Record<string, string> = {}) {
  const query = new URLSearchParams({ access_key: API_KEY!, ...params })
  const res = await fetch(`${BASE_URL}/${endpoint}?${query}`)

  if (!res.ok) throw new Error(`Marketstack error ${res.status}`)
  return res.json()
}

export function useMarketstack(endpoint: string, params: Record<string, string> = {}) {
  return useQuery({
    queryKey: [endpoint, params],
    queryFn: () => fetchMarketstack(endpoint, params),
  })
}
