"use client";

import { useRef, useState } from 'react';
import { Package, RefreshCw, ShoppingCart, Search, Globe, Clock, ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

const features = [
  {
    icon: Package,
    title: 'Instant Order Tracking',
    description: 'Customers call and get real-time order status, tracking numbers, and delivery estimates — no waiting, no human agents.',
    color: 'from-blue-500 to-blue-400',
    bgColor: 'bg-blue-50',
  },
  {
    icon: RefreshCw,
    title: 'Hassle-Free Returns',
    description: 'AI explains your return policy, collects photos via SMS, and initiates the return process automatically.',
    color: 'from-teal-500 to-teal-400',
    bgColor: 'bg-teal-50',
  },
  {
    icon: ShoppingCart,
    title: 'Smart Cart Recovery',
    description: 'AI calls customers 15 minutes after cart abandonment, answers questions, and helps complete the purchase.',
    color: 'from-purple-500 to-purple-400',
    bgColor: 'bg-purple-50',
  },
  {
    icon: Search,
    title: 'Live Product Lookup',
    description: 'Customers ask about products, stock levels, and pricing. AI searches your catalog in real-time.',
    color: 'from-orange-500 to-orange-400',
    bgColor: 'bg-orange-50',
  },
  {
    icon: Globe,
    title: 'Speak Any Language',
    description: 'Natural conversations in 30+ languages. Your AI assistant sounds human, not robotic.',
    color: 'from-pink-500 to-pink-400',
    bgColor: 'bg-pink-50',
  },
  {
    icon: Clock,
    title: 'Always On',
    description: 'Never miss a customer call. Handle peak seasons, holidays, and timezone differences effortlessly.',
    color: 'from-green-500 to-green-400',
    bgColor: 'bg-green-50',
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
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50, rotate: 2 }}
      animate={isInView ? { opacity: 1, y: 0, rotate: 0 } : { opacity: 0, y: 50, rotate: 2 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      whileHover={{
        y: -8,
        boxShadow: "0 20px 40px -8px rgba(0,0,0,0.1), 0 0 20px rgba(0,169,157,0.15)",
        transition: { duration: 0.3, ease: "easeOut" },
      }}
      onMouseMove={handleMouseMove}
      className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-teal-300/50 hover:bg-teal-50/40 overflow-hidden transition-colors duration-300"
    >
      {/* Mouse-following glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, rgba(13,148,136,0.15), transparent 60%)`,
        }}
      />
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      {/* Icon */}
      <motion.div
        className={`relative w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110`}
        whileHover={{ rotate: 5 }}
      >
        <feature.icon className={`w-6 h-6 bg-gradient-to-br ${feature.color} bg-clip-text`} style={{ color: 'inherit' }} />
        <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-20 rounded-xl`} />
      </motion.div>

      {/* Content */}
      <h3 className="text-base font-semibold text-slate-900 mb-2 tracking-tight group-hover:text-teal-600 transition-colors">
        {feature.title}
      </h3>
      <p className="text-sm text-slate-500 mb-4 leading-relaxed">
        {feature.description}
      </p>

      {/* Link */}
      <motion.a
        href="/features"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 group/link"
        whileHover={{ x: 4 }}
      >
        Learn more
        <motion.div
          initial={{ x: 0 }}
          whileHover={{ x: 4 }}
          transition={{ duration: 0.2 }}
        >
          <ArrowRight className="w-4 h-4" />
        </motion.div>
      </motion.a>
    </motion.div>
  );
}

export default function Features() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section id="features" ref={sectionRef} className="section-padding bg-gradient-to-b from-slate-50 via-teal-50/40 to-white relative overflow-hidden">
      {/* Background Decoration */}
      <motion.div
        className="absolute top-0 right-0 w-96 h-96 bg-teal-100/30 rounded-full blur-3xl pointer-events-none"
        style={{ y, opacity }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl pointer-events-none"
        style={{ y: useTransform(scrollYProgress, [0, 1], [-50, 50]), opacity }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.span
            className="inline-block px-3 py-1 bg-teal-50 text-teal-600 text-xs font-medium rounded-full mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Features
          </motion.span>
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
        </motion.div>

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
