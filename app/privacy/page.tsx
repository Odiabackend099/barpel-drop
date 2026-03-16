"use client";

import Link from 'next/link';
import { Phone, ArrowLeft } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-off-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-light-mint sticky top-0 z-50">
        <div className="container-default py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-brand-teal flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-brand-navy font-display">
              Barpel
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-brand-navy hover:text-brand-teal transition-colors duration-150 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12">
        <div className="container-default max-w-4xl">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-teal-sm border border-light-mint">
            <div className="mb-8">
              <h1 className="heading-section text-brand-navy mb-4">
                Privacy Policy
              </h1>
              <p className="text-text-secondary">
                Last updated: March 16, 2026
              </p>
            </div>

            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">1. Introduction</h2>
                <p className="text-text-secondary mb-4">
                  Barpel AI (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered voice support platform for e-commerce (the &quot;Service&quot;).
                </p>
                <p className="text-text-secondary">
                  By using our Service, you consent to the collection and use of information in accordance with this Privacy Policy. If you do not agree with this policy, please do not use our Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">2. Information We Collect</h2>
                <h3 className="font-semibold text-brand-navy mb-2">2.1 Personal Information</h3>
                <p className="text-text-secondary mb-4">
                  We may collect personal information that you voluntarily provide to us when you:
                </p>
                <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
                  <li>Register for an account</li>
                  <li>Connect your e-commerce store</li>
                  <li>Contact our support team</li>
                  <li>Subscribe to our communications</li>
                </ul>
                <p className="text-text-secondary mb-4">
                  This information may include your name, email address, phone number, business information, and payment details.
                </p>

                <h3 className="font-semibold text-brand-navy mb-2">2.2 Call Data</h3>
                <p className="text-text-secondary mb-4">
                  As part of providing our AI voice support service, we collect and process:
                </p>
                <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
                  <li>Call recordings and transcripts</li>
                  <li>Customer phone numbers</li>
                  <li>Order information accessed during calls</li>
                  <li>Call metadata (duration, time, outcome)</li>
                </ul>

                <h3 className="font-semibold text-brand-navy mb-2">2.3 Automatically Collected Information</h3>
                <p className="text-text-secondary">
                  We automatically collect certain information when you visit our website or use our Service, including IP addresses, browser type, device information, and usage patterns through cookies and similar technologies.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">3. How We Use Your Information</h2>
                <p className="text-text-secondary mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2">
                  <li>Provide, maintain, and improve our Service</li>
                  <li>Process and complete transactions</li>
                  <li>Train and improve our AI models</li>
                  <li>Send you technical notices, updates, and support messages</li>
                  <li>Respond to your comments and questions</li>
                  <li>Monitor and analyze usage patterns and trends</li>
                  <li>Detect, investigate, and prevent fraudulent transactions and unauthorized access</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">4. Information Sharing</h2>
                <p className="text-text-secondary mb-4">
                  We do not sell or rent your personal information to third parties. We may share your information with:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2">
                  <li><strong>Service Providers:</strong> Third-party vendors who help us operate our business (e.g., cloud hosting, payment processing, analytics)</li>
                  <li><strong>Integration Partners:</strong> E-commerce platforms you choose to connect (e.g., Shopify, WooCommerce)</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                  <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">5. Data Security</h2>
                <p className="text-text-secondary">
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include encryption, access controls, and regular security assessments. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">6. Your Rights</h2>
                <p className="text-text-secondary mb-4">
                  Depending on your location, you may have the following rights regarding your personal information:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2">
                  <li><strong>Access:</strong> Request a copy of your personal information</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                  <li><strong>Restriction:</strong> Request restriction of processing</li>
                  <li><strong>Portability:</strong> Request transfer of your information</li>
                  <li><strong>Objection:</strong> Object to certain types of processing</li>
                </ul>
                <p className="text-text-secondary mt-4">
                  To exercise these rights, please contact us at privacy@barpel.ai.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">7. Data Retention</h2>
                <p className="text-text-secondary">
                  We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. Call recordings are typically retained for 90 days, after which they are automatically deleted unless you request longer retention.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">8. International Data Transfers</h2>
                <p className="text-text-secondary">
                  Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. We ensure appropriate safeguards are in place to protect your information when transferred internationally.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">9. Children&apos;s Privacy</h2>
                <p className="text-text-secondary">
                  Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected personal information from a child, we will take steps to delete that information.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">10. Changes to This Policy</h2>
                <p className="text-text-secondary">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &quot;Last updated&quot; date. You are advised to review this Privacy Policy periodically for any changes.
                </p>
              </section>

              <section>
                <h2 className="heading-card text-brand-navy mb-4">11. Contact Us</h2>
                <p className="text-text-secondary">
                  If you have any questions about this Privacy Policy, please contact us at:
                </p>
                <p className="text-text-secondary mt-2">
                  <strong>Email:</strong> privacy@barpel.ai<br />
                  <strong>Address:</strong> Barpel AI Inc., 123 Innovation Drive, San Francisco, CA 94105
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-light-mint py-8">
        <div className="container-default">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-text-secondary">
              © 2026 Barpel AI. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-sm text-brand-teal font-medium">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-text-secondary hover:text-brand-teal">
                Terms of Service
              </Link>
              <Link href="/data-processing" className="text-sm text-text-secondary hover:text-brand-teal">
                Data Processing
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
