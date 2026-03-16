"use client";

import ContentPageLayout from '@/components/marketing/ContentPageLayout';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  Clock,
  Mail,
  TrendingUp,
  Phone,
  Globe,
  Settings,
  BarChart3,
  Users,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const featuredPost = {
  title: 'How AI Voice Support is Transforming E-Commerce in 2026',
  excerpt:
    'The customer service landscape has shifted dramatically. With AI voice technology maturing at an unprecedented pace, e-commerce brands are discovering that automated phone support is no longer a compromise — it&apos;s an upgrade. We explore the trends, data, and real-world results driving this transformation.',
  category: 'Industry Trends',
  date: 'March 12, 2026',
  readTime: '8 min read',
  icon: TrendingUp,
};

const blogPosts = [
  {
    slug: 'reduce-support-tickets-with-ai',
    title: '5 Ways to Reduce Support Tickets with AI',
    excerpt:
      'Learn the proven strategies that top e-commerce brands use to cut their support ticket volume by up to 73% using AI voice agents.',
    category: 'Best Practices',
    date: 'March 8, 2026',
    readTime: '5 min read',
    icon: Settings,
  },
  {
    slug: 'cart-recovery-phone-calls-vs-emails',
    title: 'Cart Recovery: Why Phone Calls Beat Emails',
    excerpt:
      'Email cart recovery gets 2-3% conversion. AI phone calls achieve 8-12%. Here&apos;s the psychology behind why voice outreach works.',
    category: 'Growth',
    date: 'March 5, 2026',
    readTime: '6 min read',
    icon: Phone,
  },
  {
    slug: 'setting-up-ai-voice-assistant',
    title: 'Setting Up Your AI Voice Assistant in 5 Minutes',
    excerpt:
      'A step-by-step guide to configuring your Barpel AI voice agent, from store integration to going live with your first call.',
    category: 'Tutorial',
    date: 'March 1, 2026',
    readTime: '4 min read',
    icon: Settings,
  },
  {
    slug: 'multilingual-support-global-customers',
    title: 'Multilingual Support: Reaching Global Customers',
    excerpt:
      'How AI voice technology enables small businesses to offer native-language phone support in 30+ languages without hiring multilingual agents.',
    category: 'Features',
    date: 'February 26, 2026',
    readTime: '7 min read',
    icon: Globe,
  },
  {
    slug: 'roi-of-ai-customer-service',
    title: 'The ROI of AI Customer Service',
    excerpt:
      'Breaking down the real numbers: cost per call, resolution rates, customer satisfaction scores, and the bottom-line impact of AI support.',
    category: 'Data & Insights',
    date: 'February 22, 2026',
    readTime: '6 min read',
    icon: BarChart3,
  },
  {
    slug: 'barpel-vs-traditional-call-centers',
    title: 'Barpel vs Traditional Call Centers: A Comparison',
    excerpt:
      'An honest side-by-side comparison of AI voice support and traditional call center outsourcing across cost, quality, and scalability.',
    category: 'Comparison',
    date: 'February 18, 2026',
    readTime: '9 min read',
    icon: Users,
  },
];

const categoryColors: Record<string, string> = {
  'Industry Trends': 'bg-purple-100 text-purple-700',
  'Best Practices': 'bg-blue-100 text-blue-700',
  'Growth': 'bg-emerald-100 text-emerald-700',
  'Tutorial': 'bg-orange-100 text-orange-700',
  'Features': 'bg-teal-100 text-teal-700',
  'Data & Insights': 'bg-indigo-100 text-indigo-700',
  'Comparison': 'bg-rose-100 text-rose-700',
};

export default function BlogPage() {
  return (
    <ContentPageLayout
      title="Barpel Blog"
      subtitle="Insights, tutorials, and strategies for modern e-commerce customer support."
      showCTA={false}
    >
      {/* Featured Post */}
      <motion.div {...fadeInUp} className="mb-20">
        <Link href="/blog/ai-voice-support-transforming-ecommerce" className="block group">
          <div className="bg-gradient-to-br from-brand-navy to-slate-800 rounded-2xl p-10 md:p-14 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/5 rounded-full translate-y-1/2 -translate-x-1/4" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-teal-500/20 text-teal-300 text-xs font-semibold rounded-full">
                  {featuredPost.category}
                </span>
                <span className="text-white/50 text-sm flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {featuredPost.readTime}
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 group-hover:text-teal-300 transition-colors duration-300">
                {featuredPost.title}
              </h2>
              <p className="text-white/70 text-lg leading-relaxed mb-6 max-w-3xl">
                {featuredPost.excerpt}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-white/50 text-sm">{featuredPost.date}</span>
                <span className="text-teal-400 font-semibold inline-flex items-center gap-2 group-hover:gap-3 transition-all duration-200">
                  Read article <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Blog Grid */}
      <motion.div {...fadeInUp} className="mb-20">
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">Latest articles</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <motion.div
              key={post.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <Link href={`/blog/${post.slug}`} className="block group h-full">
                <div className="card-feature p-0 h-full flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300">
                  {/* Post Image Area */}
                  <div className="bg-gradient-to-br from-slate-100 to-slate-50 p-8 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center">
                      <post.icon className="w-8 h-8 text-teal-500" />
                    </div>
                  </div>
                  {/* Post Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${categoryColors[post.category] || 'bg-slate-100 text-slate-600'}`}>
                        {post.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-brand-navy mb-2 group-hover:text-teal-600 transition-colors leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100">
                      <span>{post.date}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Newsletter Signup */}
      <motion.div {...fadeInUp}>
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-12 text-center">
          <Mail className="w-10 h-10 text-teal-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-brand-navy mb-4">
            Stay ahead of the curve
          </h2>
          <p className="text-slate-600 max-w-lg mx-auto mb-8">
            Get the latest e-commerce support insights, product updates, and exclusive tips
            delivered to your inbox every week. No spam, unsubscribe anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <button className="px-6 py-3 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-all duration-200 whitespace-nowrap">
              Subscribe
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Join 5,000+ e-commerce professionals. Unsubscribe anytime.
          </p>
        </div>
      </motion.div>
    </ContentPageLayout>
  );
}
