"use client";

import { m } from "framer-motion";
import Link from "next/link";
import { Phone, Check, ArrowRight, Star, TrendingUp, Clock, Headphones } from "lucide-react";

const TREVOR_REF_LINK = "https://dropship.barpel.ai/?ref=mjk5ytq";

const benefits = [
  {
    icon: Clock,
    title: "24/7 Coverage",
    description: "Your AI handles every call — even at 2 AM — without you lifting a finger.",
  },
  {
    icon: TrendingUp,
    title: "Recover Lost Revenue",
    description: "Automated abandoned cart callbacks bring back customers who were about to leave.",
  },
  {
    icon: Headphones,
    title: "Real Voice, Not a Bot",
    description: "Customers hear a natural AI voice that tracks orders, handles returns, and answers questions.",
  },
  {
    icon: Phone,
    title: "Works With Your Store",
    description: "One-click Shopify integration. Live in under 10 minutes.",
  },
];

const testimonials = [
  {
    quote: "Barpel handled 240 calls last month. I saved over $800 in VA costs and my customers don't even know it's AI.",
    name: "Dropshipping store owner",
    plan: "Growth Plan",
  },
  {
    quote: "The abandoned cart calls are a game-changer. We recovered 18% of carts that would have been dead.",
    name: "eCommerce merchant",
    plan: "Scale Plan",
  },
];

const plans = [
  {
    name: "Starter",
    price: "$29",
    credits: "100 credits",
    callsEst: "~40 calls/mo",
    cta: "Start Free",
    highlight: false,
  },
  {
    name: "Growth",
    price: "$79",
    credits: "350 credits",
    callsEst: "~140 calls/mo",
    cta: "Most Popular",
    highlight: true,
  },
  {
    name: "Scale",
    price: "$179",
    credits: "1,000 credits",
    callsEst: "~400 calls/mo",
    cta: "Scale Up",
    highlight: false,
  },
];

