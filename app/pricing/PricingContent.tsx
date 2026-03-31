"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { CREDIT_PACKAGES } from '@/lib/constants';
import {
  Check,
  X,
  ArrowRight,
  Sparkles,
  ChevronDown,
  Shield,
  Users,
  Phone,
} from 'lucide-react';
import ContentPageLayout from '@/components/marketing/ContentPageLayout';

const pkgMap = Object.fromEntries(CREDIT_PACKAGES.map(p => [p.id, p]));

const plans = [
  {
    name: 'Starter',
    description: 'For small stores just getting started with AI support',
    monthlyPrice: pkgMap['starter'].priceUsdCents / 100,
    annualTotalPrice: pkgMap['starter'].annualPriceUsdCents / 100,
    annualMonthlyEquiv: Math.round(pkgMap['starter'].annualPriceUsdCents / 12 / 100),
    features: [
      '500 credits/month',
      '1 phone number',
      'Shopify integration',
      'Order tracking',
      'Basic analytics',
      'Email support',
    ],
    cta: 'Try for free',
    href: '/signup',
    popular: false,
  },
  {
    name: 'Growth',
    description: 'For growing businesses ready to scale support',
    monthlyPrice: pkgMap['growth'].priceUsdCents / 100,
    annualTotalPrice: pkgMap['growth'].annualPriceUsdCents / 100,
    annualMonthlyEquiv: Math.round(pkgMap['growth'].annualPriceUsdCents / 12 / 100),
    features: [
      '2,000 credits/month',
      '3 phone numbers',
      'All integrations',
      'Returns handling',
      'Abandoned cart recovery',
      'Advanced analytics',
      'Priority support',
    ],
    cta: 'Try for free',
    href: '/signup',
    popular: true,
  },
  {
    name: 'Scale',
    description: 'For high-volume stores needing maximum power',
    monthlyPrice: pkgMap['scale'].priceUsdCents / 100,
    annualTotalPrice: pkgMap['scale'].annualPriceUsdCents / 100,
    annualMonthlyEquiv: Math.round(pkgMap['scale'].annualPriceUsdCents / 12 / 100),
    features: [
      '6,000 credits/month',
      '10 phone numbers',
      'Custom AI training',
      'Advanced analytics',
      'Dedicated account manager',
      'Phone support',
      'Custom workflows',
    ],
    cta: 'Try for free',
    href: '/signup',
    popular: false,
  },
  {
    name: 'Enterprise',
    description: 'For large organizations with custom needs',
    monthlyPrice: null,
    annualTotalPrice: null,
    annualMonthlyEquiv: null,
    priceText: 'Custom',
    features: [
      'Unlimited credits',
      'Unlimited phone numbers',
      'SLA guarantee',
      'Custom integrations',
      '24/7 phone support',
      'Dedicated success team',
      'On-premise option',
    ],
    cta: 'Contact us',
    href: '/contact',
    popular: false,
  },
];

