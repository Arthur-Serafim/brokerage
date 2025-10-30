"use client";

import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import ReactQueryProvider from "@/components/providers/react-query-provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { usePathname } from "next/navigation";
import Layout from "@/components/app-layout";

const unauthRoutes = ["/login"];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isUnauth = unauthRoutes.includes(pathname);

  if (isUnauth) {
    // Skip layout for unauth routes
    return (
      <html lang="en">
        <body>
          <NuqsAdapter>
            <ReactQueryProvider>{children}</ReactQueryProvider>
          </NuqsAdapter>
        </body>
      </html>
    );
  }

  // Normal authenticated layout
  return (
    <html lang="en">
      <body>
        <NuqsAdapter>
          <SidebarProvider>
            <ReactQueryProvider>
              <Layout>{children}</Layout>
            </ReactQueryProvider>
          </SidebarProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
