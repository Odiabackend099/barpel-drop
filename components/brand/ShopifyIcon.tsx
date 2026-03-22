interface ShopifyIconProps {
  size?: number;
  className?: string;
}

/**
 * Shopify brand icon — official green #96BF48 shopping bag mark.
 */
export function ShopifyIcon({ size = 24, className }: ShopifyIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Shopify"
    >
      {/* Bag body */}
      <path
        d="M15.5 4.5C15.5 2.57 13.93 1 12 1S8.5 2.57 8.5 4.5H5a1 1 0 00-1 1V21a1 1 0 001 1h14a1 1 0 001-1V5.5a1 1 0 00-1-1h-3.5z"
        fill="#96BF48"
      />
      {/* Handle arch */}
      <path
        d="M9.5 4.5a2.5 2.5 0 015 0"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      {/* White S-curve detail (Shopify mark) */}
      <path
        d="M13.4 9.6c-.3-.1-.7-.2-1-.3V9c0-.6-.4-1-1-1s-1 .4-1 1v.3c-.9.3-1.4 1.1-1.4 2.1 0 1.4 1 1.9 1.9 2.3.6.3.9.5.9.9 0 .3-.3.5-.7.5-.5 0-1-.2-1.4-.5l-.5.9c.4.3 1 .5 1.5.6V17h1v-.9c1-.2 1.6-1 1.6-2 0-1.4-1-1.9-1.9-2.3-.6-.3-.9-.5-.9-.9 0-.2.2-.4.5-.4.4 0 .8.1 1.1.3l.3-1.2z"
        fill="white"
      />
    </svg>
  );
}
