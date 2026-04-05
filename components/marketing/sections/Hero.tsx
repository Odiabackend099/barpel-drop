"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Play } from 'lucide-react';
import { m, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';

const YOUTUBE_VIDEO_ID = 'UfQP3viQvm4';

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen pt-14 overflow-hidden bg-gradient-to-br from-brand-navy via-slate-900 to-teal-950"
    >
      {/* Background orbs + grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-teal-500/15 rounded-full blur-3xl animate-hero-orb-1" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-3xl animate-hero-orb-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl animate-hero-orb-3" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <m.div
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center py-16 lg:py-24"
        style={{ y, opacity }}
      >
        {/* Badge */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/[0.07] backdrop-blur-sm rounded-full border border-white/10 mb-8"
        >
          <m.span
            className="w-2 h-2 bg-teal-400 rounded-full"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-xs font-medium text-white/80">
            Now with Abandoned Cart Recovery
          </span>
        </m.div>

        {/* Headline */}
        <m.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[40px] md:text-[56px] lg:text-[72px] font-bold leading-[1.05] tracking-[-0.03em] text-white mb-6 max-w-4xl"
        >
          AI-Powered Voice Support for Your{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-emerald-300">
            E-Commerce Store
          </span>
        </m.h1>

        {/* Subheading */}
        <m.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-lg md:text-xl lg:text-2xl text-white/70 max-w-3xl mb-12 leading-relaxed"
        >
          Stop losing sales to slow response times. Barpel&apos;s AI voice agent never sleeps,
          answers instantly, and turns browsers into buyers.
        </m.p>

        {/* Video — YouTube facade pattern */}
        <m.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl mb-10"
          style={{ aspectRatio: '16 / 9' }}
        >
          {isPlaying ? (
            /* YouTube iframe — only mounted after user clicks play */
            <iframe
              src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1&color=white`}
              title="Barpel AI Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          ) : (
            /* Facade: poster + play button — zero YouTube JS loaded */
            <button
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 w-full h-full group"
              aria-label="Play Barpel demo video"
            >
              {/* Poster thumbnail */}
              <Image
                src="/hero-dashboard.jpg"
                alt="Barpel AI dashboard"
                fill
                className="object-cover"
                priority
              />

              {/* Dark overlay */}
              <span className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300" />

              {/* Play button — Loom-style */}
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex items-center justify-center w-20 h-20 rounded-full bg-white/20 group-hover:bg-white/30 backdrop-blur-md border border-white/30 transition-all duration-300 group-hover:scale-110 shadow-2xl">
                  <Play className="w-8 h-8 text-white ml-1" fill="white" />
                </span>
              </span>
            </button>
          )}
        </m.div>

        {/* CTA */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col items-center gap-3"
        >
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#0d9488] text-white text-base font-semibold rounded-xl hover:bg-[#0b7f74] transition-all duration-200 shadow-lg shadow-teal-500/20 hover:-translate-y-px"
          >
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-sm text-white/40">
            No credit card · 5 free credits · Live in minutes
          </p>
        </m.div>
      </m.div>
    </section>
  );
}
