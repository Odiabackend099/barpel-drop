"use client";

import { m } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  Heart,
  Lightbulb,
  Shield,
  Sparkles,
  Users,
  Target,
  Zap,
  Globe,
  Award,
  MapPin,
  Mail,
  Linkedin,
  Twitter,
} from 'lucide-react';
import ContentPageLayout from '@/components/marketing/ContentPageLayout';

const values = [
  {
    icon: Heart,
    title: 'Customer First',
    description:
      'Every decision we make starts with the customer experience. We build tools that make e-commerce support faster, friendlier, and more effective for the people who matter most: your buyers.',
    color: 'bg-pink-50',
    iconColor: 'text-pink-500',
  },
  {
    icon: Lightbulb,
    title: 'AI Innovation',
    description:
      'We push the boundaries of what voice AI can do for commerce. Our team researches, experiments, and ships new capabilities every sprint to keep Barpel at the cutting edge.',
    color: 'bg-yellow-50',
    iconColor: 'text-yellow-500',
  },
  {
    icon: Shield,
    title: 'Security & Trust',
    description:
      'Your data and your customers\u2019 data deserve the highest protection. We encrypt everything, enforce strict access controls, and maintain SOC 2 compliance across our infrastructure.',
    color: 'bg-blue-50',
    iconColor: 'text-blue-500',
  },
  {
    icon: Sparkles,
    title: 'Simplicity',
    description:
      'Complex technology should feel effortless. We design every feature, every screen, and every API to be so simple that you can set up AI voice support in under ten minutes.',
    color: 'bg-teal-50',
    iconColor: 'text-teal-500',
  },
];

const team = [
  {
    name: 'Alex Chen',
    role: 'Co-Founder & CEO',
    bio: 'Former VP of Product at a leading Shopify analytics company. Obsessed with making e-commerce support effortless.',
    avatar: 'AC',
    gradient: 'from-teal-400 to-teal-600',
  },
  {
    name: 'Sarah Mitchell',
    role: 'Co-Founder & CTO',
    bio: 'Ex-Google AI researcher with a PhD in natural language processing. Architected the Barpel voice engine from scratch.',
    avatar: 'SM',
    gradient: 'from-blue-400 to-blue-600',
  },
  {
    name: 'Marcus Johnson',
    role: 'Head of Engineering',
    bio: 'Previously led infrastructure at Twilio. Ensures every Barpel call is crystal clear and lightning fast.',
    avatar: 'MJ',
    gradient: 'from-purple-400 to-purple-600',
  },
  {
    name: 'Priya Patel',
    role: 'Head of Product',
    bio: 'Former Shopify product lead. Translates merchant feedback into features that actually move the needle.',
    avatar: 'PP',
    gradient: 'from-orange-400 to-orange-600',
  },
  {
    name: 'David Kim',
    role: 'Head of AI Research',
    bio: 'Published researcher in conversational AI. Leads the team that makes Barpel sound more human every day.',
    avatar: 'DK',
    gradient: 'from-green-400 to-green-600',
  },
  {
    name: 'Elena Rodriguez',
    role: 'Head of Customer Success',
    bio: 'Spent five years scaling support at a top DTC brand. Knows firsthand what merchants need to grow.',
    avatar: 'ER',
    gradient: 'from-pink-400 to-pink-600',
  },
];

const milestones = [
  { year: '2024', title: 'Founded', desc: 'Barpel AI is founded with the vision of AI-first customer service for e-commerce.' },
  { year: '2025', title: 'Public Launch', desc: 'Launched publicly with Shopify integration and multilingual voice support in 30+ languages.' },
  { year: '2025', title: 'Early Access', desc: 'Opened early access to merchants. Abandoned cart recovery, WISMO, and returns all live.' },
  { year: '2026', title: 'Growing', desc: 'Expanding merchant base and building toward full public availability.' },
];

