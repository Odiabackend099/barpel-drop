interface WooCommerceIconProps {
  size?: number;
  className?: string;
}

/**
 * WooCommerce brand icon — rounded shopping bag in official purple #7F54B3.
 */
export function WooCommerceIcon({ size = 24, className }: WooCommerceIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="WooCommerce"
    >
      {/* Rounded bag body */}
      <rect x="2" y="5" width="20" height="16" rx="3" fill="#7F54B3" />
      {/* Bag handle arch */}
      <path
        d="M8.5 5a3.5 3.5 0 017 0"
        stroke="#7F54B3"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M8.5 5a3.5 3.5 0 017 0"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Woo "W" mark in white */}
      <path
        d="M5.5 10l1.5 5 1.5-3.5 1.5 3.5 1.5-5"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* "oo" dots */}
      <circle cx="15" cy="12.5" r="1.2" fill="white" />
      <circle cx="18" cy="12.5" r="1.2" fill="white" />
    </svg>
  );
}
