"use client";

import ContentPageLayout from '@/components/marketing/ContentPageLayout';
import { m } from 'framer-motion';
import Link from 'next/link';
import {
  Search,
  BookOpen,
  CreditCard,
  Link2,
  Settings,
  BarChart3,
  Wrench,
  ArrowRight,
  MessageCircle,
  FileText,
  HelpCircle,
  Headphones,
  Mail,
  Phone,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const categories = [
  {
    icon: BookOpen,
    title: 'Getting Started',
    description: 'Setup guides, quick start tutorials, and onboarding walkthroughs to get your AI voice agent live in minutes.',
    articles: 12,
    color: 'bg-blue-50 text-blue-500',
  },
  {
    icon: CreditCard,
    title: 'Account & Billing',
    description: 'Manage your subscription, update payment methods, view invoices, and understand your usage and billing cycles.',
    articles: 8,
    color: 'bg-emerald-50 text-emerald-500',
  },
  {
    icon: Link2,
    title: 'Integrations',
    description: 'Connect Barpel with Shopify, WooCommerce, TikTok Shop, Amazon, and other platforms your store relies on.',
    articles: 15,
    color: 'bg-purple-50 text-purple-500',
  },
  {
    icon: Settings,
    title: 'AI Configuration',
    description: 'Customize your voice persona, configure response policies, set up escalation rules, and fine-tune your AI agent.',
    articles: 10,
    color: 'bg-orange-50 text-orange-500',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Understand your call data, track resolution rates, monitor customer satisfaction, and export performance reports.',
    articles: 7,
    color: 'bg-teal-50 text-teal-500',
  },
  {
    icon: Wrench,
    title: 'Troubleshooting',
    description: 'Resolve common issues with call quality, integrations, data sync, and AI response accuracy.',
    articles: 11,
    color: 'bg-red-50 text-red-500',
  },
];

const popularArticles = [
  {
    title: 'How to set up your first AI voice agent',
    category: 'Getting Started',
    readTime: '5 min',
  },
  {
    title: 'Connecting your Shopify store to Barpel',
    category: 'Integrations',
    readTime: '3 min',
  },
  {
    title: 'Understanding your call analytics dashboard',
    category: 'Analytics',
    readTime: '4 min',
  },
  {
    title: 'Customizing your AI voice persona and tone',
    category: 'AI Configuration',
    readTime: '6 min',
  },
  {
    title: 'Upgrading or downgrading your subscription plan',
    category: 'Billing',
    readTime: '2 min',
  },
  {
    title: 'Troubleshooting call quality issues',
    category: 'Troubleshooting',
    readTime: '4 min',
  },
];

const quickLinks = [
  { icon: FileText, title: 'API Documentation', href: '/api-documentation', description: 'Full API reference for developers' },
  { icon: HelpCircle, title: 'FAQ', href: '/faq', description: 'Quick answers to common questions' },
  { icon: MessageCircle, title: 'Community Forum', href: '/contact', description: 'Connect with other Barpel users' },
  { icon: BookOpen, title: 'Video Tutorials', href: '/contact', description: 'Step-by-step video guides' },
];

export default function HelpCenterPage() {
  return (
    <ContentPageLayout
      title="Help Center"
      subtitle="Find answers, explore guides, and get the support you need to make the most of Barpel AI."
      showCTA={false}
    >
      {/* Search Bar */}
      <m.div {...fadeInUp} className="mb-16 -mt-8">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search for articles, guides, and tutorials..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <p className="text-center text-sm text-slate-500 mt-3">
            Popular: order tracking, Shopify setup, voice configuration, billing
          </p>
        </div>
      </m.div>

      {/* Category Grid */}
      <m.div {...fadeInUp} className="mb-20">
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">Browse by category</h2>
          <p className="body-large text-slate-600">
            Explore our knowledge base organized by topic.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <m.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <Link href="/faq" className="block group">
                <div className="card-feature p-8 h-full hover:shadow-lg transition-all duration-300">
                  <div className={`w-12 h-12 ${category.color} rounded-xl flex items-center justify-center mb-4`}>
                    <category.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-brand-navy mb-2 group-hover:text-teal-600 transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">{category.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{category.articles} articles</span>
                    <span className="text-sm font-medium text-teal-500 group-hover:translate-x-1 transition-transform duration-200 inline-flex items-center gap-1">
                      View articles <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            </m.div>
          ))}
        </div>
      </m.div>

      {/* Popular Articles */}
      <m.div {...fadeInUp} className="mb-20">
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">Popular articles</h2>
          <p className="body-large text-slate-600">
            The most-read guides from our knowledge base.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {popularArticles.map((article, index) => (
            <m.div
              key={article.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -10 : 10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Link href="/faq" className="block group">
                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors duration-200">
                  <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-teal-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-brand-navy group-hover:text-teal-600 transition-colors mb-1">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{article.category}</span>
                      <span>{article.readTime} read</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 transition-colors flex-shrink-0 mt-1" />
                </div>
              </Link>
            </m.div>
          ))}
        </div>
      </m.div>

      {/* Quick Links */}
      <m.div {...fadeInUp} className="mb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link, index) => (
            <m.div
              key={link.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <Link href={link.href} className="block group">
                <div className="card-feature p-6 text-center hover:shadow-lg transition-all duration-300">
                  <link.icon className="w-8 h-8 text-teal-500 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-brand-navy group-hover:text-teal-600 transition-colors mb-1">
                    {link.title}
                  </h3>
                  <p className="text-xs text-slate-500">{link.description}</p>
                </div>
              </Link>
            </m.div>
          ))}
        </div>
      </m.div>

      {/* Contact Support */}
      <m.div {...fadeInUp}>
        <div className="bg-gradient-to-br from-brand-navy to-slate-800 rounded-2xl p-12 text-center">
          <Headphones className="w-12 h-12 text-teal-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">
            Can&apos;t find what you&apos;re looking for?
          </h2>
          <p className="text-white/70 max-w-xl mx-auto mb-8">
            Our support team is here to help. Reach out via email or schedule a call
            with our onboarding specialists.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="mailto:support@barpel.ai"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-all duration-200"
            >
              <Mail className="w-4 h-4" />
              Email support
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-200"
            >
              <Phone className="w-4 h-4" />
              Schedule a call
            </Link>
          </div>
        </div>
      </m.div>
    </ContentPageLayout>
  );
}
