"use client";

import Image from 'next/image';
import { m } from 'framer-motion';

const partners = [
  { name: 'Shopify', logo: '/logos/shopify.svg' },
  { name: 'TikTok Shop', logo: '/logos/tiktok-shop.svg' },
  { name: 'WooCommerce', logo: '/logos/woocommerce.svg' },
  { name: 'Amazon', logo: '/logos/amazon.svg' },
];

export default function LogoCloud() {
  return (
    <section className="py-12 bg-[#f8fffe] border-y border-slate-100 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <m.div
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
        </m.div>

        {/* Infinite scroll marquee */}
        <div className="relative overflow-hidden">
          <m.div
            className="flex gap-8 md:gap-12 whitespace-nowrap"
            animate={{ x: ['0%', '-50%'] }}
            transition={{
              duration: 40,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {/* Render partners twice for seamless loop */}
            {[...partners, ...partners].map((partner, index) => (
              <div
                key={index}
                className="flex-shrink-0 flex flex-col items-center gap-2 group"
              >
                <div className="transition-transform duration-200 group-hover:scale-110">
                  <Image
                    src={partner.logo}
                    alt={`${partner.name}`}
                    width={40}
                    height={40}
                    className="h-10 w-auto opacity-90 group-hover:opacity-100 transition-all duration-200"
                  />
                </div>
                <span className="text-xs font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
                  {partner.name}
                </span>
              </div>
            ))}
          </m.div>
        </div>
      </div>
    </section>
  );
}
