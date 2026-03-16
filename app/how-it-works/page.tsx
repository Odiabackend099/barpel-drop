"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Plug,
  Sliders,
  Phone,
  ArrowRight,
  CheckCircle2,
  ShoppingBag,
  FileText,
  MessageSquare,
  BarChart3,
  Zap,
  Clock,
  Globe,
  Users,
  Headphones,
  Settings,
} from 'lucide-react';
import ContentPageLayout from '@/components/marketing/ContentPageLayout';

const Package = ShoppingBag;

const steps = [
  {
    number: '01',
    icon: Plug,
    title: 'Connect Your Store',
    subtitle: 'One-click Shopify integration',
    description:
      'Link your Shopify store to Barpel in seconds. We securely sync everything your AI needs to deliver outstanding customer support from day one.',
    color: 'from-blue-500 to-blue-400',
    syncs: [
      { icon: ShoppingBag, label: 'Product Catalog', desc: 'Names, descriptions, prices, variants, and images' },
      { icon: Package, label: 'Order Data', desc: 'Order status, tracking numbers, fulfillment details' },
      { icon: FileText, label: 'Store Policies', desc: 'Return, refund, and shipping policies' },
      { icon: Users, label: 'Customer Profiles', desc: 'Purchase history, preferences, and contact info' },
    ],
    details: [
      'OAuth-based secure connection with no passwords stored',
      'Initial sync completes in under 60 seconds for most stores',
      'Real-time webhook updates keep everything current',
      'Works with Shopify Basic, Shopify, Advanced, and Plus plans',
    ],
    setupTime: 'Under 2 minutes',
  },
  {
    number: '02',
    icon: Sliders,
    title: 'Configure Your AI',
    subtitle: 'Teach it your brand voice',
    description:
      'Customize how your AI assistant speaks, what policies it enforces, and when it escalates to your team. No coding required.',
    color: 'from-teal-500 to-teal-400',
    syncs: [
      { icon: MessageSquare, label: 'Voice Persona', desc: 'Tone, vocabulary, greeting style, and personality' },
      { icon: FileText, label: 'Return Policies', desc: 'Return windows, conditions, exceptions, and processes' },
      { icon: Headphones, label: 'Escalation Rules', desc: 'When to transfer, who to notify, priority levels' },
      { icon: Settings, label: 'Brand Voice', desc: 'Company name pronunciation, taglines, and key phrases' },
    ],
    details: [
      'Choose from professional, friendly, or casual voice personas',
      'Set custom return windows and condition requirements',
      'Define escalation triggers based on sentiment or topic',
      'Preview your AI in a test call before going live',
    ],
    setupTime: 'About 5 minutes',
  },
  {
    number: '03',
    icon: Phone,
    title: 'Start Taking Calls',
    subtitle: 'Go live instantly',
    description:
      'Get a dedicated phone number, forward your existing line, or embed a call widget on your site. Your AI is ready to answer every customer call.',
    color: 'from-green-500 to-green-400',
    syncs: [
      { icon: Phone, label: 'Dedicated Number', desc: 'Local or toll-free number assigned to your store' },
      { icon: BarChart3, label: 'Real-Time Analytics', desc: 'Call volume, resolution rate, and satisfaction scores' },
      { icon: Globe, label: 'Multilingual Support', desc: '30+ languages detected and spoken automatically' },
      { icon: Clock, label: '24/7 Availability', desc: 'AI answers every call, day or night, no exceptions' },
    ],
    details: [
      'Choose a local or toll-free number in your preferred area code',
      'Forward your existing support line to Barpel during off-hours',
      'Monitor live calls and step in anytime from your dashboard',
      'Receive daily summaries of call outcomes and customer feedback',
    ],
    setupTime: 'Instant',
  },
];

