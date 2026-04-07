import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import { LazyMotion, domAnimation } from "framer-motion";
import { GoogleAnalytics } from "@next/third-parties/google";
import Script from "next/script";
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const displayFont = Instrument_Serif({
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Barpel AI \u2014 AI Voice Support for E-Commerce",
  description:
    "Give every customer a dedicated AI phone line. Handle order lookups, returns, and abandoned cart recovery \u2014 automatically.",
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
  },
  openGraph: {
    title: 'Barpel AI',
    description: 'AI-Powered Voice Support for E-Commerce Stores',
    url: 'https://dropship.barpel.ai',
    siteName: 'Barpel AI',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable} overflow-x-hidden`}>
      <body className="overflow-x-hidden">
        <LazyMotion features={domAnimation} strict>
          <AnalyticsProvider>{children}</AnalyticsProvider>
        </LazyMotion>
        <Toaster richColors position="top-right" />
        <Script id="tapfiliate-js" strategy="afterInteractive">
          {`(function(t,a,p){t.TapsAssocId="63365-6bd0a5";t.TapfiliateObject=a;t[a]=t[a]||function(){
(t[a].q=t[a].q||[]).push(arguments)};var s=p.createElement('script');s.async=true;
s.src='https://script.tapfiliate.com/tapfiliate.js';var r=p.getElementsByTagName('script')[0];
r.parentNode.insertBefore(s,r)})(window,'tap',document);
tap('create','63365-6bd0a5',{integration:'javascript'});
if(document.cookie.indexOf('tap_consent=1')>-1){tap('detect');}`}
        </Script>
      </body>
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </html>
  );
}
