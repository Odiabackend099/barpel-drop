"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Sparkles, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const plans = [
  {
    name: 'Starter',
    description: 'For small stores just getting started',
    monthlyPrice: 29,
    yearlyPrice: 23,
    yearlyTotal: 276,
    features: [
      '30 credits/month',
      '1 phone number',
      'Shopify integration',
      'Order tracking',
      'Email support',
    ],
    cta: 'Get started',
    href: '/signup',
    popular: false,
    ctaStyle: 'outlined' as const,
  },
  {
    name: 'Growth',
    description: 'For growing businesses',
    monthlyPrice: 79,
    yearlyPrice: 63,
    yearlyTotal: 756,
    features: [
      '100 credits/month',
      '3 phone numbers',
      'All integrations',
      'Returns handling',
      'Abandoned cart recovery',
      'Priority support',
    ],
    cta: 'Try for free',
    href: '/signup',
    popular: true,
    ctaStyle: 'solid' as const,
  },
  {
    name: 'Scale',
    description: 'For high-volume stores',
    monthlyPrice: 179,
    yearlyPrice: 143,
    yearlyTotal: 1716,
    features: [
      '250 credits/month',
      '10 phone numbers',
      'Custom AI training',
      'Advanced analytics',
      'Dedicated account manager',
    ],
    cta: 'Talk to sales',
    href: '/signup',
    popular: false,
    ctaStyle: 'outlined' as const,
  },
];

function AnimatedPrice({ price }: { price: number }) {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={price}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="text-4xl font-bold text-brand-navy inline-block"
      >
        ${price}
      </motion.span>
    </AnimatePresence>
  );
}

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <section id="pricing" className="section-padding bg-white">
      <div className="container-default">
        {/* Section Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-12"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="heading-section text-brand-navy mb-4">
            Pick the perfect plan for your{' '}
            <span className="text-brand-teal">store</span>
          </h2>
          <p className="body-large text-text-secondary">
            Start free, upgrade as you grow. No hidden fees.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          className="flex items-center justify-center gap-4 mb-12"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span
            className={`text-sm font-medium transition-colors duration-200 ${
              !isYearly ? 'text-brand-navy' : 'text-text-secondary'
            }`}
          >
            Monthly
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
            Annual
          </span>
          <span className="px-2.5 py-1 text-xs font-semibold text-brand-teal bg-brand-teal/10 rounded-full">
            Save 20%
          </span>
        </motion.div>

        {/* Pricing Cards — 3 columns */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
              }}
              className={`relative bg-white rounded-2xl p-6 transition-all duration-300 ${
                plan.popular
                  ? 'shadow-teal-lg border-2 border-brand-teal lg:-mt-4 lg:mb-4'
                  : 'shadow-teal-sm border border-light-mint hover:shadow-teal-md hover:-translate-y-1'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-teal text-white text-xs font-semibold rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Recommended
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-brand-navy mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-text-secondary">
                  {plan.description}
                </p>
              </div>

              {/* Price with animation */}
              <div className="mb-1">
                <div className="flex items-baseline gap-1">
                  <AnimatedPrice price={isYearly ? plan.yearlyPrice : plan.monthlyPrice} />
                  <span className="text-text-secondary">/month</span>
                </div>
              </div>
              <div className="mb-6 h-5">
                <AnimatePresence mode="wait">
                  {isYearly && (
                    <motion.div
                      key="yearly-note"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-brand-teal"
                    >
                      Billed ${plan.yearlyTotal}/year
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-text-secondary">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={plan.href}
                className={`block w-full py-3 px-4 text-center font-semibold rounded-lg transition-all duration-200 ${
                  plan.ctaStyle === 'solid'
                    ? 'bg-brand-teal text-white hover:bg-[#008F85] hover:-translate-y-0.5 hover:shadow-teal-glow'
                    : 'bg-off-white text-brand-navy border border-light-mint hover:bg-brand-teal hover:text-white hover:border-brand-teal'
                }`}
              >
                {plan.cta}
              </Link>

              {/* Trust signal */}
              <div className="flex items-center justify-center gap-1.5 mt-3">
                <Lock className="w-3 h-3 text-slate-300" />
                <span className="text-[12px] text-slate-400">
                  Secured by Flutterwave · Cancel anytime
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Enterprise link */}
        <motion.div
          className="text-center mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-text-secondary text-sm mb-2">
            Need more? We can build a custom plan.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-brand-teal font-semibold hover:gap-3 transition-all duration-200"
          >
            Enterprise — Contact us
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
