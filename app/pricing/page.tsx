import type { Metadata } from 'next';
import PricingContent from './PricingContent';

export const metadata: Metadata = {
  title: 'Barpel AI Pricing | Plans from $29/mo',
  description:
    'Barpel AI plans from $29/mo. Shopify integration, 24/7 AI phone support, cart recovery. 14-day free trial — no credit card needed.',
  alternates: {
    canonical: 'https://dropship.barpel.ai/pricing',
  },
};

export default function PricingPage() {
  return <PricingContent />;
}
