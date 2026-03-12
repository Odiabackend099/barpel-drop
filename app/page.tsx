"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Phone,
  ShoppingCart,
  Zap,
  Shield,
  Globe,
  BarChart3,
  Clock,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  Star,
  Bot,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { BarpelLogo, BarpelLogoWhite } from "@/components/brand/BarpelLogo";
import { CallDemo } from "@/components/landing/CallDemo";
import { CREDIT_PACKAGES } from "@/lib/constants";

/* ─── Fade-in-up on scroll ─── */
const reveal = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

/* ─── Section wrapper ─── */
function Section({
  id,
  children,
  className = "",
  bg = "bg-white",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  bg?: string;
}) {
  return (
    <section id={id} className={`${bg} ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

/* ─── FAQ data ─── */
const FAQ_ITEMS = [
  {
    q: "How does the AI handle calls?",
    a: "When a customer calls your dedicated Barpel AI phone number, our voice agent answers instantly. It uses natural language processing to understand the request, checks your Shopify store in real time for order status, and responds conversationally — all within seconds.",
  },
  {
    q: "Do I need any technical skills?",
    a: "None at all. Sign up, connect your Shopify store with one click, customise your AI persona, and you're live. The entire setup takes under 5 minutes.",
  },
  {
    q: "What happens when my credits run out?",
    a: "We'll send you an SMS warning when your balance is low. Calls will pause until you top up — no surprise charges. You can buy more credits anytime from your dashboard.",
  },
  {
    q: "Can the AI handle returns and refunds?",
    a: "Yes. The AI can initiate a return, send the customer an SMS with return instructions, and log the request in your dashboard — all during the call.",
  },
  {
    q: "Is my customer data safe?",
    a: "Absolutely. All data is encrypted in transit and at rest. We auto-delete call transcripts after 90 days and recordings after 30 days. We never sell your data.",
  },
  {
    q: "What languages does it support?",
    a: "Currently English, with Nigerian Pidgin understanding baked in. More languages are on our roadmap — let us know what you need.",
  },
];

/* ─── Testimonials ─── */
const TESTIMONIALS = [
  {
    name: "Ada O.",
    role: "TikTok Shop Seller",
    text: "I used to spend 3 hours a day answering 'Where is my order?' calls. Barpel handles all of them now. My customers are happier and I have my time back.",
    stars: 5,
  },
  {
    name: "Chidi E.",
    role: "Shopify Merchant",
    text: "Set it up in 5 minutes. The AI sounds natural, checks Shopify in real time, and even sends tracking links via SMS. Game changer for my store.",
    stars: 5,
  },
  {
    name: "Fatima B.",
    role: "Dropshipper",
    text: "The abandoned cart callbacks alone paid for the entire service in the first week. My recovery rate went from 5% to 28%.",
    stars: 5,
  },
];

/* ─── Marquee stats ─── */
const MARQUEE_STATS = [
  "95% Customer Satisfaction",
  "< 1 Second Answer Time",
  "24/7 Coverage",
  "Real-Time Shopify Sync",
  "₦0 Per Missed Call",
  "5 Minute Setup",
  "No Contracts",
  "SMS Tracking Updates",
];

/* ═══════════════════════════════════════════════════════════════════ */
/*  LANDING PAGE                                                      */
/* ═══════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const orbY = useTransform(scrollYProgress, [0, 1], [0, 120]);

  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      {/* ─── 1. NAVBAR ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-white/70 border-b border-[#D0EDE8]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <BarpelLogo size={32} />
            <span className="font-display font-bold text-navy text-lg tracking-tight">
              Barpel
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-[#4A7A6D]">
            <a href="#how-it-works" className="hover:text-navy transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-navy transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-navy transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-navy transition-colors">
              FAQ
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-navy hover:text-teal transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold px-4 py-2 rounded-full bg-teal text-white hover:bg-teal/90 transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── 2. HERO ─── */}
      <section ref={heroRef} className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 bg-white overflow-hidden">
        {/* Parallax orbs */}
        <motion.div
          style={{ y: orbY }}
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gradient-to-br from-[#C8F0E8] to-[#7DD9C0] opacity-30 blur-3xl"
        />
        <motion.div
          style={{ y: orbY }}
          className="absolute bottom-0 -left-32 w-96 h-96 rounded-full bg-gradient-to-tr from-[#D0EDE8] to-[#00A99D] opacity-20 blur-3xl"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#C8F0E8] text-teal mb-6">
                  <Zap className="w-3 h-3" /> AI-Powered Voice Support
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-navy leading-[1.1] tracking-tight"
              >
                Your AI answers
                <br />
                <span className="bg-gradient-to-r from-teal to-mint bg-clip-text text-transparent">
                  every customer call
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-6 text-base sm:text-lg text-[#4A7A6D] max-w-lg leading-relaxed"
              >
                Stop losing sales to missed calls. Barpel gives your store a dedicated AI phone
                agent that handles order tracking, returns, and abandoned cart recovery — 24/7.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-8 flex flex-wrap gap-4"
              >
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-teal text-white font-semibold text-sm hover:bg-teal/90 transition-all shadow-teal hover:shadow-teal-lg"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#D0EDE8] text-navy font-semibold text-sm hover:bg-[#F0F9F8] transition-colors"
                >
                  See How It Works
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 flex items-center gap-6 text-xs text-[#8AADA6]"
              >
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal" /> 5 free minutes
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal" /> No credit card
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal" /> Setup in 5 min
                </span>
              </motion.div>
            </div>

            {/* Call demo on right */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <CallDemo />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── 3. MARQUEE TICKER ─── */}
      <div className="bg-[#F0F9F8] border-y border-[#D0EDE8] py-3 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...MARQUEE_STATS, ...MARQUEE_STATS].map((stat, i) => (
            <span
              key={i}
              className="mx-8 text-sm font-medium text-teal flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal" />
              {stat}
            </span>
          ))}
        </div>
      </div>

      {/* ─── 4. PROBLEM SECTION ─── */}
      <Section className="py-20 sm:py-28">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-14"
        >
          <motion.p variants={reveal} custom={0} className="text-sm font-semibold text-teal tracking-wide uppercase">
            The Problem
          </motion.p>
          <motion.h2
            variants={reveal}
            custom={1}
            className="mt-3 font-display text-3xl sm:text-4xl font-bold text-navy tracking-tight"
          >
            You&apos;re losing money on every missed call
          </motion.h2>
          <motion.p variants={reveal} custom={2} className="mt-4 text-[#4A7A6D] max-w-2xl mx-auto">
            Dropshippers and e-commerce sellers face the same problems every day.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            {
              icon: Phone,
              title: "Missed Calls",
              desc: "62% of customer calls go unanswered. Each one is a potential lost sale or chargeback.",
              stat: "62%",
            },
            {
              icon: Clock,
              title: "Hours Wasted",
              desc: "You spend 3+ hours daily answering 'Where is my order?' instead of growing your business.",
              stat: "3+ hrs/day",
            },
            {
              icon: ShoppingCart,
              title: "Abandoned Carts",
              desc: "70% of carts are abandoned. Without follow-up calls, that revenue is gone forever.",
              stat: "70%",
            },
            {
              icon: DollarSign,
              title: "Refund Chaos",
              desc: "Late responses to return requests lead to chargebacks and angry reviews.",
              stat: "2x chargebacks",
            },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              variants={reveal}
              custom={i}
              className="bg-white rounded-2xl border border-[#D0EDE8] p-6 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F0F9F8] flex items-center justify-center mb-4">
                <card.icon className="w-5 h-5 text-teal" />
              </div>
              <p className="text-2xl font-bold text-navy mb-1">{card.stat}</p>
              <h3 className="font-display font-semibold text-navy text-lg mb-2">{card.title}</h3>
              <p className="text-sm text-[#4A7A6D] leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ─── 5. HOW IT WORKS ─── */}
      <Section id="how-it-works" className="py-20 sm:py-28" bg="bg-[#F0F9F8]">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-14"
        >
          <motion.p variants={reveal} custom={0} className="text-sm font-semibold text-teal tracking-wide uppercase">
            How It Works
          </motion.p>
          <motion.h2
            variants={reveal}
            custom={1}
            className="mt-3 font-display text-3xl sm:text-4xl font-bold text-navy tracking-tight"
          >
            Live in 5 minutes
          </motion.h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="space-y-8"
          >
            {[
              {
                step: "1",
                title: "Connect your Shopify store",
                desc: "One-click OAuth. We sync your products, orders, and policies instantly.",
              },
              {
                step: "2",
                title: "Customise your AI persona",
                desc: "Choose a voice style — professional, friendly, or luxury. Add custom instructions.",
              },
              {
                step: "3",
                title: "Get your AI phone number",
                desc: "We provision a dedicated phone number that your AI agent answers 24/7.",
              },
              {
                step: "4",
                title: "Customers call, AI handles it",
                desc: "Order tracking, returns, cart recovery — all handled in real time with live Shopify data.",
              },
            ].map((item, i) => (
              <motion.div key={item.step} variants={reveal} custom={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-teal text-white flex items-center justify-center font-display font-bold text-sm flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-navy text-lg">{item.title}</h3>
                  <p className="text-sm text-[#4A7A6D] mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <CallDemo />
          </motion.div>
        </div>
      </Section>

      {/* ─── 6. FEATURES BENTO GRID ─── */}
      <Section id="features" className="py-20 sm:py-28">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-14"
        >
          <motion.p variants={reveal} custom={0} className="text-sm font-semibold text-teal tracking-wide uppercase">
            Features
          </motion.p>
          <motion.h2
            variants={reveal}
            custom={1}
            className="mt-3 font-display text-3xl sm:text-4xl font-bold text-navy tracking-tight"
          >
            Everything your support team needs
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {[
            {
              icon: Bot,
              title: "AI Voice Agent",
              desc: "Natural-sounding AI answers calls in under 1 second. Handles WISMO, returns, and general inquiries.",
            },
            {
              icon: ShoppingCart,
              title: "Shopify Integration",
              desc: "Real-time order lookup, return initiation, and store policy retrieval — all via live Shopify GraphQL API.",
            },
            {
              icon: TrendingUp,
              title: "Cart Recovery Calls",
              desc: "Automatically call customers who abandoned checkout. Recover up to 28% of lost sales.",
            },
            {
              icon: Globe,
              title: "AfterShip Tracking",
              desc: "Live shipment tracking from 900+ carriers. Your AI tells customers exactly where their order is.",
            },
            {
              icon: BarChart3,
              title: "Analytics Dashboard",
              desc: "Call volume trends, sentiment analysis, credit usage, and call type breakdown — all in real time.",
            },
            {
              icon: Shield,
              title: "Enterprise Security",
              desc: "HMAC-verified webhooks, encrypted data, automatic PII scrubbing, and GDPR-ready data retention.",
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              variants={reveal}
              custom={i}
              className="bg-white rounded-2xl border border-[#D0EDE8] p-6 hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F0F9F8] flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-teal" />
              </div>
              <h3 className="font-display font-semibold text-navy text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-[#4A7A6D] leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ─── 7. PRICING ─── */}
      <Section id="pricing" className="py-20 sm:py-28" bg="bg-[#F0F9F8]">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-14"
        >
          <motion.p variants={reveal} custom={0} className="text-sm font-semibold text-teal tracking-wide uppercase">
            Pricing
          </motion.p>
          <motion.h2
            variants={reveal}
            custom={1}
            className="mt-3 font-display text-3xl sm:text-4xl font-bold text-navy tracking-tight"
          >
            Simple, prepaid pricing
          </motion.h2>
          <motion.p variants={reveal} custom={2} className="mt-4 text-[#4A7A6D] max-w-xl mx-auto">
            No subscriptions. No contracts. Buy minutes when you need them.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          {CREDIT_PACKAGES.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              variants={reveal}
              custom={i}
              className={`relative rounded-2xl p-6 transition-all hover:-translate-y-1 ${
                ("popular" in pkg && pkg.popular)
                  ? "bg-white border-2 border-teal shadow-teal"
                  : "bg-white border border-[#D0EDE8]"
              }`}
            >
              {("popular" in pkg && pkg.popular) && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <h3 className="font-display font-bold text-navy text-xl">{pkg.name}</h3>
              <div className="mt-4">
                <span className="text-3xl font-bold text-navy">
                  ${(pkg.priceUsdCents / 100).toFixed(0)}
                </span>
              </div>
              <p className="text-sm text-[#4A7A6D] mt-1">
                {pkg.minutes} minutes &middot; ${pkg.perMin}/min
              </p>
              <ul className="mt-6 space-y-2 text-sm text-[#4A7A6D]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal flex-shrink-0" />
                  AI voice agent included
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal flex-shrink-0" />
                  Dedicated phone number
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal flex-shrink-0" />
                  Full dashboard access
                </li>
                {("popular" in pkg && pkg.popular) && (
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal flex-shrink-0" />
                    Priority support
                  </li>
                )}
              </ul>
              <Link
                href="/login"
                className={`mt-6 block text-center text-sm font-semibold py-2.5 rounded-full transition-colors ${
                  ("popular" in pkg && pkg.popular)
                    ? "bg-teal text-white hover:bg-teal/90"
                    : "bg-[#F0F9F8] text-navy hover:bg-[#D0EDE8]"
                }`}
              >
                Get Started
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ─── 8. TESTIMONIALS ─── */}
      <Section className="py-20 sm:py-28">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-14"
        >
          <motion.p variants={reveal} custom={0} className="text-sm font-semibold text-teal tracking-wide uppercase">
            Testimonials
          </motion.p>
          <motion.h2
            variants={reveal}
            custom={1}
            className="mt-3 font-display text-3xl sm:text-4xl font-bold text-navy tracking-tight"
          >
            Loved by merchants
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              variants={reveal}
              custom={i}
              className="bg-white rounded-2xl border border-[#D0EDE8] p-6"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-[#F5A623] text-[#F5A623]" />
                ))}
              </div>
              <p className="text-sm text-[#4A7A6D] leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
              <div>
                <p className="font-semibold text-navy text-sm">{t.name}</p>
                <p className="text-xs text-[#8AADA6]">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ─── 9. FAQ ─── */}
      <Section id="faq" className="py-20 sm:py-28" bg="bg-[#F0F9F8]">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-14"
        >
          <motion.p variants={reveal} custom={0} className="text-sm font-semibold text-teal tracking-wide uppercase">
            FAQ
          </motion.p>
          <motion.h2
            variants={reveal}
            custom={1}
            className="mt-3 font-display text-3xl sm:text-4xl font-bold text-navy tracking-tight"
          >
            Common questions
          </motion.h2>
        </motion.div>

        <div className="max-w-2xl mx-auto space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <FaqItem key={i} question={item.q} answer={item.a} index={i} />
          ))}
        </div>
      </Section>

      {/* ─── 10. FINAL CTA ─── */}
      <Section className="py-20 sm:py-28">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center"
        >
          <motion.h2
            variants={reveal}
            custom={0}
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-navy tracking-tight"
          >
            Ready to stop missing calls?
          </motion.h2>
          <motion.p variants={reveal} custom={1} className="mt-4 text-[#4A7A6D] max-w-lg mx-auto">
            Join merchants who are saving hours every day with AI-powered customer support.
          </motion.p>
          <motion.div variants={reveal} custom={2} className="mt-8">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-teal text-white font-semibold hover:bg-teal/90 transition-all shadow-teal hover:shadow-teal-lg"
            >
              Start Your Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="mt-4 text-xs text-[#8AADA6]">
              5 free minutes &middot; No credit card required
            </p>
          </motion.div>
        </motion.div>
      </Section>

      {/* ─── 11. FOOTER ─── */}
      <footer className="bg-navy py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BarpelLogoWhite size={28} />
                <span className="font-display font-bold text-white text-lg">Barpel</span>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">
                AI-powered voice support for e-commerce merchants. Never miss a customer call again.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>
                  <a href="#how-it-works" className="hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>
                  <span className="cursor-default">Privacy Policy</span>
                </li>
                <li>
                  <span className="cursor-default">Terms of Service</span>
                </li>
                <li>
                  <span className="cursor-default">Data Processing</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-white/10 text-center text-xs text-white/40">
            &copy; {new Date().getFullYear()} Barpel AI. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ─── FAQ Accordion Item ─── */
function FaqItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={reveal}
      custom={index}
      className="bg-white rounded-xl border border-[#D0EDE8] overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="font-medium text-navy text-sm pr-4">{question}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-[#8AADA6] flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <p className="px-5 pb-4 text-sm text-[#4A7A6D] leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
