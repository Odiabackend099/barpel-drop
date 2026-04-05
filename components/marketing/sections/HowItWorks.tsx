"use client";

import Image from 'next/image';
import { Plug, Sliders, Phone, CheckCircle2 } from 'lucide-react';
import { m } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.25,
      delayChildren: 0.1,
    },
  },
};

const getStepVariants = (index: number) => ({
  hidden: { opacity: 0, x: index % 2 === 0 ? -40 : 40, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
});

const steps = [
  {
    icon: Plug,
    title: 'Connect Your Store',
    description: 'One-click Shopify integration. We sync your products, orders, and policies automatically.',
  },
  {
    icon: Sliders,
    title: 'Configure Your AI',
    description: 'Set your brand voice, return policies, and escalation rules. Your AI learns your business.',
  },
  {
    icon: Phone,
    title: 'Start Taking Calls',
    description: 'Get a dedicated phone number. Customers call, AI answers. Watch your support tickets drop.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section-padding bg-[#f0fdfa]">
      <div className="container-default">
        <div>
          {/* Section Header */}
          <m.div
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="heading-section text-brand-navy mb-4">
              Get started in <span className="text-brand-teal">minutes</span>, not months
            </h2>
            <p className="body-large text-text-secondary">
              Three simple steps to AI-powered customer support
            </p>
          </m.div>

          {/* Content Grid */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Steps */}
            <m.div
              className="space-y-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {steps.map((step, index) => (
                <m.div
                  key={step.title}
                  className="flex gap-5"
                  variants={getStepVariants(index)}
                >
                  {/* Step Number & Line */}
                  <div className="flex flex-col items-center">
                    <m.div
                      className="w-12 h-12 rounded-full bg-brand-teal flex items-center justify-center flex-shrink-0"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: index * 0.25 }}
                    >
                      <step.icon className="w-5 h-5 text-white" />
                    </m.div>
                    {index < steps.length - 1 && (
                      <m.div
                        className="w-0.5 flex-1 bg-brand-teal/20 my-2"
                        initial={{ scaleY: 0 }}
                        whileInView={{ scaleY: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: (index + 1) * 0.25 }}
                        style={{ transformOrigin: 'top' }}
                      />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="pb-8">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-brand-teal uppercase tracking-wider">
                        Step {index + 1}
                      </span>
                    </div>
                    <h3 className="heading-card text-brand-navy mb-2">
                      {step.title}
                    </h3>
                    <p className="body-default text-text-secondary">
                      {step.description}
                    </p>
                  </div>
                </m.div>
              ))}

              {/* Trust Badge */}
              <m.div
                className="flex items-center gap-4 pt-4"
                variants={getStepVariants(0)}
              >
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-mint border-2 border-white flex items-center justify-center"
                    >
                      <span className="text-xs font-bold text-white">{i}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <CheckCircle2 className="w-4 h-4 text-brand-teal" />
                  <span>Join 100+ merchants using Barpel</span>
                </div>
              </m.div>
            </m.div>

            {/* Dashboard Image */}
            <m.div
              className="relative"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-teal-lg">
                <Image
                  src="/how-it-works-dashboard.jpg"
                  alt="Barpel AI dashboard showing order tracking and cart recovery stats"
                  width={800}
                  height={500}
                  loading="lazy"
                  className="w-full h-auto"
                />
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-teal-md border border-light-mint">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-teal/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-brand-teal" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-brand-navy">Setup Complete</div>
                    <div className="text-xs text-text-secondary">Ready to take calls</div>
                  </div>
                </div>
              </div>
            </m.div>
          </div>
        </div>
      </div>
    </section>
  );
}
