import type { Metadata } from "next";
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barpel Drop AI — AI-Powered Customer Support for E-Commerce",
  description:
    "Voice-powered customer support that answers calls, tracks orders, and handles returns automatically. Built for dropshippers and Shopify merchants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
