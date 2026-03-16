"use client";

import Image from 'next/image';
import { motion } from 'framer-motion';

const partners = [
  { name: 'Shopify', logo: '/logos/shopify.svg' },
  { name: 'Twilio', logo: '/logos/twilio.svg' },
  { name: 'Vapi AI', logo: '/logos/vapi.svg' },
  { name: 'Supabase', logo: '/logos/supabase.svg' },
];

// Duplicate 3x for seamless marquee loop (12 items total)
const duplicatedPartners = [...partners, ...partners, ...partners];

export default function LogoCloud() {
  return (
    <section className="py-12 bg-gradient-to-b from-teal-50/30 to-slate-50 border-y border-slate-100 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-sm text-slate-500 tracking-tight"
        >
          Trusted by leading e-commerce brands
        </motion.p>
      </div>

      {/* Infinite Scrolling Marquee */}
      <div className="relative">
        {/* Gradient Masks */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-teal-50/30 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

        {/* Scrolling Container */}
        <motion.div
          className="flex gap-12"
          animate={{
            x: [0, -50 * partners.length * 3],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 20,
              ease: "linear",
            },
          }}
        >
          {duplicatedPartners.map((partner, index) => (
            <motion.div
              key={`${partner.name}-${index}`}
              className="flex-shrink-0 flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-50/50 hover:bg-slate-100 transition-colors duration-300 group cursor-pointer"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="transition-transform duration-300 group-hover:scale-110">
                <Image src={partner.logo} alt={partner.name} width={32} height={32} className="h-8 w-auto" />
              </div>
              <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors whitespace-nowrap">
                {partner.name}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Second Row - Reverse Direction */}
      <div className="relative mt-4">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-teal-50/30 to-transparent z-10 pointer-events-none" />

        <motion.div
          className="flex gap-12"
          animate={{
            x: [-50 * partners.length * 3, 0],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 25,
              ease: "linear",
            },
          }}
        >
          {[...duplicatedPartners].reverse().map((partner, index) => (
            <motion.div
              key={`reverse-${partner.name}-${index}`}
              className="flex-shrink-0 flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-50/50 hover:bg-slate-100 transition-colors duration-300 group cursor-pointer"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="transition-transform duration-300 group-hover:scale-110">
                <Image src={partner.logo} alt={partner.name} width={32} height={32} className="h-8 w-auto" />
              </div>
              <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors whitespace-nowrap">
                {partner.name}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
