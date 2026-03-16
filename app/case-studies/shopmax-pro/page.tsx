"use client";

import ContentPageLayout from '@/components/marketing/ContentPageLayout';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowLeft,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Quote,
  Phone,
  Mail,
  Heart,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const keyMetrics = [
  { value: '4.2x', label: 'Cart recovery improvement', icon: TrendingUp },
  { value: '$127', label: 'Avg recovered cart value', icon: DollarSign },
  { value: '89%', label: 'Positive customer feedback', icon: Heart },
  { value: '68%→16%', label: 'Abandonment rate', icon: ShoppingCart },
];

const recoveryComparison = [
  { channel: 'Email campaigns (before)', rate: '2.1%', volume: '~85 carts/month', value: '$8,925' },
  { channel: 'Barpel AI calls (after)', rate: '8.8%', volume: '~357 carts/month', value: '$45,339' },
];

const timeline = [
  {
    day: 'Day 1',
    title: 'Shopify Integration',
    description: 'One-click Shopify Plus installation. Synced 1,800 products, customer data, and checkout flow.',
  },
  {
    day: 'Day 2',
    title: 'Voice Persona Setup',
    description: 'Configured a warm, premium brand voice matching ShopMax Pro&apos;s luxury positioning. Set call timing to 15 minutes post-abandonment.',
  },
  {
    day: 'Day 3-7',
    title: 'A/B Testing Phase',
    description: 'Split traffic 50/50 between email-only recovery and email + AI call recovery to measure incremental impact.',
  },
  {
    day: 'Week 2-4',
    title: 'Full Rollout',
    description: 'Expanded AI calls to all abandoned carts. Optimized call scripts based on product category and cart value.',
  },
  {
    day: 'Month 2',
    title: 'Optimization',
    description: 'Fine-tuned timing, added product-specific objection handling, and introduced upsell suggestions during calls.',
  },
];

const whyItWorks = [
  {
    title: 'Personal touch at scale',
    description: 'A phone call feels more personal than an email, yet AI allows you to make this call for every single abandoned cart.',
  },
  {
    title: 'Real-time objection handling',
    description: 'When customers have questions about shipping, returns, or product details, AI answers instantly — removing purchase barriers on the spot.',
  },
  {
    title: 'Optimal timing',
    description: 'Calling 15 minutes after abandonment catches customers while the purchase intent is still high. Email often arrives hours too late.',
  },
  {
    title: 'No pressure, all help',
    description: 'The AI positions the call as customer service, not sales. It asks if the customer needs help completing their order — a subtle but powerful difference.',
  },
];

