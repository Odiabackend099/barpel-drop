"use client";

import { useState } from 'react';
import { m } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ShoppingBag,
  Phone,
  Mic,
  Database,
  Lock,
  Webhook,
  Code,
} from 'lucide-react';
import ContentPageLayout from '@/components/marketing/ContentPageLayout';

const integrations = [
  {
    name: 'Shopify Suite',
    icon: ShoppingBag,
    color: '#95BF47',
    bgColor: 'bg-green-50',
    tagline: 'Your store, fully connected',
    description:
      'Connect your Shopify store in one click. Barpel syncs products, orders, customer data, and store policies in real time so your AI assistant always has the latest information.',
    setupProcess: [
      'Click "Connect Shopify" from your Barpel dashboard',
      'Authorize the Barpel app in your Shopify admin',
      'Select which data to sync (products, orders, policies)',
      'Your AI is ready to answer customer questions in under 60 seconds',
    ],
    features: [
      { label: 'Product Catalog Sync', desc: 'Names, descriptions, prices, variants, images, and inventory levels' },
      { label: 'Order Data Access', desc: 'Real-time order status, tracking numbers, fulfillment history' },
      { label: 'Policy Awareness', desc: 'Return, refund, shipping, and privacy policies parsed automatically' },
      { label: 'Customer Profiles', desc: 'Purchase history, contact info, and lifetime value data' },
      { label: 'Webhook Updates', desc: 'Instant sync when products, orders, or policies change' },
      { label: 'Multi-Store Support', desc: 'Connect multiple Shopify stores to a single Barpel account' },
    ],
    compatibility: 'Works with Shopify Basic, Shopify, Advanced, and Plus plans',
  },
  {
    name: 'Twilio Voice & SMS',
    icon: Phone,
    color: '#F22F46',
    bgColor: 'bg-red-50',
    tagline: 'Crystal-clear voice and messaging',
    description:
      'Powered by Twilio&apos;s global communications infrastructure, Barpel delivers HD voice calls and instant SMS messaging to your customers anywhere in the world.',
    setupProcess: [
      'Barpel provisions your Twilio-powered phone number automatically',
      'Choose a local or toll-free number in your preferred area code',
      'Configure call routing rules (business hours, overflow, etc.)',
      'Start receiving and making AI-powered calls immediately',
    ],
    features: [
      { label: 'HD Voice Quality', desc: 'Opus codec for natural-sounding AI conversations' },
      { label: 'SMS Notifications', desc: 'Automated order updates, return labels, and payment links via text' },
      { label: 'Call Recording', desc: 'Every call recorded and transcribed for quality assurance' },
      { label: 'Local Numbers', desc: 'Phone numbers in 100+ countries for a local presence' },
      { label: 'Call Forwarding', desc: 'Route calls to human agents when AI needs to escalate' },
      { label: 'IVR Bypass', desc: 'No phone trees, customers speak directly to your AI assistant' },
    ],
    compatibility: 'Fully managed by Barpel, no separate Twilio account needed',
  },
  {
    name: 'Vapi AI',
    icon: Mic,
    color: '#00A99D',
    bgColor: 'bg-teal-50',
    tagline: 'The AI voice engine behind every call',
    description:
      'Vapi AI powers the conversational intelligence in Barpel. It understands natural language, maintains context across conversations, and responds with human-like fluency in 30+ languages.',
    setupProcess: [
      'Vapi AI is built into every Barpel plan, no configuration needed',
      'Customize your AI persona through the Barpel dashboard',
      'Train on your store data with zero-shot learning',
      'Preview and test your AI voice before going live',
    ],
    features: [
      { label: 'Natural Language Understanding', desc: 'Understands intent, sentiment, and context from spoken language' },
      { label: 'Multilingual Support', desc: 'Automatic language detection and response in 30+ languages' },
      { label: 'Context Awareness', desc: 'Remembers previous interactions and maintains conversation flow' },
      { label: 'Custom Personas', desc: 'Adjust tone, formality, speed, and personality to match your brand' },
      { label: 'Real-Time Responses', desc: 'Sub-second latency for natural conversational pacing' },
      { label: 'Continuous Learning', desc: 'Improves accuracy with every call based on your feedback' },
    ],
    compatibility: 'Integrated natively, updated automatically with every Barpel release',
  },
  {
    name: 'Supabase',
    icon: Database,
    color: '#3ECF8E',
    bgColor: 'bg-emerald-50',
    tagline: 'Secure auth and data infrastructure',
    description:
      'Supabase provides the authentication layer and real-time database infrastructure that keeps your Barpel account secure and your data instantly accessible.',
    setupProcess: [
      'Authentication is handled automatically when you sign up',
      'Your data is stored in isolated, encrypted database instances',
      'Real-time sync keeps your dashboard updated live',
      'Row-level security ensures data isolation between accounts',
    ],
    features: [
      { label: 'Secure Authentication', desc: 'OAuth 2.0, magic links, and SSO for enterprise accounts' },
      { label: 'Real-Time Database', desc: 'Live dashboard updates without page refresh' },
      { label: 'Row-Level Security', desc: 'Every query scoped to your account, no data leakage possible' },
      { label: 'Encrypted Storage', desc: 'AES-256 encryption at rest for all customer and call data' },
      { label: 'Automatic Backups', desc: 'Point-in-time recovery with daily automated backups' },
      { label: 'Global Edge Network', desc: 'Data served from the nearest region for minimal latency' },
    ],
    compatibility: 'Fully managed infrastructure, zero configuration required',
  },
];

