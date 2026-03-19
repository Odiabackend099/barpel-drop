import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Barpel AI Blog | AI Voice Support for E-Commerce',
  alternates: {
    canonical: 'https://dropship.barpel.ai/blog',
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
