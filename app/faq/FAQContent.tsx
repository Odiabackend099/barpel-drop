"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Phone, ArrowLeft, Search, ChevronDown, MessageCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // Getting Started
  {
    category: 'Getting Started',
    question: 'How do I set up Barpel for my store?',
    answer: 'Setting up Barpel is simple: 1) Create an account, 2) Connect your Shopify or WooCommerce store with one click, 3) Configure your AI assistant with your brand voice and policies, 4) Get a dedicated phone number and start taking calls. The entire process takes less than 10 minutes.',
  },
  {
    category: 'Getting Started',
    question: 'What e-commerce platforms do you support?',
    answer: 'We currently support Shopify, WooCommerce, BigCommerce, and TikTok Shop. We also offer API access for custom integrations with other platforms. If you need support for a specific platform, please contact our team.',
  },
  {
    category: 'Getting Started',
    question: 'Do I need technical knowledge to use Barpel?',
    answer: 'No technical knowledge is required. Our platform is designed to be user-friendly, with one-click integrations and an intuitive dashboard. Our support team is also available to help you get set up if needed.',
  },

  // Pricing & Billing
  {
    category: 'Pricing & Billing',
    question: 'How does the pricing work?',
    answer: 'Our pricing is based on the number of minutes used per month. Each plan includes a certain number of minutes, and you can upgrade or downgrade at any time. Unused minutes do not roll over to the next month.',
  },
  {
    category: 'Pricing & Billing',
    question: 'What happens if I exceed my monthly minutes?',
    answer: 'If you approach your monthly limit, we will notify you via email. You can either upgrade your plan or purchase additional minutes at $0.08 per minute. We will never cut off your service unexpectedly.',
  },
  {
    category: 'Pricing & Billing',
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time with no cancellation fees. Your service will continue until the end of your current billing period. We also offer a 14-day free trial with no credit card required.',
  },

  // AI & Voice
  {
    category: 'AI & Voice',
    question: 'How does the AI handle complex customer issues?',
    answer: 'Our AI is trained on millions of customer service interactions and can handle most common inquiries automatically. For complex issues, the AI can escalate to a human agent, take a message, or schedule a callback based on your preferences.',
  },
  {
    category: 'AI & Voice',
    question: 'Can I customize the AI\'s voice and personality?',
    answer: 'Yes, you can customize the AI\'s voice, tone, speaking speed, and personality to match your brand. You can also create custom greetings, responses, and escalation rules.',
  },
  {
    category: 'AI & Voice',
    question: 'What languages does the AI support?',
    answer: 'Our AI supports over 30 languages including English, Spanish, French, German, Italian, Portuguese, Dutch, Japanese, Korean, and Chinese. The AI can automatically detect the caller\'s language and respond accordingly.',
  },
  {
    category: 'AI & Voice',
    question: 'How natural does the AI sound?',
    answer: 'Our AI uses advanced voice synthesis technology to sound remarkably human-like. Most callers cannot distinguish the AI from a human agent. You can also choose from multiple voice options to find the best fit for your brand.',
  },

  // Integrations
  {
    category: 'Integrations',
    question: 'How does the Shopify integration work?',
    answer: 'Our Shopify integration syncs your products, orders, and customer data in real-time. The AI can look up order status, process returns, check inventory, and answer product questions using your live store data.',
  },
  {
    category: 'Integrations',
    question: 'Can I integrate Barpel with my CRM?',
    answer: 'Yes, we offer integrations with popular CRMs including Salesforce, HubSpot, and Zoho. You can also use our API or Zapier integration to connect with virtually any system.',
  },
  {
    category: 'Integrations',
    question: 'Do you offer API access?',
    answer: 'Yes, we offer a comprehensive REST API that allows you to integrate Barpel with your existing systems, build custom workflows, and access call data programmatically. API documentation is available in our developer portal.',
  },

  // Security & Privacy
  {
    category: 'Security & Privacy',
    question: 'Is my customer data secure?',
    answer: 'Absolutely. We use enterprise-grade security including AES-256 encryption, SOC 2 Type II compliance, and GDPR compliance. All data is encrypted in transit and at rest. We never share or sell your data.',
  },
  {
    category: 'Security & Privacy',
    question: 'How long do you keep call recordings?',
    answer: 'By default, call recordings are retained for 90 days. You can customize this retention period in your settings, with options ranging from 7 days to indefinite retention. You can also delete recordings at any time.',
  },
  {
    category: 'Security & Privacy',
    question: 'Are you GDPR compliant?',
    answer: 'Yes, we are fully GDPR compliant. We offer data processing agreements, support data subject rights requests, and maintain appropriate technical and organizational measures to protect personal data.',
  },

  // Abandoned Cart
  {
    category: 'Abandoned Cart',
    question: 'How does abandoned cart recovery work?',
    answer: 'When a customer abandons their cart, our system waits 15 minutes and then places an outbound call. The AI answers questions, addresses concerns, and helps complete the purchase. If the customer already bought, the call is automatically canceled.',
  },
  {
    category: 'Abandoned Cart',
    question: 'Can I customize the abandoned cart call timing?',
    answer: 'Yes, you can customize the delay before the call (from 5 minutes to 24 hours), set minimum cart values, and configure which products trigger calls. You can also set quiet hours to avoid calling at inappropriate times.',
  },
];

