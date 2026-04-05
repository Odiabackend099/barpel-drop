"use client";

import Link from 'next/link';
import { Check, ArrowRight, Sparkles, Lock } from 'lucide-react';
import { m } from 'framer-motion';

const plans = [
  {
    name: 'Starter',
    description: 'For small stores just getting started',
    price: 29,
    yearlyTotal: 313,
    features: [
      '30 credits/month',
      '1 phone number',
      'Shopify integration',
      'Order tracking',
      'Email support',
    ],
    cta: 'Try for free',
    href: '/signup',
    popular: false,
    ctaStyle: 'outlined' as const,
  },
  {
    name: 'Growth',
    description: 'For growing businesses',
    price: 79,
    yearlyTotal: 853,
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
    price: 179,
    yearlyTotal: 1933,
    features: [
      '250 credits/month',
      '10 phone numbers',
      'Custom AI training',
      'Advanced analytics',
      'Dedicated account manager',
    ],
    cta: 'Try for free',
    href: '/signup',
    popular: false,
    ctaStyle: 'outlined' as const,
  },
];


export default function Pricing() {
  return (
    <section id="pricing" className="section-padding bg-white">
      <div className="container-default">
        {/* Section Header */}
        <m.div
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
        </m.div>


        {/* Pricing Cards — 3 columns */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <m.div
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

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold text-brand-navy">${plan.price}</span>
                  <span className="text-text-secondary">/month</span>
                </div>
                <div className="text-sm text-brand-teal">
                  Billed ${plan.yearlyTotal}/year · Save 10%
                </div>
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
                  Secured by Dodo Payments · Cancel anytime
                </span>
              </div>
            </m.div>
          ))}
        </div>

        {/* Enterprise Card */}
        <m.div
          className="mt-8 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <div className="rounded-2xl border-2 border-brand-navy bg-off-white p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-brand-teal" />
                <p className="text-xl font-bold text-brand-navy">Enterprise</p>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed max-w-md">
                Custom volume pricing, dedicated SLAs, white-glove onboarding, and a dedicated account manager for high-volume stores.
              </p>
            </div>
            <Link
              href="/contact"
              className="flex-shrink-0 inline-flex items-center gap-2 px-8 py-4 bg-brand-navy text-white font-bold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg"
            >
              Contact us
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </m.div>
      </div>
    </section>
  );
}
