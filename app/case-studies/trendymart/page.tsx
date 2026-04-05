"use client";

import ContentPageLayout from '@/components/marketing/ContentPageLayout';
import { m } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Clock,
  TrendingDown,
  CheckCircle2,
  Quote,
  Package,
  FileText,
  Zap,
  Users,
  ShieldCheck,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const keyMetrics = [
  { value: '$50K', label: 'Saved annually', icon: DollarSign },
  { value: '60%', label: 'Faster return processing', icon: Clock },
  { value: '45%', label: 'Fewer return-related calls', icon: TrendingDown },
  { value: '3.8 min', label: 'Avg call time (was 15 min)', icon: Users },
];

const returnChallenges = [
  {
    stat: '40%',
    label: 'of all support calls were about returns',
    description: 'Nearly half of TrendyMart&apos;s inbound calls were customers asking about return eligibility, refund status, or exchange options.',
  },
  {
    stat: '3.2',
    label: 'average calls per return',
    description: 'Customers typically called multiple times per return — once to initiate, once to check status, and once for the refund.',
  },
  {
    stat: '$4.50',
    label: 'cost per return support call',
    description: 'At $4.50 per call and 3.2 calls per return, the support cost alone was eating into margins on every returned item.',
  },
];

const automationFeatures = [
  {
    icon: ShieldCheck,
    title: 'Policy Verification',
    description: 'AI instantly checks if the item is within the return window, verifies purchase history, and confirms eligibility.',
  },
  {
    icon: FileText,
    title: 'RMA Generation',
    description: 'Automatically generates return merchandise authorization numbers and sends prepaid return labels via email or SMS.',
  },
  {
    icon: Package,
    title: 'Status Tracking',
    description: 'Customers call back to check return status? AI pulls real-time data on package location, inspection status, and refund ETA.',
  },
  {
    icon: Zap,
    title: 'Instant Refunds',
    description: 'For eligible items, AI can initiate instant refunds upon return confirmation, reducing the refund cycle from 7 days to 1.',
  },
];

const timeline = [
  {
    day: 'Day 1-2',
    title: 'Return Policy Configuration',
    description: 'Mapped TrendyMart&apos;s return policies into Barpel: 30-day window for most items, 14 days for sale items, no returns on intimates.',
  },
  {
    day: 'Day 3-4',
    title: 'Shopify & Carrier Integration',
    description: 'Connected Shopify order data and integrated with FedEx and USPS for automated return label generation.',
  },
  {
    day: 'Week 2',
    title: 'Soft Launch',
    description: 'Routed return-specific calls to Barpel AI. Monitored 500+ calls for accuracy and customer satisfaction.',
  },
  {
    day: 'Week 3-4',
    title: 'Full Deployment',
    description: 'Expanded to all support call types. Added proactive refund status notifications to reduce repeat calls.',
  },
  {
    day: 'Month 3',
    title: 'Full Optimization',
    description: 'Achieved 60% faster processing, 45% fewer calls, and $50K annualized savings. Added exchange recommendations.',
  },
];

const beforeAfter = [
  { category: 'Return Processing Time', before: '5-7 business days', after: '1-2 business days' },
  { category: 'Calls per Return', before: '3.2 average', after: '0.8 average' },
  { category: 'Return Support Cost', before: '$14.40/return', after: '$3.60/return' },
  { category: 'Annual Support Costs', before: '$156,000', after: '$106,000' },
  { category: 'Customer Wait Time', before: '6+ minutes', after: '<10 seconds' },
  { category: 'Return-Related CSAT', before: '71%', after: '92%' },
];

const returnFlowSteps = [
  'Customer calls about a return',
  'AI verifies order and checks return eligibility',
  'AI explains the return policy for that specific item',
  'If eligible, AI generates RMA number instantly',
  'Return label sent via SMS or email within seconds',
  'AI sends proactive status updates as return ships back',
  'Refund processed automatically upon warehouse receipt',
];

