/**
 * Base system prompt prepended to every Barpel AI assistant.
 * Replace {BUSINESS_NAME} before sending to Vapi.
 * Single source of truth — imported by phoneService.ts and api/merchant routes.
 */
export const BASE_PROMPT = `You are a professional AI support agent for {BUSINESS_NAME}. Your job is to help customers with:
1. Order tracking — look up their order status using the lookup_order tool
2. Return requests — initiate returns using the initiate_return tool
3. Store policies — explain policies using the get_store_policy tool

Always be warm, professional, and concise. Resolve issues in under 60 seconds when possible.
If you cannot find an order, ask for the order number politely.
Never make up tracking information. Use the tools to get real data.`;

/** Default first message spoken by the AI when a call is answered */
export const DEFAULT_FIRST_MESSAGE = "Thank you for calling {BUSINESS_NAME} support. How can I help you today?";

/** ElevenLabs voice options available for Barpel AI assistants */
export const ELEVENLABS_VOICES = [
  { id: "EXAVITQu4vr4xnSDxMaL", label: "Bella", description: "Warm & Professional" },
  { id: "21m00Tcm4TlvDq8ikWAM", label: "Rachel", description: "Clear & Friendly" },
  { id: "TxGEqnHWrfWFTfGW9XjX", label: "Josh", description: "Confident & Direct" },
  { id: "MF3mGyEYCl7XYWbV9V6O", label: "Elli", description: "Energetic & Helpful" },
] as const;

/** Valid ElevenLabs voice IDs (whitelist for security validation) */
export const VALID_VOICE_IDS = ELEVENLABS_VOICES.map((v) => v.id) as string[];

/** Valid AI models for Vapi assistants */
export const VALID_AI_MODELS = ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini"] as const;

/** Valid voice providers for Vapi assistants */
export const VALID_VOICE_PROVIDERS = ["11labs", "azure", "deepgram", "playht"] as const;

/** Barpel brand color values */
export const COLORS = {
  bg: "#FFFFFF",
  surface: "#F0F9F8",
  card: "#FFFFFF",
  border: "#D0EDE8",
  navy: "#1B2A4A",
  teal: "#00A99D",
  mint: "#7DD9C0",
  lightMint: "#C8F0E8",
  text: "#1B2A4A",
  textSecondary: "#4A7A6D",
  muted: "#8AADA6",
  green: "#00A99D",
  orange: "#F5A623",
  red: "#E74C3C",
  footerBg: "#1B2A4A",
} as const;

/** Credit packages available for purchase (1 credit = 1 minute) */
export const CREDIT_PACKAGES = [
  { id: "starter", name: "Starter", minutes: 50, priceUsdCents: 2900, perMin: 0.58 },
  { id: "growth", name: "Growth", minutes: 200, priceUsdCents: 7900, perMin: 0.40, popular: true },
  { id: "scale", name: "Scale", minutes: 600, priceUsdCents: 17900, perMin: 0.30 },
] as const;

/** AI persona quick-start templates */
export const PERSONA_TEMPLATES = [
  {
    id: "professional",
    label: "Professional & Formal",
    prompt:
      "You are a professional customer service representative for [Brand]. Speak formally and courteously. Always address the customer respectfully and provide clear, concise information.",
  },
  {
    id: "friendly",
    label: "Chill & Friendly",
    prompt:
      "You are a laid-back, friendly support agent for [Brand]. Use casual language, make customers feel at ease. Keep the tone warm and approachable.",
  },
  {
    id: "luxury",
    label: "Luxury Brand",
    prompt:
      "You represent an exclusive, high-end brand. Speak with sophistication and elegance. Make every customer feel like a VIP. Use refined language and express genuine appreciation for their business.",
  },
  {
    id: "urgent",
    label: "Urgent/Fast-Paced",
    prompt:
      "You are a fast, efficient support agent. Get straight to the point while remaining polite. Value the customer's time above all else and resolve issues quickly.",
  },
] as const;

/** Sentiment configuration for display */
export const SENTIMENT_CONFIG = {
  positive: { label: "Positive", color: "#00A99D", emoji: "satisfied" },
  neutral: { label: "Neutral", color: "#F5A623", emoji: "neutral" },
  negative: { label: "Negative", color: "#E74C3C", emoji: "dissatisfied" },
} as const;

/** Call type badge colors */
export const CALL_TYPE_COLORS: Record<string, string> = {
  order_lookup: "#00A99D",
  return_request: "#F5A623",
  abandoned_cart_recovery: "#7DD9C0",
  general: "#8AADA6",
} as const;
