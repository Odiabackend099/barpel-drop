"use client";

import ContentPageLayout from '@/components/marketing/ContentPageLayout';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Package,
  ShieldCheck,
  AlertTriangle,
  Truck,
  RotateCcw,
  Star,
  Globe,
  Zap,
  Award,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const challenges = [
  {
    icon: Clock,
    title: 'Strict Response Time Metrics',
    description:
      'Amazon requires sellers to respond to customer inquiries within 24 hours. Missing this window impacts your Account Health and can lead to suspensions.',
  },
  {
    icon: Truck,
    title: 'FBA vs FBM Complexity',
    description:
      'Managing customer expectations across Fulfilled by Amazon and Fulfilled by Merchant orders creates confusion. Each has different tracking, return, and refund workflows.',
  },
  {
    icon: AlertTriangle,
    title: 'A-to-Z Guarantee Claims',
    description:
      'Slow or inadequate support leads to A-to-Z claims that directly damage your Order Defect Rate and can result in account suspension.',
  },
];

const features = [
  {
    icon: Zap,
    title: 'Instant Response Times',
    description:
      'Barpel AI answers every customer call instantly, ensuring you never miss Amazon&apos;s response time requirements. Protect your seller metrics 24/7.',
  },
  {
    icon: Package,
    title: 'FBA & FBM Order Tracking',
    description:
      'AI intelligently handles tracking inquiries for both fulfillment types, pulling data from Amazon&apos;s systems and your own shipping providers.',
  },
  {
    icon: RotateCcw,
    title: 'Return & Refund Processing',
    description:
      'Guide customers through Amazon&apos;s return process, check return eligibility, and initiate refunds — all without human intervention.',
  },
  {
    icon: ShieldCheck,
    title: 'A-to-Z Claim Prevention',
    description:
      'Proactive support catches issues before they escalate to A-to-Z claims. AI resolves complaints quickly and documents every interaction.',
  },
  {
    icon: Star,
    title: 'Review Management',
    description:
      'Follow up with customers after delivery to ensure satisfaction. Address concerns before they turn into negative reviews.',
  },
  {
    icon: Globe,
    title: 'Multi-Marketplace Support',
    description:
      'Sell on Amazon US, UK, DE, JP, and more? Barpel handles calls in 30+ languages across all Amazon marketplaces.',
  },
];

const metrics = [
  { value: '<1s', label: 'Average response time' },
  { value: '99.8%', label: 'Response rate maintained' },
  { value: '85%', label: 'Reduction in A-to-Z claims' },
  { value: '30+', label: 'Languages supported' },
];

const sellerBenefits = [
  'Protect your Account Health Dashboard score',
  'Maintain Perfect Order Percentage above 95%',
  'Keep Order Defect Rate below 1%',
  'Meet Late Shipment Rate requirements',
  'Reduce Pre-Fulfillment Cancel Rate',
  'Handle Buy Box competitive pressure',
  'Manage multi-ASIN product inquiries',
  'Support Amazon Prime customer expectations',
];

const comparisonItems = [
  {
    category: 'Response Time',
    traditional: '2-4 hours average',
    barpel: 'Instant (under 1 second)',
  },
  {
    category: 'Availability',
    traditional: 'Business hours only',
    barpel: '24/7/365 coverage',
  },
  {
    category: 'Languages',
    traditional: '1-3 languages',
    barpel: '30+ languages',
  },
  {
    category: 'Cost per Call',
    traditional: '$8-15 per call',
    barpel: '$0.50-1.00 per call',
  },
  {
    category: 'Scalability',
    traditional: 'Limited by headcount',
    barpel: 'Unlimited concurrent calls',
  },
  {
    category: 'Accuracy',
    traditional: 'Varies by agent',
    barpel: '99.2% policy compliance',
  },
];

