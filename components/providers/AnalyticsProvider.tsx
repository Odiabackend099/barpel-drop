"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/analytics";

/** Initialises PostHog analytics on mount. Wrap at root layout level. */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAnalytics();
  }, []);

  return <>{children}</>;
}