const comparisonFeatures = [
  {
    category: 'Voice AI',
    features: [
      { name: 'Monthly credits', starter: '500', growth: '2,000', scale: '6,000', enterprise: 'Unlimited' },
      { name: 'Phone numbers', starter: '1', growth: '3', scale: '10', enterprise: 'Unlimited' },
      { name: 'Concurrent calls', starter: '2', growth: '10', scale: '50', enterprise: 'Unlimited' },
      { name: 'Call recording', starter: true, growth: true, scale: true, enterprise: true },
      { name: 'Call transcripts', starter: true, growth: true, scale: true, enterprise: true },
      { name: 'Custom voice persona', starter: false, growth: true, scale: true, enterprise: true },
    ],
  },
  {
    category: 'Features',
    features: [
      { name: 'Order tracking', starter: true, growth: true, scale: true, enterprise: true },
      { name: 'Product lookup', starter: true, growth: true, scale: true, enterprise: true },
      { name: 'Returns handling', starter: false, growth: true, scale: true, enterprise: true },
      { name: 'Cart recovery calls', starter: false, growth: true, scale: true, enterprise: true },
      { name: 'Custom workflows', starter: false, growth: false, scale: true, enterprise: true },
      { name: 'Multilingual (30+ languages)', starter: false, growth: true, scale: true, enterprise: true },
    ],
  },
  {
    category: 'Integrations',
    features: [
      { name: 'Shopify', starter: true, growth: true, scale: true, enterprise: true },
      { name: 'WooCommerce', starter: false, growth: true, scale: true, enterprise: true },
      { name: 'TikTok Shop', starter: false, growth: true, scale: true, enterprise: true },
      { name: 'Custom API', starter: false, growth: false, scale: true, enterprise: true },
      { name: 'Webhook events', starter: false, growth: true, scale: true, enterprise: true },
    ],
  },
  {
    category: 'Analytics & Reporting',
    features: [
      { name: 'Basic dashboard', starter: true, growth: true, scale: true, enterprise: true },
      { name: 'Call analytics', starter: 'Basic', growth: 'Advanced', scale: 'Advanced', enterprise: 'Custom' },
      { name: 'Revenue attribution', starter: false, growth: true, scale: true, enterprise: true },
      { name: 'Custom reports', starter: false, growth: false, scale: true, enterprise: true },
      { name: 'Data export', starter: false, growth: true, scale: true, enterprise: true },
    ],
  },
  {
    category: 'Support',
    features: [
      { name: 'Email support', starter: true, growth: true, scale: true, enterprise: true },
      { name: 'Priority support', starter: false, growth: true, scale: true, enterprise: true },
      { name: 'Phone support', starter: false, growth: false, scale: true, enterprise: true },
      { name: 'Dedicated account manager', starter: false, growth: false, scale: true, enterprise: true },
      { name: 'SLA guarantee', starter: false, growth: false, scale: false, enterprise: true },
    ],
  },
];

