"use client";

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Shield, Lock, Globe, Award } from 'lucide-react';

const badges = [
  { icon: Shield, label: 'SOC 2 Type II' },
  { icon: Lock, label: 'GDPR Compliant' },
  { icon: Globe, label: 'End-to-end encryption' },
  { icon: Award, label: 'HIPAA Ready' },
];

export default function Security() {
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

    const header = sectionRef.current?.querySelector('.section-header');
    const badgeItems = sectionRef.current?.querySelectorAll('.badge-item');

    if (header) observer.observe(header);
    badgeItems?.forEach((badge) => observer.observe(badge));

    return () => observer.disconnect();
  }, []);

  return (
    <section className="section-padding bg-brand-navy">
      <div className="container-default">
        <div ref={sectionRef} className="text-center">
          {/* Section Header */}
          <div className="section-header max-w-3xl mx-auto mb-12 opacity-0 translate-y-6">
            <h2 className="heading-section text-white mb-4">
              Built to keep your business{' '}
              <span className="text-brand-mint">secure</span>
            </h2>
            <p className="body-large text-white/70">
              Enterprise-grade security with SOC 2 compliance, data encryption,
              and privacy protections.
            </p>
            <Link
              href="/privacy"
              className="inline-flex items-center gap-2 text-brand-mint font-semibold mt-4 hover:gap-3 transition-all duration-200"
            >
              Learn more
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {badges.map((badge, index) => (
              <div
                key={badge.label}
                className="badge-item flex flex-col items-center gap-3 p-6 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 opacity-0 translate-y-6"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-full bg-brand-teal/20 flex items-center justify-center">
                  <badge.icon className="w-7 h-7 text-brand-mint" />
                </div>
                <span className="text-sm font-medium text-white/90">
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .section-header,
        .badge-item {
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .section-header.animate-in,
        .badge-item.animate-in {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </section>
  );
}
