"use client";

import ContentPageLayout from '@/components/marketing/ContentPageLayout';
import { m } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  Zap,
  Clock,
  RotateCcw,
  MessageSquare,
  TrendingUp,
  ShoppingCart,
  Globe,
  Smartphone,
  CheckCircle2,
  Video,
  Package,
  HeadphonesIcon,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const challenges = [
  {
    icon: ShoppingCart,
    title: 'Impulse Order Volume',
    description:
      'TikTok&apos;s viral nature drives massive order spikes. One trending video can generate thousands of orders overnight, overwhelming your support team.',
  },
  {
    icon: RotateCcw,
    title: 'High Return Rates',
    description:
      'Impulse purchases lead to higher return rates. Customers need quick answers about return eligibility, refund timelines, and exchange options.',
  },
  {
    icon: Clock,
    title: 'Instant Support Expectations',
    description:
      'TikTok&apos;s audience skews younger and expects instant, always-on customer service. Delayed responses lead to negative reviews and chargebacks.',
  },
];

const features = [
  {
    icon: Package,
    title: 'Order Status & Tracking',
    description:
      'Customers call and instantly get their TikTok Shop order status, tracking updates, and estimated delivery dates without waiting on hold.',
  },
  {
    icon: RotateCcw,
    title: 'Return & Refund Automation',
    description:
      'AI handles return requests end-to-end — checking eligibility, explaining your policy, and initiating the return process automatically.',
  },
  {
    icon: MessageSquare,
    title: 'Product Q&A',
    description:
      'Barpel answers sizing questions, material details, compatibility info, and product comparisons using your TikTok Shop catalog data.',
  },
  {
    icon: TrendingUp,
    title: 'Viral Spike Management',
    description:
      'When a product goes viral, Barpel scales instantly to handle thousands of simultaneous calls without dropped connections or long wait times.',
  },
  {
    icon: Globe,
    title: 'Multilingual Support',
    description:
      'Serve TikTok&apos;s global audience in 30+ languages. AI detects the caller&apos;s language and responds naturally without manual switching.',
  },
  {
    icon: Smartphone,
    title: 'Mobile-First Experience',
    description:
      'Optimized for the TikTok generation. Quick, conversational AI interactions that feel natural to mobile-native customers.',
  },
];

const stats = [
  { value: '10x', label: 'Faster than email support' },
  { value: '95%', label: 'First-call resolution' },
  { value: '24/7', label: 'Always-on coverage' },
  { value: '60%', label: 'Reduction in returns-related calls' },
];

const whyBarpel = [
  {
    title: 'Built for high-volume commerce',
    description: 'TikTok Shop sellers face unpredictable volume spikes. Barpel handles 1 call or 10,000 calls with the same speed and quality.',
  },
  {
    title: 'Understands Gen Z expectations',
    description: 'Fast, casual, and helpful. Barpel&apos;s AI voice persona can be configured to match the tone your audience expects.',
  },
  {
    title: 'Integrates with your workflow',
    description: 'Connects with your TikTok Shop seller dashboard, inventory management, and shipping providers for real-time accuracy.',
  },
  {
    title: 'Protects your seller metrics',
    description: 'Fast response times and high resolution rates keep your TikTok Shop seller rating high and prevent policy violations.',
  },
];

export default function TikTokShopPage() {
  return (
    <ContentPageLayout
      title="AI Support for TikTok Shop Sellers"
      subtitle="Handle the volume, speed, and expectations of TikTok commerce with AI voice support that scales as fast as your videos go viral."
    >
      {/* Challenge Section */}
      <m.div {...fadeInUp} className="mb-20">
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">
            The TikTok Shop <span className="text-teal-500">challenge</span>
          </h2>
          <p className="body-large text-slate-600 max-w-2xl mx-auto">
            Selling on TikTok Shop is exciting, but the support demands are unlike any other
            platform. Viral moments create instant chaos for unprepared support teams.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {challenges.map((challenge, index) => (
            <m.div
              key={challenge.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card-feature p-8 border-orange-100 bg-orange-50/30"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <challenge.icon className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-brand-navy mb-2">{challenge.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{challenge.description}</p>
            </m.div>
          ))}
        </div>
      </m.div>

      {/* Stats */}
      <m.div {...fadeInUp} className="mb-20">
        <div className="bg-gradient-to-br from-brand-navy to-slate-800 rounded-2xl p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <m.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-teal-400 mb-2">{stat.value}</div>
                <div className="text-white/70 text-sm">{stat.label}</div>
              </m.div>
            ))}
          </div>
        </div>
      </m.div>

      {/* Features */}
      <m.div {...fadeInUp} className="mb-20">
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">
            Purpose-built for <span className="text-teal-500">TikTok Shop</span>
          </h2>
          <p className="body-large text-slate-600 max-w-2xl mx-auto">
            Every feature is designed around the unique demands of social commerce
            and the expectations of TikTok&apos;s audience.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <m.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="card-feature p-8"
            >
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-teal-500" />
              </div>
              <h3 className="text-lg font-semibold text-brand-navy mb-2">{feature.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
            </m.div>
          ))}
        </div>
      </m.div>

      {/* Why Barpel for TikTok */}
      <m.div {...fadeInUp} className="mb-20">
        <div className="bg-gradient-to-br from-slate-50 to-teal-50/30 rounded-2xl p-12">
          <div className="text-center mb-12">
            <h2 className="heading-section text-brand-navy mb-4">
              Why TikTok sellers <span className="text-teal-500">choose Barpel</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {whyBarpel.map((item, index) => (
              <m.div
                key={item.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0 mt-1">
                  <CheckCircle2 className="w-6 h-6 text-teal-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-brand-navy mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </m.div>

      {/* Viral Moment Scenario */}
      <m.div {...fadeInUp} className="mb-20">
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">
            When your product <span className="text-teal-500">goes viral</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              time: 'Hour 1',
              title: 'Video goes viral',
              description: 'Your TikTok hits the For You page. Orders flood in. The phone starts ringing non-stop.',
              icon: Video,
            },
            {
              time: 'Hour 2-24',
              title: 'Barpel scales instantly',
              description: 'AI handles hundreds of simultaneous calls — order confirmations, shipping estimates, product questions. Zero wait times.',
              icon: Zap,
            },
            {
              time: 'Week 1+',
              title: 'Post-purchase support',
              description: 'As orders ship, Barpel manages tracking inquiries, return requests, and follow-up questions automatically.',
              icon: HeadphonesIcon,
            },
          ].map((step, index) => (
            <m.div
              key={step.time}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="card-feature p-8 text-center"
            >
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <step.icon className="w-6 h-6 text-teal-500" />
              </div>
              <div className="text-xs font-semibold text-teal-500 uppercase tracking-wide mb-2">{step.time}</div>
              <h3 className="text-lg font-semibold text-brand-navy mb-2">{step.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
            </m.div>
          ))}
        </div>
      </m.div>

      {/* Final CTA */}
      <m.div {...fadeInUp} className="text-center">
        <h2 className="heading-section text-brand-navy mb-4">
          Ready to scale your TikTok Shop support?
        </h2>
        <p className="body-large text-slate-600 max-w-xl mx-auto mb-8">
          Don&apos;t let support bottlenecks hold back your next viral moment.
          Get started with Barpel AI today — free trial, no credit card required.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" className="btn-primary inline-flex items-center gap-2">
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-brand-navy text-brand-navy font-semibold rounded-lg hover:bg-brand-navy hover:text-white transition-all duration-200"
          >
            Talk to sales
          </Link>
        </div>
      </m.div>
    </ContentPageLayout>
  );
}