const faqs = [
  {
    question: 'What are credits and how do they work?',
    answer:
      'Credits are the currency for AI interactions. Each inbound or outbound call uses credits based on duration: roughly 1 credit per 30 seconds of call time. Unused credits roll over for one billing cycle on Growth and Scale plans.',
  },
  {
    question: 'Can I change my plan at any time?',
    answer:
      'Yes. You can upgrade or downgrade your plan at any time from your dashboard. When you upgrade, the change takes effect immediately and you are billed the prorated difference. Downgrades take effect at the start of your next billing cycle.',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'Every new account starts with 5 free credits — no credit card required. You get full access to all features. When your credits run out, upgrade to a paid plan to keep your AI line active.',
  },
  {
    question: 'What happens if I run out of credits?',
    answer:
      'When you approach your credit limit, you will receive an email alert. If you run out, you can purchase additional credit packs or upgrade your plan. Calls will not be interrupted mid-conversation, but new inbound calls will go to voicemail until credits are replenished.',
  },
  {
    question: 'Do you offer discounts for annual billing?',
    answer:
      'Yes. Annual billing saves you 10% compared to monthly pricing. All annual plans are billed upfront for the full year. You can switch from monthly to annual billing at any time from your dashboard.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit and debit cards (Visa, Mastercard, American Express). All payments are processed securely through Dodo Payments.',
  },
];

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="w-5 h-5 text-brand-teal mx-auto" />
    ) : (
      <X className="w-5 h-5 text-slate-300 mx-auto" />
    );
  }
  return <span className="text-sm text-brand-navy font-medium">{value}</span>;
}

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <ContentPageLayout
      title="Pricing"
      subtitle="Start free, upgrade as you grow. Simple, transparent pricing with no hidden fees."
      showCTA={false}
    >
      {/* Billing Toggle */}
      <motion.div
        className="flex items-center justify-center gap-4 mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <span
          className={`text-sm font-medium transition-colors duration-200 ${
            !isYearly ? 'text-brand-navy' : 'text-text-secondary'
          }`}
        >
          Billed monthly
        </span>
        <button
          onClick={() => setIsYearly(!isYearly)}
          className="relative w-14 h-7 bg-brand-teal rounded-full transition-colors duration-200"
          aria-label="Toggle billing period"
        >
          <span
            className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
              isYearly ? 'translate-x-8' : 'translate-x-1'
            }`}
          />
        </button>
        <span
          className={`text-sm font-medium transition-colors duration-200 ${
            isYearly ? 'text-brand-navy' : 'text-text-secondary'
          }`}
        >
          Billed yearly
        </span>
        <span className="px-2 py-1 text-xs font-semibold text-brand-teal bg-brand-teal/10 rounded-full">
          Save 10%
        </span>
      </motion.div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            className={`relative bg-white rounded-2xl p-6 transition-all duration-300 ${
              plan.popular
                ? 'shadow-teal-lg border-2 border-brand-teal lg:-mt-4 lg:mb-4'
                : 'shadow-teal-sm border border-light-mint hover:shadow-teal-md hover:-translate-y-1'
            }`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-teal text-white text-xs font-semibold rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Recommended
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-bold text-brand-navy mb-1">{plan.name}</h3>
              <p className="text-sm text-text-secondary">{plan.description}</p>
            </div>

            <div className="mb-6">
              {plan.priceText ? (
                <div className="text-3xl font-bold text-brand-navy">{plan.priceText}</div>
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-brand-navy">
                    ${isYearly ? plan.annualTotalPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-text-secondary">
                    {isYearly ? '/year' : '/month'}
                  </span>
                </div>
              )}
              {plan.annualTotalPrice && isYearly && (
                <div className="text-sm text-brand-teal mt-1">
                  ${plan.annualMonthlyEquiv}/mo · Save 10%
                </div>
              )}
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-text-secondary">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href={plan.href}
              className={`block w-full py-3 px-4 text-center font-semibold rounded-lg transition-all duration-200 ${
                plan.popular
                  ? 'bg-brand-teal text-white hover:bg-[#008F85] hover:-translate-y-0.5 hover:shadow-teal-glow'
                  : 'bg-off-white text-brand-navy hover:bg-brand-teal hover:text-white'
              }`}
            >
              {plan.cta}
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Feature Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">
            Compare <span className="text-brand-teal">plans</span> in detail
          </h2>
          <p className="body-large text-text-secondary">
            Find the perfect plan for your business needs
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-4 px-4 text-sm font-semibold text-brand-navy w-1/3">
                  Feature
                </th>
                {['Starter', 'Growth', 'Scale', 'Enterprise'].map((plan) => (
                  <th
                    key={plan}
                    className={`text-center py-4 px-4 text-sm font-semibold ${
                      plan === 'Growth' ? 'text-brand-teal' : 'text-brand-navy'
                    }`}
                  >
                    {plan}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((category) => (
                <>
                  <tr key={category.category}>
                    <td
                      colSpan={5}
                      className="pt-6 pb-2 px-4 text-xs font-semibold text-brand-teal uppercase tracking-wider"
                    >
                      {category.category}
                    </td>
                  </tr>
                  {category.features.map((feature) => (
                    <tr
                      key={feature.name}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-text-secondary">{feature.name}</td>
                      <td className="py-3 px-4 text-center">
                        <FeatureValue value={feature.starter} />
                      </td>
                      <td className="py-3 px-4 text-center bg-teal-50/30">
                        <FeatureValue value={feature.growth} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <FeatureValue value={feature.scale} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <FeatureValue value={feature.enterprise} />
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Enterprise CTA */}
      <motion.div
        className="mt-20 bg-gradient-to-br from-brand-navy via-slate-800 to-brand-navy rounded-2xl p-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-brand-teal" />
          <Users className="w-8 h-8 text-brand-mint" />
          <Phone className="w-8 h-8 text-teal-300" />
        </div>
        <h2 className="heading-section font-bold text-white mb-4">
          Need a <span className="text-brand-teal">Custom Solution</span> for your enterprise?
        </h2>
        <p className="body-large text-white/70 mb-8 max-w-xl mx-auto">
          Get unlimited credits, dedicated support, custom integrations, and an SLA tailored to your business.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-teal font-semibold rounded-lg transition-all duration-200 hover:bg-off-white hover:-translate-y-0.5 hover:shadow-lg"
        >
          Contact our sales team
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>

      {/* FAQ Section */}
      <motion.div
        className="mt-24"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">
            Pricing <span className="text-brand-teal">FAQ</span>
          </h2>
          <p className="body-large text-text-secondary">
            Common questions about our pricing and billing
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-xl border border-slate-100 overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
              >
                <span className="text-sm font-semibold text-brand-navy pr-4">{faq.question}</span>
                <motion.div
                  animate={{ rotate: openFaq === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                </motion.div>
              </button>
              <AnimatePresence>
                {openFaq === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-4 text-sm text-text-secondary leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Bottom CTA */}
      <motion.div
        className="mt-16 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-sm text-text-secondary mb-4">
          Still have questions?{' '}
          <Link href="/contact" className="text-brand-teal font-semibold hover:underline">
            Talk to our team
          </Link>
        </p>
      </motion.div>
    </ContentPageLayout>
  );
}
