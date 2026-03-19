"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  MessageSquare,
  Twitter,
  Linkedin,
  Github,
  Youtube,
  ArrowRight,
} from 'lucide-react';
import ContentPageLayout from '@/components/marketing/ContentPageLayout';

const interestOptions = [
  'Getting started with Barpel',
  'Enterprise pricing',
  'Partnership opportunities',
  'Technical integration help',
  'Press and media inquiries',
  'Other',
];

const contactInfo = [
  {
    icon: Mail,
    label: 'Email',
    value: 'support@barpel.ai',
    href: 'mailto:support@barpel.ai',
    description: 'For general inquiries and support',
  },
  {
    icon: Clock,
    label: 'Response Time',
    value: 'Within a few hours',
    href: '#',
    description: 'On business days (Mon–Fri)',
  },
  {
    icon: MapPin,
    label: 'Office',
    value: '548 Market Street, Suite 300',
    href: '#map',
    description: 'San Francisco, CA 94104',
  },
  {
    icon: Clock,
    label: 'Business Hours',
    value: 'Mon-Fri, 9:00 AM - 6:00 PM PT',
    href: '#',
    description: 'Response within 24 hours',
  },
];

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com/barpelai', label: 'Twitter' },
  { icon: Linkedin, href: 'https://linkedin.com/company/barpel', label: 'LinkedIn' },
  { icon: Github, href: 'https://github.com/barpel', label: 'GitHub' },
  { icon: Youtube, href: 'https://youtube.com/barpel', label: 'YouTube' },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    interest: '',
    message: '',
  });
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          honeypot,
          source_url: window.location.href,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? 'Submission failed. Please try again.');
      }

      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ContentPageLayout
      title="Contact Us"
      subtitle="Have a question or want to learn more? We would love to hear from you."
      showCTA={false}
    >
      <div className="grid lg:grid-cols-5 gap-12">
        {/* Contact Form - Left Side */}
        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {isSubmitted ? (
            <motion.div
              className="bg-teal-50 rounded-2xl p-12 text-center border border-teal-100"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-16 h-16 rounded-full bg-brand-teal flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="heading-subsection text-brand-navy mb-4">Message Sent!</h2>
              <p className="body-large text-text-secondary mb-8 max-w-md mx-auto">
                Thank you for reaching out. Our team will get back to you within 24 hours. In the meantime, feel free to explore our documentation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/features" className="btn-primary">
                  Explore features
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setSubmitError('');
                    setHoneypot('');
                    setFormData({ name: '', email: '', company: '', phone: '', interest: '', message: '' });
                  }}
                  className="btn-secondary"
                >
                  Send another message
                </button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Honeypot — visually hidden, only bots fill it */}
              <div style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }} aria-hidden="true">
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-brand-navy mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Smith"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-brand-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition-all duration-200"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-brand-navy mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@company.com"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-brand-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition-all duration-200"
                  />
                </div>

                {/* Company */}
                <div>
                  <label htmlFor="company" className="block text-sm font-semibold text-brand-navy mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Acme Inc."
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-brand-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition-all duration-200"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-brand-navy mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-brand-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition-all duration-200"
                  />
                </div>
              </div>

              {/* Interest Dropdown */}
              <div>
                <label htmlFor="interest" className="block text-sm font-semibold text-brand-navy mb-2">
                  I&apos;m interested in... <span className="text-red-500">*</span>
                </label>
                <select
                  id="interest"
                  name="interest"
                  required
                  value={formData.interest}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition-all duration-200"
                >
                  <option value="">Select an option</option>
                  {interestOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-brand-navy mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us how we can help..."
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-brand-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition-all duration-200 resize-none"
                />
              </div>

              {/* Error message */}
              {submitError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                  {submitError}
                </p>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-teal text-white font-semibold rounded-lg transition-all duration-200 hover:bg-[#008F85] hover:-translate-y-0.5 hover:shadow-teal-glow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send message
                    <Send className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              <p className="text-xs text-text-secondary">
                By submitting this form, you agree to our{' '}
                <Link href="/privacy" className="text-brand-teal hover:underline">
                  Privacy Policy
                </Link>
                . We will never share your information with third parties.
              </p>
            </form>
          )}
        </motion.div>

        {/* Contact Info - Right Side */}
        <motion.div
          className="lg:col-span-2 space-y-8"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Contact Details */}
          <div className="space-y-4">
            {contactInfo.map((item, index) => (
              <motion.a
                key={item.label}
                href={item.href}
                className="flex items-start gap-4 p-4 bg-off-white rounded-xl border border-light-mint hover:shadow-teal-sm transition-all duration-200 group"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + index * 0.1, duration: 0.3 }}
              >
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-teal-sm transition-shadow">
                  <item.icon className="w-5 h-5 text-brand-teal" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-brand-navy">{item.label}</div>
                  <div className="text-sm text-brand-teal">{item.value}</div>
                  <div className="text-xs text-text-secondary mt-0.5">{item.description}</div>
                </div>
              </motion.a>
            ))}
          </div>

          {/* Map Placeholder */}
          <motion.div
            className="rounded-2xl bg-gradient-to-br from-teal-500 to-teal-400 p-8 aspect-[4/3] flex items-center justify-center relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="absolute inset-0 bg-white/5" />
            <div className="relative z-10 text-center">
              <MapPin className="w-12 h-12 text-white/80 mx-auto mb-3" />
              <div className="text-white font-semibold text-sm">San Francisco, CA</div>
              <div className="text-white/60 text-xs mt-1">548 Market Street, Suite 300</div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 border border-white/10 rounded-full" />
            <div className="absolute top-4 -left-4 w-20 h-20 border border-white/15 rounded-full" />
          </motion.div>

          {/* Social Links */}
          <div>
            <h3 className="text-sm font-semibold text-brand-navy mb-4">Follow Us</h3>
            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-off-white flex items-center justify-center text-slate-500 hover:bg-brand-teal hover:text-white transition-all duration-200 border border-light-mint"
                  aria-label={social.label}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <social.icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Help */}
          <div className="bg-off-white rounded-xl p-6 border border-light-mint">
            <MessageSquare className="w-6 h-6 text-brand-teal mb-3" />
            <h3 className="text-sm font-semibold text-brand-navy mb-2">Need quick answers?</h3>
            <p className="text-xs text-text-secondary mb-4">
              Check our FAQ for instant answers to the most common questions about pricing, setup, and features.
            </p>
            <Link
              href="/faq"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-teal hover:gap-2 transition-all duration-200"
            >
              Visit FAQ
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>
      </div>
    </ContentPageLayout>
  );
}
