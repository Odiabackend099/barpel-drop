export type HealthStatus = "healthy" | "at-risk" | "churned";

export interface HealthInput {
  planStatus: string | null;
  lastSignInAt: string | null;
  lastCallAt: string | null;
  creditBalance: number;
  plan: string | null;
  callsLast7Days: number;
  callsLast30Days: number;
  createdAt: string;
}

export function computeHealthScore(input: HealthInput): HealthStatus {
  const now = Date.now();
  const daysSince = (iso: string | null): number => {
    if (!iso) return Infinity;
    return (now - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
  };

  const daysSinceLogin = daysSince(input.lastSignInAt);
  const daysSinceCall = daysSince(input.lastCallAt);
  const accountAgeDays = daysSince(input.createdAt);

  // Cancelled or final dunning → churned
  if (input.planStatus === "cancelled" || input.planStatus === "past_due_final") {
    return "churned";
  }

  // No login and no calls in 30+ days → churned
  if (daysSinceLogin > 30 && daysSinceCall > 30) {
    return "churned";
  }

  // In dunning → at-risk
  if (input.planStatus?.startsWith("past_due")) {
    return "at-risk";
  }

  // No login in 7+ days (grace period for new accounts < 2 days)
  if (daysSinceLogin > 7 && accountAgeDays > 2) {
    return "at-risk";
  }

  // Usage dropped to zero (had calls in 30d but none in 7d)
  if (input.callsLast7Days === 0 && input.callsLast30Days > 0) {
    return "at-risk";
  }

  // Free trial with zero credits
  if (input.creditBalance <= 0 && input.plan === "free_trial") {
    return "at-risk";
  }

  return "healthy";
}
