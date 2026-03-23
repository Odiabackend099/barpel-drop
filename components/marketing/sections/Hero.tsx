"use client";

import Link from 'next/link';
import { ArrowRight, Play, CheckCircle2, Package, ShoppingCart, BarChart3, TrendingUp, Star } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

// Card data for the stack animation
const cards = [
  {
    icon: Package,
    title: 'Order #12345',
    subtitle: 'Shipped via Express',
    stat: '2.3s avg response',
    bottomIcon: CheckCircle2,
    bottomText: 'Arriving tomorrow',
    visual: 'order-tracking',
    accent: 'from-teal-600 to-teal-400',
  },
  {
    icon: ShoppingCart,
    title: 'Cart Recovered',
    subtitle: 'AI called customer',
    stat: '4.2x recovery rate',
    bottomIcon: TrendingUp,
    bottomText: '$127.50 saved',
    visual: 'cart-recovery',
    accent: 'from-brand-700 to-brand-500',
  },
  {
    icon: BarChart3,
    title: 'Weekly Summary',
    subtitle: 'Support dashboard',
    stat: '89% satisfaction',
    bottomIcon: Star,
    bottomText: 'vs last week',
    visual: 'support-analytics',
    accent: 'from-teal-500 to-emerald-400',
  },
];

// Mini progress bar for order tracking
function OrderTrackingVisual() {
  const stages = ['Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'];
  const activeIndex = 1;
  return (
    <div className="flex items-center gap-1 my-3">
      {stages.map((stage, i) => (
        <div key={stage} className="flex-1 flex flex-col items-center gap-1">
          <div
            className={`h-1.5 w-full rounded-full ${
              i <= activeIndex ? 'bg-teal-400' : 'bg-white/10'
            }`}
          />
          <span
            className={`text-[10px] leading-tight ${
              i === activeIndex ? 'text-teal-300 font-semibold' : 'text-white/40'
            }`}
          >
            {stage}
          </span>
        </div>
      ))}
    </div>
  );
}

// Mini conversion funnel for cart recovery
function CartRecoveryVisual() {
  const bars = [
    { label: 'Abandoned', width: '100%', color: 'bg-red-400', pct: '100%' },
    { label: 'Called', width: '65%', color: 'bg-amber-400', pct: '65%' },
    { label: 'Recovered', width: '42%', color: 'bg-teal-400', pct: '42%' },
  ];
  return (
    <div className="space-y-1.5 my-3">
      {bars.map((bar) => (
        <div key={bar.label} className="flex items-center gap-2">
          <span className="text-[10px] text-white/40 w-16 text-right">{bar.label}</span>
          <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full ${bar.color} rounded-full`} style={{ width: bar.width }} />
          </div>
          <span className="text-[10px] text-white/50 w-8">{bar.pct}</span>
        </div>
      ))}
    </div>
  );
}

// Mini bar chart for support analytics
function SupportAnalyticsVisual() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const heights = [60, 80, 45, 90, 70, 30, 50];
  return (
    <div className="flex items-end gap-1.5 my-3 h-12">
      {days.map((day, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div
            className="w-full bg-teal-400/80 rounded-sm"
            style={{ height: `${heights[i]}%` }}
          />
          <span className="text-[9px] text-white/40">{day}</span>
        </div>
      ))}
    </div>
  );
}

function CardStackDemo() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const getVisual = (visual: string) => {
    switch (visual) {
      case 'order-tracking':
        return <OrderTrackingVisual />;
      case 'cart-recovery':
        return <CartRecoveryVisual />;
      case 'support-analytics':
        return <SupportAnalyticsVisual />;
      default:
        return null;
    }
  };

  const getCardStyles = (position: number) => {
    switch (position) {
      case 0: // Front card
        return { x: 0, y: 0, scale: 1, opacity: 1, rotateZ: 0 };
      case 1: // Middle card
        return { x: 28, y: -14, scale: 0.94, opacity: 0.7, rotateZ: 1.5 };
      case 2: // Back card
        return { x: 56, y: -28, scale: 0.88, opacity: 0.4, rotateZ: 3 };
      default:
        return { x: 0, y: 0, scale: 1, opacity: 1, rotateZ: 0 };
    }
  };

  const getShadow = (position: number) => {
    switch (position) {
      case 0:
        return '0 25px 50px -12px rgba(0,0,0,0.4), 0 0 40px rgba(0,169,157,0.15)';
      case 1:
        return '0 15px 30px -8px rgba(0,0,0,0.3)';
      case 2:
        return '0 8px 16px -4px rgba(0,0,0,0.2)';
      default:
        return 'none';
    }
  };

  return (
    <div className="relative w-full h-[460px]">
      {cards.map((card, cardIndex) => {
        const position = (cardIndex - activeIndex + 3) % 3;
        const styles = getCardStyles(position);
        const zIndex = 3 - position;

        return (
          <motion.div
            key={cardIndex}
            className="absolute top-0 left-0 w-full rounded-2xl overflow-hidden border border-white/10"
            style={{ zIndex }}
            animate={{
              x: styles.x,
              y: styles.y,
              scale: styles.scale,
              opacity: styles.opacity,
              rotateZ: styles.rotateZ,
              boxShadow: getShadow(position),
            }}
            transition={{
              duration: 0.7,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {/* Glass card background */}
            <div className="bg-slate-800/85 backdrop-blur-2xl">
              {/* Gradient top border */}
              <div className={`h-1 bg-gradient-to-r ${card.accent}`} />

              <div className="p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                    <card.icon className="w-5 h-5 text-teal-300" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{card.title}</p>
                    <p className="text-xs text-white/40">{card.subtitle}</p>
                  </div>
                </div>

                {/* Visual */}
                {getVisual(card.visual)}

                {/* Stat */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                  <span className="text-xs font-medium text-teal-300">{card.stat}</span>
                  <div className="flex items-center gap-1 text-xs text-white/50">
                    <card.bottomIcon className="w-3.5 h-3.5 text-teal-400" />
                    <span>{card.bottomText}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
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
              className="text-[36px] md:text-[48px] lg:text-[60px] xl:text-[72px] font-bold leading-[1.05] tracking-[-0.03em] text-white mb-5"
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
                  href="/how-it-works"
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

          {/* Hero Card Stack Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="relative lg:pl-8"
          >
            <CardStackDemo />
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
