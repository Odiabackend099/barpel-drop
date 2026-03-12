/**
 * Delay values in milliseconds for retry attempts.
 * Optimised for Nigerian network conditions (MTN/Airtel 3G/4G):
 * short initial delay, escalating quickly.
 */
const DEFAULT_DELAYS = [250, 500, 1000];

/**
 * Executes a function with exponential backoff retry.
 * All external API calls (Shopify, AfterShip, Twilio, Vapi)
 * should be wrapped with this to handle transient network failures.
 *
 * @param fn - The async function to execute
 * @param attempts - Maximum number of attempts (default: 3)
 * @param context - Description for error logging (e.g. 'shopify_order_lookup')
 * @returns The result of the function
 * @throws The last error if all attempts fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  context = "unknown"
): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts - 1) {
        throw err;
      }
      const delay = DEFAULT_DELAYS[i] ?? DEFAULT_DELAYS[DEFAULT_DELAYS.length - 1];
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  // Unreachable, but TypeScript needs it
  throw new Error(`withRetry: all ${attempts} attempts failed for ${context}`);
}
