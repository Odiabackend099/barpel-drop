"use client";

import { m } from 'framer-motion';
import Link from 'next/link';
import {
  Package,
  RefreshCw,
  ShoppingCart,
  Search,
  Globe,
  Clock,
  ArrowRight,
  CheckCircle2,
  Zap,
  BarChart3,
  Shield,
  Headphones,
} from 'lucide-react';
import ContentPageLayout from '@/components/marketing/ContentPageLayout';

const features = [
  {
    icon: Package,
    title: 'Instant Order Tracking',
    description:
      'Customers call and get real-time order status, tracking numbers, and delivery estimates without waiting for a human agent.',
    color: 'from-blue-500 to-blue-400',
    bgColor: 'bg-blue-50',
    details: [
      'Automatic carrier detection across USPS, FedEx, UPS, and DHL',
      'Real-time shipment milestone updates delivered conversationally',
      'Proactive delay notifications sent via SMS before customers even call',
      'Multi-order lookup for repeat buyers in a single conversation',
    ],
  },
  {
    icon: RefreshCw,
    title: 'Hassle-Free Returns',
    description:
      'AI explains your return policy, collects photos via SMS, and initiates the return process automatically.',
    color: 'from-teal-500 to-teal-400',
    bgColor: 'bg-teal-50',
    details: [
      'Policy-aware responses that know your exact return window and conditions',
      'Photo collection via SMS for damage claims without leaving the call',
      'Automatic return label generation and email delivery',
      'Escalation to human agents for complex or high-value returns',
    ],
  },
  {
    icon: ShoppingCart,
    title: 'Smart Cart Recovery',
    description:
      'AI calls customers after cart abandonment, answers questions, and helps complete the purchase.',
    color: 'from-purple-500 to-purple-400',
    bgColor: 'bg-purple-50',
    details: [
      'Configurable delay triggers from 15 minutes to 24 hours post-abandonment',
      'Personalized outreach referencing exact items left in cart',
      'Real-time objection handling with dynamic discount offers',
      'Seamless handoff to checkout with SMS payment links',
    ],
  },
  {
    icon: Search,
    title: 'Live Product Lookup',
    description:
      'Customers ask about products, stock levels, and pricing. AI searches your catalog in real-time.',
    color: 'from-orange-500 to-orange-400',
    bgColor: 'bg-orange-50',
    details: [
      'Full catalog search by name, SKU, category, or natural language description',
      'Real-time inventory and variant availability checks',
      'Price comparison across sizes, colors, and bundle options',
      'Upsell and cross-sell suggestions based on customer interest',
    ],
  },
  {
    icon: Globe,
    title: 'Speak Any Language',
    description:
      'Natural conversations in 30+ languages. Your AI assistant sounds human, not robotic.',
    color: 'from-pink-500 to-pink-400',
    bgColor: 'bg-pink-50',
    details: [
      'Automatic language detection from the first sentence spoken',
      'Native-quality speech in English, Spanish, French, German, Mandarin, and 25+ more',
      'Cultural context awareness for greetings, politeness norms, and date formats',
      'Seamless mid-call language switching for bilingual customers',
    ],
  },
  {
    icon: Clock,
    title: 'Always On',
    description:
      'Never miss a customer call. Handle peak seasons, holidays, and timezone differences effortlessly.',
    color: 'from-green-500 to-green-400',
    bgColor: 'bg-green-50',
    details: [
      'True 24/7/365 availability with zero downtime SLA',
      'Automatic scaling during Black Friday, flash sales, and viral moments',
      'Timezone-aware greetings and business-hour routing',
      'Overflow handling when your human team is at capacity',
    ],
  },
];

const stats = [
  { value: '94%', label: 'Resolution Rate', icon: CheckCircle2 },
  { value: '<3s', label: 'Average Response', icon: Zap },
  { value: '30+', label: 'Languages Supported', icon: Globe },
  { value: '99.9%', label: 'Uptime Guarantee', icon: Shield },
];

