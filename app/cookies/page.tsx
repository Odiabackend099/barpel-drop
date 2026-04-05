"use client";

import ContentPageLayout from '@/components/marketing/ContentPageLayout';
import { m } from 'framer-motion';
import {
  Cookie,
  Shield,
  BarChart3,
  Settings,
  Globe,
  Clock,
  Mail,
  AlertCircle,
  Lock,
  Eye,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const essentialCookies = [
  {
    name: 'session_id',
    purpose: 'Maintains your login session so you stay authenticated as you navigate the platform.',
    retention: 'Session (cleared when browser closes)',
  },
  {
    name: 'auth_token',
    purpose: 'Securely authenticates your identity with our backend services via Supabase.',
    retention: '7 days',
  },
  {
    name: 'csrf_token',
    purpose: 'Prevents cross-site request forgery attacks by validating that form submissions originate from Barpel.',
    retention: 'Session',
  },
  {
    name: 'cookie_consent',
    purpose: 'Remembers your cookie preferences so we don&apos;t ask you repeatedly.',
    retention: '12 months',
  },
];

const analyticsCookies = [
  {
    name: 'ph_*',
    purpose: 'PostHog analytics cookies that help us understand how visitors interact with the platform, including page views, feature usage, and navigation patterns.',
    retention: '12 months',
  },
  {
    name: '_barpel_usage',
    purpose: 'Tracks aggregate usage patterns to help us improve product features and user experience.',
    retention: '6 months',
  },
];

const preferenceCookies = [
  {
    name: 'locale',
    purpose: 'Stores your preferred language setting so the interface displays in the correct language.',
    retention: '12 months',
  },
  {
    name: 'theme',
    purpose: 'Remembers your theme preference (light or dark mode) across sessions.',
    retention: '12 months',
  },
  {
    name: 'sidebar_state',
    purpose: 'Remembers whether you prefer the dashboard sidebar expanded or collapsed.',
    retention: '6 months',
  },
];

const thirdPartyCookies = [
  {
    provider: 'Supabase',
    purpose: 'Authentication and session management. Supabase powers our user authentication system and sets cookies to maintain secure login sessions.',
    link: 'https://supabase.com/privacy',
  },
  {
    provider: 'PostHog',
    purpose: 'Product analytics and usage tracking. PostHog helps us understand how users interact with Barpel so we can improve the product. All data is anonymized.',
    link: 'https://posthog.com/privacy',
  },
];

const browserInstructions = [
  {
    browser: 'Google Chrome',
    steps: 'Settings > Privacy and Security > Cookies and other site data > Manage cookies and site data',
  },
  {
    browser: 'Mozilla Firefox',
    steps: 'Settings > Privacy & Security > Cookies and Site Data > Manage Data',
  },
  {
    browser: 'Apple Safari',
    steps: 'Preferences > Privacy > Manage Website Data',
  },
  {
    browser: 'Microsoft Edge',
    steps: 'Settings > Cookies and site permissions > Manage and delete cookies and site data',
  },
];

export default function CookiePolicyPage() {
  return (
    <ContentPageLayout
      title="Cookie Policy"
      subtitle="How Barpel uses cookies and similar technologies to provide, protect, and improve our services."
      showCTA={false}
    >
      {/* Introduction */}
      <m.div {...fadeInUp} className="mb-12">
        <div className="flex items-start gap-4 mb-6">
          <Cookie className="w-8 h-8 text-teal-500 flex-shrink-0 mt-1" />
          <div>
            <h2 className="heading-section text-brand-navy mb-4">What Are Cookies?</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Cookies are small text files that are stored on your device (computer, tablet, or mobile
              phone) when you visit a website. They are widely used to make websites work more efficiently,
              provide a better user experience, and give website owners useful information about how their
              site is being used.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Barpel uses cookies and similar tracking technologies to keep you signed in, remember your
              preferences, understand how you use our platform, and improve our services. This policy
              explains which cookies we use, why we use them, and how you can manage your cookie preferences.
            </p>
          </div>
        </div>
      </m.div>

      {/* Essential Cookies */}
      <m.div {...fadeInUp} className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-teal-500" />
          <h2 className="heading-section text-brand-navy">Essential Cookies</h2>
        </div>
        <p className="text-slate-600 leading-relaxed mb-6">
          These cookies are strictly necessary for the platform to function. They enable core features
          like authentication, security, and session management. Essential cookies cannot be disabled
          as the platform would not work properly without them.
        </p>
        <div className="space-y-4">
          {essentialCookies.map((cookie, index) => (
            <m.div
              key={cookie.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-slate-50 rounded-xl p-5 border border-slate-100"
            >
              <div className="flex items-center justify-between mb-2">
                <code className="text-sm font-semibold text-brand-navy bg-white px-2 py-0.5 rounded border border-slate-200">
                  {cookie.name}
                </code>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-500">{cookie.retention}</span>
                </div>
              </div>
              <p className="text-sm text-slate-600">{cookie.purpose}</p>
            </m.div>
          ))}
        </div>
      </m.div>

      {/* Analytics Cookies */}
      <m.div {...fadeInUp} className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-6 h-6 text-teal-500" />
          <h2 className="heading-section text-brand-navy">Analytics Cookies</h2>
        </div>
        <p className="text-slate-600 leading-relaxed mb-6">
          Analytics cookies help us understand how visitors interact with Barpel. They collect information
          about page views, feature usage, and navigation patterns. All analytics data is aggregated and
          anonymized — we do not use analytics cookies to personally identify individual users.
        </p>
        <div className="space-y-4">
          {analyticsCookies.map((cookie, index) => (
            <m.div
              key={cookie.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-teal-50/50 rounded-xl p-5 border border-teal-100"
            >
              <div className="flex items-center justify-between mb-2">
                <code className="text-sm font-semibold text-brand-navy bg-white px-2 py-0.5 rounded border border-teal-200">
                  {cookie.name}
                </code>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-500">{cookie.retention}</span>
                </div>
              </div>
              <p className="text-sm text-slate-600">{cookie.purpose}</p>
            </m.div>
          ))}
        </div>
      </m.div>

      {/* Preference Cookies */}
      <m.div {...fadeInUp} className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-teal-500" />
          <h2 className="heading-section text-brand-navy">Preference Cookies</h2>
        </div>
        <p className="text-slate-600 leading-relaxed mb-6">
          Preference cookies allow the platform to remember choices you make, such as your language
          setting or theme preference. They provide a more personalized experience by ensuring your
          settings persist across sessions.
        </p>
        <div className="space-y-4">
          {preferenceCookies.map((cookie, index) => (
            <m.div
              key={cookie.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-amber-50/50 rounded-xl p-5 border border-amber-100"
            >
              <div className="flex items-center justify-between mb-2">
                <code className="text-sm font-semibold text-brand-navy bg-white px-2 py-0.5 rounded border border-amber-200">
                  {cookie.name}
                </code>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-500">{cookie.retention}</span>
                </div>
              </div>
              <p className="text-sm text-slate-600">{cookie.purpose}</p>
            </m.div>
          ))}
        </div>
      </m.div>

      {/* Third-Party Cookies */}
      <m.div {...fadeInUp} className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="w-6 h-6 text-teal-500" />
          <h2 className="heading-section text-brand-navy">Third-Party Cookies</h2>
        </div>
        <p className="text-slate-600 leading-relaxed mb-6">
          Some cookies on Barpel are set by third-party services that we use to provide authentication
          and analytics functionality. These providers have their own privacy policies governing how
          they use the data they collect.
        </p>
        <div className="space-y-4">
          {thirdPartyCookies.map((item, index) => (
            <m.div
              key={item.provider}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white rounded-xl p-6 border border-slate-200"
            >
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4 text-teal-500" />
                <h3 className="text-sm font-semibold text-brand-navy">{item.provider}</h3>
              </div>
              <p className="text-sm text-slate-600 mb-3">{item.purpose}</p>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-teal-600 hover:text-teal-700 underline"
              >
                View {item.provider}&apos;s Privacy Policy
              </a>
            </m.div>
          ))}
        </div>
      </m.div>

      {/* Managing Cookies */}
      <m.div {...fadeInUp} className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Eye className="w-6 h-6 text-teal-500" />
          <h2 className="heading-section text-brand-navy">How to Manage Cookies</h2>
        </div>
        <p className="text-slate-600 leading-relaxed mb-4">
          Most web browsers allow you to control cookies through their settings. You can typically
          choose to block all cookies, accept all cookies, or be notified when a cookie is set so
          you can decide whether to accept it.
        </p>
        <p className="text-slate-600 leading-relaxed mb-6">
          Please note that disabling essential cookies may prevent you from using certain features of
          the Barpel platform, including logging in and accessing your dashboard.
        </p>
        <div className="bg-slate-50 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-brand-navy mb-4">Browser-Specific Instructions</h3>
          <div className="space-y-4">
            {browserInstructions.map((item, index) => (
              <m.div
                key={item.browser}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-start gap-3 py-2 border-b border-slate-200 last:border-0"
              >
                <div className="w-6 h-6 bg-teal-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                  {index + 1}
                </div>
                <div>
                  <div className="text-sm font-semibold text-brand-navy">{item.browser}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{item.steps}</div>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </m.div>

      {/* Cookie Retention */}
      <m.div {...fadeInUp} className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-6 h-6 text-teal-500" />
          <h2 className="heading-section text-brand-navy">Cookie Retention Periods</h2>
        </div>
        <p className="text-slate-600 leading-relaxed mb-6">
          Different cookies are retained for different periods depending on their purpose. Session
          cookies are automatically deleted when you close your browser. Persistent cookies remain
          on your device for a set period or until you manually delete them.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-4 bg-slate-50 rounded-tl-xl text-sm font-semibold text-slate-700">Category</th>
                <th className="text-left p-4 bg-slate-50 text-sm font-semibold text-slate-700">Retention</th>
                <th className="text-left p-4 bg-slate-50 rounded-tr-xl text-sm font-semibold text-slate-700">Can Be Disabled?</th>
              </tr>
            </thead>
            <tbody>
              {[
                { category: 'Essential', retention: 'Session to 12 months', disabled: 'No' },
                { category: 'Analytics', retention: '6 to 12 months', disabled: 'Yes' },
                { category: 'Preferences', retention: '6 to 12 months', disabled: 'Yes' },
                { category: 'Third-Party', retention: 'Varies by provider', disabled: 'Yes' },
              ].map((item, index) => (
                <m.tr
                  key={item.category}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border-b border-slate-100"
                >
                  <td className="p-4 text-sm font-medium text-slate-900">{item.category}</td>
                  <td className="p-4 text-sm text-slate-600">{item.retention}</td>
                  <td className="p-4 text-sm text-slate-600">{item.disabled}</td>
                </m.tr>
              ))}
            </tbody>
          </table>
        </div>
      </m.div>

      {/* Updates to This Policy */}
      <m.div {...fadeInUp} className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <AlertCircle className="w-6 h-6 text-teal-500" />
          <h2 className="heading-section text-brand-navy">Updates to This Policy</h2>
        </div>
        <p className="text-slate-600 leading-relaxed mb-4">
          We may update this Cookie Policy from time to time to reflect changes in the cookies we use
          or for other operational, legal, or regulatory reasons. We encourage you to periodically
          review this page for the latest information on our cookie practices.
        </p>
        <p className="text-slate-600 leading-relaxed">
          If we make significant changes to this policy, we will notify you by posting a prominent
          notice on our platform or by sending you an email notification.
        </p>
      </m.div>

      {/* Contact */}
      <m.div {...fadeInUp} className="mb-8">
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <Mail className="w-6 h-6 text-teal-500 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-brand-navy mb-3">Questions About Cookies?</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                If you have any questions about our use of cookies or this Cookie Policy, please
                contact our privacy team. We are happy to provide additional information or help you
                manage your cookie preferences.
              </p>
              <a
                href="mailto:support@barpel.ai"
                className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
              >
                <Mail className="w-4 h-4" />
                support@barpel.ai
              </a>
            </div>
          </div>
        </div>
      </m.div>

      {/* Last Updated */}
      <m.div {...fadeInUp} className="text-center">
        <p className="text-xs text-slate-400">
          Last updated: March 2026
        </p>
      </m.div>
    </ContentPageLayout>
  );
}
