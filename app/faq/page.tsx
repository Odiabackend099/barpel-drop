import type { Metadata } from 'next';
import FAQContent from './FAQContent';

export const metadata: Metadata = {
  title: 'Barpel AI FAQ | Common Questions Answered',
  description:
    'Answers to common questions about Barpel AI voice support, Shopify integration, pricing, and getting started.',
  alternates: {
    canonical: 'https://dropship.barpel.ai/faq',
  },
};

export default function FAQPage() {
  return <FAQContent />;
}
