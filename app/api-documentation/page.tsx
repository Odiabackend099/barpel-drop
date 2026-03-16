"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  Code,
  Key,
  Zap,
  Shield,
  BookOpen,
  Terminal,
  Copy,
  Check,
  Globe,
  Lock,
} from 'lucide-react';
import ContentPageLayout from '@/components/marketing/ContentPageLayout';

const endpoints = [
  {
    method: 'POST',
    path: '/api/calls',
    title: 'Initiate Outbound Call',
    description: 'Start an AI-powered outbound call to a customer for cart recovery, follow-ups, or notifications.',
    params: [
      { name: 'phone_number', type: 'string', required: true, desc: 'Customer phone number in E.164 format' },
      { name: 'purpose', type: 'string', required: true, desc: 'Call purpose: "cart_recovery", "follow_up", "notification"' },
      { name: 'context', type: 'object', required: false, desc: 'Additional context (order_id, cart_items, message)' },
      { name: 'language', type: 'string', required: false, desc: 'ISO 639-1 language code (defaults to "en")' },
    ],
  },
  {
    method: 'GET',
    path: '/api/calls/:id',
    title: 'Get Call Status',
    description: 'Retrieve the current status, transcript, and metadata for a specific call.',
    params: [
      { name: 'id', type: 'string', required: true, desc: 'Unique call identifier returned from POST /api/calls' },
    ],
  },
  {
    method: 'GET',
    path: '/api/analytics',
    title: 'Get Analytics Data',
    description: 'Retrieve aggregated analytics for calls, resolution rates, and customer satisfaction over a time range.',
    params: [
      { name: 'start_date', type: 'string', required: true, desc: 'Start date in ISO 8601 format' },
      { name: 'end_date', type: 'string', required: true, desc: 'End date in ISO 8601 format' },
      { name: 'granularity', type: 'string', required: false, desc: '"hourly", "daily", or "weekly" (defaults to "daily")' },
    ],
  },
  {
    method: 'POST',
    path: '/api/orders/lookup',
    title: 'Lookup Order',
    description: 'Search for an order by order number, email, or phone number. Returns order status and tracking info.',
    params: [
      { name: 'query', type: 'string', required: true, desc: 'Order number, customer email, or phone number' },
      { name: 'type', type: 'string', required: false, desc: 'Search type: "order_number", "email", "phone" (auto-detected if omitted)' },
    ],
  },
  {
    method: 'POST',
    path: '/api/webhooks',
    title: 'Register Webhook',
    description: 'Subscribe to real-time event notifications for calls, escalations, and order updates.',
    params: [
      { name: 'url', type: 'string', required: true, desc: 'HTTPS endpoint URL to receive webhook payloads' },
      { name: 'events', type: 'array', required: true, desc: 'Event types: ["call.started", "call.ended", "call.escalated", "order.updated"]' },
      { name: 'secret', type: 'string', required: false, desc: 'Signing secret for payload verification (auto-generated if omitted)' },
    ],
  },
];

const rateLimits = [
  { plan: 'Starter', limit: '100 requests/min', burst: '20 requests/sec' },
  { plan: 'Growth', limit: '500 requests/min', burst: '50 requests/sec' },
  { plan: 'Scale', limit: '2,000 requests/min', burst: '200 requests/sec' },
  { plan: 'Enterprise', limit: 'Custom', burst: 'Custom' },
];

const curlExample = `curl -X POST https://api.barpel.ai/v1/calls \\
  -H "Authorization: Bearer barpel_sk_live_abc123..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone_number": "+14155551234",
    "purpose": "cart_recovery",
    "context": {
      "cart_items": ["Blue Running Shoes", "White T-Shirt"],
      "cart_value": 89.99,
      "customer_name": "Sarah"
    }
  }'`;

const jsExample = `import Barpel from '@barpel/sdk';

const barpel = new Barpel({
  apiKey: process.env.BARPEL_API_KEY,
});

// Initiate a cart recovery call
const call = await barpel.calls.create({
  phoneNumber: '+14155551234',
  purpose: 'cart_recovery',
  context: {
    cartItems: ['Blue Running Shoes', 'White T-Shirt'],
    cartValue: 89.99,
    customerName: 'Sarah',
  },
});

console.log('Call initiated:', call.id);
console.log('Status:', call.status);

// Listen for call events
barpel.calls.on(call.id, 'ended', (event) => {
  console.log('Call ended:', event.summary);
  console.log('Resolution:', event.resolution);
});`;

