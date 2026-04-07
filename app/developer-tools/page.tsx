"use client";

import ContentPageLayout from '@/components/marketing/ContentPageLayout';
import { m } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  Code2,
  Webhook,
  FileCode2,
  Terminal,
  BookOpen,
  Key,
  Globe,
  Zap,
  Lock,
  Users,
  MessageSquare,
  Package,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const apiEndpoints = [
  { method: 'GET', path: '/v1/calls', description: 'List all call records with filters' },
  { method: 'GET', path: '/v1/calls/:id', description: 'Retrieve a specific call record' },
  { method: 'POST', path: '/v1/agents', description: 'Create or update AI agent configuration' },
  { method: 'GET', path: '/v1/analytics', description: 'Retrieve analytics and metrics' },
  { method: 'POST', path: '/v1/webhooks', description: 'Register a webhook endpoint' },
  { method: 'GET', path: '/v1/transcripts/:id', description: 'Get full call transcript' },
];

const methodColors: Record<string, string> = {
  'GET': 'bg-blue-100 text-blue-700',
  'POST': 'bg-emerald-100 text-emerald-700',
  'PUT': 'bg-orange-100 text-orange-700',
  'DELETE': 'bg-red-100 text-red-700',
};

const webhookEvents = [
  { event: 'call.started', description: 'Fired when an inbound or outbound call begins' },
  { event: 'call.completed', description: 'Fired when a call ends with full transcript data' },
  { event: 'call.transferred', description: 'Fired when AI transfers a call to a human agent' },
  { event: 'call.failed', description: 'Fired when a call fails or is dropped unexpectedly' },
  { event: 'agent.updated', description: 'Fired when an AI agent configuration is modified' },
  { event: 'analytics.daily', description: 'Daily summary of call metrics and performance' },
];

const sdks = [
  {
    language: 'JavaScript / TypeScript',
    status: 'Available',
    statusColor: 'bg-emerald-100 text-emerald-700',
    install: 'npm install @barpel/sdk',
    icon: FileCode2,
  },
  {
    language: 'Python',
    status: 'Coming Soon',
    statusColor: 'bg-amber-100 text-amber-700',
    install: 'pip install barpel',
    icon: Terminal,
  },
  {
    language: 'Ruby',
    status: 'Coming Soon',
    statusColor: 'bg-amber-100 text-amber-700',
    install: 'gem install barpel',
    icon: Code2,
  },
  {
    language: 'PHP',
    status: 'Coming Soon',
    statusColor: 'bg-amber-100 text-amber-700',
    install: 'composer require barpel/sdk',
    icon: Code2,
  },
];

const apiFeatures = [
  {
    icon: Key,
    title: 'API Key Authentication',
    description: 'Simple, secure API key-based auth. Generate and rotate keys from your dashboard.',
  },
  {
    icon: Lock,
    title: 'Rate Limiting',
    description: '1,000 requests per minute on all plans. Higher limits available for enterprise.',
  },
  {
    icon: Globe,
    title: 'RESTful Design',
    description: 'Standard REST conventions with JSON request and response bodies throughout.',
  },
  {
    icon: Zap,
    title: 'Real-time Webhooks',
    description: 'Get instant notifications for call events. HMAC-signed payloads for security.',
  },
];

const webhookCodeExample = `// Express.js webhook handler
const express = require('express');
const crypto = require('crypto');
const app = express();

app.post('/webhooks/barpel', express.json(), (req, res) => {
  // Verify webhook signature
  const signature = req.headers['x-barpel-signature'];
  const hmac = crypto
    .createHmac('sha256', process.env.BARPEL_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (signature !== hmac) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { event, data } = req.body;

  switch (event) {
    case 'call.completed':
      console.log('Call completed:', data.call_id);
      console.log('Duration:', data.duration, 'seconds');
      console.log('Resolution:', data.resolution_status);
      // Update your CRM, analytics, etc.
      break;

    case 'call.transferred':
      console.log('Call transferred to human agent');
      // Notify your support team
      break;
  }

  res.status(200).json({ received: true });
});

app.listen(3000);`;