export default function AboutPage() {
  return (
    <ContentPageLayout
      title="About Barpel"
      subtitle="Transforming e-commerce customer support with AI voice technology"
    >
      {/* Mission Statement */}
      <m.div
        className="text-center max-w-3xl mx-auto mb-24"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-full mb-6">
          <Target className="w-4 h-4 text-brand-teal" />
          <span className="text-sm font-semibold text-brand-teal">Our Mission</span>
        </div>
        <h2 className="heading-section text-brand-navy mb-6">
          We believe every online store deserves{' '}
          <span className="text-brand-teal">world-class customer support</span>, regardless of size or budget.
        </h2>
        <p className="body-large text-text-secondary">
          Barpel was founded on a simple observation: e-commerce merchants spend too much time and money on customer support that could be handled by AI. We are building the platform that lets any store offer instant, intelligent, 24/7 phone support without hiring a call center.
        </p>
      </m.div>

      {/* Company Story */}
      <m.div
        className="mb-24"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="heading-section text-brand-navy mb-6">Our Story</h2>
            <div className="space-y-4 text-text-secondary">
              <p className="body-large">
                Barpel started in 2024 when our founders, Alex and Sarah, saw the same problem from two different angles. Alex had spent years helping Shopify merchants grow, and kept hearing the same complaint: customer support was their biggest bottleneck. Sarah had been building conversational AI at Google and knew the technology was finally ready to handle real business conversations.
              </p>
              <p className="body-large">
                They joined forces with a clear goal: build an AI voice assistant so good that customers cannot tell the difference, and so simple that any merchant can set it up in minutes. Within months, they had a prototype handling real calls for a handful of Shopify stores. The results were immediate. Resolution rates climbed, support costs dropped, and customer satisfaction actually improved.
              </p>
              <p className="body-large">
                Today, Barpel is live and handling real customer calls for e-commerce brands in 30+ languages. We are in early access and just getting started.
              </p>
            </div>
          </div>
          <div>
            <m.div
              className="rounded-2xl bg-gradient-to-br from-teal-500 to-teal-400 p-8 aspect-square flex items-center justify-center relative overflow-hidden"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 bg-white/5" />
              <div className="relative z-10 text-center">
                <div className="text-6xl font-bold text-white mb-2">2024</div>
                <div className="text-white/80 text-lg font-medium">Founded in San Francisco</div>
                <div className="mt-6 text-white/60 text-sm">With a mission to democratize AI customer support</div>
              </div>
              <div className="absolute -bottom-8 -right-8 w-40 h-40 border border-white/10 rounded-full" />
              <div className="absolute top-8 -left-4 w-24 h-24 border border-white/15 rounded-full" />
            </m.div>
          </div>
        </div>
      </m.div>

      {/* Timeline */}
      <m.div
        className="mb-24"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="heading-section text-brand-navy mb-10 text-center">Our Journey</h2>
        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 hidden md:block" />
          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <m.div
                key={`${milestone.year}-${milestone.title}`}
                className={`flex flex-col md:flex-row items-center gap-4 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                <div className={`md:w-5/12 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                  <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                    <div className="text-xs font-semibold text-brand-teal uppercase tracking-wider mb-1">
                      {milestone.year}
                    </div>
                    <div className="text-sm font-semibold text-brand-navy mb-1">{milestone.title}</div>
                    <div className="text-sm text-text-secondary">{milestone.desc}</div>
                  </div>
                </div>
                <div className="w-4 h-4 rounded-full bg-brand-teal border-4 border-white shadow-sm z-10 flex-shrink-0" />
                <div className="md:w-5/12" />
              </m.div>
            ))}
          </div>
        </div>
      </m.div>

      {/* Values */}
      <m.div
        className="mb-24"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">
            Our <span className="text-brand-teal">Values</span>
          </h2>
          <p className="body-large text-text-secondary max-w-2xl mx-auto">
            The principles that guide every decision we make
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {values.map((value, index) => (
            <m.div
              key={value.title}
              className="card-feature flex gap-5"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <div className={`w-12 h-12 rounded-xl ${value.color} flex items-center justify-center flex-shrink-0`}>
                <value.icon className={`w-6 h-6 ${value.iconColor}`} />
              </div>
              <div>
                <h3 className="heading-card text-brand-navy mb-2">{value.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{value.description}</p>
              </div>
            </m.div>
          ))}
        </div>
      </m.div>

      {/* Team */}
      <m.div
        className="mb-24"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-12">
          <h2 className="heading-section text-brand-navy mb-4">
            Meet the <span className="text-brand-teal">Team</span>
          </h2>
          <p className="body-large text-text-secondary max-w-2xl mx-auto">
            A diverse group of engineers, researchers, and commerce experts building the future of customer support
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map((member, index) => (
            <m.div
              key={member.name}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${member.gradient} flex items-center justify-center mb-4`}>
                <span className="text-lg font-bold text-white">{member.avatar}</span>
              </div>
              <h3 className="text-base font-semibold text-brand-navy mb-0.5">{member.name}</h3>
              <p className="text-sm text-brand-teal font-medium mb-3">{member.role}</p>
              <p className="text-sm text-text-secondary leading-relaxed">{member.bio}</p>
              <div className="flex gap-2 mt-4">
                <a href="https://www.linkedin.com/company/barpel-ai" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-brand-teal hover:text-white transition-all duration-200">
                  <Linkedin className="w-4 h-4" />
                </a>
                <a href="https://x.com/barpelai" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-brand-teal hover:text-white transition-all duration-200">
                  <Twitter className="w-4 h-4" />
                </a>
              </div>
            </m.div>
          ))}
        </div>
      </m.div>

      {/* Culture / Office */}
      <m.div
        className="mb-24"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="heading-section text-brand-navy mb-6">
              Life at <span className="text-brand-teal">Barpel</span>
            </h2>
            <div className="space-y-4 text-text-secondary">
              <p className="body-large">
                We are a remote-first company with team members across North America, Europe, and Asia. We believe great work happens when talented people have the freedom to work from wherever they do their best thinking.
              </p>
              <p className="body-large">
                We gather quarterly for team offsites where we hack on new ideas, share learnings, and strengthen the bonds that make remote work effective. Our culture values ownership, transparency, and a bias toward action.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              {[
                { icon: Globe, label: 'Remote-First' },
                { icon: Users, label: '30+ Team Members' },
                { icon: MapPin, label: '8 Countries' },
                { icon: Award, label: 'Quarterly Offsites' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 text-brand-teal" />
                  <span className="text-sm font-medium text-brand-navy">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <m.div
            className="rounded-2xl bg-gradient-to-br from-brand-navy to-slate-700 p-8 aspect-[4/3] flex items-center justify-center relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative z-10 text-center">
              <Users className="w-16 h-16 text-teal-400 mx-auto mb-4" />
              <div className="text-white text-lg font-semibold mb-2">Remote-First Team</div>
              <div className="text-white/60 text-sm">Working across 8 countries, united by mission</div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-36 h-36 border border-white/10 rounded-full" />
            <div className="absolute top-6 -left-6 w-28 h-28 border border-teal-400/20 rounded-full" />
            <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-teal-400/10 rounded-full blur-xl" />
          </m.div>
        </div>
      </m.div>

      {/* Bottom CTAs */}
      <m.div
        className="grid md:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-off-white rounded-2xl p-8 border border-light-mint text-center">
          <Zap className="w-8 h-8 text-brand-teal mx-auto mb-4" />
          <h3 className="heading-card text-brand-navy mb-2">Join Our Team</h3>
          <p className="text-sm text-text-secondary mb-6">
            We are hiring across engineering, product, and customer success. Come build the future of AI support.
          </p>
          <Link href="/careers" className="btn-primary">
            View open positions
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="bg-off-white rounded-2xl p-8 border border-light-mint text-center">
          <Mail className="w-8 h-8 text-brand-teal mx-auto mb-4" />
          <h3 className="heading-card text-brand-navy mb-2">Get in Touch</h3>
          <p className="text-sm text-text-secondary mb-6">
            Have questions about Barpel, partnership opportunities, or press inquiries? We would love to hear from you.
          </p>
          <Link href="/contact" className="btn-primary">
            Contact us
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </m.div>
    </ContentPageLayout>
  );
}
