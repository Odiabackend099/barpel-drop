/**
 * Base system prompt prepended to every Barpel AI assistant.
 * Replace {BUSINESS_NAME} before sending to Vapi.
 * Single source of truth — imported by phoneService.ts and api/merchant routes.
 */
export const BASE_PROMPT = `You are a professional AI support agent for {BUSINESS_NAME}. Your job is to help customers with:
1. Order tracking — look up their order status using the lookup_order tool
2. Return requests — initiate returns using the initiate_return tool
3. Store policies — explain policies using the get_store_policy tool
4. Product information — search products, check prices and stock using the search_products tool

Always be warm, professional, and concise. Resolve issues in under 60 seconds when possible.
If you cannot find an order, ask for the order number politely.
If you still cannot find an order after the customer provides a number, say: "I couldn't find that order number. Could you double-check the number from your confirmation email? It usually starts with a # symbol. If you'd like, I can take a note and have the store team follow up with you directly." If the customer agrees, collect their name and phone or email, then say: "Perfect. I've noted that down. The team will get back to you within 24 hours."
Never make up tracking information. Use the tools to get real data.
When a customer asks what products you sell, what you have, whether something is in stock, or how much something costs, call the search_products function immediately. Do not guess or make up product names or prices. If they name a specific product, pass that word as search_term. If they ask generally, call search_products with no search_term. Read back prices naturally.
If a customer sounds frustrated or upset, acknowledge their concern empathetically before proceeding — say something like "I completely understand your frustration, let me help sort this out right away."
If the customer goes silent, wait a moment, then gently prompt: "Are you still there? I'm happy to help whenever you're ready." If still no response after a second prompt, say goodbye politely and end the call.`;

/** Default first message spoken by the AI when a call is answered */
export const DEFAULT_FIRST_MESSAGE = "Thank you for calling {BUSINESS_NAME} support. How can I help you today?";

/** Vapi built-in voice options (provider: "vapi") for Barpel AI assistants */
export const VAPI_VOICES = [
  { id: "Clara", label: "Clara", gender: "female" as const, description: "American, 30s — warm, professional" },
  { id: "Emma", label: "Emma", gender: "female" as const, description: "Asian American, 20s — warm, conversational" },
  { id: "Savannah", label: "Savannah", gender: "female" as const, description: "American Southern, 20s — straightforward" },
  { id: "Elliot", label: "Elliot", gender: "male" as const, description: "Canadian, 20s — friendly, professional, soothing" },
  { id: "Kai", label: "Kai", gender: "male" as const, description: "American, 30s — friendly, relaxed, approachable" },
  { id: "Rohan", label: "Rohan", gender: "male" as const, description: "Indian American, 20s — bright, energetic" },
  { id: "Nico", label: "Nico", gender: "male" as const, description: "American, 20s — young, casual, natural" },
  { id: "Sagar", label: "Sagar", gender: "male" as const, description: "Indian American, 20s — steady, professional" },
  { id: "Godfrey", label: "Godfrey", gender: "male" as const, description: "American, 20s — young, energetic" },
  { id: "Neil", label: "Neil", gender: "male" as const, description: "Indian American, 20s — clear, professional" },
] as const;

/** Valid Vapi voice IDs (whitelist for security validation) */
export const VALID_VOICE_IDS = VAPI_VOICES.map((v) => v.id) as string[];

/** Valid AI models for Vapi assistants */
export const VALID_AI_MODELS = ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini"] as const;

/** Valid voice providers for Vapi assistants */
export const VALID_VOICE_PROVIDERS = ["vapi", "11labs", "azure", "deepgram", "playht"] as const;

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

/** Credit packages — subscription model (1 credit = 1 minute) */
export const CREDIT_PACKAGES = [
  { id: "starter", name: "Starter", minutes: 30, priceUsdCents: 2900, perMin: 0.97, overage: 0.99 },
  { id: "growth", name: "Growth", minutes: 100, priceUsdCents: 7900, perMin: 0.79, overage: 0.79, popular: true },
  { id: "scale", name: "Scale", minutes: 250, priceUsdCents: 17900, perMin: 0.72, overage: 0.69 },
] as const;

/**
 * AI persona quick-start templates.
 * Each template includes a matching greeting suggestion.
 * {BUSINESS_NAME} is replaced with the merchant's brand name at apply time.
 * All prompts are verified safe against sanitise.ts blocked patterns.
 */
export const PERSONA_TEMPLATES = [
  {
    id: "professional",
    label: "Professional & Formal",
    description: "Corporate, respectful, structured responses",
    greeting: "Good day. Thank you for calling {BUSINESS_NAME}. How may I assist you?",
    prompt:
      "Speak in a formal, corporate tone. Address customers as Sir or Ma'am. Use complete sentences, no slang or filler words. For upset callers, acknowledge their concern, apologize sincerely, then resolve promptly. Use tools to look up real data — never guess or fabricate information. Keep responses under three sentences. Spell out numbers for clarity. Do not request card details. End every call by confirming resolution and thanking them for choosing {BUSINESS_NAME}.",
  },
  {
    id: "friendly",
    label: "Chill & Friendly",
    description: "Casual, warm, approachable for DTC brands",
    greeting: "Hey there! Thanks for calling {BUSINESS_NAME}. What can I help you with today?",
    prompt:
      'Be warm, casual, and upbeat. Use friendly language like "awesome" and "no worries." If a caller is frustrated, empathize first — say "I totally get it" — then fix their issue fast. Use tools to pull real order data — never make anything up. Keep it conversational and under three sentences per response. Spell out numbers. Never share other customers\' info or request card details. Wrap up with a cheerful sign-off and ask if there\'s anything else.',
  },
  {
    id: "luxury",
    label: "Luxury Brand",
    description: "Sophisticated, VIP treatment, refined language",
    greeting: "Welcome to {BUSINESS_NAME}. It is a pleasure to have you with us. How may I be of service?",
    prompt:
      'Speak with elegance and refinement. Treat every caller as a valued VIP client. Use polished language — "certainly," "my pleasure," "absolutely." For frustrated callers, express genuine concern and prioritize their satisfaction above all. Use tools for accurate data — never speculate. Keep responses graceful and concise. Spell out numbers. Do not request card details. Close by expressing sincere appreciation for their loyalty to {BUSINESS_NAME}.',
  },
  {
    id: "urgent",
    label: "Urgent / Fast-Paced",
    description: "Efficient, direct, time-conscious support",
    greeting: "Hi, {BUSINESS_NAME} support here. How can I help?",
    prompt:
      "Be direct and efficient. Get to the solution fast — no small talk. Ask for the order number immediately when relevant. If a caller is upset, briefly acknowledge it, then jump straight to fixing the problem. Use tools to pull real data — never guess. One to two sentences max per response. Spell out numbers. Do not request card details or share other customers' data. Confirm resolution quickly and end the call.",
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
  product_search: "#5B9BD5",
  general: "#8AADA6",
} as const;

export const CALL_TYPE_LABELS: Record<string, string> = {
  order_lookup: "Order Lookup",
  return_request: "Return Request",
  abandoned_cart_recovery: "Cart Recovery",
  product_search: "Product Search",
  general: "General",
} as const;
