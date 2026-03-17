import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barpel AI \u2014 AI Voice Support for E-Commerce",
  description:
    "Give every customer a dedicated AI phone line. Handle order lookups, returns, and abandoned cart recovery \u2014 automatically.",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Barpel AI',
    description: 'AI-Powered Voice Support for E-Commerce Stores',
    url: 'https://barpel.ai',
    siteName: 'Barpel AI',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
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
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </html>
  );
}
