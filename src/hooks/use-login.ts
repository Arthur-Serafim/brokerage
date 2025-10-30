"use client";

import { useMutation } from "@tanstack/react-query";

interface LoginResponse {
  success: boolean;
}

export function useLogin() {
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Invalid credentials");
      }
      
      return res.json() as Promise<LoginResponse>;
    },
  });
}