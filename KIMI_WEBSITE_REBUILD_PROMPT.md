# Kimi_Agent_Kimi — Barpel AI Website Rebuild Prompt

## Role

Act as a senior UI/UX designer and frontend engineer. You are redesigning the marketing website for **Barpel AI** — an AI-powered voice support agent for e-commerce stores. The app already has a working dashboard, onboarding wizard, signup, and login. You are ONLY rebuilding the public marketing website (the `/` homepage and its sections).

---

## Project Stack

- **Framework:** Next.js 14 (App Router)
- **UI Library:** shadcn/ui (components live in `components/ui/`)
- **Styling:** Tailwind CSS 3.4 with custom theme
- **Animations:** Framer Motion (`framer-motion` is installed as `motion`)
- **Icons:** lucide-react
- **TypeScript:** Yes, strict mode
- **Fonts:** Syne + Instrument Serif (display), DM Sans + Plus Jakarta Sans (body), Geist Mono (code)

---

## Brand Identity & Design Tokens

### Colors (MUST use these exactly)

| Token | Hex | Usage |
|-------|-----|-------|
| **Navy** | `#1B2A4A` | Hero backgrounds, dark sections, headings |
| **Teal** | `#00A99D` | Primary CTA, links, accents, icons |
| **Teal (tailwind)** | `#0d9488` | Button backgrounds, primary UI |
| **Mint** | `#7DD9C0` | Secondary accent, gradient endpoints |
| **Light Mint** | `#C8F0E8` | Subtle highlights, tag backgrounds |
| **Off-White** | `#F0F9F8` | Page background, light sections |
| **White** | `#FFFFFF` | Cards, alternate sections |
| **Text Primary** | `#1B2A4A` | Body text on light backgrounds |
| **Text Secondary** | `#4A7A6D` | Muted body text |
| **Text Muted** | `#8AADA6` | Placeholder, caption text |

### Gradients

```css
--gradient-brand: linear-gradient(135deg, #1B2A4A 0%, #00A99D 50%, #7DD9C0 100%);
--gradient-cta: linear-gradient(135deg, #00A99D, #7DD9C0);
--gradient-hero: linear-gradient(160deg, #F0F9F8 0%, #FFFFFF 50%, #E8F7F5 100%);
```

### Shadows (teal-tinted)

```css
--shadow-sm: 0 2px 8px rgba(0,169,157,0.08);
--shadow-md: 0 8px 32px rgba(0,169,157,0.12);
--shadow-lg: 0 24px 64px rgba(0,169,157,0.16);
```

### Design Language

- **Glassmorphism** cards with `backdrop-blur` and semi-transparent borders
- **Teal glow** effects on hover (box-shadow with teal alpha)
- **Smooth Framer Motion** animations on scroll (fade-in, slide-up)
- **Generous whitespace** — premium SaaS feel
- **Rounded corners** — `rounded-2xl` for cards, `rounded-full` for badges/pills

---

## Hero Section — Use BeamsBackground Component

The hero section MUST use the `<BeamsBackground />` component from `@/components/ui/beams-background`. This component renders animated teal/mint beams on a navy (`#1B2A4A`) background.

**Replace the default inner content** of `BeamsBackground` with the Barpel hero content:

```tsx
<BeamsBackground className="min-h-[90vh]">
  {/* Override the inner z-10 div with: */}
  {/* Badge: "Now with Abandoned Cart Recovery" */}
  {/* H1: "AI-Powered Voice Support for Your E-Commerce Store" */}
  {/* Subtitle: "Give every customer a dedicated AI phone line..." */}
  {/* Two CTAs: "Get started free" (teal button) + "See how it works" (ghost) */}
  {/* Trust indicators: No credit card · 14-day free trial · 100+ merchants */}
</BeamsBackground>
```

> **Important:** The BeamsBackground component has hardcoded inner content (placeholder h1 + p). You will need to modify the component to accept `children` and render them inside the `z-10` div instead of the placeholder text. The component file is at `components/ui/beams-background.tsx`.

---

## Website Sections (in order)

Rebuild ALL of these sections. Use the exact text content below. Redesign the visual layout to be modern, premium, and conversion-optimized.