export default function ShopMaxProCaseStudy() {
  return (
    <ContentPageLayout
      title="ShopMax Pro Case Study"
      subtitle="How a Shopify Plus store achieved 4.2x cart recovery improvement and $127 average recovered cart value with AI phone calls."
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
        <div className="bg-gradient-to-br from-brand-teal to-teal-600 rounded-2xl p-10">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <span className="text-white/60 text-sm font-semibold uppercase tracking-wide">Shopify Plus</span>
              <h2 className="text-3xl font-bold text-white mt-2 mb-4">ShopMax Pro</h2>
              <p className="text-white/80 leading-relaxed">
                ShopMax Pro is a premium home goods retailer on Shopify Plus, offering curated furniture,
                decor, and kitchen products. With an average order value of $185, cart abandonment was
                costing them significant revenue every month.
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
      </motion.div>

      {/* The Challenge */}
      <motion.div {...fadeInUp} className="mb-16">
        <h2 className="heading-section text-brand-navy mb-6">The Challenge</h2>
        <p className="body-large text-slate-600 leading-relaxed mb-4">
          ShopMax Pro faced a 68% cart abandonment rate — slightly above the e-commerce average, but with
          their high average order value of $185, every abandoned cart represented significant lost revenue.
        </p>
        <p className="text-slate-600 leading-relaxed mb-4">
          Their existing recovery strategy relied entirely on a 3-email drip campaign. The first email
          went out 1 hour after abandonment, followed by a reminder at 24 hours, and a final discount
          offer at 72 hours. This sequence converted at just 2.1% — well below their target.
        </p>
        <p className="text-slate-600 leading-relaxed">
          The marketing team experimented with timing, subject lines, and discount amounts, but email
          recovery had plateaued. They needed a fundamentally different approach to re-engage customers
          who had shown high purchase intent but didn&apos;t complete checkout.
        </p>
      </motion.div>

      {/* The Solution */}
      <motion.div {...fadeInUp} className="mb-16">
        <h2 className="heading-section text-brand-navy mb-6">The Solution</h2>
        <p className="text-slate-600 leading-relaxed mb-8">
          ShopMax Pro implemented Barpel AI cart recovery calls as a complement to their email sequence.
          The AI calls customers 15 minutes after cart abandonment — while purchase intent is still high —
          and offers to help with any questions about the products in their cart.
        </p>

        <div className="bg-slate-50 rounded-2xl p-8 mb-8">
          <h3 className="text-lg font-semibold text-brand-navy mb-4">How the call works</h3>
          <div className="space-y-4">
            {[
              'AI calls the customer 15 minutes after abandonment',
              'Introduces itself as ShopMax Pro customer service',
              'References the specific products left in the cart',
              'Asks if the customer has any questions or needs help',
              'Answers product questions, shipping costs, return policy',
              'Offers to transfer to a human agent if needed',
              'If customer is interested, sends a one-click checkout link via SMS',
            ].map((step, index) => (
              <motion.div
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
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Recovery Comparison */}
      <motion.div {...fadeInUp} className="mb-16">
        <h2 className="heading-section text-brand-navy mb-8">Recovery Performance</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {recoveryComparison.map((item, index) => (
            <motion.div
              key={item.channel}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`rounded-2xl p-8 ${index === 0 ? 'bg-slate-100' : 'bg-teal-50 border-2 border-teal-200'}`}
            >
              <div className="flex items-center gap-2 mb-4">
                {index === 0 ? <Mail className="w-5 h-5 text-slate-400" /> : <Phone className="w-5 h-5 text-teal-500" />}
                <span className={`text-sm font-semibold ${index === 0 ? 'text-slate-500' : 'text-teal-600'}`}>
                  {item.channel}
                </span>
              </div>
              <div className={`text-4xl font-bold mb-2 ${index === 0 ? 'text-slate-600' : 'text-teal-600'}`}>
                {item.rate}
              </div>
              <div className="text-sm text-slate-500 mb-1">Recovery rate</div>
              <div className="text-sm text-slate-600">{item.volume} recovered</div>
              <div className={`text-lg font-bold mt-4 ${index === 0 ? 'text-slate-700' : 'text-teal-700'}`}>
                {item.value}/month revenue recovered
              </div>
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
              <div className="flex-shrink-0 w-24">
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

      {/* Why It Works */}
      <motion.div {...fadeInUp} className="mb-16">
        <h2 className="heading-section text-brand-navy mb-8">Why Phone Calls Beat Email</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {whyItWorks.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="flex gap-4"
            >
              <CheckCircle2 className="w-6 h-6 text-teal-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-brand-navy mb-1">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quote */}
      <motion.div {...fadeInUp} className="mb-16">
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-10">
          <Quote className="w-10 h-10 text-teal-300 mb-4" />
          <blockquote className="text-xl text-brand-navy font-medium leading-relaxed mb-6">
            &quot;The ROI was immediate. In our first week with Barpel cart recovery calls, we recovered
            more revenue than our email campaigns had in the entire previous month. The AI feels so natural
            that customers don&apos;t even realize they&apos;re talking to an AI — they just feel helped.&quot;
          </blockquote>
          <div>
            <div className="text-sm font-semibold text-brand-navy">Sarah Kim</div>
            <div className="text-sm text-slate-500">Head of E-Commerce, ShopMax Pro</div>
          </div>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div {...fadeInUp} className="text-center">
        <h2 className="heading-section text-brand-navy mb-4">
          Recover more carts with AI calls
        </h2>
        <p className="body-large text-slate-600 max-w-xl mx-auto mb-8">
          Start recovering abandoned carts with Barpel AI today. Free trial includes
          cart recovery calls — no credit card required.
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