export default function DeveloperToolsPage() {
  return (
    <ContentPageLayout
      title="Developer Tools"
      subtitle="Build on top of Barpel. Integrate AI voice support into your existing workflows with our API, webhooks, and SDKs."
    >
      {/* Overview */}
      <m.div {...fadeInUp} className="mb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {apiFeatures.map((feature, index) => (
            <m.div
              key={feature.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="card-feature p-6 text-center"
            >
              <feature.icon className="w-8 h-8 text-teal-500 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-brand-navy mb-1">{feature.title}</h3>
              <p className="text-xs text-slate-500">{feature.description}</p>
            </m.div>
          ))}
        </div>
      </m.div>

      {/* REST API Section */}
      <m.div {...fadeInUp} className="mb-20">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Code2 className="w-5 h-5 text-teal-500" />
              <span className="text-sm font-semibold text-teal-600 uppercase tracking-wide">REST API</span>
            </div>
            <h2 className="heading-section text-brand-navy mb-4">
              Full control via <span className="text-teal-500">REST API</span>
            </h2>
            <p className="body-large text-slate-600 mb-6">
              Access call records, manage AI agent configurations, retrieve analytics,
              and control every aspect of your Barpel setup programmatically.
            </p>
            <Link
              href="/api-documentation"
              className="inline-flex items-center gap-2 text-teal-600 font-semibold hover:gap-3 transition-all duration-200"
            >
              View full API documentation
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex-1">
            <div className="bg-slate-900 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-slate-400 ml-2">API Endpoints</span>
              </div>
              <div className="p-4 space-y-2">
                {apiEndpoints.map((endpoint, index) => (
                  <m.div
                    key={endpoint.path}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-center gap-3 py-1.5"
                  >
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${methodColors[endpoint.method]}`}>
                      {endpoint.method}
                    </span>
                    <code className="text-sm text-teal-400 font-mono">{endpoint.path}</code>
                    <span className="text-xs text-slate-500 hidden md:inline">{endpoint.description}</span>
                  </m.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </m.div>

      {/* Webhooks Section */}
      <m.div {...fadeInUp} className="mb-20">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Webhook className="w-5 h-5 text-teal-500" />
            <span className="text-sm font-semibold text-teal-600 uppercase tracking-wide">Webhooks</span>
          </div>
          <h2 className="heading-section text-brand-navy mb-4">
            Real-time <span className="text-teal-500">event notifications</span>
          </h2>
          <p className="body-large text-slate-600 max-w-2xl mx-auto">
            Subscribe to webhook events and get instant notifications when calls start,
            end, transfer, or fail. All payloads are HMAC-signed for security.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Event List */}
          <div>
            <h3 className="text-lg font-semibold text-brand-navy mb-4">Available Events</h3>
            <div className="space-y-3">
              {webhookEvents.map((item, index) => (
                <m.div
                  key={item.event}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <code className="text-sm text-teal-600 font-mono bg-teal-50 px-2 py-0.5 rounded flex-shrink-0">
                    {item.event}
                  </code>
                  <span className="text-sm text-slate-600">{item.description}</span>
                </m.div>
              ))}
            </div>
          </div>

          {/* Code Example */}
          <div>
            <h3 className="text-lg font-semibold text-brand-navy mb-4">Example Integration</h3>
            <div className="bg-slate-900 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-slate-400 ml-2">webhook-handler.js</span>
              </div>
              <pre className="p-4 text-xs text-slate-300 font-mono overflow-x-auto leading-relaxed max-h-96">
                <code>{webhookCodeExample}</code>
              </pre>
            </div>
          </div>
        </div>
      </m.div>

      {/* SDKs Section */}
      <m.div {...fadeInUp} className="mb-20">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Package className="w-5 h-5 text-teal-500" />
            <span className="text-sm font-semibold text-teal-600 uppercase tracking-wide">SDKs</span>
          </div>
          <h2 className="heading-section text-brand-navy mb-4">
            Official <span className="text-teal-500">SDKs</span>
          </h2>
          <p className="body-large text-slate-600 max-w-2xl mx-auto">
            Use our official SDKs for a faster integration experience with built-in
            type safety, error handling, and automatic retries.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sdks.map((sdk, index) => (
            <m.div
              key={sdk.language}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="card-feature p-6"
            >
              <sdk.icon className="w-8 h-8 text-teal-500 mb-3" />
              <h3 className="text-sm font-semibold text-brand-navy mb-1">{sdk.language}</h3>
              <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full mb-3 ${sdk.statusColor}`}>
                {sdk.status}
              </span>
              <div className="bg-slate-900 rounded-lg px-3 py-2">
                <code className="text-xs text-teal-400 font-mono">{sdk.install}</code>
              </div>
            </m.div>
          ))}
        </div>
      </m.div>

      {/* Developer Community CTA */}
      <m.div {...fadeInUp}>
        <div className="bg-gradient-to-br from-brand-navy to-slate-800 rounded-2xl p-12 text-center">
          <Users className="w-10 h-10 text-teal-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">
            Join the developer community
          </h2>
          <p className="text-white/70 max-w-lg mx-auto mb-8">
            Connect with other developers building on Barpel. Share integrations,
            get help, and shape the future of our API.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/api-documentation"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-all duration-200"
            >
              <BookOpen className="w-4 h-4" />
              Read the docs
            </Link>
            <Link
              href="https://discord.gg/barpelai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-200"
            >
              <MessageSquare className="w-4 h-4" />
              Join Discord
            </Link>
          </div>
        </div>
      </m.div>
    </ContentPageLayout>
  );
}
