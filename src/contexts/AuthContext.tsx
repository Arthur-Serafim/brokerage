"use client";

import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  email: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const {
    data: user,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetch("/api/me", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Unauthorized");
      }

      return res.json() as Promise<User>;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Redirect to login if query failed
  if (!isLoading && !user) {
    router.push("/login");
    return null;
  }

  return (
    <AuthContext.Provider value={{ user: user ?? null, isLoading, refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useMe() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useMe must be used within an AuthProvider");
  }
  return context;
}