### 1. Navigation

**Logo:** Use `<BarpelLogo />` from `@/components/brand/BarpelLogo.tsx` (renders `/public/logo.png`). For white variant on dark backgrounds: `<BarpelLogoWhite />`.

**Desktop Nav Items:**
- Product (dropdown): Features, How it Works, Integrations, Pricing
- Solutions (dropdown): For Dropshippers, For Shopify Stores, For TikTok Shop
- Resources (dropdown): Documentation, Blog, FAQ
- Pricing (direct link)

**CTAs:** Log In | Get started (teal button)

**Mobile:** Hamburger → slide-out menu with same items

---

### 2. Hero (with BeamsBackground)

**Badge:** "Now with Abandoned Cart Recovery"
**H1:** "AI-Powered Voice Support for Your E-Commerce Store"
**Subtitle:** "Give every customer a dedicated AI phone line. Handle order lookups, returns, and abandoned cart recovery — automatically. No humans required."
**CTA Primary:** "Get started free" → `/signup`
**CTA Secondary:** "See how it works" → scroll to How it Works
**Trust line:** No credit card · 14-day free trial · 100+ merchants

---

### 3. Logo Cloud

**Heading:** "Our Trusted Integrations"
**Subtext:** "Barpel connects with the platforms your store already runs on"
**Logos:** Shopify, TikTok Shop, WooCommerce, Amazon, Vapi AI, Twilio
> Use lucide-react icons or simple SVG text logos.

---

### 4. Intro Paragraph

**Text:** "Barpel AI is an AI-powered voice support agent for e-commerce stores. It answers customer phone calls 24/7, providing real-time order tracking, handling return requests, recovering abandoned carts through outbound calls, and answering product questions — all without human involvement. Barpel AI integrates with Shopify, TikTok Shop, WooCommerce, and Amazon, and supports natural conversations in 30+ languages. Plans start at $29/month."

---

### 5. Features

**Section Title:** "Everything your customers need, handled by AI"
**Subtitle:** "From order tracking to returns, our voice AI handles it all — 24/7, in any language."

**6 Feature Cards:**

| # | Title | Description | Icon (lucide-react) |
|---|-------|-------------|---------------------|
| 1 | Instant Order Tracking | Customers call and get real-time order status, tracking numbers, and delivery estimates — no waiting, no human agents. | `Package` |
| 2 | Hassle-Free Returns | AI explains your return policy, collects photos via SMS, and initiates the return process automatically. | `RotateCcw` |
| 3 | Smart Cart Recovery | AI calls customers 15 minutes after cart abandonment, answers questions, and helps complete the purchase. | `ShoppingCart` |
| 4 | Live Product Lookup | Customers ask about products, stock levels, and pricing. AI searches your catalog in real-time. | `Search` |
| 5 | Speak Any Language | Natural conversations in 30+ languages. Your AI assistant sounds human, not robotic. | `Globe` |
| 6 | Always On | Never miss a customer call. Handle peak seasons, holidays, and timezone differences effortlessly. | `Clock` |

---

### 6. How It Works

**Section Title:** "Get started in minutes, not months"
**Subtitle:** "Three simple steps to AI-powered customer support"

**Steps:**
1. **Connect Your Store** — One-click Shopify integration. We sync your products, orders, and policies automatically.
2. **Configure Your AI** — Set your brand voice, return policies, and escalation rules. Your AI learns your business.
3. **Start Taking Calls** — Get a dedicated phone number. Customers call, AI answers. Watch your support tickets drop.

**Trust Badge:** "Join 100+ merchants using Barpel"

---

### 7. Integrations

**Section Title:** "Connect Barpel to the tools you already use"
**Subtitle:** "Boost productivity with seamless integrations"

**Integration Logos:** Shopify, Twilio, Vapi AI, Supabase

**Featured Cards:**
1. **Shopify Suite** — Connect your Shopify store in one click. Sync products, orders, and customer data automatically.
2. **Voice & SMS** — Powered by Twilio and Vapi AI for crystal-clear voice calls and SMS notifications.

---

### 8. Pricing

**Section Title:** "Pick the perfect plan for your store"
**Subtitle:** "Start free, upgrade as you grow. No hidden fees."

