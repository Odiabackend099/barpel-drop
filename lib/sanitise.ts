/**
 * Blocked patterns for merchant custom prompts.
 * Each entry has a regex and a human-readable reason for the block.
 * Patterns align with spec Part Four security requirement 6 (B-16).
 */
const BLOCKED_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  // Payment / PII collection
  { pattern: /credit\s*card/i, reason: "Collecting payment card information is not permitted" },
  { pattern: /card\s*number/i, reason: "Collecting card numbers is not permitted" },
  { pattern: /\bcvv\b/i, reason: "Collecting CVV is not permitted" },
  { pattern: /bank\s*account/i, reason: "Collecting bank account details is not permitted" },
  { pattern: /routing\s*number/i, reason: "Collecting routing numbers is not permitted" },
  { pattern: /collect\s*payment/i, reason: "Instructing AI to collect payments is not permitted" },
  { pattern: /take\s*payment/i, reason: "Instructing AI to take payments is not permitted" },
  { pattern: /process\s*payment/i, reason: "Instructing AI to process payments is not permitted" },

  // Prompt injection / instruction override
  { pattern: /ignore\s*instructions/i, reason: "Attempting to override AI instructions is not permitted" },
  { pattern: /ignore\s*previous/i, reason: "Attempting to override AI instructions is not permitted" },
  { pattern: /ignore\s*all/i, reason: "Attempting to override AI instructions is not permitted" },
  { pattern: /disregard/i, reason: "Attempting to override AI instructions is not permitted" },
  { pattern: /jailbreak/i, reason: "Jailbreak attempts are not permitted" },
  { pattern: /system\s*prompt/i, reason: "Referencing system prompts is not permitted" },
  { pattern: /you\s*are\s*now/i, reason: "Attempting to redefine AI identity is not permitted" },

  // Impersonation
  { pattern: /impersonate/i, reason: "Impersonation instructions are not permitted" },
  { pattern: /pretend\s*to\s*be/i, reason: "Impersonation instructions are not permitted" },
  { pattern: /\bact\s+as\b/i, reason: "Role-play instructions that could override AI identity are not permitted" },
];

const MAX_PROMPT_LENGTH = 500;

/**
 * Sanitises a merchant's custom AI prompt before sending to Vapi.
 * Enforces a 500-character limit and blocks known injection patterns.
 *
 * Returns { valid, sanitized, blockedReason? } per B-16 spec.
 * Does NOT throw — caller decides how to handle blocked prompts.
 *
 * @param raw - The raw prompt string from the merchant
 * @returns Sanitisation result with valid flag and optional blocked reason
 */
export function sanitiseMerchantPrompt(raw: string): {
  valid: boolean;
  sanitized: string;
  blockedReason?: string;
} {
  const trimmed = raw.trim().slice(0, MAX_PROMPT_LENGTH);

  for (const { pattern, reason } of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { valid: false, sanitized: "", blockedReason: reason };
    }
  }

  return { valid: true, sanitized: trimmed };
}
