"use client";

import { m } from 'framer-motion';
import {
  ArrowRight,
  Download,
  Palette,
  FileText,
  Image,
  BarChart3,
  Mail,
  Copy,
  Check,
  Building2,
  Globe,
  Award,
} from 'lucide-react';
import { useState } from 'react';
import ContentPageLayout from '@/components/marketing/ContentPageLayout';

const brandColors = [
  { name: 'Teal (Primary)', hex: '#0d9488', rgb: '13, 148, 136', usage: 'Primary brand color, CTAs, links, and accents' },
  { name: 'Navy (Dark)', hex: '#0f172a', rgb: '15, 23, 42', usage: 'Headlines, dark backgrounds, and navigation' },
  { name: 'Mint (Secondary)', hex: '#14b8a6', rgb: '20, 184, 166', usage: 'Secondary accents, gradients, and hover states' },
  { name: 'Light Mint', hex: '#ccfbf1', rgb: '204, 251, 241', usage: 'Borders, subtle backgrounds, and dividers' },
  { name: 'Off White', hex: '#f8fafc', rgb: '248, 250, 252', usage: 'Section backgrounds and card surfaces' },
  { name: 'Text Secondary', hex: '#4A7A6D', rgb: '74, 122, 109', usage: 'Body text and secondary content' },
];

const companyFacts = [
  { icon: Building2, label: 'Founded', value: '2025' },
  { icon: Globe, label: 'Headquarters', value: 'San Francisco, CA' },
  { icon: Award, label: 'Languages Supported', value: '30+' },
  { icon: BarChart3, label: 'Stage', value: 'Early Access' },
];


function ColorSwatch({ color }: { color: typeof brandColors[0] }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(color.hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <m.div
      className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
      whileHover={{ y: -2 }}
    >
      <div
        className="h-20 w-full"
        style={{ backgroundColor: color.hex }}
      />
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-brand-navy">{color.name}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand-teal transition-colors"
            title="Copy hex code"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
        <div className="text-xs font-mono text-brand-teal mb-1">{color.hex}</div>
        <div className="text-xs text-text-secondary">{color.usage}</div>
      </div>
    </m.div>
  );
}

