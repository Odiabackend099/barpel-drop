import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | Barpel AI',
};

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
