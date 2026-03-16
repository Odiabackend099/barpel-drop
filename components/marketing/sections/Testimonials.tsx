"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const testimonials = [
  {
    company: 'Always Available',
    stat: '24/7',
    description: 'customer support coverage',
    color: 'from-brand-navy to-brand-teal',
    bgColor: 'bg-brand-navy',
    href: '/features',
  },
  {
    company: 'Lightning Fast',
    stat: '< 3s',
    description: 'response time on every call',
    color: 'from-brand-teal to-brand-mint',
    bgColor: 'bg-brand-teal',
    href: '/features',
  },
  {
    company: 'Fully Automated',
    stat: '0',
    description: 'humans required',
    color: 'from-brand-mint to-[#F5A623]',
    bgColor: 'bg-brand-mint',
    href: '/features',
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
    );

    const header = sectionRef.current?.querySelector('.section-header');
    const carousel = carouselRef.current;

    if (header) observer.observe(header);
    if (carousel) observer.observe(carousel);

    return () => observer.disconnect();
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="section-padding bg-[#0f172a] overflow-hidden">
      <div className="container-default">
        <div ref={sectionRef}>
          {/* Section Header */}
          <div className="section-header flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12 opacity-0 translate-y-6">
            <div>
              <h2 className="heading-section text-white mb-2">
                Discover how stores grow with{' '}
                <span className="text-brand-mint">Barpel</span>
              </h2>
            </div>
            <Link
              href="/customer-stories"
              className="inline-flex items-center gap-2 text-brand-mint font-semibold hover:gap-3 transition-all duration-200"
            >
              View customer stories
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Carousel */}
          <div
            ref={carouselRef}
            className="relative opacity-0 translate-y-6"
          >
            {/* Navigation Buttons */}
            <div className="absolute -top-16 right-0 flex gap-2 z-10">
              <button
                onClick={prevSlide}
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors duration-200"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors duration-200"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Cards Container */}
            <div className="overflow-hidden">
              <div
                className="flex gap-6 transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentIndex * (100 / 3)}%)` }}
              >
                {testimonials.map((testimonial) => (
                  <div
                    key={testimonial.company}
                    className="flex-shrink-0 w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
                  >
                    <div className="group relative bg-white rounded-2xl overflow-hidden border border-white/10 shadow-teal-sm hover:shadow-teal-md transition-all duration-300">
                      {/* Top Section with Stat */}
                      <div className={`${testimonial.bgColor} p-8 pb-16`}>
                        <div className="text-white/80 text-sm font-medium mb-2">
                          {testimonial.company}
                        </div>
                        <div className="text-5xl font-bold text-white mb-2">
                          {testimonial.stat}
                        </div>
                        <div className="text-white/90">
                          {testimonial.description}
                        </div>
                      </div>

                      {/* Bottom Section with CTA */}
                      <div className="relative">
                        {/* Curved Shape */}
                        <div className={`absolute -top-12 left-0 right-0 h-16 ${testimonial.bgColor} rounded-b-[50%]`} />

                        {/* CTA Button */}
                        <div className="relative p-6 pt-8">
                          <Link
                            href={testimonial.href}
                            className="inline-flex items-center gap-2 text-white font-semibold group/link"
                          >
                            <span className={`px-4 py-2 rounded-lg bg-gradient-to-r ${testimonial.color} transition-all duration-200 group-hover/link:shadow-lg`}>
                              Read now
                              <ArrowRight className="inline-block w-4 h-4 ml-2 transition-transform duration-200 group-hover/link:translate-x-1" />
                            </span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentIndex
                      ? 'w-6 bg-brand-teal'
                      : 'bg-light-mint hover:bg-brand-teal/50'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .section-header,
        .relative.opacity-0 {
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .section-header.animate-in,
        .relative.opacity-0.animate-in {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </section>
  );
}
