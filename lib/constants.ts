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

/** Credit packages available for purchase */
export const CREDIT_PACKAGES = [
  { id: "starter", name: "Starter", minutes: 100, priceUsdCents: 1999, perMin: 0.2 },
  { id: "growth", name: "Growth", minutes: 500, priceUsdCents: 7999, perMin: 0.16, popular: true },
  { id: "scale", name: "Scale", minutes: 1500, priceUsdCents: 19999, perMin: 0.13 },
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
  happy: { label: "Happy", color: "#00A99D", emoji: "satisfied" },
  neutral: { label: "Neutral", color: "#F5A623", emoji: "neutral" },
  angry: { label: "Angry", color: "#E74C3C", emoji: "dissatisfied" },
} as const;

/** Call type badge colors */
export const CALL_TYPE_COLORS: Record<string, string> = {
  WISMO: "#00A99D",
  "Return/Refund": "#F5A623",
  "Abandoned Cart": "#7DD9C0",
  "Product Inquiry": "#1B2A4A",
  "General Inquiry": "#8AADA6",
  "Address Change": "#4A7A6D",
  "Payment Issue": "#E74C3C",
  other: "#8AADA6",
} as const;
