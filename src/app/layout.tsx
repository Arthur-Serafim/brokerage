import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import ReactQueryProvider from "@/components/providers/react-query-provider";
import Layout from "@/components/Layout";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