const categories = ['All', 'Getting Started', 'Pricing & Billing', 'AI & Voice', 'Integrations', 'Security & Privacy', 'Abandoned Cart'];

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [openItems, setOpenItems] = useState<string[]>([]);

  const filteredFAQs = faqData.filter((item) => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleItem = (question: string) => {
    setOpenItems((prev) =>
      prev.includes(question)
        ? prev.filter((q) => q !== question)
        : [...prev, question]
    );
  };

  return (
    <div className="min-h-screen bg-off-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-light-mint sticky top-0 z-50">
        <div className="container-default py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-brand-teal flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-brand-navy font-display">
              Barpel
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-brand-navy hover:text-brand-teal transition-colors duration-150 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12">
        <div className="container-default max-w-4xl">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="heading-section text-brand-navy mb-4">
              Frequently Asked Questions
            </h1>
            <p className="body-large text-text-secondary max-w-2xl mx-auto">
              Find answers to common questions about Barpel&apos;s AI-powered voice support platform.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white rounded-xl border border-light-mint focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none transition-all duration-200"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-brand-teal text-white'
                    : 'bg-white text-brand-navy hover:bg-off-white border border-light-mint'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((item) => (
                <div
                  key={item.question}
                  className="bg-white rounded-xl border border-light-mint overflow-hidden"
                >
                  <button
                    onClick={() => toggleItem(item.question)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-off-white/50 transition-colors duration-200"
                  >
                    <span className="font-semibold text-brand-navy pr-4">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-brand-teal flex-shrink-0 transition-transform duration-200 ${
                        openItems.includes(item.question) ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div
                    className={`px-6 overflow-hidden transition-all duration-300 ${
                      openItems.includes(item.question) ? 'pb-5 max-h-96' : 'max-h-0'
                    }`}
                  >
                    <p className="text-text-secondary">{item.answer}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-light-mint mx-auto mb-4" />
                <p className="text-text-secondary mb-2">No results found</p>
                <p className="text-sm text-text-muted">
                  Try adjusting your search or browse all categories
                </p>
              </div>
            )}
          </div>

          {/* Content Freshness */}
          <p className="mt-8 text-xs text-text-muted text-right">
            Last updated: March 2026
          </p>

          {/* Contact CTA */}
          <div className="mt-4 bg-brand-teal rounded-2xl p-8 text-center text-white">
            <h2 className="text-xl font-bold mb-2">Still have questions?</h2>
            <p className="text-white/80 mb-6">
              Our support team is here to help you get started.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-teal font-semibold rounded-lg hover:bg-off-white transition-colors duration-200"
            >
              Contact Support
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-light-mint py-8">
        <div className="container-default">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-text-secondary">
              © 2026 Barpel AI. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-sm text-text-secondary hover:text-brand-teal">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-text-secondary hover:text-brand-teal">
                Terms of Service
              </Link>
              <Link href="/data-processing" className="text-sm text-text-secondary hover:text-brand-teal">
                Data Processing
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
