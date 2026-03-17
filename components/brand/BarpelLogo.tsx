import Image from 'next/image';

interface BarpelLogoProps {
  size?: number;
  className?: string;
}

/** Barpel AI logo — full color variant. */
export function BarpelLogo({ size = 40, className }: BarpelLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Barpel AI logo"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}

/** All-white / light variant for dark backgrounds. */
export function BarpelLogoWhite({ size = 40, className }: BarpelLogoProps) {
  return (
    <Image
      src="/logo-white.png"
      alt="Barpel AI logo"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}
