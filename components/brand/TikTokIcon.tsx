interface TikTokIconProps {
  size?: number;
  className?: string;
}

/**
 * TikTok brand icon — musical note "d" shape with characteristic
 * triple-layer shadow effect: black body, cyan left-shadow, red right-shadow.
 */
export function TikTokIcon({ size = 24, className }: TikTokIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="TikTok"
    >
      {/* Red shadow layer (offset right+down) */}
      <path
        d="M10.5 3.5v10.3a2.8 2.8 0 11-2.8-2.8h.3V8.4h-.3A5.4 5.4 0 1013 13.8V8.1a8.1 8.1 0 004.8 1.5V7a5.4 5.4 0 01-3.2-1.4 5.4 5.4 0 01-1.6-2.1H10.5z"
        fill="#EE1D52"
        transform="translate(0.5 0.5)"
      />
      {/* Cyan shadow layer (offset left+up) */}
      <path
        d="M10.5 3.5v10.3a2.8 2.8 0 11-2.8-2.8h.3V8.4h-.3A5.4 5.4 0 1013 13.8V8.1a8.1 8.1 0 004.8 1.5V7a5.4 5.4 0 01-3.2-1.4 5.4 5.4 0 01-1.6-2.1H10.5z"
        fill="#69C9D0"
        transform="translate(-0.5 -0.5)"
      />
      {/* Black main layer */}
      <path
        d="M10.5 3.5v10.3a2.8 2.8 0 11-2.8-2.8h.3V8.4h-.3A5.4 5.4 0 1013 13.8V8.1a8.1 8.1 0 004.8 1.5V7a5.4 5.4 0 01-3.2-1.4 5.4 5.4 0 01-1.6-2.1H10.5z"
        fill="#000000"
      />
    </svg>
  );
}
