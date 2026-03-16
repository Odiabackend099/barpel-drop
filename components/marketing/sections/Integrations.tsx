"use client";

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ExternalLink } from 'lucide-react';

const integrations = [
  { name: 'Shopify', logo: '/logos/shopify.svg' },
  { name: 'Twilio', logo: '/logos/twilio.svg' },
  { name: 'Vapi AI', logo: '/logos/vapi.svg' },
  { name: 'Supabase', logo: '/logos/supabase.svg' },
];

const featuredIntegrations = [
  {
    name: 'Shopify Suite',
    description: 'Connect your Shopify store in one click. Sync products, orders, and customer data automatically.',
    logo: '/logos/shopify.svg',
  },
  {
    name: 'Voice & SMS',
    description: 'Powered by Twilio and Vapi AI for crystal-clear voice calls and SMS notifications.',
    logo: '/logos/twilio.svg',
  },
];

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

export default function Integrations() {
  return (
    <section id="integrations" className="section-padding bg-gradient-to-b from-teal-50/20 to-white">
      <div className="container-default">
        <div>
          {/* Section Header */}
          <motion.div
            className="max-w-2xl mb-12"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="heading-section text-brand-navy mb-4">
              Connect Barpel to the tools you{' '}
              <span className="text-brand-teal">already use</span>
            </h2>
            <p className="body-large text-text-secondary mb-4">
              Boost productivity with seamless integrations
            </p>
            <Link
              href="/integrations"
              className="inline-flex items-center gap-2 text-brand-teal font-semibold hover:gap-3 transition-all duration-200"
            >
              View all integrations
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Integration Logos Grid */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
            variants={gridVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {integrations.map((integration) => (
              <motion.div
                key={integration.name}
                className="group flex flex-col items-center justify-center p-6 bg-off-white rounded-xl border border-light-mint transition-all duration-300 hover:bg-white hover:shadow-teal-md hover:-translate-y-1"
                variants={cardVariants}
                whileHover={{ y: -4 }}
                title={integration.name}
              >
                <motion.div
                  className="mb-2"
                  whileHover={{ rotate: 5, scale: 1.15 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                  <Image src={integration.logo} alt={integration.name} width={40} height={40} className="h-10 w-auto" />
                </motion.div>
                <span className="text-sm font-medium text-text-secondary group-hover:text-brand-navy transition-colors">
                  {integration.name}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* Featured Integration Cards */}
          <motion.div
            className="grid md:grid-cols-2 gap-6"
            variants={gridVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {featuredIntegrations.map((integration) => (
              <motion.a
                key={integration.name}
                href="/integrations"
                className="group flex items-start gap-4 p-6 bg-off-white rounded-xl border border-light-mint transition-all duration-300 hover:bg-white hover:shadow-teal-md hover:border-brand-teal/30"
                variants={cardVariants}
              >
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-teal-sm group-hover:shadow-teal-md transition-shadow duration-300">
                  <Image src={integration.logo} alt={integration.name} width={32} height={32} className="h-8 w-auto" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-brand-navy">
                      {integration.name}
                    </h3>
                    <ExternalLink className="w-4 h-4 text-brand-teal opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
                  </div>
                  <p className="text-sm text-text-secondary">
                    {integration.description}
                  </p>
                </div>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