export default function HowItWorksPage() {
  return (
    <ContentPageLayout
      title="How It Works"
      subtitle="Three simple steps to AI-powered customer support. Get up and running in under 10 minutes."
    >
      {/* Timeline Overview */}
      <motion.div
        className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-20"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                <span className="text-sm font-bold text-white">{step.number}</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-brand-navy">{step.title}</div>
                <div className="text-xs text-text-secondary">{step.setupTime}</div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <ArrowRight className="w-5 h-5 text-slate-300 hidden md:block" />
            )}
          </div>
        ))}
      </motion.div>

      {/* Detailed Steps */}
      <div className="space-y-32">
        {steps.map((step, index) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            {/* Step Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                <step.icon className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-xs font-semibold text-brand-teal uppercase tracking-wider">
                  Step {step.number}
                </span>
                <h2 className="heading-section text-brand-navy">{step.title}</h2>
              </div>
            </div>

            <p className="body-large text-text-secondary mb-10 max-w-2xl">
              {step.description}
            </p>

            {/* Two Column Layout */}
            <div className={`grid lg:grid-cols-2 gap-12 items-start ${index % 2 === 1 ? '' : ''}`}>
              {/* What Syncs / Configures / Happens */}
              <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                <h3 className="heading-card text-brand-navy mb-6">
                  {index === 0
                    ? 'What gets synced'
                    : index === 1
                    ? 'What you configure'
                    : 'What you get'}
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {step.syncs.map((sync, syncIndex) => (
                    <motion.div
                      key={sync.label}
                      className="card-feature"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: syncIndex * 0.1, duration: 0.4 }}
                    >
                      <sync.icon className="w-5 h-5 text-brand-teal mb-3" />
                      <div className="text-sm font-semibold text-brand-navy mb-1">{sync.label}</div>
                      <div className="text-xs text-text-secondary">{sync.desc}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Details + Visual */}
              <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                <div className={`rounded-2xl p-8 bg-gradient-to-br ${step.color} relative overflow-hidden mb-8`}>
                  <div className="absolute inset-0 bg-white/5" />
                  <div className="relative z-10">
                    <step.icon className="w-12 h-12 text-white/80 mb-4" />
                    <div className="text-white font-semibold text-lg mb-2">{step.subtitle}</div>
                    <div className="text-white/70 text-sm">Setup time: {step.setupTime}</div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-32 h-32 border border-white/10 rounded-full" />
                  <div className="absolute top-4 right-4 w-20 h-20 border border-white/15 rounded-full" />
                </div>

                <ul className="space-y-3">
                  {step.details.map((detail, detailIndex) => (
                    <motion.li
                      key={detailIndex}
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: detailIndex * 0.1, duration: 0.4 }}
                    >
                      <CheckCircle2 className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-text-secondary">{detail}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Total Setup Time */}
      <motion.div
        className="mt-24 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-teal-50 rounded-full mb-8">
          <Zap className="w-5 h-5 text-brand-teal" />
          <span className="text-sm font-semibold text-brand-teal">
            Total setup time: under 10 minutes
          </span>
        </div>
      </motion.div>

      {/* Trust Section */}
      <motion.div
        className="mt-8 bg-off-white rounded-2xl p-12 border border-light-mint"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-brand-navy mb-2">500+</div>
            <div className="text-sm text-text-secondary">Stores connected</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-brand-navy mb-2">2M+</div>
            <div className="text-sm text-text-secondary">Calls handled</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-brand-navy mb-2">94%</div>
            <div className="text-sm text-text-secondary">First-call resolution</div>
          </div>
        </div>
      </motion.div>

      {/* Bottom CTA */}
      <motion.div
        className="mt-16 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="heading-subsection text-brand-navy mb-4">
          Ready to get started?
        </h2>
        <p className="body-large text-text-secondary mb-8 max-w-xl mx-auto">
          Set up Barpel in minutes and let AI handle your customer calls starting today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" className="btn-primary">
            Start your free trial
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/contact" className="btn-secondary">
            Talk to sales
          </Link>
        </div>
      </motion.div>
    </ContentPageLayout>
  );
}