export default function AmazonSellersPage() {
  return (
    <ContentPageLayout
      title="AI Phone Support for Amazon Sellers"
      subtitle="Protect your seller metrics, prevent A-to-Z claims, and provide instant support across FBA and FBM orders — all with AI."
    >
      {/* Challenges */}
      <motion.div {...fadeInUp} className="mb-20">
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">
            Amazon&apos;s strict metrics <span className="text-teal-500">demand more</span>
          </h2>
          <p className="body-large text-slate-600 max-w-2xl mx-auto">
            Unlike other marketplaces, Amazon actively penalizes sellers with slow support.
            Your account health depends on response speed and resolution quality.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {challenges.map((challenge, index) => (
            <motion.div
              key={challenge.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card-feature p-8 border-amber-100 bg-amber-50/30"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                <challenge.icon className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-brand-navy mb-2">{challenge.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{challenge.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div {...fadeInUp} className="mb-20">
        <div className="bg-gradient-to-br from-[#FF9900] to-[#e88a00] rounded-2xl p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {metrics.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-white/80 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Features */}
      <motion.div {...fadeInUp} className="mb-20">
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">
            Built for Amazon <span className="text-teal-500">seller success</span>
          </h2>
          <p className="body-large text-slate-600 max-w-2xl mx-auto">
            Every feature is designed to protect your Amazon account health while delivering
            the world-class support your customers expect.
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

      {/* Seller Benefits Checklist */}
      <motion.div {...fadeInUp} className="mb-20">
        <div className="bg-gradient-to-br from-slate-50 to-teal-50/30 rounded-2xl p-12">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1">
              <h2 className="heading-section text-brand-navy mb-4">
                Protect your <span className="text-teal-500">seller account</span>
              </h2>
              <p className="body-large text-slate-600 mb-8">
                Barpel AI helps you maintain the metrics Amazon cares about most,
                keeping your account in good standing and your Buy Box eligibility intact.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {sellerBenefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-64 h-64 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-100">
                <div className="text-center">
                  <Award className="w-16 h-16 text-[#FF9900] mx-auto mb-4" />
                  <div className="text-sm font-semibold text-slate-900">Account Health</div>
                  <div className="text-3xl font-bold text-teal-500 mt-2">Protected</div>
                  <div className="text-xs text-slate-500 mt-1">by Barpel AI</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Comparison Table */}
      <motion.div {...fadeInUp} className="mb-20">
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">
            Barpel AI vs <span className="text-teal-500">traditional support</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-4 bg-slate-50 rounded-tl-xl text-sm font-semibold text-slate-700">Category</th>
                <th className="text-left p-4 bg-slate-50 text-sm font-semibold text-slate-700">Traditional Support</th>
                <th className="text-left p-4 bg-teal-50 rounded-tr-xl text-sm font-semibold text-teal-700">Barpel AI</th>
              </tr>
            </thead>
            <tbody>
              {comparisonItems.map((item, index) => (
                <motion.tr
                  key={item.category}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border-b border-slate-100"
                >
                  <td className="p-4 text-sm font-medium text-slate-900">{item.category}</td>
                  <td className="p-4 text-sm text-slate-500">{item.traditional}</td>
                  <td className="p-4 text-sm font-medium text-teal-600 bg-teal-50/30">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-500" />
                      {item.barpel}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Final CTA */}
      <motion.div {...fadeInUp} className="text-center">
        <h2 className="heading-section text-brand-navy mb-4">
          Protect your Amazon business with AI support
        </h2>
        <p className="body-large text-slate-600 max-w-xl mx-auto mb-8">
          Don&apos;t risk your seller account with slow support. Get started with Barpel AI
          and maintain perfect metrics effortlessly. Free trial — no credit card required.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" className="btn-primary inline-flex items-center gap-2">
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-brand-navy text-brand-navy font-semibold rounded-lg hover:bg-brand-navy hover:text-white transition-all duration-200"
          >
            Schedule a demo
          </Link>
        </div>
      </motion.div>
    </ContentPageLayout>
  );
}
