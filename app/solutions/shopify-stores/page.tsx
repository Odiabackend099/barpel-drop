"use client";

import ContentPageLayout from '@/components/marketing/ContentPageLayout';
import { m } from 'framer-motion';
import Link from 'next/link';
import {
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Search,
  ShoppingCart,
  BarChart3,
  Phone,
  Settings,
  Star,
  Package,
  CreditCard,
  Shield,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const integrationSteps = [
  {
    icon: ShoppingBag,
    title: 'Connect your Shopify store',
    description: 'Authorize Barpel with one click via Shopify OAuth. No coding required, no developer needed.',
  },
  {
    icon: RefreshCw,
    title: 'Auto-sync your store data',
    description: 'Barpel automatically syncs your products, orders, customer data, and store policies in real time.',
  },
  {
    icon: Settings,
    title: 'Configure your AI voice persona',
    description: 'Choose a voice, set your brand tone, and upload your FAQs. Your AI agent is ready in under 5 minutes.',
  },
  {
    icon: Phone,
    title: 'Start taking calls',
    description: 'Forward your support line to Barpel or use our dedicated number. AI handles calls from day one.',
  },
];

const features = [
  {
    icon: Package,
    title: 'Order Tracking & Status',
    description:
      'Customers call and get instant order updates pulled directly from Shopify. Tracking numbers, shipping status, estimated delivery — all automated.',
  },
  {
    icon: RefreshCw,
    title: 'Returns & Exchanges',
    description:
      'AI walks customers through your return policy, checks eligibility windows, and initiates return labels — all within a single phone call.',
  },
  {
    icon: ShoppingCart,
    title: 'Cart Recovery Calls',
    description:
      'When a customer abandons their cart, Barpel calls them within 15 minutes to answer questions and help complete their purchase.',
  },
  {
    icon: Search,
    title: 'Product Lookup & Recommendations',
    description:
      'Customers can ask about products, availability, sizing, and compatibility. Barpel searches your catalog and provides instant answers.',
  },
  {
    icon: CreditCard,
    title: 'Payment & Billing Support',
    description:
      'Handle payment questions, invoice requests, and billing disputes without human intervention. Secure payment data handling.',
  },
  {
    icon: Shield,
    title: 'Fraud Prevention',
    description:
      'AI detects suspicious patterns and flags potentially fraudulent orders for manual review before they ship.',
  },
];

const stats = [
  { value: '30+', label: 'Languages supported' },
  { value: '15 min', label: 'Cart recovery window' },
  { value: '24/7', label: 'Always-on coverage' },
  { value: '99.9%', label: 'Uptime guarantee' },
];

const shopifyBenefits = [
  'Real-time order sync from Shopify',
  'Automatic product catalog updates',
  'Native Shopify Flow integration',
  'Works with Shopify Plus checkout extensibility',
  'Compatible with all major Shopify themes',
  'Supports multi-location inventory',
  'Shopify POS integration for retail',
  'Automated refund processing',
];

export default function ShopifyStoresPage() {
  return (
    <ContentPageLayout
      title="The #1 AI Voice Support App for Shopify"
      subtitle="One-click installation. Instant order sync. AI-powered phone support that knows your store inside and out."
    >
      {/* Stats Banner */}
      <m.div {...fadeInUp} className="mb-20">
        <div className="bg-gradient-to-br from-[#96bf48] to-[#5a8a17] rounded-2xl p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <m.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-white/80 text-sm">{stat.label}</div>
              </m.div>
            ))}
          </div>
        </div>
      </m.div>

      {/* How It Works with Shopify */}
      <m.div {...fadeInUp} className="mb-20">
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">
            Seamless <span className="text-teal-500">Shopify integration</span>
          </h2>
          <p className="body-large text-slate-600 max-w-2xl mx-auto">
            Install Barpel from the Shopify App Store and start handling customer calls
            with AI in under five minutes. No technical setup required.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {integrationSteps.map((step, index) => (
            <m.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              <div className="text-6xl font-bold text-teal-100 mb-4">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4">
                <step.icon className="w-6 h-6 text-teal-500" />
              </div>
              <h3 className="text-lg font-semibold text-brand-navy mb-2">{step.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
            </m.div>
          ))}
        </div>
      </m.div>

      {/* Features Grid */}
      <m.div {...fadeInUp} className="mb-20">
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">
            Everything your Shopify store <span className="text-teal-500">needs</span>
          </h2>
          <p className="body-large text-slate-600 max-w-2xl mx-auto">
            From order tracking to cart recovery, Barpel handles every customer call scenario
            that Shopify merchants face daily.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <m.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="card-feature p-8"
            >
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-teal-500" />
              </div>
              <h3 className="text-lg font-semibold text-brand-navy mb-2">{feature.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
            </m.div>
          ))}
        </div>
      </m.div>

      {/* Shopify Benefits Checklist */}
      <m.div {...fadeInUp} className="mb-20">
        <div className="bg-gradient-to-br from-slate-50 to-teal-50/30 rounded-2xl p-12">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1">
              <h2 className="heading-section text-brand-navy mb-4">
                Built natively for <span className="text-teal-500">Shopify</span>
              </h2>
              <p className="body-large text-slate-600 mb-8">
                Unlike generic call center tools, Barpel is purpose-built for Shopify.
                Every feature is designed around how Shopify stores operate.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {shopifyBenefits.map((benefit, index) => (
                  <m.div
                    key={benefit}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">{benefit}</span>
                  </m.div>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-64 h-64 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-100">
                <div className="text-center">
                  <ShoppingBag className="w-16 h-16 text-[#96bf48] mx-auto mb-4" />
                  <div className="text-sm font-semibold text-slate-900">Shopify App Store</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">4.9 / 5 rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </m.div>

      {/* Case Study Highlight — coming soon */}
      <m.div {...fadeInUp} className="mb-20">
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-teal-500" />
            <span className="text-sm font-semibold text-teal-600 uppercase tracking-wide">Case Studies</span>
          </div>
          <p className="text-slate-600 max-w-lg mx-auto">
            We are documenting early access results. Real merchant case studies coming soon.
          </p>
        </div>
      </m.div>

      {/* Final CTA */}
      <m.div {...fadeInUp} className="text-center">
        <h2 className="heading-section text-brand-navy mb-4">
          Connect Barpel to your Shopify store today
        </h2>
        <p className="body-large text-slate-600 max-w-xl mx-auto mb-8">
          Free trial includes all features — no credit card required.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" className="btn-primary inline-flex items-center gap-2">
            Connect Shopify
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-brand-navy text-brand-navy font-semibold rounded-lg hover:bg-brand-navy hover:text-white transition-all duration-200"
          >
            Schedule a demo
          </Link>
        </div>
      </m.div>
    </ContentPageLayout>
  );
}
