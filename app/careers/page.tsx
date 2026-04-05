"use client";

import { m } from 'framer-motion';
import {
  ArrowRight,
  MapPin,
  Clock,
  Briefcase,
  Heart,
  Globe,
  Zap,
  DollarSign,
  BookOpen,
  Coffee,
  Monitor,
  Plane,
  Shield,
  Users,
  Code,
  Palette,
  Headphones,
  Brain,
  Mail,
} from 'lucide-react';
import ContentPageLayout from '@/components/marketing/ContentPageLayout';

const benefits = [
  {
    icon: Globe,
    title: 'Remote-First',
    description: 'Work from anywhere in the world. We hire the best talent regardless of location.',
  },
  {
    icon: DollarSign,
    title: 'Competitive Pay',
    description: 'Top-of-market compensation with equity for every team member.',
  },
  {
    icon: Shield,
    title: 'Full Benefits',
    description: 'Comprehensive health, dental, and vision coverage for you and your family.',
  },
  {
    icon: BookOpen,
    title: 'Learning Budget',
    description: '$2,000 annual stipend for courses, conferences, books, and professional development.',
  },
  {
    icon: Monitor,
    title: 'Home Office Setup',
    description: '$1,500 equipment budget to build your ideal workspace.',
  },
  {
    icon: Plane,
    title: 'Quarterly Offsites',
    description: 'Team gatherings in great locations to collaborate, learn, and have fun together.',
  },
  {
    icon: Coffee,
    title: 'Flexible Hours',
    description: 'We care about output, not hours. Work when you are most productive.',
  },
  {
    icon: Heart,
    title: 'Unlimited PTO',
    description: 'Take the time you need to recharge. We trust you to manage your own schedule.',
  },
];

const positions = [
  {
    title: 'Senior Full-Stack Engineer',
    department: 'Engineering',
    location: 'Remote (US/EU)',
    type: 'Full-time',
    icon: Code,
    description:
      'Build and scale the Barpel platform end-to-end. You will work across our Next.js frontend, Node.js backend, and Supabase data layer to ship features that thousands of merchants rely on daily.',
    requirements: [
      '5+ years of professional software engineering experience',
      'Strong proficiency in TypeScript, React, and Node.js',
      'Experience with PostgreSQL and real-time data systems',
      'Familiarity with e-commerce platforms (Shopify, WooCommerce) is a plus',
    ],
  },
  {
    title: 'AI/ML Engineer',
    department: 'AI Research',
    location: 'Remote (Global)',
    type: 'Full-time',
    icon: Brain,
    description:
      'Push the boundaries of conversational AI for commerce. You will fine-tune language models, improve voice quality, and build the intelligence that makes Barpel sound human on every call.',
    requirements: [
      '3+ years in ML/NLP with production model deployment experience',
      'Hands-on experience with transformer models and speech synthesis',
      'Strong Python skills and familiarity with PyTorch or TensorFlow',
      'Published research or contributions to open-source AI projects is a plus',
    ],
  },
  {
    title: 'Customer Success Manager',
    department: 'Customer Success',
    location: 'Remote (US)',
    type: 'Full-time',
    icon: Headphones,
    description:
      'Be the trusted advisor for our highest-value merchants. You will onboard new customers, drive adoption, reduce churn, and gather the feedback that shapes our product roadmap.',
    requirements: [
      '3+ years in customer success or account management at a SaaS company',
      'Experience working with e-commerce merchants or similar SMB customers',
      'Strong communication skills and comfort with technical concepts',
      'Data-driven mindset with experience using CRM and analytics tools',
    ],
  },
  {
    title: 'Product Designer',
    department: 'Design',
    location: 'Remote (US/EU)',
    type: 'Full-time',
    icon: Palette,
    description:
      'Design the experiences that make Barpel feel magical. From the merchant dashboard to the onboarding wizard, you will craft interfaces that are intuitive, beautiful, and built for speed.',
    requirements: [
      '4+ years of product design experience with a strong portfolio',
      'Expert-level Figma skills and experience with design systems',
      'Experience designing for SaaS or developer-focused products',
      'Ability to conduct user research and translate insights into designs',
    ],
  },
];

