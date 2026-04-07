"use client";

import { m } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Users,
  BarChart3,
  Megaphone,
  MessageSquare,
  TrendingUp,
  Handshake,
  RefreshCw,
} from 'lucide-react';
import ContentPageLayout from '@/components/marketing/ContentPageLayout';

const TAPFILIATE_SIGNUP_URL = 'https://barpelai.tapfiliate.com/programs/barpel-ai/signup/';

const programStats = [
  { value: '20%', label: 'Recurring commission' },
  { value: '90 days', label: 'Cookie window' },
  { value: 'Lifetime', label: 'Commission duration' },
  { value: 'Monthly', label: 'Payout schedule' },
];

const benefits = [
  {
    icon: RefreshCw,
    title: 'Recurring for life',
    description:
      'You earn 20% of every monthly subscription your referral pays — not just the first month. As long as they stay a customer, you keep earning.',
  },
  {
    icon: BarChart3,
    title: 'Real-time dashboard',
    description:
      'Track every click, signup, and conversion in your Tapfiliate dashboard. See exactly what is earning and what is not, in real time.',
  },
  {
    icon: DollarSign,
    title: 'Upgrade to 25% at 25 referrals',
    description:
      'Refer 25 paying customers and you automatically upgrade to Gold tier — 25% recurring, lifetime. No application, no negotiation.',
  },
  {
    icon: Users,
    title: '90-day cookie window',
    description:
      'If someone clicks your link today and signs up 60 days later, you still get credit. Most programs give 30 days. We give 90.',
  },
  {
    icon: Megaphone,
    title: 'Marketing materials',
    description:
      'Email swipe copy, social media templates, and talking points ready to use. Drop in your referral link and go.',
  },
  {
    icon: MessageSquare,
    title: 'Direct support',
    description:
      'Questions about your dashboard, commissions, or tracking? Post in our affiliate Slack channel and get a real answer fast.',
  },
];

const earningsTable = [
  { referrals: 5, plan: 'Starter ($29/mo)', monthly: '$29', annual: '$348' },
  { referrals: 5, plan: 'Growth ($79/mo)', monthly: '$79', annual: '$948' },
  { referrals: 10, plan: 'Starter ($29/mo)', monthly: '$58', annual: '$696' },
  { referrals: 10, plan: 'Growth ($79/mo)', monthly: '$158', annual: '$1,896' },
  { referrals: 25, plan: 'Growth ($79/mo)', monthly: '$395', annual: '$4,740' },
  { referrals: 50, plan: 'Growth ($79/mo)', monthly: '$987', annual: '$11,844', gold: true },
];

const howItWorks = [
  {
    step: '01',
    title: 'Sign up in 60 seconds',
    description: 'Create your affiliate account on Tapfiliate. No approval process. You get your unique tracking link immediately.',
  },
  {
    step: '02',
    title: 'Share your link',
    description: 'Post it in your YouTube description, newsletter, social posts, or blog. Add sub-IDs to track which content converts best.',
  },
  {
    step: '03',
    title: 'Earn recurring commissions',
    description: 'Every time someone signs up through your link and becomes a paying customer, you earn 20% of their monthly subscription — every month, for life.',
  },
  {
    step: '04',
    title: 'Get paid monthly',
    description: 'Commissions are paid on the 15th of each month (Net-30). Minimum payout is $50. Payments via bank transfer or Wise.',
  },
];

const whoItsFor = [
  'Dropshipping YouTubers and educators',
  'Shopify consultants and coaches',
  'E-commerce bloggers and newsletter writers',
  'Agency owners and managed service providers',
  'Course creators with a Shopify/dropshipping audience',
  'Anyone who recommends tools to online store owners',
];

