"use client";

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

// Clean SVG representations of actual compliance certification marks
function Soc2Badge() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14">
      <circle cx="40" cy="40" r="38" stroke="#7DD9C0" strokeWidth="2" />
      <circle cx="40" cy="40" r="30" stroke="#7DD9C0" strokeWidth="1" strokeDasharray="4 3" />
      <text x="40" y="28" textAnchor="middle" fill="#7DD9C0" fontSize="7" fontWeight="700" fontFamily="sans-serif">AICPA</text>
      <text x="40" y="40" textAnchor="middle" fill="white" fontSize="10" fontWeight="800" fontFamily="sans-serif">SOC 2</text>
      <text x="40" y="52" textAnchor="middle" fill="#7DD9C0" fontSize="6" fontWeight="600" fontFamily="sans-serif">TYPE II</text>
      <path d="M28 58 L40 65 L52 58" stroke="#7DD9C0" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function HipaaBadge() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14">
      <path d="M40 4 L72 20 L72 60 L40 76 L8 60 L8 20 Z" stroke="#7DD9C0" strokeWidth="2" fill="rgba(0,169,157,0.1)" />
      <path d="M40 14 L62 24 L62 56 L40 66 L18 56 L18 24 Z" stroke="#7DD9C0" strokeWidth="1" strokeDasharray="3 2" fill="none" />
      <text x="40" y="37" textAnchor="middle" fill="white" fontSize="10" fontWeight="800" fontFamily="sans-serif">HIPAA</text>
      <text x="40" y="50" textAnchor="middle" fill="#7DD9C0" fontSize="6" fontWeight="600" fontFamily="sans-serif">READY</text>
    </svg>
  );
}

function GdprBadge() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14">
      <rect x="4" y="4" width="72" height="72" rx="8" stroke="#7DD9C0" strokeWidth="2" fill="rgba(0,169,157,0.08)" />
      <circle cx="40" cy="22" r="6" fill="#7DD9C0" opacity="0.7" />
      {/* EU stars ring */}
      {[0,1,2,3,4,5,6,7,8,9,10,11].map((i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const x = 40 + 13 * Math.cos(angle);
        const y = 22 + 13 * Math.sin(angle);
        return <circle key={i} cx={x} cy={y} r="1.2" fill="#7DD9C0" />;
      })}
      <text x="40" y="50" textAnchor="middle" fill="white" fontSize="10" fontWeight="800" fontFamily="sans-serif">GDPR</text>
      <text x="40" y="62" textAnchor="middle" fill="#7DD9C0" fontSize="6" fontWeight="600" fontFamily="sans-serif">COMPLIANT</text>
    </svg>
  );
}

function EncryptionBadge() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14">
      <path d="M40 8 C22 8 14 18 14 30 L14 44 C14 60 26 72 40 72 C54 72 66 60 66 44 L66 30 C66 18 58 8 40 8 Z" stroke="#7DD9C0" strokeWidth="2" fill="rgba(0,169,157,0.08)" />
      {/* Keyhole */}
      <circle cx="40" cy="36" r="7" stroke="#7DD9C0" strokeWidth="2" fill="none" />
      <rect x="37" y="40" width="6" height="12" rx="2" fill="#7DD9C0" opacity="0.7" />
      {/* Checkmark overlay */}
      <circle cx="57" cy="20" r="10" fill="#0f172a" />
      <circle cx="57" cy="20" r="9" fill="#00A99D" />
      <path d="M52 20 L56 24 L63 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="40" y="65" textAnchor="middle" fill="#7DD9C0" fontSize="6" fontWeight="600" fontFamily="sans-serif">END-TO-END</text>
    </svg>
  );
}

const badges = [
  {
    BadgeIcon: Soc2Badge,
    label: 'SOC 2 Type II',
    description: 'Audited annually by independent third parties',
  },
  {
    BadgeIcon: HipaaBadge,
    label: 'HIPAA Ready',
    description: 'Healthcare-grade data privacy controls',
  },
  {
    BadgeIcon: GdprBadge,
    label: 'GDPR Compliant',
    description: 'Full EU data protection compliance',
  },
  {
    BadgeIcon: EncryptionBadge,
    label: 'End-to-End Encrypted',
    description: 'All call data encrypted in transit and at rest',
  },
];

export default function Security() {
  return (
    <section className="section-padding bg-brand-navy">
      <div className="container-default">
        <div className="text-center">
          {/* Section Header */}
          <motion.div
            className="max-w-3xl mx-auto mb-14"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
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
          </motion.div>

          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {badges.map((badge, index) => (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: index * 0.1 }}
                whileHover={{ y: -6, scale: 1.05 }}
                className="flex flex-col items-center gap-3 p-6 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm cursor-default w-44"
              >
                <badge.BadgeIcon />
                <div>
                  <span className="text-sm font-semibold text-white/95 block">
                    {badge.label}
                  </span>
                  <span className="text-xs text-white/45 mt-0.5 block leading-snug">
                    {badge.description}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
