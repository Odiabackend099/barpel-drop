"use client";

import { m } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Users,
  Megaphone,
  Headphones,
  Handshake,
  Zap,
  BarChart3,
  BookOpen,
  Star,
  TrendingUp,
  Gift,
} from 'lucide-react';
import ContentPageLayout from '@/components/marketing/ContentPageLayout';

const partnerBenefits = [
  {
    icon: DollarSign,
    title: 'Revenue Share',
    description:
      'Earn recurring commissions on every customer you refer or manage. Our competitive revenue share model rewards partners who help us grow.',
  },
  {
    icon: Megaphone,
    title: 'Co-Marketing',
    description:
      'Access co-branded content, joint webinars, case studies, and placement on our partner directory to amplify your reach.',
  },
  {
    icon: Headphones,
    title: 'Technical Support',
    description:
      'Get priority access to our engineering team, dedicated partner Slack channel, and advanced documentation for complex integrations.',
  },
  {
    icon: BookOpen,
    title: 'Training & Certification',
    description:
      'Complete our partner certification program to become a Barpel expert. Certified partners get premium placement and higher revenue share.',
  },
  {
    icon: Gift,
    title: 'Demo Environment',
    description:
      'Full-featured sandbox accounts for demos and testing. Show prospects exactly how Barpel works without touching production data.',
  },
  {
    icon: BarChart3,
    title: 'Partner Dashboard',
    description:
      'Track referrals, commissions, customer health, and pipeline in a dedicated partner portal with real-time analytics.',
  },
];

const partnerTiers = [
  {
    name: 'Referral',
    icon: Users,
    color: 'from-blue-500 to-blue-400',
    description: 'Perfect for agencies, consultants, and influencers who recommend tools to their audience.',
    benefits: [
      '15% recurring revenue share for 12 months',
      'Unique referral link with real-time tracking',
      'Co-branded landing page for your audience',
      'Monthly performance reports',
      'Access to partner marketing materials',
    ],
    ideal: 'Shopify consultants, e-commerce bloggers, agency owners',
    cta: 'Join as Referral Partner',
  },
  {
    name: 'Reseller',
    icon: TrendingUp,
    color: 'from-teal-500 to-teal-400',
    description: 'For agencies and service providers who want to offer Barpel as part of their own service packages.',
    benefits: [
      '25% recurring revenue share, no cap',
      'White-label options for your brand',
      'Dedicated partner success manager',
      'Priority feature requests',
      'Joint sales calls and deal support',
      'Access to beta features',
    ],
    ideal: 'E-commerce agencies, Shopify Plus partners, managed service providers',
    cta: 'Apply as Reseller',
    popular: true,
  },
  {
    name: 'Technology',
    icon: Zap,
    color: 'from-purple-500 to-purple-400',
    description: 'For SaaS platforms, tools, and infrastructure providers who want to integrate with Barpel.',
    benefits: [
      'API access for native integration development',
      'Co-engineering support for joint solutions',
      'Marketplace listing on Barpel integrations page',
      'Joint go-to-market campaigns',
      'Shared customer insights and feedback',
      'Early access to new APIs and features',
    ],
    ideal: 'E-commerce platforms, helpdesk tools, CRM providers, shipping solutions',
    cta: 'Explore Technology Partnership',
  },
];

const applicationSteps = [
  {
    step: '01',
    title: 'Apply Online',
    description: 'Fill out the partner application form with details about your business and audience. Takes about 5 minutes.',
  },
  {
    step: '02',
    title: 'Discovery Call',
    description: 'Our partnerships team will schedule a 30-minute call to learn about your goals and discuss how we can work together.',
  },
  {
    step: '03',
    title: 'Onboarding',
    description: 'Get access to your partner portal, marketing materials, demo environment, and training resources.',
  },
  {
    step: '04',
    title: 'Start Earning',
    description: 'Begin referring customers, close deals, or integrate with our platform. Commissions are paid monthly via Stripe.',
  },
];