export default function TrendyMartCaseStudy() {
  return (
    <ContentPageLayout
      title="TrendyMart Case Study"
      subtitle="How a fast-fashion Shopify store saved $50K annually by automating return processing with Barpel AI."
    >
      {/* Back Link */}
      <m.div {...fadeInUp} className="mb-8">
        <Link
          href="/customer-stories"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customer Stories
        </Link>
      </m.div>

      {/* Company Overview */}
      <m.div {...fadeInUp} className="mb-16">
        <div className="bg-gradient-to-br from-[#9C27B0] to-[#E91E63] rounded-2xl p-10">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <span className="text-white/60 text-sm font-semibold uppercase tracking-wide">Fashion E-Commerce</span>
              <h2 className="text-3xl font-bold text-white mt-2 mb-4">TrendyMart</h2>
              <p className="text-white/80 leading-relaxed">
                TrendyMart is a fast-fashion Shopify store specializing in trend-driven clothing and accessories.
                With a rapid product cycle and competitive pricing, they process thousands of orders monthly — and
                with fast fashion comes a high volume of returns.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {keyMetrics.map((metric) => (
                <div key={metric.label} className="bg-white/15 rounded-xl p-4 text-center min-w-[140px]">
                  <metric.icon className="w-5 h-5 text-white/80 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{metric.value}</div>
                  <div className="text-xs text-white/60">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </m.div>

      {/* The Challenge */}
      <m.div {...fadeInUp} className="mb-16">
        <h2 className="heading-section text-brand-navy mb-6">The Challenge</h2>
        <p className="body-large text-slate-600 leading-relaxed mb-4">
          Returns are a fact of life in fast fashion. Sizing inconsistencies, trend-sensitive purchases,
          and impulse buying all contribute to return rates that are significantly higher than other
          e-commerce categories. For TrendyMart, returns had become their single largest cost center
          in customer support.
        </p>
        <p className="text-slate-600 leading-relaxed mb-8">
          The support team spent nearly 40% of their time handling return-related calls — checking eligibility,
          explaining policies, generating labels, and providing status updates. The manual RMA process alone
          took 15 minutes per request. Each return generated an average of 3.2 phone calls, and at $4.50 per
          call, the support cost per return was $14.40 — often exceeding the margin on the original sale.
        </p>

        {/* Challenge Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          {returnChallenges.map((item, index) => (
            <m.div
              key={item.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="card-feature p-6 border-red-100 bg-red-50/30 text-center"
            >
              <div className="text-3xl font-bold text-red-500 mb-1">{item.stat}</div>
              <div className="text-sm font-semibold text-brand-navy mb-2">{item.label}</div>
              <p className="text-xs text-slate-600">{item.description}</p>
            </m.div>
          ))}
        </div>
      </m.div>

      {/* The Solution */}
      <m.div {...fadeInUp} className="mb-16">
        <h2 className="heading-section text-brand-navy mb-6">The Solution</h2>
        <p className="text-slate-600 leading-relaxed mb-8">
          TrendyMart implemented Barpel AI to fully automate their return support workflow. The AI handles
          every step of the return process — from eligibility checks to label generation to refund processing —
          without human intervention.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {automationFeatures.map((feature, index) => (
            <m.div
              key={feature.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="card-feature p-6"
            >
              <feature.icon className="w-8 h-8 text-teal-500 mb-3" />
              <h3 className="text-sm font-semibold text-brand-navy mb-1">{feature.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{feature.description}</p>
            </m.div>
          ))}
        </div>

        {/* Return Flow */}
        <div className="bg-slate-50 rounded-2xl p-8">
          <h3 className="text-lg font-semibold text-brand-navy mb-4">Automated return flow</h3>
          <div className="space-y-3">
            {returnFlowSteps.map((step, index) => (
              <m.div
                key={step}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className="w-6 h-6 bg-teal-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  {index + 1}
                </div>
                <span className="text-sm text-slate-700">{step}</span>
              </m.div>
            ))}
          </div>
        </div>
      </m.div>

      {/* Timeline */}
      <m.div {...fadeInUp} className="mb-16">
        <h2 className="heading-section text-brand-navy mb-8">Implementation Timeline</h2>
        <div className="space-y-6">
          {timeline.map((item, index) => (
            <m.div
              key={item.day}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="flex gap-6"
            >
              <div className="flex-shrink-0 w-24">
                <span className="text-sm font-bold text-teal-500">{item.day}</span>
              </div>
              <div className="flex-1 pb-6 border-l-2 border-teal-100 pl-6 relative">
                <div className="absolute -left-[9px] top-0 w-4 h-4 bg-teal-500 rounded-full border-2 border-white" />
                <h3 className="text-sm font-semibold text-brand-navy mb-1">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.description}</p>
              </div>
            </m.div>
          ))}
        </div>
      </m.div>

      {/* Before & After */}
      <m.div {...fadeInUp} className="mb-16">
        <h2 className="heading-section text-brand-navy mb-8">Before & After</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-4 bg-slate-50 rounded-tl-xl text-sm font-semibold text-slate-700">Metric</th>
                <th className="text-left p-4 bg-red-50 text-sm font-semibold text-red-700">Before Barpel</th>
                <th className="text-left p-4 bg-teal-50 rounded-tr-xl text-sm font-semibold text-teal-700">After Barpel</th>
              </tr>
            </thead>
            <tbody>
              {beforeAfter.map((item, index) => (
                <m.tr
                  key={item.category}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border-b border-slate-100"
                >
                  <td className="p-4 text-sm font-medium text-slate-900">{item.category}</td>
                  <td className="p-4 text-sm text-red-600 bg-red-50/30">{item.before}</td>
                  <td className="p-4 text-sm font-medium text-teal-600 bg-teal-50/30">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-500" />
                      {item.after}
                    </div>
                  </td>
                </m.tr>
              ))}
            </tbody>
          </table>
        </div>
      </m.div>

      {/* Quote */}
      <m.div {...fadeInUp} className="mb-16">
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-10">
          <Quote className="w-10 h-10 text-teal-300 mb-4" />
          <blockquote className="text-xl text-brand-navy font-medium leading-relaxed mb-6">
            &quot;Returns used to be our Achilles heel. Forty percent of our support time went to
            return calls, and each one cost us nearly $15 in agent time. Barpel turned a cost center
            into a seamless customer experience. Now the entire process runs itself — customers get
            their labels in seconds, refunds process automatically, and our team can focus on what
            actually grows the business.&quot;
          </blockquote>
          <div>
            <div className="text-sm font-semibold text-brand-navy">David Park</div>
            <div className="text-sm text-slate-500">COO, TrendyMart</div>
          </div>
        </div>
      </m.div>

      {/* CTA */}
      <m.div {...fadeInUp} className="text-center">
        <h2 className="heading-section text-brand-navy mb-4">
          Automate your return support
        </h2>
        <p className="body-large text-slate-600 max-w-xl mx-auto mb-8">
          Stop losing margin on return support calls. Let Barpel AI handle the entire
          return workflow automatically. Free trial — no credit card required.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" className="btn-primary inline-flex items-center gap-2">
            Start free trial
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/customer-stories"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-brand-navy text-brand-navy font-semibold rounded-lg hover:bg-brand-navy hover:text-white transition-all duration-200"
          >
            More customer stories
          </Link>
        </div>
      </m.div>
    </ContentPageLayout>
  );
}
