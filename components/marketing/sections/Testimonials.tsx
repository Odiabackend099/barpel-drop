"use client";

import { m } from 'framer-motion';
import { Star } from 'lucide-react';
import Link from 'next/link';

export default function Testimonials() {
  return (
    <section className="section-padding bg-[#0f172a] overflow-hidden">
      <div className="container-default">
        {/* Section Header */}
        <m.div
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
            We are in early access and building our first merchant case studies. Want to be featured?
          </p>
        </m.div>

        {/* Coming Soon Card */}
        <m.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative bg-white/[0.06] backdrop-blur-sm rounded-2xl p-10 border border-white/10 text-center max-w-2xl mx-auto"
        >
          <div className="flex items-center justify-center gap-0.5 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="text-white/70 text-base leading-relaxed mb-6">
            Case studies are coming soon. We are currently working with our early access merchants to document real results. Check back shortly — or become our first featured store.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-teal text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors duration-200 text-sm"
          >
            Start free trial
          </Link>
        </m.div>
      </div>
    </section>
  );
}
