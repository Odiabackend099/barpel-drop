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

export const metadata: Metadata = {
  title: "Barpel AI - AI-Powered Voice Support for E-Commerce | 24/7 Customer Service",
  description:
    "Transform your e-commerce customer support with Barpel AI. Automated voice calls for order tracking, returns, and abandoned cart recovery. 73% reduction in support tickets.",
};

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <LogoCloud />
        <Features />
        <HowItWorks />
        <Integrations />
        <Pricing />
        <Testimonials />
        <Security />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
