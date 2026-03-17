import type { Metadata } from 'next';
import HowItWorksContent from './HowItWorksContent';

export const metadata: Metadata = {
  title: 'How Barpel AI Works | Setup in Under 5 Minutes',
  description:
    'Connect your Shopify store, configure your AI persona, and go live in under 10 minutes. See the full setup process.',
  alternates: {
    canonical: 'https://barpel.ai/how-it-works',
  },
};

export default function HowItWorksPage() {
  return <HowItWorksContent />;
}
