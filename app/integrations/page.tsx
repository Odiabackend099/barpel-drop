import type { Metadata } from 'next';
import IntegrationsContent from './IntegrationsContent';

export const metadata: Metadata = {
  title: 'Barpel AI Integrations | Shopify, TikTok Shop & More',
  description:
    'Barpel AI connects to Shopify, TikTok Shop, WooCommerce, and Amazon. Get your AI phone agent live in under 5 minutes.',
  alternates: {
    canonical: 'https://dropship.barpel.ai/integrations',
  },
};

export default function IntegrationsPage() {
  return <IntegrationsContent />;
}
