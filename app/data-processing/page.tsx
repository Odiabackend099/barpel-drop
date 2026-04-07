import type { Metadata } from 'next';
import Link from 'next/link';
import { Phone, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Data Processing Addendum | Barpel AI',
};

export default function DataProcessing() {
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
                Data Processing Addendum
              </h1>
              <p className="text-text-secondary">
                Last updated: March 16, 2026
              </p>
            </div>

            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">1. Introduction</h2>
                <p className="text-text-secondary mb-4">
                  This Data Processing Addendum (&quot;DPA&quot;) forms part of the Terms of Service between Barpel AI (&quot;Processor&quot;) and the customer (&quot;Controller&quot;) and sets out the terms for processing personal data in accordance with applicable data protection laws, including the General Data Protection Regulation (GDPR).
                </p>
                <p className="text-text-secondary">
                  This DPA applies when Barpel processes personal data on behalf of the Controller in the course of providing the AI voice support platform services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">2. Definitions</h2>
                <p className="text-text-secondary mb-4">
                  For the purposes of this DPA:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2">
                  <li><strong>&quot;Personal Data&quot;</strong> means any information relating to an identified or identifiable natural person processed by Barpel on behalf of the Controller.</li>
                  <li><strong>&quot;Data Subject&quot;</strong> means the identified or identifiable natural person to whom Personal Data relates.</li>
                  <li><strong>&quot;Processing&quot;</strong> means any operation performed on Personal Data, including collection, storage, use, disclosure, or deletion.</li>
                  <li><strong>&quot;Subprocessor&quot;</strong> means any third-party processor engaged by Barpel to assist in providing the Service.</li>
                  <li><strong>&quot;Security Incident&quot;</strong> means any unauthorized access, disclosure, or breach of Personal Data.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">3. Data Processing</h2>
                <h3 className="font-semibold text-brand-navy mb-2">3.1 Scope and Purpose</h3>
                <p className="text-text-secondary mb-4">
                  Barpel will process Personal Data only for the purpose of providing the AI voice support services as described in the Terms of Service and in accordance with the Controller&apos;s documented instructions.
                </p>

                <h3 className="font-semibold text-brand-navy mb-2">3.2 Categories of Data</h3>
                <p className="text-text-secondary mb-4">
                  The Personal Data processed may include:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2">
                  <li>Customer contact information (name, phone number, email)</li>
                  <li>Order and transaction data</li>
                  <li>Call recordings and transcripts</li>
                  <li>Customer service interaction history</li>
                  <li>Account and billing information</li>
                </ul>

                <h3 className="font-semibold text-brand-navy mb-2">3.3 Data Subject Categories</h3>
                <p className="text-text-secondary">
                  The Personal Data relates to the Controller&apos;s customers, potential customers, and end-users who interact with the AI voice support system.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">4. Subprocessors</h2>
                <p className="text-text-secondary mb-4">
                  The Controller authorizes Barpel to engage Subprocessors to assist in providing the Service. Barpel maintains a current list of Subprocessors at <a href="/privacy" className="text-brand-teal hover:underline">barpel.ai/subprocessors</a>.
                </p>
                <p className="text-text-secondary mb-4">
                  Barpel will:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2">
                  <li>Enter into written agreements with Subprocessors that include data protection obligations substantially similar to those in this DPA</li>
                  <li>Remain liable for any breaches caused by Subprocessors</li>
                  <li>Notify the Controller of any intended changes to Subprocessors at least 30 days in advance</li>
                  <li>Provide the Controller the opportunity to object to new Subprocessors</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">5. Security Measures</h2>
                <p className="text-text-secondary mb-4">
                  Barpel implements appropriate technical and organizational measures to protect Personal Data, including:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2">
                  <li><strong>Encryption:</strong> All data in transit is encrypted using TLS 1.3. Data at rest is encrypted using AES-256.</li>
                  <li><strong>Access Controls:</strong> Role-based access controls and multi-factor authentication for all systems.</li>
                  <li><strong>Network Security:</strong> Firewalls, intrusion detection, and DDoS protection.</li>
                  <li><strong>Monitoring:</strong> Continuous security monitoring and logging.</li>
                  <li><strong>Backups:</strong> Regular encrypted backups with tested recovery procedures.</li>
                  <li><strong>Employee Training:</strong> Regular security awareness training for all personnel.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">6. Data Subject Rights</h2>
                <p className="text-text-secondary mb-4">
                  Barpel will assist the Controller in responding to Data Subject requests to exercise their rights under applicable data protection laws, including:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2">
                  <li>Right of access</li>
                  <li>Right to rectification</li>
                  <li>Right to erasure (&quot;right to be forgotten&quot;)</li>
                  <li>Right to restriction of processing</li>
                  <li>Right to data portability</li>
                  <li>Right to object</li>
                </ul>
                <p className="text-text-secondary mt-4">
                  Barpel will notify the Controller promptly upon receiving any such request and will not respond directly to the Data Subject unless authorized by the Controller.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">7. Security Incidents</h2>
                <p className="text-text-secondary mb-4">
                  In the event of a Security Incident, Barpel will:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2">
                  <li>Notify the Controller without undue delay and no later than 24 hours after becoming aware of the incident</li>
                  <li>Provide details about the nature of the incident, affected data, and likely consequences</li>
                  <li>Take immediate steps to contain and remediate the incident</li>
                  <li>Cooperate with the Controller in any required notifications to supervisory authorities or Data Subjects</li>
                  <li>Document the incident and response actions taken</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">8. Data Transfers</h2>
                <p className="text-text-secondary mb-4">
                  Personal Data may be transferred to and processed in countries outside the European Economic Area (EEA). When such transfers occur, Barpel ensures appropriate safeguards are in place, including:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2">
                  <li>Standard Contractual Clauses approved by the European Commission</li>
                  <li>Adequacy decisions by the European Commission</li>
                  <li>Binding Corporate Rules (where applicable)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">9. Data Retention and Deletion</h2>
                <p className="text-text-secondary mb-4">
                  Barpel will retain Personal Data only for as long as necessary to provide the Service or as required by law. Upon termination of the agreement or upon the Controller&apos;s request, Barpel will:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-2">
                  <li>Delete all Personal Data within 30 days, except where retention is required by law</li>
                  <li>Provide written confirmation of deletion upon request</li>
                  <li>Ensure Subprocessors also delete all Personal Data</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">10. Audit Rights</h2>
                <p className="text-text-secondary">
                  The Controller has the right to audit Barpel&apos;s compliance with this DPA. Audits may be conducted annually or following a Security Incident. Barpel will cooperate with such audits and provide access to relevant documentation. Any third-party audits must be conducted at the Controller&apos;s expense and with reasonable advance notice.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="heading-card text-brand-navy mb-4">11. Term and Termination</h2>
                <p className="text-text-secondary">
                  This DPA remains in effect for the duration of the Terms of Service. Upon termination, Barpel&apos;s obligations regarding data protection and security will continue for as long as Barpel retains any Personal Data.
                </p>
              </section>

              <section>
                <h2 className="heading-card text-brand-navy mb-4">12. Contact Information</h2>
                <p className="text-text-secondary">
                  For any questions regarding this Data Processing Addendum, please contact:
                </p>
                <p className="text-text-secondary mt-2">
                  <strong>Data Protection Officer</strong><br />
                  <strong>Email:</strong> support@barpel.ai<br />
                  <strong>Address:</strong> Barpel AI, 26 Romford Street, Suncity, Abuja, Nigeria
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
              <Link href="/terms" className="text-sm text-text-secondary hover:text-brand-teal">
                Terms of Service
              </Link>
              <Link href="/data-processing" className="text-sm text-brand-teal font-medium">
                Data Processing
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
