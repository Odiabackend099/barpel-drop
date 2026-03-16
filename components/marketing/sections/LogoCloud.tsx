"use client";

import Image from 'next/image';
import { motion } from 'framer-motion';

const partners = [
  { name: 'Shopify', logo: '/logos/shopify.svg' },
  { name: 'TikTok Shop', logo: '/logos/tiktok-shop.svg' },
  { name: 'WooCommerce', logo: '/logos/woocommerce.svg' },
  { name: 'Amazon', logo: '/logos/amazon.svg' },
  { name: 'Vapi AI', logo: '/logos/vapi.svg' },
  { name: 'Twilio', logo: '/logos/twilio.svg' },
];

export default function LogoCloud() {
  return (
    <section className="py-12 bg-[#f8fffe] border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <p className="text-sm font-medium text-slate-600 tracking-tight mb-1">
            Our Trusted Integrations
          </p>
          <p className="text-sm text-slate-400">
            Barpel connects with the platforms your store already runs on
          </p>
        </motion.div>

        {/* Static Logo Row */}
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {partners.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="transition-transform duration-200 group-hover:scale-110">
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  width={32}
                  height={32}
                  className="h-8 w-auto grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-200"
                />
              </div>
              <span className="text-xs font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
                {partner.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
