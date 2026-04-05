"use client";

import ContentPageLayout from '@/components/marketing/ContentPageLayout';
import { m } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  Languages,
  CheckCircle2,
  Quote,
  Smile,
  TrendingUp,
  Sun,
  Moon,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const keyMetrics = [
  { value: '24/7', label: 'Global coverage achieved', icon: Clock },
  { value: '30+', label: 'Languages supported', icon: Languages },
  { value: '94%', label: 'Customer satisfaction', icon: Smile },
  { value: '$120K', label: 'Annual savings', icon: TrendingUp },
];

const coverageBefore = [
  { timezone: 'Americas (EST)', coverage: 'Business hours only', status: 'Partial' },
  { timezone: 'Europe (CET)', coverage: '6 hours overlap', status: 'Partial' },
  { timezone: 'Asia Pacific (JST)', coverage: 'No coverage', status: 'None' },
  { timezone: 'Middle East (GST)', coverage: 'No coverage', status: 'None' },
  { timezone: 'Africa (WAT)', coverage: 'Minimal', status: 'Minimal' },
];

const languagesSupported = [
  'English', 'Spanish', 'French', 'German', 'Portuguese', 'Italian',
  'Dutch', 'Japanese', 'Korean', 'Mandarin', 'Arabic', 'Hindi',
  'Turkish', 'Polish', 'Swedish', 'Norwegian', 'Danish', 'Finnish',
];

const timeline = [
  {
    day: 'Week 1',
    title: 'Platform Integration',
    description: 'Connected marketplace platform, synced 8,500 product listings across 40+ countries, and configured regional shipping rules.',
  },
  {
    day: 'Week 2',
    title: 'Language Configuration',
    description: 'Set up AI voice personas for top 15 languages. Configured cultural nuances, greetings, and region-specific policies.',
  },
  {
    day: 'Week 3',
    title: 'Timezone Rollout',
    description: 'Launched AI support for Asia-Pacific and Middle East timezones first — the regions with zero previous coverage.',
  },
  {
    day: 'Week 4',
    title: 'Full Global Coverage',
    description: 'Expanded to all timezones and all 30+ languages. Transitioned human team to escalation-only roles.',
  },
  {
    day: 'Month 3',
    title: 'Optimization',
    description: 'Achieved 94% CSAT. Reduced human escalation rate to 8%. Added proactive shipping notifications in local languages.',
  },
];

const beforeAfter = [
  { category: 'Support Hours', before: '10 hours/day (EST)', after: '24/7/365' },
  { category: 'Languages', before: '3 (EN, ES, FR)', after: '30+' },
  { category: 'Agent Headcount', before: '8 agents', after: '2 (escalation only)' },
  { category: 'Monthly Cost', before: '$24,000', after: '$6,200' },
  { category: 'CSAT Score', before: '78%', after: '94%' },
  { category: 'Avg Wait Time', before: '8.5 minutes', after: '<5 seconds' },
  { category: 'After-Hours Coverage', before: 'Voicemail only', after: 'Full AI support' },
];

