"use client";

import ContentPageLayout from '@/components/marketing/ContentPageLayout';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowLeft,
  Package,
  TrendingDown,
  DollarSign,
  CheckCircle2,
  Quote,
  Calendar,
  Zap,
  Globe,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const keyMetrics = [
  { value: '73%', label: 'Reduction in support tickets', icon: TrendingDown },
  { value: '$5.8K', label: 'Monthly savings', icon: DollarSign },
  { value: '1 day', label: 'Setup time', icon: Calendar },
  { value: '10,000+', label: 'Monthly orders handled', icon: Package },
];

const timeline = [
  {
    day: 'Day 1',
    title: 'Installation & Configuration',
    description: 'Connected WooCommerce store, synced 3,200 active products, configured shipping policies and return rules for 4 suppliers.',
  },
  {
    day: 'Day 2-3',
    title: 'AI Training & Testing',
    description: 'Uploaded FAQ database, trained AI on supplier-specific shipping timelines, tested 50 sample call scenarios with the team.',
  },
  {
    day: 'Day 4',
    title: 'Soft Launch',
    description: 'Routed 25% of inbound calls to Barpel AI. Monitored call quality and resolution rates in real time.',
  },
  {
    day: 'Week 2',
    title: 'Full Deployment',
    description: 'Expanded to 100% of inbound calls. Two support agents reassigned to growth and supplier relations.',
  },
  {
    day: 'Month 1',
    title: 'Measurable Results',
    description: 'Support tickets down 73%. Monthly support costs reduced from $8K to $2.2K. Customer satisfaction stable at 91%.',
  },
];

const beforeAfter = [
  { category: 'Support Agents', before: '3 full-time', after: '1 (oversight only)' },
  { category: 'Monthly Support Cost', before: '$8,000', after: '$2,200' },
  { category: 'Avg Response Time', before: '4.2 hours', after: '<1 second' },
  { category: 'Tickets per Day', before: '145', after: '39' },
  { category: 'CSAT Score', before: '82%', after: '91%' },
  { category: 'Languages Supported', before: '1 (English)', after: '30+' },
];

export default function DropshipDirectCaseStudy() {
  return (
    <ContentPageLayout
      title="DropshipDirect Case Study"
      subtitle="How a high-volume dropshipping store reduced support tickets by 73% and saved $5.8K per month with Barpel AI."
    >
      {/* Back Link */}
      <motion.div {...fadeInUp} className="mb-8">
        <Link
          href="/customer-stories"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customer Stories
        </Link>
      </motion.div>

      {/* Company Overview */}
      <motion.div {...fadeInUp} className="mb-16">
        <div className="bg-gradient-to-br from-brand-navy to-slate-800 rounded-2xl p-10">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <span className="text-teal-400 text-sm font-semibold uppercase tracking-wide">Dropshipping</span>
              <h2 className="text-3xl font-bold text-white mt-2 mb-4">DropshipDirect</h2>
              <p className="text-white/70 leading-relaxed">
                DropshipDirect is a high-volume dropshipping operation processing over 10,000 orders per month
                across multiple product categories. They source from 4 international suppliers and ship to
                customers in 12 countries.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {keyMetrics.map((metric) => (
                <div key={metric.label} className="bg-white/10 rounded-xl p-4 text-center min-w-[140px]">
                  <metric.icon className="w-5 h-5 text-teal-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{metric.value}</div>
                  <div className="text-xs text-white/60">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* The Challenge */}
      <motion.div {...fadeInUp} className="mb-16">
        <h2 className="heading-section text-brand-navy mb-6">The Challenge</h2>
        <div className="prose prose-slate max-w-none">
          <p className="body-large text-slate-600 leading-relaxed mb-4">
            DropshipDirect was drowning in customer support inquiries. With products shipping from China,
            Turkey, and India, delivery times ranged from 7 to 28 days. Customers were anxious, confused,
            and calling constantly to ask about their order status.
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            The company employed three full-time support agents at a combined cost of $8,000 per month.
            Despite this investment, response times averaged 4.2 hours, and the team was perpetually behind.
            Peak holiday seasons made the problem even worse, with ticket volumes tripling.
          </p>
          <p className="text-slate-600 leading-relaxed">
            The most common inquiry — &quot;Where is my order?&quot; — accounted for 62% of all support tickets.
            These were simple, repetitive questions that didn&apos;t require human judgment, yet they consumed
            the majority of the team&apos;s time.
          </p>
        </div>
      </motion.div>

      {/* The Solution */}
      <motion.div {...fadeInUp} className="mb-16">
        <h2 className="heading-section text-brand-navy mb-6">The Solution</h2>
        <p className="text-slate-600 leading-relaxed mb-8">
          DropshipDirect implemented Barpel AI to handle their most common call types: order tracking,
          shipping status updates, return policy questions, and delivery estimates. The AI was configured
          with supplier-specific shipping timelines and could pull real-time tracking data from 6 carriers.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Package,
              title: 'Automated Order Tracking',
              description: 'AI retrieves tracking information from 6 carriers and provides real-time updates to callers.',
            },
            {
              icon: Globe,
              title: 'Multilingual Handling',
              description: 'With customers in 12 countries, AI now handles calls in their native language.',
            },
            {
              icon: Zap,
              title: 'Proactive Outreach',
              description: 'AI calls customers proactively when shipments are delayed, reducing inbound volume.',
            },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="card-feature p-6"
            >
              <item.icon className="w-8 h-8 text-teal-500 mb-3" />
              <h3 className="text-sm font-semibold text-brand-navy mb-1">{item.title}</h3>
              <p className="text-xs text-slate-600">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Timeline */}
      <motion.div {...fadeInUp} className="mb-16">
        <h2 className="heading-section text-brand-navy mb-8">Implementation Timeline</h2>
        <div className="space-y-6">
          {timeline.map((item, index) => (
            <motion.div
              key={item.day}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="flex gap-6"
            >
              <div className="flex-shrink-0 w-20">
                <span className="text-sm font-bold text-teal-500">{item.day}</span>
              </div>
              <div className="flex-1 pb-6 border-l-2 border-teal-100 pl-6 relative">
                <div className="absolute -left-[9px] top-0 w-4 h-4 bg-teal-500 rounded-full border-2 border-white" />
                <h3 className="text-sm font-semibold text-brand-navy mb-1">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Before & After */}
      <motion.div {...fadeInUp} className="mb-16">
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
                <motion.tr
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
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Quote */}
      <motion.div {...fadeInUp} className="mb-16">
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-10">
          <Quote className="w-10 h-10 text-teal-300 mb-4" />
          <blockquote className="text-xl text-brand-navy font-medium leading-relaxed mb-6">
            &quot;Barpel completely transformed how we handle customer support. We went from three overwhelmed
            agents firefighting tickets all day to a lean operation focused on growth. The AI handles our
            most common calls flawlessly, and our customers are actually happier than before.&quot;
          </blockquote>
          <div>
            <div className="text-sm font-semibold text-brand-navy">Marcus Chen</div>
            <div className="text-sm text-slate-500">CEO, DropshipDirect</div>
          </div>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div {...fadeInUp} className="text-center">
        <h2 className="heading-section text-brand-navy mb-4">
          Ready to see similar results?
        </h2>
        <p className="body-large text-slate-600 max-w-xl mx-auto mb-8">
          Start your free trial and see how Barpel AI can transform your support operation,
          just like it did for DropshipDirect.
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
      </motion.div>
    </ContentPageLayout>
  );
}