export default function EcommerceParadisePage() {
  return (
    <div className="min-h-screen bg-off-white">
      {/* Nav */}
      <header className="bg-white border-b border-light-mint sticky top-0 z-50">
        <div className="container-default py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-brand-teal flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-brand-navy font-display">Barpel</span>
          </Link>
          <Link
            href={TREVOR_REF_LINK}
            className="px-4 py-2 bg-brand-teal text-white text-sm font-semibold rounded-lg hover:bg-teal-600 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </header>

      {/* Co-brand banner */}
      <div className="bg-brand-navy text-white text-sm text-center py-2.5 px-4">
        Exclusive offer for <span className="font-semibold text-teal-300">eCommerce Paradise</span> members · 5 free credits, no credit card required
      </div>

      {/* Hero */}
      <section className="bg-white py-20">
        <div className="container-default max-w-4xl text-center">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Partnership badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-full text-sm text-teal-700 font-medium mb-8">
              <Star className="w-4 h-4 text-teal-500 fill-teal-500" />
              Recommended by Trevor Fenner · eCommerce Paradise
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-brand-navy font-display leading-tight mb-6">
              Stop Losing Customers<br />
              <span className="text-teal-500">to Unanswered Calls</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10">
              Barpel AI handles every inbound call, tracks orders, processes returns, and recovers abandoned carts — automatically, 24/7. No VAs. No missed calls. No lost revenue.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={TREVOR_REF_LINK}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-teal text-white font-bold rounded-xl hover:bg-teal-600 transition-all text-lg shadow-lg hover:shadow-xl"
              >
                Start Free — 5 Credits Included
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <p className="text-sm text-slate-500 mt-4">No credit card required · Setup in under 10 minutes</p>
          </m.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-brand-navy py-10">
        <div className="container-default">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "2.3s", label: "Avg response time" },
              { value: "24/7", label: "Always-on coverage" },
              { value: "$3.40", label: "Saved per call vs. VA" },
              { value: "10 min", label: "Time to go live" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold text-teal-400 font-display">{stat.value}</div>
                <div className="text-sm text-white/60 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trevor endorsement */}
      <section className="bg-white py-16">
        <div className="container-default max-w-3xl">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-teal-50 to-slate-50 border border-teal-100 rounded-2xl p-8 md:p-10"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-brand-teal flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
                TF
              </div>
              <div>
                <blockquote className="text-lg text-slate-700 leading-relaxed mb-4">
                  &ldquo;The #1 problem I hear from dropshippers is customer service eating up all their time. Barpel solves that completely — your AI handles calls while you focus on growing your store.&rdquo;
                </blockquote>
                <div className="flex items-center gap-1 mb-1">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="font-semibold text-brand-navy">Trevor Fenner</p>
                <p className="text-sm text-slate-500">Founder, eCommerce Paradise</p>
              </div>
            </div>
          </m.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-off-white">
        <div className="container-default">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-brand-navy font-display mb-4">
              Everything your store needs, hands-free
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <m.div
                key={b.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="bg-white rounded-xl p-6 border border-light-mint shadow-sm"
              >
                <b.icon className="w-8 h-8 text-teal-500 mb-3" />
                <h3 className="font-semibold text-brand-navy mb-2">{b.title}</h3>
                <p className="text-sm text-slate-500">{b.description}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* What it handles */}
      <section className="bg-white py-16">
        <div className="container-default max-w-3xl">
          <h2 className="text-3xl font-bold text-brand-navy font-display text-center mb-10">
            What Barpel handles for you
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "Order status & tracking questions",
              "Return & refund requests",
              "Abandoned cart recovery calls",
              "Product availability inquiries",
              "Call forwarding to human agents",
              "After-hours coverage, always",
              "Multi-language support",
              "Custom AI persona & scripts",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 p-3 rounded-lg bg-teal-50">
                <Check className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-off-white py-16">
        <div className="container-default max-w-4xl">
          <h2 className="text-3xl font-bold text-brand-navy font-display text-center mb-10">
            Store owners love it
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((t, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white rounded-xl p-6 border border-light-mint shadow-sm"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-4 italic">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-semibold text-brand-navy text-sm">{t.name}</p>
                  <p className="text-xs text-teal-600">{t.plan}</p>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-white py-16">
        <div className="container-default max-w-4xl">
          <h2 className="text-3xl font-bold text-brand-navy font-display text-center mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-center text-slate-500 mb-10">Start free. No credit card required.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-6 border ${plan.highlight ? "border-teal-400 bg-teal-50 shadow-lg" : "border-light-mint bg-white"}`}
              >
                {plan.highlight && (
                  <div className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-2">Most Popular</div>
                )}
                <h3 className="text-xl font-bold text-brand-navy font-display">{plan.name}</h3>
                <div className="text-3xl font-bold text-brand-navy mt-2 mb-1">
                  {plan.price}<span className="text-sm font-normal text-slate-500">/mo</span>
                </div>
                <p className="text-sm text-slate-500 mb-1">{plan.credits}</p>
                <p className="text-sm text-teal-600 font-medium mb-6">{plan.callsEst}</p>
                <Link
                  href={TREVOR_REF_LINK}
                  className={`w-full inline-flex items-center justify-center px-4 py-3 rounded-lg font-semibold text-sm transition-colors ${
                    plan.highlight
                      ? "bg-brand-teal text-white hover:bg-teal-600"
                      : "bg-slate-100 text-brand-navy hover:bg-slate-200"
                  }`}
                >
                  {plan.cta === "Most Popular" ? "Get Started" : plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-brand-navy py-20">
        <div className="container-default max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white font-display mb-4">
            Ready to put your customer service on autopilot?
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Join hundreds of dropshippers and eCommerce stores using Barpel AI to save time, reduce costs, and recover revenue.
          </p>
          <Link
            href={TREVOR_REF_LINK}
            className="inline-flex items-center gap-2 px-8 py-4 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-400 transition-all text-lg shadow-lg"
          >
            Start Free — 5 Credits Included
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-white/50 text-sm mt-4">Exclusive link for eCommerce Paradise community</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-light-mint py-8">
        <div className="container-default flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-400">© 2026 Barpel AI. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-slate-400">
            <Link href="/privacy" className="hover:text-brand-teal">Privacy</Link>
            <Link href="/terms" className="hover:text-brand-teal">Terms</Link>
            <Link href="/contact" className="hover:text-brand-teal">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