export default function FeaturesPage() {
  return (
    <ContentPageLayout
      title="Features"
      subtitle="Everything your customers need, handled by AI. From order tracking to multilingual support, Barpel covers it all."
    >
      {/* Stats Bar */}
      <m.div
        className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {stats.map((stat, index) => (
          <m.div
            key={stat.label}
            className="text-center p-6 bg-off-white rounded-xl border border-light-mint"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <stat.icon className="w-6 h-6 text-brand-teal mx-auto mb-3" />
            <div className="text-2xl font-bold text-brand-navy mb-1">{stat.value}</div>
            <div className="text-sm text-text-secondary">{stat.label}</div>
          </m.div>
        ))}
      </m.div>

      {/* Feature Sections */}
      <div className="space-y-24">
        {features.map((feature, index) => (
          <m.div
            key={feature.title}
            className={`grid lg:grid-cols-2 gap-12 items-center ${
              index % 2 === 1 ? 'lg:flex-row-reverse' : ''
            }`}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            {/* Text Content */}
            <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
              <m.div
                className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${feature.bgColor} mb-6`}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <feature.icon className="w-7 h-7 text-slate-700" />
              </m.div>

              <h2 className="heading-section text-brand-navy mb-4">{feature.title}</h2>
              <p className="body-large text-text-secondary mb-6">{feature.description}</p>

              <ul className="space-y-4 mb-8">
                {feature.details.map((detail, detailIndex) => (
                  <m.li
                    key={detailIndex}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: detailIndex * 0.1, duration: 0.4 }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-text-secondary">{detail}</span>
                  </m.li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="btn-primary"
              >
                Get started free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Visual Placeholder */}
            <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
              <m.div
                className={`relative rounded-2xl overflow-hidden aspect-[4/3] bg-gradient-to-br ${feature.color} p-8 flex items-center justify-center`}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
                <div className="relative z-10 text-center">
                  <feature.icon className="w-16 h-16 text-white/90 mx-auto mb-4" />
                  <div className="text-white/80 text-sm font-medium">{feature.title}</div>
                </div>
                {/* Decorative circles */}
                <div className="absolute top-6 right-6 w-24 h-24 border border-white/20 rounded-full" />
                <div className="absolute bottom-8 left-8 w-32 h-32 border border-white/10 rounded-full" />
                <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
              </m.div>
            </div>
          </m.div>
        ))}
      </div>

      {/* Additional Capabilities */}
      <m.div
        className="mt-24"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">
            And so much <span className="text-brand-teal">more</span>
          </h2>
          <p className="body-large text-text-secondary max-w-2xl mx-auto">
            Every feature is designed to reduce support costs while keeping your customers delighted.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: BarChart3,
              title: 'Real-Time Analytics',
              desc: 'Track call volume, resolution rates, customer satisfaction, and revenue impact from a single dashboard.',
            },
            {
              icon: Headphones,
              title: 'Smart Escalation',
              desc: 'AI knows when to transfer to a human. Set custom triggers based on sentiment, topic, or customer tier.',
            },
            {
              icon: Shield,
              title: 'Enterprise Security',
              desc: 'SOC 2 compliant infrastructure with end-to-end encryption for every call and customer interaction.',
            },
            {
              icon: Zap,
              title: 'Instant Setup',
              desc: 'Connect your Shopify store and go live in under 10 minutes. No engineering team required.',
            },
            {
              icon: RefreshCw,
              title: 'Continuous Learning',
              desc: 'Your AI improves with every call. Review transcripts, flag corrections, and watch accuracy climb.',
            },
            {
              icon: Package,
              title: 'Custom Workflows',
              desc: 'Build multi-step automations for returns, exchanges, warranty claims, and subscription management.',
            },
          ].map((item, index) => (
            <m.div
              key={item.title}
              className="card-feature"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5 text-brand-teal" />
              </div>
              <h3 className="heading-card text-brand-navy mb-2">{item.title}</h3>
              <p className="text-sm text-text-secondary">{item.desc}</p>
            </m.div>
          ))}
        </div>
      </m.div>

      {/* Bottom CTA */}
      <m.div
        className="mt-20 text-center bg-off-white rounded-2xl p-12 border border-light-mint"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="heading-subsection text-brand-navy mb-4">
          Ready to transform your customer support?
        </h2>
        <p className="body-large text-text-secondary mb-8 max-w-xl mx-auto">
          Join 100+ e-commerce brands that use Barpel to handle customer calls automatically.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" className="btn-primary">
            Start your free trial
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/pricing" className="btn-secondary">
            View pricing
          </Link>
        </div>
      </m.div>
    </ContentPageLayout>
  );
}
