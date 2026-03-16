"use client";

import Link from 'next/link';
import { ArrowRight, Play, CheckCircle2, Phone, Clock, CreditCard } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

function HeroDashboardCard() {
  return (
    <motion.div
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="relative min-w-[320px] sm:min-w-[400px] lg:min-w-[480px] rounded-2xl overflow-hidden border border-white/10 bg-white/[0.08] backdrop-blur-2xl"
      style={{
        boxShadow: '0 25px 60px -12px rgba(13,148,136,0.25), 0 0 40px rgba(13,148,136,0.1)',
      }}
    >
      {/* Card Header */}
      <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
          <div className="w-3 h-3 rounded-full bg-green-400/80" />
        </div>
        <span className="text-[11px] text-white/40 font-medium">Barpel AI Dashboard</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Phone Line Status */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.06] border border-white/[0.08]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500/20 flex items-center justify-center">
              <Phone className="w-4.5 h-4.5 text-teal-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">+1 470 762 0377</p>
              <p className="text-[11px] text-white/40">Primary line</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/20 border border-teal-500/30">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-teal-400"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-[11px] font-medium text-teal-300">Active</span>
          </div>
        </motion.div>

        {/* Call Log Entry */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.06] border border-white/[0.08]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Clock className="w-4.5 h-4.5 text-blue-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Order #1042 inquiry</p>
              <p className="text-[11px] text-white/40">Resolved in 23s</p>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          </div>
        </motion.div>

        {/* Credits Bar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="p-3.5 rounded-xl bg-white/[0.06] border border-white/[0.08]"
        >
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-white/50" />
              <span className="text-sm font-medium text-white">Credits remaining</span>
            </div>
            <span className="text-sm font-bold text-teal-300">850</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: '85%' }}
              transition={{ duration: 1.2, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <p className="text-[11px] text-white/30 mt-1.5">850 of 1,000 credits used this month</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen pt-14 overflow-hidden bg-gradient-to-br from-brand-navy via-slate-900 to-teal-950"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Mesh gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 10, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-teal-500/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -10, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            x: [0, 50, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 10 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl"
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Floating Particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-teal-400/20 rounded-full"
            style={{
              left: `${10 + i * 12}%`,
              top: `${15 + (i % 4) * 20}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 4 + i * 0.7,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
        style={{ y, opacity }}
      >
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center min-h-[calc(100vh-56px)] py-12 lg:py-0">
          {/* Content */}
          <div className="max-w-2xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/[0.07] backdrop-blur-sm rounded-full border border-white/10 mb-6"
            >
              <motion.span
                className="w-2 h-2 bg-teal-400 rounded-full"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-xs font-medium text-white/80">
                Now with Abandoned Cart Recovery
              </span>
            </motion.div>

            {/* Headline — Calendly-scale bold */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-[48px] md:text-[64px] lg:text-[80px] xl:text-[96px] font-bold leading-[1.05] tracking-[-0.03em] text-white mb-5"
            >
              AI-Powered Voice Support for Your{' '}
              <motion.span
                className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-emerald-300"
              >
                E-Commerce Store
              </motion.span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-base md:text-lg lg:text-xl text-white/60 mb-8 leading-relaxed"
            >
              Give every customer a dedicated AI phone line. Handle order lookups,
              returns, and abandoned cart recovery — automatically. No humans
              required.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3 mb-6"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#0d9488] text-white text-base font-semibold rounded-xl hover:bg-[#0b7f74] transition-all duration-200 shadow-lg shadow-teal-500/20"
                >
                  Get started free
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border border-[#0d9488]/50 text-[#5eead4] text-base font-medium rounded-xl hover:bg-[#0d9488]/10 hover:border-[#0d9488] transition-all duration-200"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center"
                  >
                    <Play className="w-3 h-3 text-teal-300 ml-0.5" />
                  </motion.div>
                  See how it works
                </Link>
              </motion.div>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-wrap items-center gap-4"
            >
              {[
                { icon: CheckCircle2, text: 'No credit card' },
                { icon: CheckCircle2, text: '14-day free trial' },
                { icon: CheckCircle2, text: '100+ merchants' },
              ].map((item, i) => (
                <motion.div
                  key={item.text}
                  className="flex items-center gap-1.5 text-xs text-white/50"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                >
                  <item.icon className="w-3.5 h-3.5 text-teal-400" />
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Hero Dashboard Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="relative lg:pl-8"
          >
            <HeroDashboardCard />
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-xs text-white/30">Scroll to explore</span>
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-white/40 rounded-full"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
