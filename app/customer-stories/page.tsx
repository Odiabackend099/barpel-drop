"use client";

import ContentPageLayout from '@/components/marketing/ContentPageLayout';
import { m } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  Star,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

export default function CustomerStoriesPage() {
  return (
    <ContentPageLayout
      title="Customer Stories"
      subtitle="Real results from merchants using Barpel AI voice support."
    >
      {/* Coming Soon */}
      <m.div {...fadeInUp} className="mb-20">
        <div className="bg-gradient-to-br from-brand-navy to-slate-800 rounded-2xl p-16 text-center">
          <Star className="w-10 h-10 text-teal-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">Case studies coming soon</h2>
          <p className="text-white/60 max-w-lg mx-auto">
            We are in early access and actively working with merchants to document their results.
            Check back soon — or start your free trial and be our first featured story.
          </p>
        </div>
      </m.div>

      {/* Bottom CTA */}
      <m.div {...fadeInUp} className="text-center">
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-12">
          <h2 className="text-2xl font-bold text-brand-navy mb-4">
            Ready to write your success story?
          </h2>
          <p className="text-slate-600 max-w-lg mx-auto mb-8">
            Start your free trial today. No credit card required — 5 free calls included.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="btn-primary inline-flex items-center gap-2">
              Start free trial
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </m.div>
    </ContentPageLayout>
  );
}