export default function PartnersPage() {
  return (
    <ContentPageLayout
      title="Partner Program"
      subtitle="Grow your business alongside Barpel. Earn recurring revenue, access exclusive resources, and bring AI voice support to your clients."
    >
      {/* Partner Stats */}
      <m.div
        className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {[
          { value: '120+', label: 'Active Partners' },
          { value: '$2.4M', label: 'Partner Earnings (2025)' },
          { value: '25%', label: 'Max Revenue Share' },
          { value: '< 24h', label: 'Application Review' },
        ].map((stat, index) => (
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

      {/* Partner Benefits */}
      <m.div
        className="mb-24"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">
            Partner <span className="text-brand-teal">Benefits</span>
          </h2>
          <p className="body-large text-text-secondary max-w-2xl mx-auto">
            Everything you need to succeed as a Barpel partner
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partnerBenefits.map((benefit, index) => (
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

      {/* Partner Tiers */}
      <m.div
        className="mb-24"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">
            Choose Your <span className="text-brand-teal">Tier</span>
          </h2>
          <p className="body-large text-text-secondary max-w-2xl mx-auto">
            Three partnership models designed for different business types
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {partnerTiers.map((tier, index) => (
            <m.div
              key={tier.name}
              className={`relative bg-white rounded-2xl p-6 transition-all duration-300 ${
                tier.popular
                  ? 'shadow-teal-lg border-2 border-brand-teal'
                  : 'shadow-teal-sm border border-light-mint hover:shadow-teal-md hover:-translate-y-1'
              }`}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-teal text-white text-xs font-semibold rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Most Popular
                </div>
              )}

              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-4`}>
                <tier.icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-lg font-bold text-brand-navy mb-1">{tier.name} Partner</h3>
              <p className="text-sm text-text-secondary mb-6">{tier.description}</p>

              <ul className="space-y-3 mb-6">
                {tier.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-teal flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-text-secondary">{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="mb-6 p-3 bg-slate-50 rounded-lg">
                <div className="text-xs font-semibold text-brand-navy mb-1">Ideal for</div>
                <div className="text-xs text-text-secondary">{tier.ideal}</div>
              </div>

              <a
                href="mailto:partners@barpel.ai?subject=Partner Application - ${tier.name}"
                className={`block w-full py-3 px-4 text-center font-semibold rounded-lg transition-all duration-200 ${
                  tier.popular
                    ? 'bg-brand-teal text-white hover:bg-[#008F85] hover:-translate-y-0.5 hover:shadow-teal-glow'
                    : 'bg-off-white text-brand-navy hover:bg-brand-teal hover:text-white'
                }`}
              >
                {tier.cta}
              </a>
            </m.div>
          ))}
        </div>
      </m.div>

      {/* Application Process */}
      <m.div
        className="mb-24"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">
            How to <span className="text-brand-teal">Apply</span>
          </h2>
          <p className="body-large text-text-secondary max-w-2xl mx-auto">
            Getting started as a Barpel partner is straightforward
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {applicationSteps.map((step, index) => (
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
              {index < applicationSteps.length - 1 && (
                <ArrowRight className="w-5 h-5 text-slate-300 absolute top-4 -right-3 hidden lg:block" />
              )}
            </m.div>
          ))}
        </div>
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
          Ready to grow together?
        </h2>
        <p className="body-large text-white/70 mb-8 max-w-xl mx-auto">
          Apply to the Barpel Partner Program today and start earning recurring revenue while bringing AI voice support to your clients.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="mailto:partners@barpel.ai?subject=Partner Program Application"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-teal font-semibold rounded-lg transition-all duration-200 hover:bg-off-white hover:-translate-y-0.5 hover:shadow-lg"
          >
            Apply now
            <ArrowRight className="w-4 h-4" />
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg transition-all duration-200 hover:bg-white/10"
          >
            Talk to our team
          </Link>
        </div>
      </m.div>
    </ContentPageLayout>
  );
}
