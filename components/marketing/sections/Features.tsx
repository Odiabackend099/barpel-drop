"use client";

import { useRef, useState } from 'react';
import { Package, RefreshCw, ShoppingCart, Search, Globe, Clock, ArrowRight } from 'lucide-react';
import { m, useInView } from 'framer-motion';

const features = [
  {
    icon: Package,
    title: 'Instant Order Tracking',
    description: 'Customers call and get real-time order status, tracking numbers, and delivery estimates — no waiting, no human agents.',
    iconBg: 'bg-brand-600',
    iconColor: 'text-white',
  },
  {
    icon: RefreshCw,
    title: 'Hassle-Free Returns',
    description: 'AI explains your return policy, collects photos via SMS, and initiates the return process automatically.',
    iconBg: 'bg-brand-700',
    iconColor: 'text-white',
  },
  {
    icon: ShoppingCart,
    title: 'Smart Cart Recovery',
    description: 'AI calls customers 15 minutes after cart abandonment, answers questions, and helps complete the purchase.',
    iconBg: 'bg-brand-500',
    iconColor: 'text-white',
  },
  {
    icon: Search,
    title: 'Live Product Lookup',
    description: 'Customers ask about products, stock levels, and pricing. AI searches your catalog in real-time.',
    iconBg: 'bg-brand-600',
    iconColor: 'text-white',
  },
  {
    icon: Globe,
    title: 'Speak Any Language',
    description: 'Natural conversations in 30+ languages. Your AI assistant sounds human, not robotic.',
    iconBg: 'bg-brand-700',
    iconColor: 'text-white',
  },
  {
    icon: Clock,
    title: 'Always On',
    description: 'Never miss a customer call. Handle peak seasons, holidays, and timezone differences effortlessly.',
    iconBg: 'bg-brand-500',
    iconColor: 'text-white',
  },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-100px" });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <m.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      whileHover={{
        y: -4,
        boxShadow: "0 20px 40px -8px rgba(0,0,0,0.1), 0 0 20px rgba(0,169,157,0.15)",
        transition: { duration: 0.2, ease: "easeOut" },
      }}
      onMouseMove={handleMouseMove}
      className="group relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-[#0d9488] overflow-hidden transition-colors duration-200"
    >
      {/* Mouse-following glow — pointer-events-none, only paints on hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(280px circle at ${mousePos.x}px ${mousePos.y}px, rgba(13,148,136,0.12), transparent 60%)`,
        }}
      />
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Icon */}
      <m.div
        className={`relative w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center mb-5`}
        whileHover={{ rotate: 5, scale: 1.1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
      </m.div>

      {/* Content */}
      <h3 className="text-base font-semibold text-slate-900 mb-2 tracking-tight group-hover:text-teal-600 transition-colors">
        {feature.title}
      </h3>
      <p className="text-sm text-slate-500 mb-4 leading-relaxed">
        {feature.description}
      </p>

      {/* Link */}
      <m.a
        href="/features"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-600"
        whileHover={{ x: 4 }}
        transition={{ duration: 0.2 }}
      >
        Learn more
        <ArrowRight className="w-4 h-4" />
      </m.a>
    </m.div>
  );
}

export default function Features() {
  return (
    <section id="features" className="section-padding bg-white relative overflow-hidden">
      {/* Background blobs — CSS-only, no JS scroll callbacks */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-100/30 rounded-full blur-3xl pointer-events-none animate-hero-orb-1" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-100/20 rounded-full blur-3xl pointer-events-none animate-hero-orb-2" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <m.div
          className="text-center max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <m.span
            className="inline-block px-3 py-1 bg-teal-50 text-teal-600 text-xs font-medium rounded-full mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Features
          </m.span>
          <h2 className="heading-section text-slate-900 mb-4">
            Everything your customers need,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-400">
              handled by AI
            </span>
          </h2>
          <p className="body-large text-slate-500">
            From order tracking to returns, our voice AI handles it all — 24/7,
            in any language.
          </p>
        </m.div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
