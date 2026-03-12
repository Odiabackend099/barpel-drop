import { withRetry } from "@/lib/retry";

interface TrackingEvent {
  message: string;
  location: string | null;
  checkpointTime: string;
  tag: string;
}

interface TrackingResult {
  trackingNumber: string;
  carrier: string;
  status: string;
  estimatedDelivery: string | null;
  events: TrackingEvent[];
}

/**
 * Fetches real-time tracking data from AfterShip.
 *
 * @param trackingNumber - The carrier tracking number
 * @returns Tracking result with status and events, or null if not found
 */
/**
 * Returns true if AfterShip is configured and available.
 * When false, callers should fall back to Shopify fulfillment tracking data.
 */
export function isAfterShipEnabled(): boolean {
  const key = process.env.AFTERSHIP_API_KEY;
  return !!key && key !== 'your_real_api_key';
}

export async function getTracking(
  trackingNumber: string
): Promise<TrackingResult | null> {
  const apiKey = process.env.AFTERSHIP_API_KEY;
  // Graceful fallback — if no API key, return null so caller uses Shopify data
  if (!apiKey || apiKey === 'your_real_api_key') return null;

  const response = await withRetry(
    () =>
      fetch(
        `https://api.aftership.com/v4/trackings/${encodeURIComponent(trackingNumber)}`,
        {
          headers: {
            "as-api-key": apiKey,
            "Content-Type": "application/json",
          },
        }
      ),
    3,
    "aftership_tracking"
  );

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error(`AfterShip API error: ${response.status}`);
  }

  const json = await response.json();
  const tracking = json.data?.tracking;
  if (!tracking) return null;

  return {
    trackingNumber: tracking.tracking_number,
    carrier: tracking.slug ?? "unknown",
    status: tracking.tag ?? "Unknown",
    estimatedDelivery: tracking.expected_delivery ?? null,
    events: (tracking.checkpoints ?? []).map(
      (cp: {
        message: string;
        location: string | null;
        checkpoint_time: string;
        tag: string;
      }) => ({
        message: cp.message,
        location: cp.location,
        checkpointTime: cp.checkpoint_time,
        tag: cp.tag,
      })
    ),
  };
}

/**
 * Formats tracking data into a human-readable message for the AI voice agent.
 */
export function formatTrackingMessage(tracking: TrackingResult): string {
  const statusMap: Record<string, string> = {
    InTransit: "in transit",
    OutForDelivery: "out for delivery",
    Delivered: "delivered",
    AttemptFail: "delivery was attempted but failed",
    Exception: "experiencing a delay",
    InfoReceived: "label created, awaiting pickup by carrier",
    Pending: "pending",
  };

  // Zero checkpoints — carrier hasn't scanned yet
  if (tracking.events.length === 0) {
    return "Your order has shipped but the carrier hasn't logged a scan yet. Please check back in 24 hours or check your email for shipping updates.";
  }

  const humanStatus = statusMap[tracking.status] ?? tracking.status;
  let message = `Your package is currently ${humanStatus}.`;

  if (tracking.estimatedDelivery) {
    message += ` Estimated delivery is ${tracking.estimatedDelivery}.`;
  }

  // AfterShip checkpoints are in chronological order — last item is most recent
  const latestEvent = tracking.events[tracking.events.length - 1];
  if (latestEvent) {
    message += ` The latest update: ${latestEvent.message}`;
    if (latestEvent.location) {
      message += ` at ${latestEvent.location}`;
    }
    message += ".";
  }

  return message;
}
