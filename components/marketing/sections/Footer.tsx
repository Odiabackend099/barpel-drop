"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Linkedin, Facebook, Youtube } from 'lucide-react';
import Logo from '@/components/marketing/Logo';

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.6l-5.165-6.75-5.91 6.75H2.556l7.73-8.835L1.966 2.25h6.5l4.659 6.16L17.356 2.25h.888zm-1.017 17.528h1.83L5.982 4.1H4.064l12.163 15.678z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.51a8.27 8.27 0 0 0 4.76 1.5v-3.4a4.85 4.85 0 0 1-1-.08z" />
    </svg>
  );
}

const footerLinks = {
  product: {
    title: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'How it Works', href: '/how-it-works' },
      { label: 'Integrations', href: '/integrations' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'API Documentation', href: '/api-documentation' },
    ],
  },
  solutions: {
    title: 'Solutions',
    links: [
      { label: 'For Dropshippers', href: '/solutions/dropshippers' },
      { label: 'For Shopify Stores', href: '/solutions/shopify-stores' },
      { label: 'For TikTok Shop', href: '/solutions/tiktok-shop' },
      { label: 'For Amazon Sellers', href: '/solutions/amazon-sellers' },
    ],
  },
  resources: {
    title: 'Resources',
    links: [
      { label: 'Help Center', href: '/help-center' },
      { label: 'Blog', href: '/blog' },
      { label: 'Customer Stories', href: '/customer-stories' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Developer Tools', href: '/developer-tools' },
    ],
  },
  company: {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
      { label: 'Partners', href: '/partners' },
      { label: 'Press Kit', href: '/press-kit' },
    ],
  },
};

const socialLinks = [
  { icon: Facebook, href: 'https://www.facebook.com/share/1AtFaTkMEN/?mibextid=wwXIfr', label: 'Facebook' },
  { icon: XIcon, href: 'https://x.com/barpel_ai?s=21', label: 'X' },
  { icon: Linkedin, href: 'https://www.linkedin.com/in/barbara-aernyi-6b206b3b2', label: 'LinkedIn' },
  { icon: Youtube, href: 'https://youtube.com/@barpel-ai?si=oTi9ZbnJrVvjXcJ7', label: 'YouTube' },
  { icon: TikTokIcon, href: 'https://www.tiktok.com/@barpelai', label: 'TikTok' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Footer() {
  return (
    <footer className="bg-[#0f172a] border-t border-white/10">
      <motion.div
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Column */}
          <motion.div variants={itemVariants} className="col-span-2 md:col-span-3 lg:col-span-2">
            <Logo size="lg" showText={true} variant="light" className="mb-4" />
            <p className="text-sm text-white/60 mb-6 max-w-xs leading-relaxed">
              AI-powered voice support for modern e-commerce. Handle customer
              calls automatically, 24/7.
            </p>

            {/* Social Links */}
            <div className="flex gap-2">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:bg-teal-500 hover:text-white transition-all duration-200"
                  aria-label={social.label}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <social.icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Link Columns */}
          {Object.values(footerLinks).map((section, sectionIndex) => (
            <motion.div key={section.title} variants={itemVariants}>
              <h3 className="text-sm font-semibold text-white mb-4 tracking-tight">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link, linkIndex) => (
                  <motion.li
                    key={link.label}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + sectionIndex * 0.05 + linkIndex * 0.03 }}
                  >
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 hover:text-teal-400 transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Bar */}
        <motion.div
          variants={itemVariants}
          className="mt-12 pt-8 border-t border-white/10"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-white/40">
              © 2026 Barpel AI Inc. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link
                href="/privacy"
                className="text-xs text-white/50 hover:text-teal-400 transition-colors duration-150"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-xs text-white/50 hover:text-teal-400 transition-colors duration-150"
              >
                Terms of Service
              </Link>
              <Link
                href="/data-processing"
                className="text-xs text-white/50 hover:text-teal-400 transition-colors duration-150"
              >
                Data Processing
              </Link>
              <Link
                href="/cookies"
                className="text-xs text-white/50 hover:text-teal-400 transition-colors duration-150"
              >
                Cookies
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
}
