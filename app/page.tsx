import { Metadata } from "next";
import Navigation from "@/components/marketing/Navigation";
import Hero from "@/components/marketing/sections/Hero";
import LogoCloud from "@/components/marketing/sections/LogoCloud";
import Features from "@/components/marketing/sections/Features";
import HowItWorks from "@/components/marketing/sections/HowItWorks";
import Integrations from "@/components/marketing/sections/Integrations";
import Pricing from "@/components/marketing/sections/Pricing";
import Testimonials from "@/components/marketing/sections/Testimonials";
import Security from "@/components/marketing/sections/Security";
import CTA from "@/components/marketing/sections/CTA";
import Footer from "@/components/marketing/sections/Footer";
import Compare from "@/components/marketing/sections/Compare";
import HomeFAQ from "@/components/marketing/sections/HomeFAQ";

export const metadata: Metadata = {
  title: "Barpel AI | AI Voice Support for E-Commerce Stores",
  description:
    "AI phone agent for e-commerce stores. Answers calls 24/7, tracks orders, handles returns, recovers carts. 2.3s response. Free 14-day trial.",
  alternates: {
    canonical: 'https://dropship.barpel.ai',
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://dropship.barpel.ai/#organization",
      "name": "Barpel AI",
      "url": "https://dropship.barpel.ai",
      "logo": "https://dropship.barpel.ai/logo.png",
      "description": "AI-powered voice support for e-commerce. Automated phone calls for order tracking, returns, and abandoned cart recovery.",
      "sameAs": [
        "https://www.linkedin.com/company/barpelai",
        "https://www.instagram.com/barpel.ai",
        "https://www.tiktok.com/@barpelai"
      ]
    },
    {
      "@type": "SoftwareApplication",
      "name": "Barpel AI",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "description": "AI-powered voice support agent for e-commerce. Handles order tracking, returns, cart recovery, and product lookup calls 24/7 in 30+ languages.",
      "offers": [
        {
          "@type": "Offer",
          "name": "Starter",
          "price": "29",
          "priceCurrency": "USD",
          "description": "30 credits/month, 1 phone number, Shopify integration, order tracking"
        },
        {
          "@type": "Offer",
          "name": "Growth",
          "price": "79",
          "priceCurrency": "USD",
          "description": "100 credits/month, 3 phone numbers, all integrations, cart recovery, returns"
        },
        {
          "@type": "Offer",
          "name": "Scale",
          "price": "179",
          "priceCurrency": "USD",
          "description": "250 credits/month, 10 phone numbers, custom AI training, dedicated manager"
        }
      ],
      "featureList": [
        "Instant Order Tracking",
        "Automated Returns Processing",
        "Smart Cart Recovery",
        "Live Product Lookup",
        "30+ Language Support",
        "24/7 Availability",
        "Shopify Integration",
        "TikTok Shop Integration",
        "WooCommerce Integration",
        "Amazon Integration"
      ]
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is Barpel AI?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Barpel AI is an AI-powered voice support agent for e-commerce stores. It answers customer phone calls 24/7, handles order tracking, processes return requests, recovers abandoned carts via outbound calls, and supports 30+ languages. It integrates with Shopify, TikTok Shop, WooCommerce, and Amazon. Setup takes under 5 minutes. Plans start at $29/month."
          }
        },
        {
          "@type": "Question",
          "name": "How much does Barpel AI cost?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Barpel AI offers three plans: Starter at $29/month (30 credits, 1 phone number), Growth at $79/month (100 credits, 3 phone numbers), and Scale at $179/month (250 credits, 10 phone numbers with custom AI training). A 14-day free trial is available — no credit card required."
          }
        },
        {
          "@type": "Question",
          "name": "Does Barpel AI work with Shopify?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Barpel AI has a native Shopify integration. It connects to your Shopify store to pull real-time order data, tracking numbers, delivery estimates, and product inventory. Customers call your AI phone line and get accurate answers from your live Shopify data."
          }
        },
        {
          "@type": "Question",
          "name": "Does Barpel AI work with TikTok Shop?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Barpel AI integrates directly with TikTok Shop. It handles order tracking, return requests, and product questions for TikTok Shop customers, helping sellers maintain high satisfaction scores and avoid account suspension."
          }
        },
        {
          "@type": "Question",
          "name": "How fast does Barpel AI answer customer calls?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Barpel AI answers calls with an average response time of 2.3 seconds. Unlike human agents, it operates 24/7 with no hold times, no voicemail, and no time zone limitations."
          }
        },
        {
          "@type": "Question",
          "name": "Can Barpel AI handle returns and refunds?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Barpel AI explains your return policy to customers, collects return photos via SMS, and initiates the return process automatically — without any human involvement. This reduces manual work and speeds up refund resolution."
          }
        },
        {
          "@type": "Question",
          "name": "What languages does Barpel AI support?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Barpel AI supports natural voice conversations in 30+ languages, allowing e-commerce stores to provide customer support across different regions and time zones automatically."
          }
        },
        {
          "@type": "Question",
          "name": "Is Barpel AI secure and compliant?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Barpel AI is SOC 2 Type II certified, GDPR compliant, HIPAA ready, and uses end-to-end encryption for all customer call data. Payments are secured by Flutterwave."
          }
        }
      ]
    }
  ]
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navigation />
      <main>
        <Hero />
        <LogoCloud />
        <section className="py-8 bg-white">
          <div className="container-default max-w-4xl">
            <p className="body-large text-text-secondary text-center">
              Barpel AI is an AI-powered voice support agent for e-commerce stores. It
              answers customer phone calls 24/7, providing real-time order tracking,
              handling return requests, recovering abandoned carts through outbound calls,
              and answering product questions — all without human involvement. Barpel AI
              integrates with Shopify, TikTok Shop, WooCommerce, and Amazon, and supports
              natural conversations in 30+ languages. Plans start at $29/month.
            </p>
          </div>
        </section>
        <p className="sr-only">
          Barpel AI achieves an 89% customer satisfaction rate across all supported
          e-commerce stores. The average call response time is 2.3 seconds. Stores
          using Barpel AI&apos;s cart recovery feature see a 4.2x improvement in
          recovery rates, with 42% of targeted abandoned carts successfully recovered.
        </p>
        <Features />
        <HowItWorks />
        <Integrations />
        <Pricing />
        <Compare />
        <Testimonials />
        <Security />
        <HomeFAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