export default function IntegrationsPage() {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  return (
    <ContentPageLayout
      title="Integrations"
      subtitle="Barpel connects to the tools you already use. Plug in your store, your phone system, and your data layer in minutes."
    >
      {/* Integration Overview Grid */}
      <m.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {integrations.map((integration, index) => (
          <m.a
            key={integration.name}
            href={`#${integration.name.toLowerCase().replace(/\s+/g, '-')}`}
            className={`flex flex-col items-center justify-center p-6 ${integration.bgColor} rounded-xl border border-light-mint transition-all duration-300 hover:shadow-teal-md hover:-translate-y-1`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <integration.icon className="w-8 h-8 mb-3" style={{ color: integration.color }} />
            <span className="text-sm font-semibold text-brand-navy text-center">{integration.name}</span>
          </m.a>
        ))}
      </m.div>

      {/* Detailed Integration Cards */}
      <div className="space-y-16">
        {integrations.map((integration) => (
          <m.div
            key={integration.name}
            id={integration.name.toLowerCase().replace(/\s+/g, '-')}
            className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-teal-sm"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
          >
            {/* Card Header */}
            <div className={`p-8 ${integration.bgColor} border-b border-slate-100`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <integration.icon className="w-7 h-7" style={{ color: integration.color }} />
                </div>
                <div>
                  <h2 className="heading-subsection text-brand-navy">{integration.name}</h2>
                  <p className="text-sm text-text-secondary">{integration.tagline}</p>
                </div>
              </div>
              <p className="body-large text-text-secondary max-w-2xl">{integration.description}</p>
            </div>

            {/* Card Body */}
            <div className="p-8">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Setup Process */}
                <div>
                  <h3 className="heading-card text-brand-navy mb-4">Setup Process</h3>
                  <div className="space-y-3">
                    {integration.setupProcess.map((step, stepIndex) => (
                      <div key={stepIndex} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-brand-teal flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-white">{stepIndex + 1}</span>
                        </div>
                        <span className="text-sm text-text-secondary">{step}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-text-secondary italic">{integration.compatibility}</p>
                </div>

                {/* Features */}
                <div>
                  <h3 className="heading-card text-brand-navy mb-4">Key Capabilities</h3>
                  <div className="space-y-3">
                    {integration.features.slice(0, expandedCard === integration.name ? undefined : 4).map((feature, featureIndex) => (
                      <m.div
                        key={feature.label}
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: featureIndex * 0.05, duration: 0.3 }}
                      >
                        <CheckCircle2 className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm font-semibold text-brand-navy">{feature.label}</div>
                          <div className="text-xs text-text-secondary">{feature.desc}</div>
                        </div>
                      </m.div>
                    ))}
                  </div>

                  {integration.features.length > 4 && (
                    <button
                      onClick={() =>
                        setExpandedCard(expandedCard === integration.name ? null : integration.name)
                      }
                      className="mt-4 flex items-center gap-1 text-sm font-medium text-brand-teal hover:underline"
                    >
                      {expandedCard === integration.name ? 'Show less' : `Show all ${integration.features.length} capabilities`}
                      <m.div
                        animate={{ rotate: expandedCard === integration.name ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </m.div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </m.div>
        ))}
      </div>

      {/* Coming Soon / API */}
      <m.div
        className="mt-24"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">
            Build with the <span className="text-brand-teal">Barpel API</span>
          </h2>
          <p className="body-large text-text-secondary max-w-2xl mx-auto">
            Need a custom integration? Our REST API and webhooks let you connect Barpel to any system in your stack.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Code,
              title: 'REST API',
              desc: 'Full programmatic access to calls, orders, analytics, and configuration.',
            },
            {
              icon: Webhook,
              title: 'Webhooks',
              desc: 'Real-time event notifications for calls, escalations, and order updates.',
            },
            {
              icon: Lock,
              title: 'API Keys',
              desc: 'Scoped API keys with fine-grained permissions for secure third-party access.',
            },
          ].map((item, index) => (
            <m.div
              key={item.title}
              className="card-feature text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <item.icon className="w-8 h-8 text-brand-teal mx-auto mb-4" />
              <h3 className="heading-card text-brand-navy mb-2">{item.title}</h3>
              <p className="text-sm text-text-secondary">{item.desc}</p>
            </m.div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/api-documentation"
            className="inline-flex items-center gap-2 text-brand-teal font-semibold hover:gap-3 transition-all duration-200"
          >
            Explore the API documentation
            <ArrowRight className="w-4 h-4" />
          </Link>
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
          Ready to connect your store?
        </h2>
        <p className="body-large text-text-secondary mb-8 max-w-xl mx-auto">
          Set up your integrations in minutes and let Barpel start handling customer calls today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" className="btn-primary">
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/contact" className="btn-secondary">
            Request a custom integration
          </Link>
        </div>
      </m.div>
    </ContentPageLayout>
  );
}
