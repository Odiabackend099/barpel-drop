"use client";

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';

export default function CTA() {
  const sectionRef = useRef<HTMLDivElement>(null);

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

    const content = sectionRef.current?.querySelector('.cta-content');
    if (content) observer.observe(content);

    return () => observer.disconnect();
  }, []);

  return (
    <section className="section-padding bg-cta-gradient">
      <div className="container-default">
        <div ref={sectionRef}>
          <div className="cta-content text-center max-w-3xl mx-auto opacity-0 translate-y-6">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-8">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>

            {/* Headline */}
            <h2 className="heading-section text-white mb-4">
              Power up your customer support
            </h2>

            {/* Description */}
            <p className="body-large text-white/80 mb-8">
              Get started in seconds — for free. No credit card required.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-teal font-semibold rounded-lg transition-all duration-200 hover:bg-off-white hover:-translate-y-0.5 hover:shadow-lg"
              >
                Start for free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg transition-all duration-200 hover:bg-white/10"
              >
                Get a demo
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .cta-content {
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cta-content.animate-in {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </section>
  );
}