| Plan | Price | Description | Features |
|------|-------|-------------|----------|
| **Starter** | $29/mo | For small stores just getting started | 30 credits/month, 1 phone number, Shopify integration, Order tracking, Email support |
| **Growth** ⭐ | $79/mo | For growing businesses | 100 credits/month, 3 phone numbers, All integrations, Returns handling, Cart recovery, Priority support |
| **Scale** | $179/mo | For high-volume stores | 250 credits/month, 10 phone numbers, Custom AI training, Advanced analytics, Dedicated account manager |

**Enterprise:** "Custom volume pricing, dedicated SLAs, white-glove onboarding" → "Contact us"
**Footer note:** "Secured by Dodo Payments · Cancel anytime"
**Toggle:** Monthly / Yearly (save 10%)

---

### 9. Compare

**Title:** "Barpel AI vs. the alternatives"
**Subtitle:** "See how Barpel AI compares to Gorgias and hiring a virtual assistant."

| Feature | Barpel AI | Gorgias | Hiring a VA |
|---------|-----------|---------|-------------|
| Monthly cost | From $29 | From $60 | $300–800 |
| Voice calls | ✅ Yes | ❌ No | ✅ Yes |
| 24/7 coverage | ✅ Always | Text only | Time zones |
| Setup time | 5 minutes | Days | 1–2 weeks |
| Cart recovery | Automated | Manual | Manual |
| Languages | 30+ | Limited | 1–2 |

---

### 10. Testimonials

**Section Title:** "Real stores, real results with Barpel"
**Subtitle:** "From Shopify to TikTok Shop — merchants across every platform trust Barpel."

**Testimonial 1:**
> "Before Barpel, our support inbox was flooded with 'Where is my order?' questions. Now the AI handles all of it. We went from 60+ daily tickets to under 10."
> — **Sarah K.**, Founder, NovaDrop Co. (Shopify + TikTok Shop) ⭐⭐⭐⭐⭐

**Testimonial 2:**
> "The abandoned cart recovery alone paid for the entire year. Barpel called back 3 customers in one night and recovered $890 in orders."
> — **James T.**, Owner, VeloGear Supplies (Shopify) ⭐⭐⭐⭐⭐

**Testimonial 3:**
> "I used to miss calls on weekends and lose sales. Barpel answers instantly, handles returns professionally, and my customers don't even know it's AI."
> — **Amara O.**, Co-founder, LuxeFinds Store (WooCommerce) ⭐⭐⭐⭐⭐

---

### 11. Security

**Section Title:** "Built to keep your business secure"
**Subtitle:** "Enterprise-grade security with SOC 2 compliance, data encryption, and privacy protections."

**4 Badges:**
1. **SOC 2 Type II** — Audited annually by independent third parties
2. **HIPAA Ready** — Healthcare-grade data privacy controls
3. **GDPR Compliant** — Full EU data protection compliance
4. **End-to-End Encrypted** — All call data encrypted in transit and at rest

---

### 12. FAQ

**Section Title:** "Frequently asked questions"
**Subtitle:** "Everything you need to know about Barpel AI."

**10 Q&As:**

1. **What is Barpel AI?** — Barpel AI is an AI-powered voice support agent built for e-commerce stores. It answers customer phone calls 24/7, handles order tracking, processes return requests, recovers abandoned carts via outbound calls, and responds to product questions — all automatically. It integrates with Shopify, TikTok Shop, WooCommerce, and Amazon. Plans start at $29/month.

2. **How much does Barpel AI cost?** — Starter at $29/month (30 credits, 1 phone number), Growth at $79/month (100 credits, 3 phone numbers, cart recovery), Scale at $179/month (250 credits, 10 phone numbers, custom AI training). All plans include a 14-day free trial — no credit card required.

3. **Does Barpel AI work with Shopify?** — Yes. Native Shopify integration. Real-time order data, tracking numbers, delivery estimates, and product inventory.

4. **Does Barpel AI work with TikTok Shop?** — Yes. Order tracking, return requests, and product questions for TikTok Shop customers.

5. **How fast does Barpel AI answer calls?** — Average response time of 2.3 seconds. 24/7, no hold times, no voicemail.

