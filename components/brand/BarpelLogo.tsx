interface BarpelLogoProps {
  size?: number;
  className?: string;
}

/** Barpel "B" speech-bubble logo with wifi arcs — brand gradient variant. */
export function BarpelLogo({ size = 40, className }: BarpelLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      className={className}
      aria-label="Barpel AI logo"
    >
      <defs>
        <linearGradient
          id="barpelGrad"
          x1="0"
          y1="0"
          x2="80"
          y2="80"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#1B2A4A" />
          <stop offset="50%" stopColor="#00A99D" />
          <stop offset="100%" stopColor="#7DD9C0" />
        </linearGradient>
      </defs>
      <path
        d="M68 12C68 8.686 65.314 6 62 6H18C14.686 6 12 8.686 12 12V52C12 55.314 14.686 58 18 58H24V72L38 58H62C65.314 58 68 55.314 68 52V12Z"
        fill="url(#barpelGrad)"
      />
      <path
        d="M24 28C24 28 28 22 40 22C52 22 56 28 56 28"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M28 36C28 36 31 32 40 32C49 32 52 36 52 36"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M32 44C32 44 34 42 40 42C46 42 48 44 48 44"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** All-white variant for dark backgrounds (footer). */
export function BarpelLogoWhite({ size = 40, className }: BarpelLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      className={className}
      aria-label="Barpel AI logo"
    >
      <path
        d="M68 12C68 8.686 65.314 6 62 6H18C14.686 6 12 8.686 12 12V52C12 55.314 14.686 58 18 58H24V72L38 58H62C65.314 58 68 55.314 68 52V12Z"
        fill="white"
      />
      <path
        d="M24 28C24 28 28 22 40 22C52 22 56 28 56 28"
        stroke="#1B2A4A"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M28 36C28 36 31 32 40 32C49 32 52 36 52 36"
        stroke="#1B2A4A"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M32 44C32 44 34 42 40 42C46 42 48 44 48 44"
        stroke="#1B2A4A"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
