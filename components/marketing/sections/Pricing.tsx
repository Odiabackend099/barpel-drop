"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Sparkles } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    description: 'For small stores just getting started',
    monthlyPrice: 29,
    yearlyPrice: 23,
    features: [
      '500 credits/month',
      '1 phone number',
      'Shopify integration',
      'Order tracking',
      'Email support',
    ],
    cta: 'Get started',
    href: '/signup',
    popular: false,
  },
  {
    name: 'Growth',
    description: 'For growing businesses',
    monthlyPrice: 79,
    yearlyPrice: 63,
    features: [
      '2,000 credits/month',
      '3 phone numbers',
      'All integrations',
      'Returns handling',
      'Abandoned cart recovery',
      'Priority support',
    ],
    cta: 'Try for free',
    href: '/signup',
    popular: true,
  },
  {
    name: 'Scale',
    description: 'For high-volume stores',
    monthlyPrice: 179,
    yearlyPrice: 143,
    features: [
      '6,000 credits/month',
      '10 phone numbers',
      'Custom AI training',
      'Advanced analytics',
      'Dedicated account manager',
    ],
    cta: 'Talk to sales',
    href: '/signup',
    popular: false,
  },
  {
    name: 'Custom',
    description: 'For large organizations',
    monthlyPrice: null,
    yearlyPrice: null,
    priceText: 'Custom',
    features: [
      'Unlimited credits',
      'Unlimited numbers',
      'SLA guarantee',
      'Custom integrations',
      '24/7 phone support',
    ],
    cta: 'Contact us',
    href: '/contact',
    popular: false,
  },
];

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
    );

    const header = sectionRef.current?.querySelector('.section-header');
    const toggle = sectionRef.current?.querySelector('.pricing-toggle');
    const cards = cardsRef.current?.querySelectorAll('.pricing-card');

    if (header) observer.observe(header);
    if (toggle) observer.observe(toggle);
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <section id="pricing" className="section-padding bg-gradient-to-br from-slate-50 to-teal-50/30">
      <div className="container-default">
        <div ref={sectionRef}>
          {/* Section Header */}
          <div className="section-header text-center max-w-3xl mx-auto mb-12 opacity-0 translate-y-6">
            <h2 className="heading-section text-brand-navy mb-4">
              Pick the perfect plan for your{' '}
              <span className="text-brand-teal">store</span>
            </h2>
            <p className="body-large text-text-secondary">
              Start free, upgrade as you grow. No hidden fees.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="pricing-toggle flex items-center justify-center gap-4 mb-12 opacity-0 translate-y-6">
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
              Save 20%
            </span>
          </div>

          {/* Pricing Cards */}
          <div
            ref={cardsRef}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`pricing-card relative bg-white rounded-2xl p-6 transition-all duration-300 opacity-0 translate-y-6 ${
                  plan.popular
                    ? 'shadow-teal-lg border-2 border-brand-teal lg:-mt-4 lg:mb-4'
                    : 'shadow-teal-sm border border-light-mint hover:shadow-teal-md hover:-translate-y-1'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
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
                  {plan.priceText ? (
                    <div className="text-3xl font-bold text-brand-navy">
                      {plan.priceText}
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-brand-navy">
                        ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-text-secondary">/month</span>
                    </div>
                  )}
                  {plan.yearlyPrice && isYearly && (
                    <div className="text-sm text-brand-teal mt-1">
                      Save ${(plan.monthlyPrice! - plan.yearlyPrice) * 12}/year
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
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
                    plan.popular
                      ? 'bg-brand-teal text-white hover:bg-[#008F85] hover:-translate-y-0.5 hover:shadow-teal-glow'
                      : 'bg-off-white text-brand-navy hover:bg-brand-teal hover:text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* Bottom Link */}
          <div className="text-center mt-8">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-brand-teal font-semibold hover:gap-3 transition-all duration-200"
            >
              Learn more on our pricing page
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .section-header,
        .pricing-toggle,
        .pricing-card {
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .section-header.animate-in,
        .pricing-toggle.animate-in,
        .pricing-card.animate-in {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </section>
  );
}
