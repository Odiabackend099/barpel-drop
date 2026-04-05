"use client";

import { useEffect } from "react";

/** Initialises PostHog analytics on mount. Wrap at root layout level. */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    import("@/lib/analytics").then(({ initAnalytics }) => initAnalytics());
  }, []);

  return <>{children}</>;
}
