"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Wallet } from "lucide-react";
import { AuthProvider, useMe } from "@/contexts/AuthContext";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useMe();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // If not loading and no user, AuthProvider will redirect to /login
  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar>
        <SidebarHeader>
          <h1 className="text-lg font-semibold p-4">Marketstack</h1>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Banking</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem key="/">
                  <SidebarMenuButton asChild isActive={pathname === "/"}>
                    <Link href="/" className="flex items-center gap-2">
                      <Wallet size={18} />
                      Wallet
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4">
          <div className="text-xs text-muted-foreground">
            <p className="mb-2">Logged in as:</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            © 2025 Marketstack
          </p>
        </SidebarFooter>
      </Sidebar>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  );
}
