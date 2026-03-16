"use client";

import ContentPageLayout from '@/components/marketing/ContentPageLayout';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Package,
  Clock,
  Globe,
  RotateCcw,
  MapPin,
  Bell,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const painPoints = [
  {
    icon: Clock,
    title: 'Long Shipping Times',
    description:
      'Extended delivery windows from overseas suppliers generate waves of anxious customer calls asking for updates and ETAs.',
  },
  {
    icon: MapPin,
    title: 'Order Tracking Inquiries',
    description:
      'Customers demand real-time tracking updates across multiple carriers and international logistics networks.',
  },
  {
    icon: RotateCcw,
    title: 'Return Confusion',
    description:
      'Complex return policies with different rules per supplier create frustration and endless back-and-forth support threads.',
  },
];

const features = [
  {
    icon: Package,
    title: 'Automated Order Tracking',
    description:
      'Barpel AI instantly retrieves tracking information from any carrier and relays real-time updates to customers via phone call, without human intervention.',
  },
  {
    icon: Bell,
    title: 'Proactive Shipping Updates',
    description:
      'Instead of waiting for customers to call, Barpel proactively reaches out with status changes, delays, and estimated delivery windows.',
  },
  {
    icon: ShieldCheck,
    title: 'Return Policy AI',
    description:
      'Your AI voice agent understands your return policies inside and out, guiding customers through the process and initiating RMAs automatically.',
  },
  {
    icon: Globe,
    title: 'Multi-Language Support',
    description:
      'Serve customers in 30+ languages without hiring multilingual agents. Barpel AI handles calls in the customer&apos;s preferred language.',
  },
  {
    icon: MessageSquare,
    title: 'Supplier Coordination',
    description:
      'Barpel can relay information between your suppliers and customers, bridging the communication gap that plagues dropshipping.',
  },
  {
    icon: Zap,
    title: 'Instant Escalation',
    description:
      'When a call requires human attention, Barpel seamlessly transfers to your team with full context and conversation history.',
  },
];

const stats = [
  { value: '24/7', label: 'Automated phone coverage' },
  { value: '24/7', label: 'Coverage in every timezone' },
  { value: '30+', label: 'Languages supported' },
  { value: '<2min', label: 'Average resolution time' },
];

export default function DropshippersPage() {
  return (
    <ContentPageLayout
      title="AI Voice Support Built for Dropshippers"
      subtitle="Automate order tracking calls, handle returns, and provide 24/7 multilingual support — so you can focus on scaling your store."
    >
      {/* Pain Points Section */}
      <motion.div {...fadeInUp} className="mb-20">
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">
            The dropshipping support <span className="text-teal-500">problem</span>
          </h2>
          <p className="body-large text-slate-600 max-w-2xl mx-auto">
            Every dropshipper knows the struggle. Long shipping times, multiple carriers,
            and confused customers create a support nightmare that drains your margins.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {painPoints.map((point, index) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card-feature p-8 border-red-100 bg-red-50/30"
            >
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                <point.icon className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-brand-navy mb-2">{point.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{point.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Stats Section */}
      <motion.div {...fadeInUp} className="mb-20">
        <div className="bg-gradient-to-br from-brand-navy to-slate-800 rounded-2xl p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-teal-400 mb-2">{stat.value}</div>
                <div className="text-white/70 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* How Barpel Solves It */}
      <motion.div {...fadeInUp} className="mb-20">
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">
            How Barpel <span className="text-teal-500">solves it</span>
          </h2>
          <p className="body-large text-slate-600 max-w-2xl mx-auto">
            Purpose-built AI voice support that understands the unique challenges of dropshipping
            and handles them automatically, around the clock.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
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
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* How It Works */}
      <motion.div {...fadeInUp} className="mb-20">
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">
            Up and running in <span className="text-teal-500">minutes</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Connect your store',
              description:
                'Link your Shopify, WooCommerce, or custom store. Barpel syncs your products, orders, and shipping data automatically.',
            },
            {
              step: '02',
              title: 'Train your AI agent',
              description:
                'Upload your return policies, shipping FAQs, and brand voice guidelines. The AI learns your business in minutes.',
            },
            {
              step: '03',
              title: 'Go live',
              description:
                'Forward your support number to Barpel. Your AI agent starts handling calls immediately with real-time order data.',
            },
          ].map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative"
            >
              <div className="text-6xl font-bold text-teal-100 mb-4">{item.step}</div>
              <h3 className="text-xl font-semibold text-brand-navy mb-2">{item.title}</h3>
              <p className="text-slate-600 leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Customer Success */}
      <motion.div {...fadeInUp} className="mb-20">
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-teal-500" />
                <span className="text-sm font-semibold text-teal-600 uppercase tracking-wide">Case Study</span>
              </div>
              <h3 className="text-2xl font-bold text-brand-navy mb-4">
                DropshipDirect automated support with 24/7 AI coverage
              </h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                With over 10,000 monthly orders and 3 full-time support agents costing $8K per month,
                DropshipDirect was drowning in &quot;Where is my order?&quot; calls. After implementing
                Barpel AI, they automated routine calls around the clock and saved $5.8K monthly.
              </p>
              <div className="flex flex-wrap gap-4 mb-6">
                {[
                  { label: 'Response time', value: '< 3s' },
                  { label: 'Monthly savings', value: '$5.8K' },
                  { label: 'Setup time', value: '1 day' },
                ].map((metric) => (
                  <div key={metric.label} className="bg-white rounded-lg px-4 py-3 shadow-sm">
                    <div className="text-xl font-bold text-teal-500">{metric.value}</div>
                    <div className="text-xs text-slate-500">{metric.label}</div>
                  </div>
                ))}
              </div>
              <Link
                href="/case-studies/dropship-direct"
                className="inline-flex items-center gap-2 text-teal-600 font-semibold hover:gap-3 transition-all duration-200"
              >
                Read the full story
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Final CTA */}
      <motion.div {...fadeInUp} className="text-center">
        <h2 className="heading-section text-brand-navy mb-4">
          Ready to automate your dropshipping support?
        </h2>
        <p className="body-large text-slate-600 max-w-xl mx-auto mb-8">
          Join hundreds of dropshippers who have eliminated support overload with Barpel AI.
          Start your free trial today — no credit card required.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" className="btn-primary inline-flex items-center gap-2">
            Start free trial
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-brand-navy text-brand-navy font-semibold rounded-lg hover:bg-brand-navy hover:text-white transition-all duration-200"
          >
            Book a demo
          </Link>
        </div>
      </motion.div>
    </ContentPageLayout>
  );
}