const responseExample = `{
  "id": "call_a1b2c3d4e5f6",
  "status": "in_progress",
  "phone_number": "+14155551234",
  "purpose": "cart_recovery",
  "started_at": "2026-03-15T14:30:00Z",
  "duration": null,
  "transcript": null,
  "resolution": null,
  "metadata": {
    "cart_value": 89.99,
    "customer_name": "Sarah"
  }
}`;

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-blue-100 text-blue-700',
    POST: 'bg-green-100 text-green-700',
    PUT: 'bg-yellow-100 text-yellow-700',
    DELETE: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded ${colors[method] || 'bg-slate-100 text-slate-700'}`}>
      {method}
    </span>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-xl bg-slate-900 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-xs text-slate-400 font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm text-slate-300 font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function ApiDocumentationPage() {
  const [activeTab, setActiveTab] = useState<'curl' | 'javascript'>('curl');

  return (
    <ContentPageLayout
      title="API Documentation"
      subtitle="Build custom integrations with the Barpel REST API. Programmatic access to calls, orders, analytics, and more."
    >
      {/* Quick Links */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {[
          { icon: BookOpen, label: 'Overview', href: '#overview' },
          { icon: Key, label: 'Authentication', href: '#authentication' },
          { icon: Terminal, label: 'Endpoints', href: '#endpoints' },
          { icon: Zap, label: 'Rate Limits', href: '#rate-limits' },
        ].map((link, index) => (
          <motion.a
            key={link.label}
            href={link.href}
            className="flex items-center gap-3 p-4 bg-off-white rounded-xl border border-light-mint hover:shadow-teal-md hover:-translate-y-0.5 transition-all duration-200"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <link.icon className="w-5 h-5 text-brand-teal" />
            <span className="text-sm font-semibold text-brand-navy">{link.label}</span>
          </motion.a>
        ))}
      </motion.div>

      {/* Overview */}
      <motion.section
        id="overview"
        className="mb-16"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="heading-section text-brand-navy mb-4">Overview</h2>
        <div className="prose max-w-none">
          <p className="body-large text-text-secondary mb-4">
            The Barpel API is a RESTful interface that gives you full programmatic control over your AI voice support system. Use it to initiate outbound calls, query call history, retrieve analytics, look up orders, and manage webhook subscriptions.
          </p>
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="card-feature">
              <Globe className="w-5 h-5 text-brand-teal mb-2" />
              <div className="text-sm font-semibold text-brand-navy mb-1">Base URL</div>
              <code className="text-xs text-brand-teal font-mono">https://api.barpel.ai/v1</code>
            </div>
            <div className="card-feature">
              <Code className="w-5 h-5 text-brand-teal mb-2" />
              <div className="text-sm font-semibold text-brand-navy mb-1">Format</div>
              <span className="text-xs text-text-secondary">JSON request and response bodies</span>
            </div>
            <div className="card-feature">
              <Shield className="w-5 h-5 text-brand-teal mb-2" />
              <div className="text-sm font-semibold text-brand-navy mb-1">Transport</div>
              <span className="text-xs text-text-secondary">HTTPS required, TLS 1.2+</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Authentication */}
      <motion.section
        id="authentication"
        className="mb-16"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="heading-section text-brand-navy mb-4">Authentication</h2>
        <p className="body-large text-text-secondary mb-6">
          All API requests must include a valid API key in the Authorization header. You can generate and manage API keys from your Barpel dashboard under Settings &gt; API Keys.
        </p>

        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-brand-teal" />
            <span className="text-sm font-semibold text-brand-navy">API Key Format</span>
          </div>
          <code className="text-sm font-mono text-brand-teal">
            Authorization: Bearer barpel_sk_live_xxxxxxxxxxxx
          </code>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="card-feature">
            <Key className="w-5 h-5 text-brand-teal mb-2" />
            <div className="text-sm font-semibold text-brand-navy mb-1">Live Keys</div>
            <p className="text-xs text-text-secondary">
              Prefixed with <code className="font-mono">barpel_sk_live_</code>. Use in production to make real calls and access live data.
            </p>
          </div>
          <div className="card-feature">
            <Key className="w-5 h-5 text-slate-400 mb-2" />
            <div className="text-sm font-semibold text-brand-navy mb-1">Test Keys</div>
            <p className="text-xs text-text-secondary">
              Prefixed with <code className="font-mono">barpel_sk_test_</code>. Use in development to simulate calls without charges.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Endpoints */}
      <motion.section
        id="endpoints"
        className="mb-16"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="heading-section text-brand-navy mb-4">Endpoints</h2>
        <p className="body-large text-text-secondary mb-8">
          Core API endpoints for managing calls, orders, analytics, and webhooks.
        </p>

        <div className="space-y-6">
          {endpoints.map((endpoint, index) => (
            <motion.div
              key={endpoint.path}
              className="bg-white rounded-xl border border-slate-100 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3 mb-1">
                  <MethodBadge method={endpoint.method} />
                  <code className="text-sm font-mono font-semibold text-brand-navy">{endpoint.path}</code>
                </div>
                <p className="text-sm text-text-secondary">{endpoint.description}</p>
              </div>
              <div className="px-6 py-4">
                <div className="text-xs font-semibold text-brand-navy uppercase tracking-wider mb-3">
                  Parameters
                </div>
                <div className="space-y-2">
                  {endpoint.params.map((param) => (
                    <div key={param.name} className="flex items-start gap-4 py-2 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-2 min-w-[160px]">
                        <code className="text-sm font-mono text-brand-navy">{param.name}</code>
                        {param.required && (
                          <span className="text-[10px] font-semibold text-red-500 uppercase">required</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-mono text-slate-400 mr-2">{param.type}</span>
                        <span className="text-sm text-text-secondary">{param.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Code Examples */}
      <motion.section
        className="mb-16"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="heading-section text-brand-navy mb-4">Code Examples</h2>
        <p className="body-large text-text-secondary mb-6">
          Quick-start examples for initiating an outbound cart recovery call.
        </p>

        {/* Tab Selector */}
        <div className="flex gap-2 mb-4">
          {(['curl', 'javascript'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-brand-teal text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab === 'curl' ? 'cURL' : 'JavaScript'}
            </button>
          ))}
        </div>

        <CodeBlock
          code={activeTab === 'curl' ? curlExample : jsExample}
          language={activeTab === 'curl' ? 'bash' : 'javascript'}
        />

        {/* Response Example */}
        <div className="mt-6">
          <h3 className="heading-card text-brand-navy mb-3">Response</h3>
          <CodeBlock code={responseExample} language="json" />
        </div>
      </motion.section>

      {/* Rate Limits */}
      <motion.section
        id="rate-limits"
        className="mb-16"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="heading-section text-brand-navy mb-4">Rate Limits</h2>
        <p className="body-large text-text-secondary mb-6">
          API rate limits vary by plan. When you exceed your limit, the API returns a <code className="font-mono text-sm text-brand-teal">429 Too Many Requests</code> response with a <code className="font-mono text-sm text-brand-teal">Retry-After</code> header.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-brand-navy">Plan</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-brand-navy">Rate Limit</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-brand-navy">Burst Limit</th>
              </tr>
            </thead>
            <tbody>
              {rateLimits.map((limit) => (
                <tr key={limit.plan} className="border-b border-slate-100">
                  <td className="py-3 px-4 text-sm font-medium text-brand-navy">{limit.plan}</td>
                  <td className="py-3 px-4 text-sm text-text-secondary">{limit.limit}</td>
                  <td className="py-3 px-4 text-sm text-text-secondary">{limit.burst}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* SDKs */}
      <motion.div
        className="bg-off-white rounded-2xl p-12 border border-light-mint text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <Terminal className="w-10 h-10 text-brand-teal mx-auto mb-4" />
        <h2 className="heading-subsection text-brand-navy mb-4">SDKs Coming Soon</h2>
        <p className="body-large text-text-secondary mb-6 max-w-xl mx-auto">
          Official client libraries for Node.js, Python, Ruby, and PHP are in development. Sign up to be notified when they launch.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {['Node.js', 'Python', 'Ruby', 'PHP', 'Go'].map((lang) => (
            <span
              key={lang}
              className="px-3 py-1 text-xs font-mono font-medium bg-white text-slate-600 rounded-full border border-slate-200"
            >
              {lang}
            </span>
          ))}
        </div>
        <Link href="/signup" className="btn-primary">
          Get your API key
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </ContentPageLayout>
  );
}