export default function PartnersPage() {
  return (
    <ContentPageLayout
      title="Affiliate Program"
      subtitle="Earn 20% recurring commission for every Shopify store owner you refer to Barpel. Lifetime. No caps. Paid monthly."
    >
      {/* Program Stats */}
      <m.div
        className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {programStats.map((stat, index) => (
          <m.div
            key={stat.label}
            className="text-center p-6 bg-off-white rounded-xl border border-light-mint"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <div className="text-2xl font-bold text-brand-navy mb-1">{stat.value}</div>
            <div className="text-sm text-text-secondary">{stat.label}</div>
          </m.div>
        ))}
      </m.div>

      {/* Who It's For */}
      <m.div
        className="mb-24"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="heading-section text-brand-navy mb-4">
              Built for <span className="text-brand-teal">e-commerce creators</span>
            </h2>
            <p className="body-large text-text-secondary mb-8">
              If your audience runs Shopify stores, you are sitting on a natural fit. Barpel handles customer calls for dropshippers — WISMO calls, cart recovery, returns. Your audience already needs this.
            </p>
            <ul className="space-y-3">
              {whoItsFor.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
                  <span className="text-text-secondary">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-off-white rounded-2xl p-8 border border-light-mint">
            <h3 className="heading-card text-brand-navy mb-2">What you are promoting</h3>
            <p className="text-sm text-text-secondary mb-6">
              Barpel is an AI phone agent for Shopify stores. It answers customer calls instantly, handles order tracking, returns, and cart recovery — all automatically. Plans start at $29/month.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-text-secondary">
                <CheckCircle2 className="w-4 h-4 text-brand-teal flex-shrink-0" />
                Answers calls instantly, 24/7
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <CheckCircle2 className="w-4 h-4 text-brand-teal flex-shrink-0" />
                Handles order tracking, returns, and cart recovery
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <CheckCircle2 className="w-4 h-4 text-brand-teal flex-shrink-0" />
                Supports 30+ languages
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <CheckCircle2 className="w-4 h-4 text-brand-teal flex-shrink-0" />
                Setup in under 5 minutes
              </div>
            </div>
          </div>
        </div>
      </m.div>

      {/* What You Earn */}
      <m.div
        className="mb-24"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">
            What you <span className="text-brand-teal">actually earn</span>
          </h2>
          <p className="body-large text-text-secondary max-w-2xl mx-auto">
            20% of every monthly subscription, recurring for the lifetime of the customer. Here is what that looks like at different referral volumes.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-light-mint">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-off-white border-b border-light-mint">
                <th className="text-left p-4 font-semibold text-brand-navy">Paying referrals</th>
                <th className="text-left p-4 font-semibold text-brand-navy">Avg plan</th>
                <th className="text-left p-4 font-semibold text-brand-navy">Monthly commission</th>
                <th className="text-left p-4 font-semibold text-brand-navy">Annual commission</th>
                <th className="text-left p-4 font-semibold text-brand-navy">Tier</th>
              </tr>
            </thead>
            <tbody>
              {earningsTable.map((row) => (
                <tr
                  key={row.referrals}
                  className={`border-b border-light-mint last:border-0 ${row.gold ? 'bg-teal-50' : 'bg-white'}`}
                >
                  <td className="p-4 font-semibold text-brand-navy">{row.referrals}</td>
                  <td className="p-4 text-text-secondary">{row.plan}</td>
                  <td className="p-4 font-semibold text-brand-teal">{row.monthly}/mo</td>
                  <td className="p-4 font-semibold text-brand-teal">{row.annual}/yr</td>
                  <td className="p-4">
                    {row.gold ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-brand-teal text-white text-xs font-semibold rounded-full">
                        <TrendingUp className="w-3 h-3" /> Gold 25%
                      </span>
                    ) : (
                      <span className="text-text-secondary text-xs">Standard 20%</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-secondary mt-3 text-center">
          Gold tier (25%) unlocks automatically when you reach 25 paying referrals. No application required.
        </p>
        <p className="text-xs text-text-secondary mt-1 text-center">
          Commissions are earned for as long as the referred customer remains on an active paid plan. Subject to{' '}
          <Link href="/terms" className="underline hover:text-brand-teal">program terms</Link>.
        </p>
      </m.div>

      {/* Benefits */}
      <m.div
        className="mb-24"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">
            What you <span className="text-brand-teal">get</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <m.div
              key={benefit.title}
              className="card-feature"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
            >
              <benefit.icon className="w-6 h-6 text-brand-teal mb-4" />
              <h3 className="heading-card text-brand-navy mb-2">{benefit.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{benefit.description}</p>
            </m.div>
          ))}
        </div>
      </m.div>

      {/* How It Works */}
      <m.div
        className="mb-24"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">
            How it <span className="text-brand-teal">works</span>
          </h2>
          <p className="body-large text-text-secondary max-w-2xl mx-auto">
            Sign up, share your link, get paid. No approval process. No waiting.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {howItWorks.map((step, index) => (
            <m.div
              key={step.step}
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <div className="text-4xl font-bold text-teal-100 mb-3">{step.step}</div>
              <h3 className="heading-card text-brand-navy mb-2">{step.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{step.description}</p>
              {index < howItWorks.length - 1 && (
                <ArrowRight className="w-5 h-5 text-slate-300 absolute top-4 -right-3 hidden lg:block" />
              )}
            </m.div>
          ))}
        </div>
      </m.div>

      {/* Payment Terms */}
      <m.div
        className="mb-24 bg-off-white rounded-2xl p-8 border border-light-mint"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="heading-card text-brand-navy mb-6">Payment terms</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          {[
            { label: 'Payout date', value: '15th of each month' },
            { label: 'Net terms', value: 'Net-30 (March earnings paid April 15th)' },
            { label: 'Minimum payout', value: '$50 USD' },
            { label: 'Payment method', value: 'Bank transfer or Wise' },
          ].map((item) => (
            <div key={item.label}>
              <div className="text-xs font-semibold text-brand-teal uppercase tracking-wide mb-1">{item.label}</div>
              <div className="text-text-secondary">{item.value}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-secondary mt-6 pt-6 border-t border-light-mint">
          Commissions have a 30-day hold after conversion to account for refunds. If a referred customer refunds within 30 days, that commission is not paid out. All commissions are in USD.
        </p>
      </m.div>

      {/* CTA */}
      <m.div
        className="bg-gradient-to-br from-brand-navy via-slate-800 to-brand-navy rounded-2xl p-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <Handshake className="w-12 h-12 text-brand-teal mx-auto mb-6" />
        <h2 className="heading-subsection text-white mb-4">
          Start earning today
        </h2>
        <p className="body-large text-white/70 mb-2 max-w-xl mx-auto">
          Sign up takes 60 seconds. Your tracking link is ready immediately.
        </p>
        <p className="text-sm text-white/50 mb-8 max-w-xl mx-auto">
          20% recurring commission. 90-day cookie. Lifetime duration. Paid monthly.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={TAPFILIATE_SIGNUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-teal font-semibold rounded-lg transition-all duration-200 hover:bg-off-white hover:-translate-y-0.5 hover:shadow-lg"
          >
            Join the affiliate program
            <ArrowRight className="w-4 h-4" />
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg transition-all duration-200 hover:bg-white/10"
          >
            Questions? Talk to us
          </Link>
        </div>
      </m.div>
    </ContentPageLayout>
  );
}