export default function CareersPage() {
  return (
    <ContentPageLayout
      title="Careers"
      subtitle="Join the future of AI customer support. Help us build the platform that transforms how e-commerce brands serve their customers."
    >
      {/* Why Barpel */}
      <m.div
        className="mb-24"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">
            Why <span className="text-brand-teal">Barpel</span>?
          </h2>
          <p className="body-large text-text-secondary max-w-2xl mx-auto">
            We are a small team tackling a massive opportunity. E-commerce customer support is a $350B industry ripe for AI disruption, and we are leading the charge.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <m.div
            className="card-feature text-center p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Zap className="w-8 h-8 text-brand-teal mx-auto mb-4" />
            <h3 className="heading-card text-brand-navy mb-2">High Impact</h3>
            <p className="text-sm text-text-secondary">
              Every feature you ship reaches hundreds of merchants and millions of their customers. Your work directly drives revenue and customer satisfaction.
            </p>
          </m.div>
          <m.div
            className="card-feature text-center p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <Users className="w-8 h-8 text-brand-teal mx-auto mb-4" />
            <h3 className="heading-card text-brand-navy mb-2">Small Team, Big Ownership</h3>
            <p className="text-sm text-text-secondary">
              At 30 people, everyone owns a meaningful piece of the product. No bureaucracy, no waiting for approval. Ship fast, learn fast.
            </p>
          </m.div>
          <m.div
            className="card-feature text-center p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Brain className="w-8 h-8 text-brand-teal mx-auto mb-4" />
            <h3 className="heading-card text-brand-navy mb-2">Cutting-Edge AI</h3>
            <p className="text-sm text-text-secondary">
              Work with the latest in voice AI, large language models, and real-time speech synthesis. This is applied AI at its most exciting.
            </p>
          </m.div>
        </div>
      </m.div>

      {/* Benefits */}
      <m.div
        className="mb-24"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">
            Benefits & <span className="text-brand-teal">Perks</span>
          </h2>
          <p className="body-large text-text-secondary max-w-2xl mx-auto">
            We take care of our team so they can focus on building amazing products
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {benefits.map((benefit, index) => (
            <m.div
              key={benefit.title}
              className="bg-off-white rounded-xl p-5 border border-light-mint"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <benefit.icon className="w-6 h-6 text-brand-teal mb-3" />
              <h3 className="text-sm font-semibold text-brand-navy mb-1">{benefit.title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{benefit.description}</p>
            </m.div>
          ))}
        </div>
      </m.div>

      {/* Open Positions */}
      <m.div
        className="mb-24"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">
            Open <span className="text-brand-teal">Positions</span>
          </h2>
          <p className="body-large text-text-secondary max-w-2xl mx-auto">
            We are looking for talented people to join our mission. All positions are remote-friendly.
          </p>
        </div>

        <div className="space-y-6">
          {positions.map((position, index) => (
            <m.div
              key={position.title}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                      <position.icon className="w-6 h-6 text-brand-teal" />
                    </div>
                    <div>
                      <h3 className="heading-card text-brand-navy mb-1">{position.title}</h3>
                      <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {position.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {position.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {position.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <a
                    href={`mailto:careers@barpel.ai?subject=Application: ${position.title}`}
                    className="btn-primary flex-shrink-0"
                  >
                    Apply Now
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>

                <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                  {position.description}
                </p>

                <div>
                  <div className="text-xs font-semibold text-brand-navy uppercase tracking-wider mb-2">
                    What we are looking for
                  </div>
                  <ul className="space-y-2">
                    {position.requirements.map((req, reqIndex) => (
                      <li key={reqIndex} className="flex items-start gap-2 text-sm text-text-secondary">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-teal flex-shrink-0 mt-2" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </m.div>
          ))}
        </div>
      </m.div>

      {/* Don't See Your Role */}
      <m.div
        className="bg-off-white rounded-2xl p-12 text-center border border-light-mint"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <Mail className="w-10 h-10 text-brand-teal mx-auto mb-4" />
        <h2 className="heading-subsection text-brand-navy mb-4">
          Don&apos;t see your role?
        </h2>
        <p className="body-large text-text-secondary mb-8 max-w-xl mx-auto">
          We are always looking for exceptional people. Send us your resume and tell us how you would contribute to Barpel. We review every application personally.
        </p>
        <a
          href="mailto:careers@barpel.ai?subject=General Application"
          className="btn-primary"
        >
          Send your resume
          <ArrowRight className="w-4 h-4" />
        </a>
        <p className="text-xs text-text-secondary mt-4">
          Email us at{' '}
          <a href="mailto:careers@barpel.ai" className="text-brand-teal hover:underline">
            careers@barpel.ai
          </a>
        </p>
      </m.div>
    </ContentPageLayout>
  );
}