export default function GlobalGoodsCaseStudy() {
  return (
    <ContentPageLayout
      title="GlobalGoods Case Study"
      subtitle="How an international marketplace achieved true 24/7 multilingual support across 40+ countries with Barpel AI."
    >
      {/* Back Link */}
      <m.div {...fadeInUp} className="mb-8">
        <Link
          href="/customer-stories"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customer Stories
        </Link>
      </m.div>

      {/* Company Overview */}
      <m.div {...fadeInUp} className="mb-16">
        <div className="bg-gradient-to-br from-brand-mint to-emerald-500 rounded-2xl p-10">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <span className="text-white/60 text-sm font-semibold uppercase tracking-wide">International Marketplace</span>
              <h2 className="text-3xl font-bold text-white mt-2 mb-4">GlobalGoods</h2>
              <p className="text-white/80 leading-relaxed">
                GlobalGoods is an online marketplace connecting artisans and manufacturers from around the world
                with customers in 40+ countries. With a diverse, international customer base, support demands
                span every timezone and dozens of languages.
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
      </m.div>

      {/* The Challenge */}
      <m.div {...fadeInUp} className="mb-16">
        <h2 className="heading-section text-brand-navy mb-6">The Challenge</h2>
        <p className="body-large text-slate-600 leading-relaxed mb-4">
          GlobalGoods had grown rapidly from a US-only marketplace to serving customers in over 40 countries.
          But their support team hadn&apos;t scaled to match. Eight agents working US business hours left
          massive gaps in coverage for customers in Asia, Europe, and the Middle East.
        </p>
        <p className="text-slate-600 leading-relaxed mb-4">
          After-hours calls went to voicemail, and many international customers never called back.
          Language barriers compounded the problem — the team only spoke English, Spanish, and French,
          leaving customers in Germany, Japan, Korea, and dozens of other countries without native-language support.
        </p>
        <p className="text-slate-600 leading-relaxed mb-8">
          Support costs were growing 30% year-over-year as they tried to hire multilingual agents
          for each new market. The result was a 78% CSAT score, well below industry standards, and
          a growing volume of negative reviews citing poor support responsiveness and language barriers.
        </p>

        {/* Coverage Gaps Table */}
        <div className="bg-red-50/50 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-red-700 mb-4">Coverage gaps before Barpel</h3>
          <div className="space-y-3">
            {coverageBefore.map((item) => (
              <div key={item.timezone} className="flex items-center justify-between py-2 border-b border-red-100 last:border-0">
                <span className="text-sm text-slate-700">{item.timezone}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">{item.coverage}</span>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    item.status === 'None' ? 'bg-red-100 text-red-700' :
                    item.status === 'Minimal' ? 'bg-amber-100 text-amber-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </m.div>

      {/* The Solution */}
      <m.div {...fadeInUp} className="mb-16">
        <h2 className="heading-section text-brand-navy mb-6">The Solution</h2>
        <p className="text-slate-600 leading-relaxed mb-8">
          GlobalGoods implemented Barpel AI to provide true 24/7 multilingual phone support.
          The AI was configured with product knowledge spanning 8,500 listings, regional shipping
          policies for 40+ countries, and voice personas in 30+ languages.
        </p>

        {/* Languages Grid */}
        <div className="bg-teal-50/50 rounded-xl p-6 mb-8">
          <h3 className="text-sm font-semibold text-teal-700 mb-4">Languages now supported</h3>
          <div className="flex flex-wrap gap-2">
            {languagesSupported.map((lang) => (
              <span key={lang} className="px-3 py-1.5 bg-white text-sm text-slate-700 rounded-full border border-teal-100">
                {lang}
              </span>
            ))}
            <span className="px-3 py-1.5 bg-teal-500 text-sm text-white rounded-full font-medium">
              +12 more
            </span>
          </div>
        </div>

        {/* Day/Night visual */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card-feature p-8 text-center">
            <Sun className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-brand-navy mb-2">Daytime Support</h3>
            <p className="text-sm text-slate-600">
              AI handles routine calls while human agents focus on complex escalations,
              VIP customers, and strategic seller relationships.
            </p>
          </div>
          <div className="card-feature p-8 text-center bg-brand-navy border-brand-navy">
            <Moon className="w-10 h-10 text-teal-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">After-Hours Support</h3>
            <p className="text-sm text-white/70">
              Full AI coverage for every timezone. No more voicemail, no more missed calls.
              Customers in Tokyo get the same quality as customers in New York.
            </p>
          </div>
        </div>
      </m.div>

      {/* Timeline */}
      <m.div {...fadeInUp} className="mb-16">
        <h2 className="heading-section text-brand-navy mb-8">Implementation Timeline</h2>
        <div className="space-y-6">
          {timeline.map((item, index) => (
            <m.div
              key={item.day}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="flex gap-6"
            >
              <div className="flex-shrink-0 w-20">
                <span className="text-sm font-bold text-teal-500">{item.day}</span>
              </div>
              <div className="flex-1 pb-6 border-l-2 border-teal-100 pl-6 relative">
                <div className="absolute -left-[9px] top-0 w-4 h-4 bg-teal-500 rounded-full border-2 border-white" />
                <h3 className="text-sm font-semibold text-brand-navy mb-1">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.description}</p>
              </div>
            </m.div>
          ))}
        </div>
      </m.div>

      {/* Before & After */}
      <m.div {...fadeInUp} className="mb-16">
        <h2 className="heading-section text-brand-navy mb-8">Before & After</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-4 bg-slate-50 rounded-tl-xl text-sm font-semibold text-slate-700">Metric</th>
                <th className="text-left p-4 bg-red-50 text-sm font-semibold text-red-700">Before Barpel</th>
                <th className="text-left p-4 bg-teal-50 rounded-tr-xl text-sm font-semibold text-teal-700">After Barpel</th>
              </tr>
            </thead>
            <tbody>
              {beforeAfter.map((item, index) => (
                <m.tr
                  key={item.category}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border-b border-slate-100"
                >
                  <td className="p-4 text-sm font-medium text-slate-900">{item.category}</td>
                  <td className="p-4 text-sm text-red-600 bg-red-50/30">{item.before}</td>
                  <td className="p-4 text-sm font-medium text-teal-600 bg-teal-50/30">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-500" />
                      {item.after}
                    </div>
                  </td>
                </m.tr>
              ))}
            </tbody>
          </table>
        </div>
      </m.div>

      {/* Quote */}
      <m.div {...fadeInUp} className="mb-16">
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-10">
          <Quote className="w-10 h-10 text-teal-300 mb-4" />
          <blockquote className="text-xl text-brand-navy font-medium leading-relaxed mb-6">
            &quot;Barpel eliminated timezone as a constraint for our support team. Our customers in
            Tokyo get the same experience as customers in New York. We went from covering 3 timezones
            with 8 agents to covering all of them with 2 agents and Barpel AI. The multilingual
            capability alone was worth the switch.&quot;
          </blockquote>
          <div>
            <div className="text-sm font-semibold text-brand-navy">Maria Chen</div>
            <div className="text-sm text-slate-500">VP of Customer Experience, GlobalGoods</div>
          </div>
        </div>
      </m.div>

      {/* CTA */}
      <m.div {...fadeInUp} className="text-center">
        <h2 className="heading-section text-brand-navy mb-4">
          Go global with AI support
        </h2>
        <p className="body-large text-slate-600 max-w-xl mx-auto mb-8">
          Provide 24/7 multilingual support to customers anywhere in the world.
          Start your free trial today — no credit card required.
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
      </m.div>
    </ContentPageLayout>
  );
}
