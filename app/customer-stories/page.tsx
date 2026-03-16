"use client";

import ContentPageLayout from '@/components/marketing/ContentPageLayout';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  Quote,
  Star,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const stories = [
  {
    company: 'DropshipDirect',
    stat: '24/7',
    statLabel: 'Automated phone coverage',
    description:
      'A high-volume dropshipping store with 10,000+ monthly orders was drowning in &quot;Where is my order?&quot; calls. After implementing Barpel AI, they automated the majority of routine calls and reassigned two full-time agents to growth initiatives.',
    industry: 'Dropshipping',
    results: ['24/7 AI coverage', '$5.8K monthly savings', '1-day setup'],
    href: '/case-studies/dropship-direct',
    gradient: 'from-brand-navy to-brand-teal',
    bgColor: 'bg-brand-navy',
    quote: 'Barpel completely transformed our support operation. We went from firefighting to growing.',
    quotePerson: 'Marcus Chen, CEO',
  },
  {
    company: 'ShopMax Pro',
    stat: '4.2x',
    statLabel: 'Increase in cart recovery rate',
    description:
      'This Shopify Plus store selling premium home goods was losing thousands in abandoned carts every month. Barpel AI cart recovery calls converted at 4.2x the rate of their previous email campaigns, recovering an average of $127 per cart.',
    industry: 'Shopify Plus',
    results: ['4.2x recovery rate', '$127 avg cart value', '89% satisfaction'],
    href: '/case-studies/shopmax-pro',
    gradient: 'from-brand-teal to-brand-mint',
    bgColor: 'bg-brand-teal',
    quote: 'The ROI was immediate. Barpel paid for itself within the first week of cart recovery calls.',
    quotePerson: 'Sarah Kim, Head of E-Commerce',
  },
  {
    company: 'GlobalGoods',
    stat: '24/7',
    statLabel: 'Customer support coverage',
    description:
      'An international marketplace with customers in 40+ countries needed round-the-clock support in multiple languages. Barpel AI now provides true 24/7 coverage in 30+ languages, something that was impossible with their previous team of 8 agents.',
    industry: 'International Marketplace',
    results: ['24/7 coverage', '30+ languages', '94% CSAT score'],
    href: '/case-studies/globalgoods',
    gradient: 'from-brand-mint to-[#F5A623]',
    bgColor: 'bg-brand-mint',
    quote: 'We went from covering 3 timezones to covering all of them, instantly.',
    quotePerson: 'James Okonkwo, VP of Customer Experience',
  },
  {
    company: 'TrendyMart',
    stat: '$50K',
    statLabel: 'Saved in support costs annually',
    description:
      'A fast-fashion Shopify store with high return volume was spending nearly 40% of their support budget on returns-related calls. Barpel AI automated the entire return workflow, cutting costs dramatically and speeding up processing by 60%.',
    industry: 'Fashion E-Commerce',
    results: ['$50K saved yearly', '60% faster returns', '45% fewer calls'],
    href: '/case-studies/trendymart',
    gradient: 'from-[#9C27B0] to-[#E91E63]',
    bgColor: 'bg-[#9C27B0]',
    quote: 'Returns used to be our biggest headache. Now they basically run themselves.',
    quotePerson: 'Lisa Rodriguez, COO',
  },
];

const overallStats = [
  { value: '100+', label: 'Businesses using Barpel' },
  { value: '2M+', label: 'Calls handled by AI' },
  { value: '94%', label: 'Average CSAT score' },
  { value: '$12M+', label: 'Saved in support costs' },
];

export default function CustomerStoriesPage() {
  return (
    <ContentPageLayout
      title="Customer Stories"
      subtitle="See how businesses of all sizes are growing with Barpel AI voice support."
    >
      {/* Overall Stats */}
      <motion.div {...fadeInUp} className="mb-20">
        <div className="bg-gradient-to-br from-brand-navy to-slate-800 rounded-2xl p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {overallStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-teal-400 mb-2">{stat.value}</div>
                <div className="text-white/70 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Story Cards */}
      <motion.div {...fadeInUp} className="mb-20">
        <div className="space-y-12">
          {stories.map((story, index) => (
            <motion.div
              key={story.company}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="flex flex-col lg:flex-row">
                  {/* Stat Panel */}
                  <div className={`${story.bgColor} p-10 lg:w-80 flex-shrink-0 flex flex-col justify-center text-center lg:text-left`}>
                    <div className="text-white/60 text-sm font-medium mb-1">{story.industry}</div>
                    <div className="text-white text-xl font-bold mb-4">{story.company}</div>
                    <div className="text-5xl lg:text-6xl font-bold text-white mb-2">{story.stat}</div>
                    <div className="text-white/80 text-sm">{story.statLabel}</div>
                  </div>

                  {/* Content Panel */}
                  <div className="p-8 lg:p-10 flex-1">
                    <p className="text-slate-600 leading-relaxed mb-6">{story.description}</p>

                    {/* Results */}
                    <div className="flex flex-wrap gap-3 mb-6">
                      {story.results.map((result) => (
                        <span
                          key={result}
                          className="px-3 py-1.5 bg-teal-50 text-teal-700 text-sm font-medium rounded-full"
                        >
                          {result}
                        </span>
                      ))}
                    </div>

                    {/* Quote */}
                    <div className="bg-slate-50 rounded-xl p-5 mb-6">
                      <div className="flex gap-3">
                        <Quote className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-slate-700 text-sm italic mb-2">{story.quote}</p>
                          <p className="text-slate-500 text-xs font-medium">{story.quotePerson}</p>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={story.href}
                      className="inline-flex items-center gap-2 text-teal-600 font-semibold hover:gap-3 transition-all duration-200"
                    >
                      Read the full story
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Bottom CTA */}
      <motion.div {...fadeInUp} className="text-center">
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-12">
          <Star className="w-10 h-10 text-teal-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-brand-navy mb-4">
            Ready to write your success story?
          </h2>
          <p className="text-slate-600 max-w-lg mx-auto mb-8">
            Join hundreds of e-commerce businesses that have transformed their customer support
            with Barpel AI. Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="btn-primary inline-flex items-center gap-2">
              Start free trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-brand-navy text-brand-navy font-semibold rounded-lg hover:bg-brand-navy hover:text-white transition-all duration-200"
            >
              Get a demo
            </Link>
          </div>
        </div>
      </motion.div>
    </ContentPageLayout>
  );
}
