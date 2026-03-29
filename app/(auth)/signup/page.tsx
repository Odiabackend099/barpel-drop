import type { Metadata } from 'next';
import SignupContent from './SignupContent';

export const metadata: Metadata = {
  title: 'Start Free Trial | Barpel AI',
  description:
    'Create your free Barpel AI account. 5 free credits to start — no credit card required. AI voice support for your e-commerce store.',
  alternates: {
    canonical: 'https://dropship.barpel.ai/signup',
  },
};

export default function SignupPage() {
  return <SignupContent />;
}
