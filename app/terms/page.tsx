"use client";

import Link from 'next/link';
import { Phone, ArrowLeft } from 'lucide-react';

export default function Terms() {
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
                Terms of Service
              </h1>
              <p className="text-text-secondary">
                Last updated: March 16, 2026
              </p>
            </div>

            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">1. Acceptance of Terms</h2>
                <p className="text-text-secondary mb-4">
                  By accessing or using the Barpel AI voice support platform (the &quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not access or use the Service.
                </p>
                <p className="text-text-secondary">
                  These Terms constitute a legally binding agreement between you and Barpel AI Inc. (&quot;Barpel,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) regarding your use of the Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">2. Description of Service</h2>
                <p className="text-text-secondary mb-4">
                  Barpel provides an AI-powered voice support platform designed for e-commerce businesses. Our Service includes:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2">
                  <li>Automated voice call handling for customer inquiries</li>
                  <li>Order tracking and status updates</li>
                  <li>Returns and exchange processing</li>
                  <li>Abandoned cart recovery calls</li>
                  <li>Product information lookup</li>
                  <li>Integration with e-commerce platforms</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">3. User Accounts</h2>
                <h3 className="font-semibold text-brand-navy mb-2">3.1 Registration</h3>
                <p className="text-text-secondary mb-4">
                  To use the Service, you must create an account. You agree to provide accurate, current, and complete information during registration and to keep your account information updated.
                </p>

                <h3 className="font-semibold text-brand-navy mb-2">3.2 Account Security</h3>
                <p className="text-text-secondary mb-4">
                  You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
                </p>

                <h3 className="font-semibold text-brand-navy mb-2">3.3 Account Termination</h3>
                <p className="text-text-secondary">
                  We reserve the right to suspend or terminate your account at any time for any reason, including violation of these Terms. Upon termination, your right to use the Service will immediately cease.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">4. Payment Terms</h2>
                <h3 className="font-semibold text-brand-navy mb-2">4.1 Subscription Plans</h3>
                <p className="text-text-secondary mb-4">
                  The Service is offered on a subscription basis. You agree to pay all fees associated with your selected plan. Fees are non-refundable except as required by law or as explicitly stated in these Terms.
                </p>

                <h3 className="font-semibold text-brand-navy mb-2">4.2 Billing</h3>
                <p className="text-text-secondary mb-4">
                  You will be billed in advance on a recurring basis according to your selected billing cycle (monthly or annually). All fees are exclusive of taxes, which you are responsible for paying.
                </p>

                <h3 className="font-semibold text-brand-navy mb-2">4.3 Changes to Pricing</h3>
                <p className="text-text-secondary">
                  We may change our pricing at any time. We will provide notice of any price changes at least 30 days before they take effect. Your continued use of the Service after the price change constitutes acceptance of the new pricing.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">5. Acceptable Use</h2>
                <p className="text-text-secondary mb-4">
                  You agree not to use the Service to:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe upon the rights of others</li>
                  <li>Transmit any harmful, fraudulent, or illegal content</li>
                  <li>Interfere with or disrupt the Service or servers</li>
                  <li>Attempt to gain unauthorized access to any part of the Service</li>
                  <li>Use the Service for any purpose other than its intended use</li>
                  <li>Make calls to numbers on do-not-call lists without proper consent</li>
                  <li>Harass, abuse, or spam individuals</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">6. Intellectual Property</h2>
                <h3 className="font-semibold text-brand-navy mb-2">6.1 Our Intellectual Property</h3>
                <p className="text-text-secondary mb-4">
                  The Service and its original content, features, and functionality are owned by Barpel and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                </p>

                <h3 className="font-semibold text-brand-navy mb-2">6.2 License to You</h3>
                <p className="text-text-secondary">
                  Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your business purposes.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">7. Data and Privacy</h2>
                <p className="text-text-secondary">
                  Your use of the Service is also governed by our Privacy Policy, which is incorporated by reference into these Terms. By using the Service, you consent to the collection and use of information as described in the Privacy Policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">8. Third-Party Integrations</h2>
                <p className="text-text-secondary">
                  The Service may integrate with third-party services (e.g., Shopify, WooCommerce). Your use of such integrations is subject to the terms and policies of those third parties. We are not responsible for the availability or performance of third-party services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">9. Disclaimer of Warranties</h2>
                <p className="text-text-secondary">
                  THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">10. Limitation of Liability</h2>
                <p className="text-text-secondary">
                  TO THE FULLEST EXTENT PERMITTED BY LAW, BARPEL SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">11. Indemnification</h2>
                <p className="text-text-secondary">
                  You agree to indemnify, defend, and hold harmless Barpel and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys&apos; fees) arising out of or related to your use of the Service or violation of these Terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">12. Governing Law</h2>
                <p className="text-text-secondary">
                  These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be resolved exclusively in the state or federal courts located in San Francisco, California.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">13. Changes to Terms</h2>
                <p className="text-text-secondary">
                  We may modify these Terms at any time. We will provide notice of significant changes by posting the updated Terms on our website and updating the &quot;Last updated&quot; date. Your continued use of the Service after such changes constitutes acceptance of the revised Terms.
                </p>
              </section>

              <section>
                <h2 className="heading-card text-brand-navy mb-4">14. Contact Us</h2>
                <p className="text-text-secondary">
                  If you have any questions about these Terms, please contact us at:
                </p>
                <p className="text-text-secondary mt-2">
                  <strong>Email:</strong> legal@barpel.ai<br />
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
              <Link href="/privacy" className="text-sm text-text-secondary hover:text-brand-teal">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-brand-teal font-medium">
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
