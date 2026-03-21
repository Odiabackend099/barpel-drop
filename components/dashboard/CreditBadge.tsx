'use client';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface CreditBadgeProps {
  balanceSeconds: number;
  loading?: boolean;
}

export function CreditBadge({ balanceSeconds, loading }: CreditBadgeProps) {
  if (loading) {
    return <div className="h-7 w-20 animate-pulse rounded-full bg-muted" />;
  }

  const formatBalance = (seconds: number): string => {
    if (seconds <= 0) return '0 sec';
    if (seconds < 60) return `${seconds} sec`;
    const minutes = Math.floor(seconds / 60);
    const remainingSecs = seconds % 60;
    // Under 5 minutes: show "X cr Y sec" (or "X credits" if exactly on minute boundary)
    if (seconds < 300) {
      return remainingSecs === 0 ? `${minutes} credits` : `${minutes} cr ${remainingSecs}s`;
    }
    // 5 minutes and above: show "X credits"
    return `${minutes} credits`;
  };

  // Thresholds in seconds
  const isZero = balanceSeconds <= 0;
  const isLowRed = balanceSeconds > 0 && balanceSeconds < 300;   // 1 sec – 4 min 59 sec: red pulse
  const isAmber = balanceSeconds >= 300 && balanceSeconds < 600;  // 5 min – 9 min 59 sec: amber
  // 600+ seconds (10+ min): green

  const colorClass = isZero
    ? 'bg-red-100 text-red-700 border-red-200'
    : isLowRed
    ? 'bg-red-50 text-red-600 border-red-100 animate-pulse'
    : isAmber
    ? 'bg-amber-50 text-amber-600 border-amber-100'
    : 'bg-brand-50 text-brand-700 border-brand-100';

  const display = formatBalance(balanceSeconds);

  return (
    <Link href="/dashboard/billing">
      <span className={cn(
        'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors duration-200 cursor-pointer hover:opacity-80',
        colorClass
      )}>
        {isZero && <AlertCircle className="h-3 w-3 animate-pulse" />}
        {display}
      </span>
    </Link>
  );
}
