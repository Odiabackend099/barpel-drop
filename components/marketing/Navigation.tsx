"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '@/components/marketing/Logo';

interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string; description?: string }[];
}

const navItems: NavItem[] = [
  {
    label: 'Product',
    href: '/features',
    children: [
      { label: 'Features', href: '/features', description: 'Explore all capabilities' },
      { label: 'How it Works', href: '/how-it-works', description: 'See the setup process' },
      { label: 'Integrations', href: '/integrations', description: 'Connect your tools' },
      { label: 'Pricing', href: '/pricing', description: 'Choose your plan' },
    ],
  },
  {
    label: 'Solutions',
    href: '/solutions/shopify-stores',
    children: [
      { label: 'For Dropshippers', href: '/solutions/dropshippers', description: 'Automated support for dropshipping' },
      { label: 'For Shopify Stores', href: '/solutions/shopify-stores', description: 'Native Shopify integration' },
      { label: 'For TikTok Shop', href: '/solutions/tiktok-shop', description: 'Social commerce support' },
    ],
  },
  {
    label: 'Resources',
    href: '/help-center',
    children: [
      { label: 'Documentation', href: '/api-documentation', description: 'API and setup guides' },
      { label: 'Blog', href: '/blog', description: 'Latest updates and tips' },
      { label: 'FAQ', href: '/faq', description: 'Common questions answered' },
    ],
  },
  { label: 'Pricing', href: '/pricing' },
];

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDropdownEnter = (label: string) => {
    setActiveDropdown(label);
  };

  const handleDropdownLeave = () => {
    setActiveDropdown(null);
  };

  const isActive = (href: string) => {
    if (href.startsWith('/#')) {
      return pathname === '/' && (typeof window !== 'undefined' ? window.location.hash : '') === href.substring(1);
    }
    return pathname === href;
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/">
            <Logo size="md" showText={true} variant={isScrolled ? 'dark' : 'light'} />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="relative"
                onMouseEnter={() => item.children && handleDropdownEnter(item.label)}
                onMouseLeave={handleDropdownLeave}
              >
                {item.children ? (
                  <button
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                      activeDropdown === item.label || isActive(item.href)
                        ? 'text-teal-600'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                    <motion.div
                      animate={{ rotate: activeDropdown === item.label ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={`px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                      isActive(item.href)
                        ? 'text-teal-600'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                )}

                {/* Dropdown Menu with Glassmorphism */}
                <AnimatePresence>
                  {item.children && activeDropdown === item.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-slate-200/50 overflow-hidden"
                    >
                      <div className="p-2">
                        {item.children.map((child, childIndex) => (
                          <motion.div
                            key={child.label}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: childIndex * 0.03 }}
                          >
                            <Link
                              href={child.href}
                              className="block px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors duration-150 group"
                              onClick={() => setActiveDropdown(null)}
                            >
                              <div className="text-sm font-medium text-slate-900 group-hover:text-teal-600 transition-colors">
                                {child.label}
                              </div>
                              {child.description && (
                                <div className="text-xs text-slate-500 mt-0.5">
                                  {child.description}
                                </div>
                              )}
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Desktop CTAs */}
          <motion.div
            className="hidden lg:flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Link
              href="/login"
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-150"
            >
              Log In
            </Link>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-900/20"
              >
                Get started
              </Link>
            </motion.div>
          </motion.div>

          {/* Mobile Menu Button */}
          <motion.button
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors duration-150"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait">
              {isMobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-5 h-5 text-slate-900" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="w-5 h-5 text-slate-900" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/50 overflow-hidden"
          >
            <div className="max-w-6xl mx-auto px-4 py-4">
              <div className="space-y-1">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {item.children ? (
                      <div className="space-y-1">
                        <div className="px-3 py-2 text-sm font-semibold text-slate-900">
                          {item.label}
                        </div>
                        <div className="pl-3 space-y-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.label}
                              href={child.href}
                              className="block px-3 py-2 text-sm text-slate-600 hover:text-teal-600 hover:bg-slate-50 rounded-lg transition-colors duration-150"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className="block px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 rounded-lg transition-colors duration-150"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    )}
                  </motion.div>
                ))}
              </div>

              <motion.div
                className="mt-4 pt-4 border-t border-slate-200 space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Link
                  href="/login"
                  className="block w-full px-3 py-2 text-center text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors duration-150"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="block w-full px-3 py-2 text-center text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors duration-150"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get started
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
