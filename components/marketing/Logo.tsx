"use client";
import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  animated?: boolean;
  variant?: 'dark' | 'light';
}

const sizes = {
  sm: { container: 'w-8 h-8', text: 'text-lg' },
  md: { container: 'w-10 h-10', text: 'text-xl' },
  lg: { container: 'w-14 h-14', text: 'text-2xl' },
  xl: { container: 'w-20 h-20', text: 'text-3xl' },
};

export default function Logo({ size = 'md', showText = true, className = '', animated = true, variant = 'dark' }: LogoProps) {
  const { container, text } = sizes[size];
  const textColor = variant === 'light' ? 'text-white' : 'text-brand-teal';

  const LogoContent = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Logo Image with Animation */}
      <motion.div
        className={`${container} relative flex-shrink-0`}
        whileHover={animated ? { scale: 1.05, rotate: 5 } : {}}
        whileTap={animated ? { scale: 0.95 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <img
          src="/logo.png"
          alt="Barpel AI logo"
          className="w-full h-full object-contain drop-shadow-lg"
        />
        {/* Glow effect */}
        <div className="absolute inset-0 bg-teal-500/20 rounded-full blur-xl -z-10" />
      </motion.div>

      {/* Text */}
      {showText && (
        <motion.span
          className={`${text} font-semibold ${textColor} tracking-tight transition-colors duration-300`}
          initial={animated ? { opacity: 0, x: -10 } : {}}
          animate={animated ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          Barpel<span className={`font-bold ml-1 ${variant === 'light' ? 'text-[#0d9488]' : 'text-[#0d9488]'}`}>AI</span>
        </motion.span>
      )}
    </div>
  );

  return LogoContent;
}

// Animated logo for loading states
export function AnimatedLogo({ size = 'lg' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const { container } = sizes[size];

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className={`${container} relative`}
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <img
          src="/logo.png"
          alt="Barpel AI logo"
          className="w-full h-full object-contain"
        />
        <motion.div
          className="absolute inset-0 bg-teal-500/30 rounded-full blur-xl -z-10"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Barpel AI</h2>
        <p className="text-sm text-slate-500">Loading...</p>
      </motion.div>
    </div>
  );
}
