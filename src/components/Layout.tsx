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
import { Home, Globe, Coins, Building } from "lucide-react";

const routes = [
  { href: "/tickers", label: "Tickers", icon: Home },
  { href: "/exchanges", label: "Exchanges", icon: Building },
  { href: "/currencies", label: "Currencies", icon: Coins },
  { href: "/timezones", label: "Timezones", icon: Globe },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar>
        <SidebarHeader>
          <h1 className="text-lg font-semibold p-4">Marketstack</h1>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Brokerage</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {routes.map(({ href, label, icon: Icon }) => (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton asChild isActive={pathname === href}>
                      <Link href={href} className="flex items-center gap-2">
                        <Icon size={18} />
                        {label}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4 text-xs text-muted-foreground">
          © 2025 Marketstack
        </SidebarFooter>
      </Sidebar>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