export default function PressKitPage() {
  return (
    <ContentPageLayout
      title="Press Kit"
      subtitle="Brand assets, company information, and media resources for press and partners."
    >
      {/* Brand Assets */}
      <m.div
        className="mb-24"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3 mb-8">
          <Image className="w-6 h-6 text-brand-teal" />
          <h2 className="heading-section text-brand-navy">Brand Assets</h2>
        </div>

        <p className="body-large text-text-secondary mb-8 max-w-2xl">
          Download our official logos and brand marks. Please use the assets as provided and do not alter colors, proportions, or add effects.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Logo on Light */}
          <m.div
            className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white p-8 flex items-center justify-center h-40 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-400 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">B</span>
                </div>
                <span className="text-xl font-bold text-brand-navy">Barpel</span>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-brand-navy">Logo (Light Background)</div>
                <div className="text-xs text-text-secondary">PNG, SVG</div>
              </div>
              <a
                href="/logo.png"
                download
                className="flex items-center gap-1 text-sm font-medium text-brand-teal hover:underline"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
          </m.div>

          {/* Logo on Dark */}
          <m.div
            className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <div className="bg-brand-navy p-8 flex items-center justify-center h-40">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-400 to-teal-300 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">B</span>
                </div>
                <span className="text-xl font-bold text-white">Barpel</span>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-brand-navy">Logo (Dark Background)</div>
                <div className="text-xs text-text-secondary">PNG, SVG</div>
              </div>
              <a
                href="/logo.png"
                download
                className="flex items-center gap-1 text-sm font-medium text-brand-teal hover:underline"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
          </m.div>

          {/* Icon Only */}
          <m.div
            className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="bg-gradient-to-br from-slate-50 to-teal-50 p-8 flex items-center justify-center h-40">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-400 flex items-center justify-center shadow-teal-md">
                <span className="text-white font-bold text-3xl">B</span>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-brand-navy">Icon Mark</div>
                <div className="text-xs text-text-secondary">PNG, SVG, ICO</div>
              </div>
              <a
                href="/logo.png"
                download
                className="flex items-center gap-1 text-sm font-medium text-brand-teal hover:underline"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
          </m.div>
        </div>
      </m.div>

      {/* Brand Colors */}
      <m.div
        className="mb-24"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3 mb-8">
          <Palette className="w-6 h-6 text-brand-teal" />
          <h2 className="heading-section text-brand-navy">Brand Colors</h2>
        </div>

        <p className="body-large text-text-secondary mb-8 max-w-2xl">
          Our color palette reflects trust, innovation, and clarity. Click any swatch to copy its hex code.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {brandColors.map((color, index) => (
            <m.div
              key={color.hex}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <ColorSwatch color={color} />
            </m.div>
          ))}
        </div>
      </m.div>

      {/* Company Facts */}
      <m.div
        className="mb-24"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="w-6 h-6 text-brand-teal" />
          <h2 className="heading-section text-brand-navy">Company Facts</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {companyFacts.map((fact, index) => (
            <m.div
              key={fact.label}
              className="bg-off-white rounded-xl p-5 border border-light-mint text-center"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <fact.icon className="w-5 h-5 text-brand-teal mx-auto mb-2" />
              <div className="text-lg font-bold text-brand-navy mb-0.5">{fact.value}</div>
              <div className="text-xs text-text-secondary">{fact.label}</div>
            </m.div>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-xl p-6 border border-slate-100">
          <h3 className="heading-card text-brand-navy mb-3">Boilerplate</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            Barpel AI is an AI-powered voice support platform for e-commerce. Founded in 2025 by Rafael (CEO) and Austyn (CTO), Barpel enables online stores to automate customer phone support with conversational AI that handles order tracking, returns, product questions, and cart recovery in 30+ languages. The platform integrates with Shopify, TikTok Shop, WooCommerce, and Amazon, and is currently available in early access.
          </p>
        </div>
      </m.div>

      {/* Press Releases */}
      <m.div
        className="mb-24"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3 mb-8">
          <FileText className="w-6 h-6 text-brand-teal" />
          <h2 className="heading-section text-brand-navy">Press Releases</h2>
        </div>

        <div className="bg-off-white rounded-xl p-8 border border-light-mint text-center">
          <p className="text-text-secondary text-sm">
            No press releases yet. For media inquiries contact{' '}
            <a href="mailto:press@barpel.ai" className="text-brand-teal hover:underline">press@barpel.ai</a>.
          </p>
        </div>
      </m.div>

      {/* Press Contact */}
      <m.div
        className="bg-off-white rounded-2xl p-12 border border-light-mint"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <Mail className="w-8 h-8 text-brand-teal mb-4" />
            <h2 className="heading-subsection text-brand-navy mb-4">Press Contact</h2>
            <p className="body-large text-text-secondary mb-6">
              For media inquiries, interview requests, or additional assets, reach out to our communications team. We typically respond within 24 hours.
            </p>
            <a
              href="mailto:press@barpel.ai"
              className="inline-flex items-center gap-2 text-brand-teal font-semibold hover:underline"
            >
              press@barpel.ai
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 border border-slate-100">
              <div className="text-sm font-semibold text-brand-navy">Media Inquiries</div>
              <div className="text-sm text-brand-teal">press@barpel.ai</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-slate-100">
              <div className="text-sm font-semibold text-brand-navy">Partnership Inquiries</div>
              <div className="text-sm text-brand-teal">partners@barpel.ai</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-slate-100">
              <div className="text-sm font-semibold text-brand-navy">General Inquiries</div>
              <div className="text-sm text-brand-teal">hello@barpel.ai</div>
            </div>
          </div>
        </div>
      </m.div>
    </ContentPageLayout>
  );
}
