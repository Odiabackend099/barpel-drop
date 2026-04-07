import { timingSafeEqual, createHmac, randomBytes } from "crypto";

/**
 * Verifies an HMAC-SHA256 signature using constant-time comparison.
 * NEVER use `===` for signature comparison — vulnerable to timing attacks.
 *
 * @param payload - The raw request body as a Buffer
 * @param secret - The shared secret key
 * @param receivedSignature - The signature from the request header (hex string)
 * @returns true if the signature matches
 */
export function verifyHmacSha256(
  payload: Buffer,
  secret: string,
  receivedSignature: string
): boolean {
  const expectedSig = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  try {
    return timingSafeEqual(
      Buffer.from(expectedSig, "hex"),
      Buffer.from(receivedSignature, "hex")
    );
  } catch {
    // Buffers of different lengths throw — treat as invalid
    return false;
  }
}

/**
 * Verifies the Vapi webhook secret header.
 * Vapi uses a simple shared secret in the x-vapi-secret header.
 *
 * @param receivedSecret - The value from the x-vapi-secret header
 * @param expectedSecret - The VAPI_WEBHOOK_SECRET env var
 * @returns true if the secrets match (constant-time)
 */
export function verifyVapiSecret(
  receivedSecret: string,
  expectedSecret: string
): boolean {
  try {
    return timingSafeEqual(
      Buffer.from(receivedSecret),
      Buffer.from(expectedSecret)
    );
  } catch {
    return false;
  }
}

/**
 * Verifies Shopify webhook HMAC signatures.
 *
 * IMPORTANT: Shopify webhook headers use base64 encoding (NOT hex).
 * The OAuth callback HMAC uses hex — use verifyHmacSha256 for that.
 *
 * @param payload - The raw request body as a Buffer or string
 * @param secret - The per-shop webhook secret (from Vault) or SHOPIFY_API_SECRET
 * @param receivedSignature - The base64 value from X-Shopify-Hmac-SHA256 header
 * @returns true if the signature matches
 */
export function verifyShopifyWebhook(
  payload: Buffer | string,
  secret: string,
  receivedSignature: string
): boolean {
  const expectedSig = createHmac("sha256", secret)
    .update(payload)
    .digest("base64");
  try {
    const expectedBuf = Buffer.from(expectedSig, "base64");
    const receivedBuf = Buffer.from(receivedSignature, "base64");
    // timingSafeEqual requires equal-length buffers
    if (expectedBuf.length !== receivedBuf.length) return false;
    return timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}

/**
 * Generates a cryptographically random nonce.
 * @param bytes - Number of random bytes (default 32 = 64 hex chars)
 */
export function generateNonce(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * Redacts PII from a string for safe logging.
 * Replaces phone numbers, emails, and card-like number sequences.
 */
export function redactPii(text: string): string {
  return text
    // Formatted phone numbers: (123) 456-7890, 123-456-7890, 123.456.7890
    .replace(/\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}/g, "[PHONE_REDACTED]")
    // International with spaces: +44 7911 123 456
    .replace(/\+\d{1,3}[\s](\d[\s]?){7,12}/g, "[PHONE_REDACTED]")
    // Phone numbers: +234XXXXXXXXXX or 0XXXXXXXXXX patterns
    .replace(/(\+?\d{1,4})\d{4}(\d{4,})/g, (_m, prefix, suffix) => `${prefix}****${suffix.slice(-4)}`)
    // More general phone pattern
    .replace(/\b\d{10,15}\b/g, "[PHONE_REDACTED]")
    // Email addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL_REDACTED]")
    // Credit card-like sequences (13-19 digits)
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{1,7}\b/g, "[CARD_REDACTED]");
}