6. **Can Barpel AI handle returns and refunds?** — Yes. Explains return policy, collects photos via SMS, initiates return process automatically.

7. **What languages does Barpel AI support?** — 30+ languages including English, Spanish, French, German, Portuguese, Japanese, Korean, and Chinese.

8. **How do I set up Barpel AI?** — Under 5 minutes: connect your store, configure your AI, get a phone number. No coding required.

9. **Is Barpel AI secure and compliant?** — SOC 2 Type II, GDPR compliant, HIPAA ready. All data encrypted end-to-end.

10. **Does Barpel AI replace my support team?** — It handles 80%+ of repetitive inquiries automatically, freeing your team for complex interactions.

---

### 13. CTA

**Headline:** "Power up your customer support"
**Subtitle:** "Get started in seconds — for free. No credit card required."
**CTA Primary:** "Start for free" → `/signup`
**CTA Secondary:** "Get a demo"

---

### 14. Footer

**Brand tagline:** "AI-powered voice support for modern e-commerce. Handle customer calls automatically, 24/7."

**Link Columns:**

| Product | Solutions | Resources | Company |
|---------|-----------|-----------|---------|
| Features | For Dropshippers | Help Center | About Us |
| How it Works | For Shopify Stores | Blog | Careers |
| Integrations | For TikTok Shop | Customer Stories | Contact |
| Pricing | For Amazon Sellers | FAQ | Partners |
| API Documentation | | Developer Tools | Press Kit |

**Social:** Facebook, X (Twitter), LinkedIn, YouTube, TikTok
**Bottom:** © 2026 Barpel AI Inc. All rights reserved. | Privacy Policy | Terms of Service | Data Processing | Cookies

---

## SEO / Structured Data

Keep the existing JSON-LD schema in `app/page.tsx` — Organization, SoftwareApplication, and FAQPage.

**Meta:**
- Title: "Barpel AI | AI Voice Support for E-Commerce Stores"
- Description: "AI phone agent for e-commerce stores. Answers calls 24/7, tracks orders, handles returns, recovers carts. 2.3s response. Free 14-day trial."
- Canonical: `https://dropship.barpel.ai`

---

## File Structure

```
app/page.tsx                              ← Homepage (imports all sections)
components/ui/beams-background.tsx        ← Animated beam background (already installed)
components/marketing/Navigation.tsx       ← Top nav
components/marketing/sections/Hero.tsx    ← Hero with BeamsBackground
components/marketing/sections/LogoCloud.tsx
components/marketing/sections/Features.tsx
components/marketing/sections/HowItWorks.tsx
components/marketing/sections/Integrations.tsx
components/marketing/sections/Pricing.tsx
components/marketing/sections/Compare.tsx
components/marketing/sections/Testimonials.tsx
components/marketing/sections/Security.tsx
components/marketing/sections/HomeFAQ.tsx
components/marketing/sections/CTA.tsx
components/marketing/sections/Footer.tsx
components/brand/BarpelLogo.tsx           ← Logo components (already exists)
```

---

## Design Requirements

1. **Mobile-first responsive** — all sections must look great on 375px, 768px, and 1440px
2. **Scroll animations** — Use Framer Motion `whileInView` for fade-in/slide-up on every section
3. **Glassmorphism cards** — Semi-transparent backgrounds with `backdrop-blur-xl` and subtle teal borders
4. **Gradient text** — Use `bg-gradient-to-r from-teal-400 to-mint bg-clip-text text-transparent` for emphasis
5. **Hover effects** — Teal glow shadow on cards, scale transforms on CTAs
6. **Dark hero / light body** — Hero is navy with beams. Body sections alternate between off-white and white
7. **Sticky nav** — Navigation should be sticky with blur backdrop on scroll
8. **Accessibility** — All interactive elements must have focus states, proper ARIA labels, semantic HTML

---

## What NOT to touch

- `/signup`, `/login` pages
- `/onboarding` wizard
- `/dashboard` and all dashboard routes
- Supabase auth configuration
- Payment integrations
- Any API routes

You are ONLY rebuilding the marketing website homepage and its component sections.
