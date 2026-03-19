"use client";

import { motion } from 'framer-motion';
import { Star, CheckCircle2 } from 'lucide-react';

const testimonials = [
  {
    quote: "Before Barpel, our support inbox was flooded with 'Where is my order?' questions. Now the AI handles all of it. We went from 60+ daily tickets to under 10. My team finally has time to actually grow the store.",
    name: "Sarah K.",
    role: "Founder",
    store: "NovaDrop Co.",
    platform: "Shopify + TikTok Shop",
    avatar: "SK",
    avatarBg: "bg-brand-teal",
    stars: 5,
  },
  {
    quote: "The abandoned cart recovery alone paid for the entire year. Barpel called back 3 customers in one night and recovered $890 in orders I would have just lost. It's running while I'm asleep — that's wild.",
    name: "James T.",
    role: "Owner",
    store: "VeloGear Supplies",
    platform: "Shopify",
    avatar: "JT",
    avatarBg: "bg-purple-600",
    stars: 5,
  },
  {
    quote: "I used to miss calls on weekends and lose sales because of it. Barpel answers instantly, in perfect English, handles returns professionally, and my customers don't even know it's AI. 5-star reviews went up.",
    name: "Amara O.",
    role: "Co-founder",
    store: "LuxeFinds Store",
    platform: "WooCommerce",
    avatar: "AO",
    avatarBg: "bg-emerald-600",
    stars: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="section-padding bg-[#0f172a] overflow-hidden">
      <div className="container-default">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="heading-section text-white mb-2">
            Real stores, real results with{' '}
            <span className="text-brand-mint">Barpel</span>
          </h2>
          <p className="body-large text-white/50">
            From Shopify to TikTok Shop — merchants across every platform trust Barpel to handle their customer calls.
          </p>
        </motion.div>

        {/* Testimonial Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
              }}
              className="relative bg-white/[0.06] backdrop-blur-sm rounded-2xl p-6 border border-white/10 flex flex-col gap-4 hover:bg-white/[0.09] transition-colors duration-300"
            >
              {/* Stars */}
              <div className="flex items-center gap-0.5">
                {[...Array(testimonial.stars)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-white/85 text-sm leading-relaxed flex-1">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full ${testimonial.avatarBg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {testimonial.avatar}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-white truncate">
                      {testimonial.name}
                    </p>
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-teal flex-shrink-0" />
                  </div>
                  <p className="text-xs text-white/50 truncate">
                    {testimonial.role} · {testimonial.store}
                  </p>
                </div>

                {/* Platform badge */}
                <div className="ml-auto flex-shrink-0">
                  <span className="px-2 py-0.5 bg-white/10 rounded-full text-[10px] font-medium text-white/60 whitespace-nowrap">
                    {testimonial.platform}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
