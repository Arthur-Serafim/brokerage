"use client";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import ReactQueryProvider from "@/components/providers/react-query-provider";
import Layout from "@/components/Layout";
import { usePathname } from "next/navigation";

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
          <ReactQueryProvider>{children}</ReactQueryProvider>
        </body>
      </html>
    );
  }

  // Normal authenticated layout
  return (
    <html lang="en">
      <body>
        <SidebarProvider>
          <ReactQueryProvider>
            <Layout>{children}</Layout>
          </ReactQueryProvider>
        </SidebarProvider>
      </body>
    </html>
  );
}
