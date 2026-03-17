import type { Metadata } from 'next';
import FeaturesContent from './FeaturesContent';

export const metadata: Metadata = {
  title: 'AI Voice Features | Order Tracking & Cart Recovery',
  description:
    'Order tracking, automated returns, smart cart recovery, 30+ languages. Barpel AI handles customer calls so you never have to.',
  alternates: {
    canonical: 'https://barpel.ai/features',
  },
};

export default function FeaturesPage() {
  return <FeaturesContent />;
}
