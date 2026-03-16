"use client";

import Navigation from '@/components/marketing/Navigation';
import Footer from '@/components/marketing/sections/Footer';
import CTA from '@/components/marketing/sections/CTA';
import { motion } from 'framer-motion';

interface ContentPageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showCTA?: boolean;
}

export default function ContentPageLayout({ title, subtitle, children, showCTA = true }: ContentPageLayoutProps) {
  return (
    <div className="min-h-screen">
      <Navigation />
      {/* Hero Banner */}
      <section className="pt-24 pb-12 bg-gradient-to-br from-brand-navy via-slate-800 to-brand-navy">
        <div className="container-default">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="heading-hero text-white mb-4">{title}</h1>
            {subtitle && <p className="body-large text-white/70 max-w-2xl mx-auto">{subtitle}</p>}
          </motion.div>
        </div>
      </section>
      {/* Content */}
      <main className="section-padding">
        <div className="container-default">
          {children}
        </div>
      </main>
      {showCTA && <CTA />}
      <Footer />
    </div>
  );
}
