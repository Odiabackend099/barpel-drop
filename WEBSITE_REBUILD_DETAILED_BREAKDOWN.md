# Barpel AI Website Rebuild — Ultra-Detailed Breakdown

## MASTER TASK LIST — Every Element, Every Word

---

## COMPONENT 1: NAVIGATION

**File:** `components/marketing/Navigation.tsx`

### Desktop Navigation (1440px+)

#### Left Section
- **Logo Component:** `<BarpelLogo size={40} />`
- **Logo Link:** href="/" className="flex items-center"

#### Center Section (Navigation Menu)
**Each menu item uses `<DropdownMenu>` from shadcn/ui**

**1. Product Dropdown**
- Label: "Product"
- Menu Items:
  - "Features" → href="#features"
  - "How it Works" → href="#how-it-works"
  - "Integrations" → href="#integrations"
  - "Pricing" → href="#pricing"

**2. Solutions Dropdown**
- Label: "Solutions"
- Menu Items:
  - "For Dropshippers" → href="#solutions/dropshippers"
  - "For Shopify Stores" → href="#solutions/shopify"
  - "For TikTok Shop" → href="#solutions/tiktok-shop"

**3. Resources Dropdown**
- Label: "Resources"
- Menu Items:
  - "Documentation" → href="/docs"
  - "Blog" → href="/blog"
  - "FAQ" → href="#faq"

**4. Pricing (Direct Link)**
- Label: "Pricing"
- Link: href="#pricing"

#### Right Section (Auth CTAs)
**1. Log In Button**
- Text: "Log In"
- Style: ghost/outline (transparent, text-teal)
- Link: href="/login"
- Hover: text becomes darker teal

**2. Get Started Button**
- Text: "Get started"
- Style: solid teal background (`bg-teal-600`)
- Link: href="/signup"
- Hover: darker teal with glow shadow

### Mobile Navigation (< 1024px)

**Hamburger Button**
- Icon: lucide-react `Menu` icon
- Color: `#1B2A4A` (navy)
- Size: 24px
- Position: top-right, sticky

**Mobile Menu (Sheet/Drawer)**
- Slide from right
- Backdrop blur
- Background: white with subtle shadow
- Padding: 24px

**Mobile Menu Items (Stacked Vertically)**
1. Logo at top (centered)
2. "Product" (expandable)
   - "Features"
   - "How it Works"
   - "Integrations"
   - "Pricing"
3. "Solutions" (expandable)
   - "For Dropshippers"
   - "For Shopify Stores"
   - "For TikTok Shop"
4. "Resources" (expandable)
   - "Documentation"
   - "Blog"
   - "FAQ"
5. "Pricing" (direct)
6. Divider (hr)
7. "Log In" button (full width, ghost style)
8. "Get started" button (full width, teal solid)

### Styling & Behavior

**Sticky Positioning**
- `position: sticky`
- `top: 0`
- `z-index: 50`
- Background: white with 95% opacity
- Backdrop: blur(20px)
- Border-bottom: 1px solid `#E8F7F5` (light teal)
- Height: 64px (desktop), 56px (mobile)
- Padding: 0 24px (desktop), 0 16px (mobile)
- Flex layout: space-between

**Hover States**
- All text links: text-teal-600, underline on hover
- Dropdown items: background-light-mint (`#C8F0E8`), rounded corners
- CTA buttons: scale(1.05), box-shadow with teal glow

---

## COMPONENT 2: HERO SECTION

**File:** `components/marketing/sections/Hero.tsx`

### Structure
```tsx
<BeamsBackground intensity="strong">
  {/* Children override BeamsBackground's default content */}
  {children go here}
</BeamsBackground>
```

> **NOTE:** Modify `components/ui/beams-background.tsx` to render children in the `z-10` div instead of hardcoded h1 + p.

### Hero Content (Inside BeamsBackground)

**1. Badge**
- Text: "Now with Abandoned Cart Recovery"
- Icon: `CheckCircle2` from lucide-react (teal)
- Style: pill badge with light-mint background
- className: "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-600 font-medium text-sm"
- Animation: fade-in from top, delay 0.2s

**2. Main Headline (H1)**
- Text: "AI-Powered Voice Support for Your E-Commerce Store"
- Size: `text-6xl md:text-7xl lg:text-8xl`
- Weight: `font-semibold`
- Color: white (`text-white`)
- Tracking: `tracking-tighter`
- Max-width: 1200px
- Animation: fade-in from top, delay 0.4s

**3. Subtitle (Paragraph)**
- Text: "Give every customer a dedicated AI phone line. Handle order lookups, returns, and abandoned cart recovery — automatically. No humans required."
- Size: `text-xl md:text-2xl lg:text-3xl`
- Color: white with 70% opacity (`text-white/70`)
- Max-width: 800px
- Line-height: `leading-relaxed`
- Animation: fade-in from top, delay 0.6s

**4. CTA Buttons Container**
- Layout: flex gap-4, justify-center
- Wrap on mobile

**CTA 1: Primary (Teal Button)**
- Text: "Get started free"
- Link: href="/signup"
- Style: solid teal background
  - bg-teal-600
  - text-white
  - px-8 py-4
  - rounded-full
  - font-semibold
- Hover: darker teal (bg-teal-700) + glow shadow `0 0 20px rgba(0,169,157,0.4)`
- Size on mobile: full width, stacked
- Animation: fade-in from bottom, delay 0.8s

**CTA 2: Secondary (Ghost Button)**
- Text: "See how it works" + arrow icon
- Icon: `ArrowRight` from lucide-react
- Link: onClick scroll to HowItWorks section (anchor "#how-it-works")
- Style: transparent with white border
  - border border-white/50
  - text-white
  - px-8 py-4
  - rounded-full
  - font-semibold
- Hover: background white/10 + border-white
- Size on mobile: full width below primary
- Animation: fade-in from bottom, delay 1s

**5. Trust Indicators (Below CTAs)**
- Layout: flex justify-center gap-8, text-center
- Responsive: stack on mobile
- 3 metrics:

  **Metric 1:**
  - Icon: `CreditCard` (white, size 20)
  - Text: "No credit card"
  - Font: `text-white/70 text-sm`

  **Metric 2:**
  - Icon: `Clock` (white, size 20)
  - Text: "14-day free trial"
  - Font: `text-white/70 text-sm`

  **Metric 3:**
  - Icon: `Users` (white, size 20)
  - Text: "100+ merchants"
  - Font: `text-white/70 text-sm`

- Animation: fade-in from bottom, delay 1.2s

### Beams Background Properties
- Intensity: "strong"
- Background color: navy `#1B2A4A`
- Min-height: 90vh (so CTA is visible without scroll)
- Beam hue range: 155-180 (teal/mint/emerald)
- Blur effect: 15px

---

## COMPONENT 3: LOGO CLOUD

**File:** `components/marketing/sections/LogoCloud.tsx`

### Container
- Background: white
- Padding: py-16 px-4
- Max-width: container (1280px)

### Heading
- Text: "Our Trusted Integrations"
- Size: `text-3xl md:text-4xl`
- Weight: `font-semibold`
- Color: navy (`#1B2A4A`)
- Alignment: `text-center`
- Max-width: 600px, centered
- Margin-bottom: mb-4

### Subheading
- Text: "Barpel connects with the platforms your store already runs on"
- Size: `text-lg md:text-xl`
- Color: `#4A7A6D` (text-secondary)
- Alignment: `text-center`
- Max-width: 600px, centered
- Margin-bottom: mb-12

### Logo Grid
- Layout: grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6
- Gap: gap-8
- Items: 6 logos (Shopify, TikTok Shop, WooCommerce, Amazon, Vapi AI, Twilio)
- Each logo:
  - Use simple text OR lucide-react icon as fallback
  - Height: h-16
  - Grayscale by default
  - Hover: opacity increase + slight scale
  - Animation: fade-in staggered (delay increases for each)

### Logo Details (placeholder names, use icons):
1. **Shopify** — `Store` icon or text "Shopify" in navy
2. **TikTok Shop** — `Music` icon or text "TikTok Shop"
3. **WooCommerce** — `ShoppingCart` icon or text "WooCommerce"
4. **Amazon** — `Globe` icon or text "Amazon"
5. **Vapi AI** — `Zap` icon or text "Vapi AI"
6. **Twilio** — `Phone` icon or text "Twilio"

---

## COMPONENT 4: INTRO PARAGRAPH

**File:** `app/page.tsx` (inline between LogoCloud and Features)

### Container
- Background: white
- Padding: py-8 px-4

### Section Wrapper
- Max-width: `max-w-4xl`
- Centered

### Paragraph Text
- Text: "Barpel AI is an AI-powered voice support agent for e-commerce stores. It answers customer phone calls 24/7, providing real-time order tracking, handling return requests, recovering abandoned carts through outbound calls, and answering product questions — all without human involvement. Barpel AI integrates with Shopify, TikTok Shop, WooCommerce, and Amazon, and supports natural conversations in 30+ languages. Plans start at $29/month."
- Size: `text-lg md:text-xl` (body-large)
- Color: `#4A7A6D` (text-secondary)
- Alignment: `text-center`
- Line-height: `leading-relaxed`
- Max-width: 100%

---

## COMPONENT 5: FEATURES SECTION

**File:** `components/marketing/sections/Features.tsx`

### Container
- Background: `#F0F9F8` (off-white)
- Padding: py-20 px-4

### Header
- Alignment: text-center
- Max-width: container

**Section Title**
- Text: "Everything your customers need, handled by AI"
- Size: `text-4xl md:text-5xl`
- Weight: `font-semibold`
- Color: navy `#1B2A4A`
- Margin-bottom: mb-6

**Section Subtitle**
- Text: "From order tracking to returns, our voice AI handles it all — 24/7, in any language."
- Size: `text-xl md:text-2xl`
- Color: `#4A7A6D` (text-secondary)
- Max-width: 800px, centered
- Margin-bottom: mb-16

### Feature Cards Grid
- Layout: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Gap: `gap-8`
- 6 cards (one for each feature)

**Each Feature Card Structure:**
- Container: rounded-2xl p-8 border border-teal-200 bg-white/80 backdrop-blur-sm
- Hover: shadow-lg with teal glow, scale(1.05)
- Animation: whileInView fade-in + slide-up

**Card Elements:**

1. **Icon Container**
   - Background: light-mint `#C8F0E8`
   - Size: 64px × 64px
   - Rounded: rounded-2xl
   - Icon color: teal `#00A99D`
   - Icon size: 32px
   - Margin-bottom: mb-4

2. **Title (H3)**
   - Text: feature name (see below)
   - Size: `text-2xl`
   - Weight: `font-semibold`
   - Color: navy `#1B2A4A`
   - Margin-bottom: mb-2

3. **Description (P)**
   - Text: feature description (see below)
   - Size: `text-base`
   - Color: `#4A7A6D` (text-secondary)
   - Line-height: `leading-relaxed`

### Feature Details

**Feature 1: Instant Order Tracking**
- Icon: `Package` (lucide-react)
- Title: "Instant Order Tracking"
- Description: "Customers call and get real-time order status, tracking numbers, and delivery estimates — no waiting, no human agents."

**Feature 2: Hassle-Free Returns**
- Icon: `RotateCcw` (lucide-react)
- Title: "Hassle-Free Returns"
- Description: "AI explains your return policy, collects photos via SMS, and initiates the return process automatically."

**Feature 3: Smart Cart Recovery**
- Icon: `ShoppingCart` (lucide-react)
- Title: "Smart Cart Recovery"
- Description: "AI calls customers 15 minutes after cart abandonment, answers questions, and helps complete the purchase."

**Feature 4: Live Product Lookup**
- Icon: `Search` (lucide-react)
- Title: "Live Product Lookup"
- Description: "Customers ask about products, stock levels, and pricing. AI searches your catalog in real-time."

**Feature 5: Speak Any Language**
- Icon: `Globe` (lucide-react)
- Title: "Speak Any Language"
- Description: "Natural conversations in 30+ languages. Your AI assistant sounds human, not robotic."

**Feature 6: Always On**
- Icon: `Clock` (lucide-react)
- Title: "Always On"
- Description: "Never miss a customer call. Handle peak seasons, holidays, and timezone differences effortlessly."

---

## COMPONENT 6: HOW IT WORKS SECTION

**File:** `components/marketing/sections/HowItWorks.tsx`

### Container
- Background: white
- Padding: py-20 px-4

### Header (Centered)

**Section Title**
- Text: "Get started in minutes, not months"
- Size: `text-4xl md:text-5xl`
- Weight: `font-semibold`
- Color: navy `#1B2A4A`
- Margin-bottom: mb-4

**Section Subtitle**
- Text: "Three simple steps to AI-powered customer support"
- Size: `text-xl md:text-2xl`
- Color: `#4A7A6D` (text-secondary)
- Max-width: 800px, centered
- Margin-bottom: mb-16

### Steps Container
- Layout: `grid grid-cols-1 md:grid-cols-3`
- Gap: `gap-8`
- Margin-bottom: mb-12

**Each Step Card:**
- Container: rounded-2xl p-8 bg-gradient-to-br from-off-white to-light-mint
- Border: 1px solid `#C8F0E8` (light-mint)
- Position: relative

**Step Number Badge**
- Text: "1", "2", "3"
- Size: `text-5xl` or `text-6xl`
- Weight: `font-bold`
- Color: teal `#00A99D`
- Opacity: 0.1
- Position: absolute top-right

**Step Content:**

1. **Step 1: Connect Your Store**
   - Number: 1
   - Title: "Connect Your Store"
   - Description: "One-click Shopify integration. We sync your products, orders, and policies automatically."

2. **Step 2: Configure Your AI**
   - Number: 2
   - Title: "Configure Your AI"
   - Description: "Set your brand voice, return policies, and escalation rules. Your AI learns your business."

3. **Step 3: Start Taking Calls**
   - Number: 3
   - Title: "Start Taking Calls"
   - Description: "Get a dedicated phone number. Customers call, AI answers. Watch your support tickets drop."

**Title (H3)**
- Size: `text-2xl`
- Weight: `font-semibold`
- Color: navy `#1B2A4A`
- Margin-bottom: mb-2

**Description (P)**
- Size: `text-base`
- Color: `#4A7A6D` (text-secondary)
- Line-height: `leading-relaxed`

### Bottom Trust Badge
- Container: rounded-full px-6 py-3
- Background: light-mint `#C8F0E8`
- Border: 1px solid teal `#00A99D`
- Icon: `CheckCircle2` (teal, size 20)
- Text: "Join 100+ merchants using Barpel"
- Color: navy `#1B2A4A`
- Font: `font-semibold text-sm`
- Alignment: centered, margin-top: mt-12

---

## COMPONENT 7: INTEGRATIONS SECTION

**File:** `components/marketing/sections/Integrations.tsx`

### Container
- Background: `#F0F9F8` (off-white)
- Padding: py-20 px-4

### Header (Centered)

**Section Title**
- Text: "Connect Barpel to the tools you already use"
- Size: `text-4xl md:text-5xl`
- Weight: `font-semibold`
- Color: navy `#1B2A4A`
- Margin-bottom: mb-4

**Section Subtitle**
- Text: "Boost productivity with seamless integrations"
- Size: `text-xl md:text-2xl`
- Color: `#4A7A6D` (text-secondary)
- Max-width: 800px, centered
- Margin-bottom: mb-16

### Logo Grid (Similar to LogoCloud)
- Layout: `grid grid-cols-2 md:grid-cols-4`
- Gap: `gap-8`
- 4 logos: Shopify, Twilio, Vapi AI, Supabase
- Each: h-20, grayscale by default, hover opacity/scale increase

### Featured Integration Cards
- Layout: `grid grid-cols-1 md:grid-cols-2`
- Gap: `gap-8`
- Margin-top: mt-16

**Card 1: Shopify Suite**
- Container: rounded-2xl p-8 bg-white border border-teal-200
- Icon: `Store` (lucide-react, teal, size 32)
- Title: "Shopify Suite"
- Description: "Connect your Shopify store in one click. Sync products, orders, and customer data automatically."
- Hover: shadow-lg + teal glow
- CTA: "Learn more" (text link with arrow)

**Card 2: Voice & SMS**
- Container: rounded-2xl p-8 bg-white border border-teal-200
- Icon: `Phone` (lucide-react, teal, size 32)
- Title: "Voice & SMS"
- Description: "Powered by Twilio and Vapi AI for crystal-clear voice calls and SMS notifications."
- Hover: shadow-lg + teal glow
- CTA: "Learn more" (text link with arrow)

---

## COMPONENT 8: PRICING SECTION

**File:** `components/marketing/sections/Pricing.tsx`

### Container
- Background: white
- Padding: py-20 px-4

### Header (Centered)

**Section Title**
- Text: "Pick the perfect plan for your store"
- Size: `text-4xl md:text-5xl`
- Weight: `font-semibold`
- Color: navy `#1B2A4A`
- Margin-bottom: mb-4

**Section Subtitle**
- Text: "Start free, upgrade as you grow. No hidden fees."
- Size: `text-xl md:text-2xl`
- Color: `#4A7A6D` (text-secondary)
- Max-width: 800px, centered
- Margin-bottom: mb-12

### Billing Toggle
- Layout: flex justify-center gap-4 mb-12
- Toggle buttons: "Monthly" | "Yearly"
- Active button: bg-teal-600 text-white
- Inactive button: bg-light-mint text-navy
- State: useState([billingPeriod, setBillingPeriod])
- Discount badge: "Save 10%" on yearly toggle

### Pricing Cards Grid
- Layout: `grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3`
- Gap: `gap-8`
- Max-width: 1400px, centered

**Card 1: Starter Plan**
- Container: rounded-2xl p-8 border-2 border-light-mint bg-white
- Popular badge: NO (not on this one)

**Card 1 Content:**
- Price: "$29" (if monthly) or "$313/year save 10%" (if yearly)
- Period text: "/month" (if monthly) or "billed annually" (if yearly)
- Title: "Starter"
- Subtitle: "For small stores just getting started"
- Features (bullet list, 5 items):
  - "30 credits/month"
  - "1 phone number"
  - "Shopify integration"
  - "Order tracking"
  - "Email support"
- CTA: "Try for free" button (outline style, text-teal)
- Link: href="/signup"

**Card 2: Growth Plan**
- Container: rounded-2xl p-8 border-2 border-teal bg-gradient-to-br from-off-white to-light-mint
- Popular badge: YES
  - Text: "Recommended" or "Popular"
  - Position: absolute top-4 right-4
  - Style: rounded-full px-4 py-1 bg-teal text-white font-semibold text-sm
- Scale: `transform scale-105` (slightly larger than others)
- Shadow: shadow-xl with teal glow

**Card 2 Content:**
- Price: "$79" (if monthly) or "$853/year save 10%" (if yearly)
- Period text: "/month" (if monthly) or "billed annually" (if yearly)
- Title: "Growth"
- Subtitle: "For growing businesses"
- Features (bullet list, 6 items):
  - "100 credits/month"
  - "3 phone numbers"
  - "All integrations"
  - "Returns handling"
  - "Abandoned cart recovery"
  - "Priority support"
- CTA: "Try for free" button (solid teal style)
- Link: href="/signup"

**Card 3: Scale Plan**
- Container: rounded-2xl p-8 border-2 border-light-mint bg-white
- Popular badge: NO

**Card 3 Content:**
- Price: "$179" (if monthly) or "$1933/year save 10%" (if yearly)
- Period text: "/month" (if monthly) or "billed annually" (if yearly)
- Title: "Scale"
- Subtitle: "For high-volume stores"
- Features (bullet list, 5 items):
  - "250 credits/month"
  - "10 phone numbers"
  - "Custom AI training"
  - "Advanced analytics"
  - "Dedicated account manager"
- CTA: "Try for free" button (outline style, text-teal)
- Link: href="/signup"

### Enterprise Section (Below Cards)
- Container: rounded-2xl p-8 border-2 border-light-mint bg-off-white
- Layout: flex justify-between items-center (responsive stack on mobile)
- Text section:
  - Title: "Enterprise"
  - Description: "Custom volume pricing, dedicated SLAs, white-glove onboarding, and a dedicated account manager for high-volume stores."
- CTA: "Contact us" button (solid teal)

### Footer Note
- Text: "Secured by Dodo Payments · Cancel anytime"
- Alignment: centered
- Font: `text-sm text-muted`
- Icons: lock icon + Dodo logo (if available)
- Margin-top: mt-12

---

## COMPONENT 9: COMPARE SECTION

**File:** `components/marketing/sections/Compare.tsx`

### Container
- Background: `#F0F9F8` (off-white)
- Padding: py-20 px-4

### Header (Centered)

**Section Title**
- Text: "Barpel AI vs. the alternatives"
- Size: `text-4xl md:text-5xl`
- Weight: `font-semibold`
- Color: navy `#1B2A4A`
- Margin-bottom: mb-4

**Section Subtitle**
- Text: "See how Barpel AI compares to Gorgias and hiring a virtual assistant for e-commerce customer support."
- Size: `text-xl md:text-2xl`
- Color: `#4A7A6D` (text-secondary)
- Max-width: 800px, centered
- Margin-bottom: mb-16

### Comparison Table
- Container: responsive horizontal scroll on mobile
- Background: white
- Border: 1px solid `#E8F7F5` (light teal)
- Rounded: rounded-2xl
- Padding: p-8

**Table Structure:**
- 4 columns: Feature | Barpel AI | Gorgias | Hiring a VA
- Header row: bold navy text, bg-light-mint

**Rows:**

1. **Monthly cost**
   - Barpel AI: "From $29"
   - Gorgias: "From $60"
   - Hiring a VA: "$300–800"
   - Highlight Barpel (bg-light-mint row)

2. **Voice calls**
   - Barpel AI: "✅ Yes"
   - Gorgias: "❌ No"
   - Hiring a VA: "✅ Yes"

3. **24/7 coverage**
   - Barpel AI: "✅ Always"
   - Gorgias: "Text only"
   - Hiring a VA: "Time zones"

4. **Setup time**
   - Barpel AI: "5 minutes"
   - Gorgias: "Days"
   - Hiring a VA: "1–2 weeks"

5. **Cart recovery**
   - Barpel AI: "✅ Automated"
   - Gorgias: "Manual"
   - Hiring a VA: "Manual"

6. **Languages**
   - Barpel AI: "30+"
   - Gorgias: "Limited"
   - Hiring a VA: "1–2"

**Table Styling:**
- Alternating row colors (white / off-white)
- Checkmarks: green color `#16a34a`
- X marks: red color `#dc2626`
- Barpel cells: light-mint background for emphasis

---

## COMPONENT 10: TESTIMONIALS SECTION

**File:** `components/marketing/sections/Testimonials.tsx`

### Container
- Background: white
- Padding: py-20 px-4

### Header (Centered)

**Section Title**
- Text: "Real stores, real results with Barpel"
- Size: `text-4xl md:text-5xl`
- Weight: `font-semibold`
- Color: navy `#1B2A4A`
- Margin-bottom: mb-4

**Section Subtitle**
- Text: "From Shopify to TikTok Shop — merchants across every platform trust Barpel to handle their customer calls."
- Size: `text-xl md:text-2xl`
- Color: `#4A7A6D` (text-secondary)
- Max-width: 800px, centered
- Margin-bottom: mb-16

### Testimonials Grid
- Layout: `grid grid-cols-1 md:grid-cols-3`
- Gap: `gap-8`

**Each Testimonial Card:**
- Container: rounded-2xl p-8 bg-off-white border border-light-mint
- Hover: shadow-lg + scale(1.02)
- Animation: whileInView fade-in + slide-up

**Card Elements:**

1. **Rating (5 stars)**
   - Icons: 5 × `Star` (lucide-react, filled, color: `#F5A623` [warning/gold])
   - Margin-bottom: mb-4

2. **Quote (Testimonial Text)**
   - Text: the testimonial quote (see below)
   - Size: `text-base`
   - Color: `#4A7A6D` (text-secondary)
   - Font-style: `italic`
   - Line-height: `leading-relaxed`
   - Margin-bottom: mb-6

3. **Author Info**
   - Container: flex gap-3 align items-center
   - Avatar: circular, 40x40px, bg-teal, initials inside
   - Text section:
     - **Name:** Bold navy, `text-base`
     - **Role:** Text-muted, `text-sm`
     - **Store:** Text-muted, `text-sm`

### Testimonial Details

**Testimonial 1:**
- Quote: "Before Barpel, our support inbox was flooded with 'Where is my order?' questions. Now the AI handles all of it. We went from 60+ daily tickets to under 10. My team finally has time to actually grow the store."
- Author Name: "Sarah K."
- Author Role: "Founder"
- Store: "NovaDrop Co."
- Platform: "Shopify + TikTok Shop"

**Testimonial 2:**
- Quote: "The abandoned cart recovery alone paid for the entire year. Barpel called back 3 customers in one night and recovered $890 in orders I would have just lost. It's running while I'm asleep — that's wild."
- Author Name: "James T."
- Author Role: "Owner"
- Store: "VeloGear Supplies"
- Platform: "Shopify"

**Testimonial 3:**
- Quote: "I used to miss calls on weekends and lose sales because of it. Barpel answers instantly, in perfect English, handles returns professionally, and my customers don't even know it's AI. 5-star reviews went up."
- Author Name: "Amara O."
- Author Role: "Co-founder"
- Store: "LuxeFinds Store"
- Platform: "WooCommerce"

---

## COMPONENT 11: SECURITY SECTION

**File:** `components/marketing/sections/Security.tsx`

### Container
- Background: `#F0F9F8` (off-white)
- Padding: py-20 px-4

### Header (Centered)

**Section Title**
- Text: "Built to keep your business secure"
- Size: `text-4xl md:text-5xl`
- Weight: `font-semibold`
- Color: navy `#1B2A4A`
- Margin-bottom: mb-4

**Section Subtitle**
- Text: "Enterprise-grade security with SOC 2 compliance, data encryption, and privacy protections."
- Size: `text-xl md:text-2xl`
- Color: `#4A7A6D` (text-secondary)
- Max-width: 800px, centered
- Margin-bottom: mb-16

### Security Badges Grid
- Layout: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- Gap: `gap-8`

**Each Badge Card:**
- Container: rounded-2xl p-8 bg-white border border-light-mint
- Hover: shadow-lg + glow
- Animation: whileInView fade-in + slide-up

**Badge 1: SOC 2 Type II**
- Icon: `Shield` (lucide-react, teal, size 32)
- Title: "SOC 2 Type II"
- Description: "Audited annually by independent third parties"

**Badge 2: HIPAA Ready**
- Icon: `Lock` (lucide-react, teal, size 32)
- Title: "HIPAA Ready"
- Description: "Healthcare-grade data privacy controls"

**Badge 3: GDPR Compliant**
- Icon: `Globe` (lucide-react, teal, size 32)
- Title: "GDPR Compliant"
- Description: "Full EU data protection compliance"

**Badge 4: End-to-End Encrypted**
- Icon: `Zap` (lucide-react, teal, size 32)
- Title: "End-to-End Encrypted"
- Description: "All call data encrypted in transit and at rest"

### Learn More Link
- Text: "Learn more"
- Link: href="/privacy"
- Style: text-teal with underline
- Position: centered below badges, margin-top: mt-8

---

## COMPONENT 12: FAQ SECTION

**File:** `components/marketing/sections/HomeFAQ.tsx`

### Container
- Background: white
- Padding: py-20 px-4

### Header (Centered)

**Section Title**
- Text: "Frequently asked questions"
- Size: `text-4xl md:text-5xl`
- Weight: `font-semibold`
- Color: navy `#1B2A4A`
- Margin-bottom: mb-4

**Section Subtitle**
- Text: "Everything you need to know about Barpel AI."
- Size: `text-xl md:text-2xl`
- Color: `#4A7A6D` (text-secondary)
- Max-width: 800px, centered
- Margin-bottom: mb-16

### Accordion Container
- Max-width: 800px, centered
- Use shadcn/ui `<Accordion>` component

**Each Accordion Item:**
- Use `<AccordionItem value={`item-${i}`} />`
- Border: 1px solid light-mint
- Rounded: rounded-lg
- Margin-bottom: mb-4

**Accordion Trigger (Question):**
- Icon: `ChevronDown` (lucide-react, teal, rotates on open)
- Text: the question (bold, navy, `text-lg`)
- Padding: p-4
- Hover: bg-off-white
- Font-weight: `font-semibold`

**Accordion Content (Answer):**
- Text: the answer (see below)
- Size: `text-base`
- Color: `#4A7A6D` (text-secondary)
- Padding: p-4
- Line-height: `leading-relaxed`
- Animation: smooth expand/collapse

### FAQ Questions & Answers

**Q1: What is Barpel AI?**
- A: "Barpel AI is an AI-powered voice support agent built for e-commerce stores. It answers customer phone calls 24/7, handles order tracking, processes return requests, recovers abandoned carts via outbound calls, and responds to product questions — all automatically, without human involvement. It integrates with Shopify, TikTok Shop, WooCommerce, and Amazon. Plans start at $29/month."

**Q2: How much does Barpel AI cost?**
- A: "Barpel AI offers three plans: Starter at $29/month (30 credits, 1 phone number, Shopify integration), Growth at $79/month (100 credits, 3 phone numbers, cart recovery and returns), and Scale at $179/month (250 credits, 10 phone numbers, custom AI training). All plans include a 14-day free trial — no credit card required."

**Q3: Does Barpel AI work with Shopify?**
- A: "Yes. Barpel AI has a native Shopify integration. It connects to your store to pull real-time order data, tracking numbers, delivery estimates, and product inventory. When customers call your AI phone line, they get accurate answers directly from your live Shopify data — no manual lookup needed."

**Q4: Does Barpel AI work with TikTok Shop?**
- A: "Yes. Barpel AI integrates directly with TikTok Shop. It handles order tracking, return requests, and product questions for TikTok Shop customers. This helps sellers maintain high satisfaction scores and avoid account suspension from poor response rates."

**Q5: How fast does Barpel AI answer calls?**
- A: "Barpel AI answers calls with an average response time of 2.3 seconds. Unlike human agents, it operates 24/7 with no hold times, no voicemail, and no time zone limitations. Calls are handled instantly, any time of day."

**Q6: Can Barpel AI handle returns and refunds?**
- A: "Yes. Barpel AI explains your return policy to customers, collects return photos via SMS, and initiates the return process automatically. This eliminates manual back-and-forth, reduces support tickets, and speeds up refund resolution — all without human involvement."

**Q7: What languages does Barpel AI support?**
- A: "Barpel AI supports natural voice conversations in 30+ languages, including English, Spanish, French, German, Portuguese, Japanese, Korean, and Chinese. It automatically detects the caller's language and responds accordingly, letting you serve customers across regions without additional staff."

**Q8: How do I set up Barpel AI?**
- A: "Setup takes under 5 minutes: connect your Shopify or TikTok Shop store with one click, configure your brand voice and return policies, and get a dedicated phone number. The AI immediately starts answering calls using your live store data. No technical knowledge or coding required."

**Q9: Is Barpel AI secure and compliant?**
- A: "Yes. Barpel AI is SOC 2 Type II certified, GDPR compliant, and HIPAA ready. All customer call data is encrypted end-to-end in transit and at rest. Payments are processed securely via Paystack. We never share or sell your data."

**Q10: Does Barpel AI replace my customer support team?**
- A: "Barpel AI handles the high-volume, repetitive inquiries — order status, returns, cart recovery, product questions — that make up the majority of e-commerce support tickets. This frees your team (or eliminates the need to hire one) for complex, relationship-critical interactions. Most Barpel AI stores resolve 80%+ of inquiries without human escalation."

---

## COMPONENT 13: CTA SECTION

**File:** `components/marketing/sections/CTA.tsx`

### Container
- Background: white
- Padding: py-20 px-4

### CTA Card
- Container: rounded-3xl p-12 bg-gradient-brand (navy → teal → mint)
- Max-width: 1200px, centered
- Text alignment: centered
- Layout: flex flex-col items-center justify-center

**Icon (Optional)**
- Icon: `MessageCircle` (lucide-react, white, size 48)
- Margin-bottom: mb-6
- Opacity: 0.9

**Headline**
- Text: "Power up your customer support"
- Size: `text-4xl md:text-5xl`
- Weight: `font-semibold`
- Color: white
- Margin-bottom: mb-4
- Max-width: 600px

**Subtitle**
- Text: "Get started in seconds — for free. No credit card required."
- Size: `text-xl md:text-2xl`
- Color: white/80
- Margin-bottom: mb-8
- Max-width: 600px

**CTA Buttons**
- Layout: flex gap-4, center, wrap on mobile
- Margin-top: mt-8

**Button 1: Primary**
- Text: "Start for free" + arrow icon
- Icon: `ArrowRight` (lucide-react)
- Style: solid white background
  - bg-white
  - text-teal-600
  - px-8 py-4
  - rounded-full
  - font-semibold
- Hover: scale(1.05) + shadow
- Link: href="/signup"

**Button 2: Secondary**
- Text: "Get a demo"
- Style: white outline (transparent with border)
  - border-2 border-white
  - text-white
  - px-8 py-4
  - rounded-full
  - font-semibold
- Hover: bg-white/10
- Link: href="/contact" or scroll to contact form (if exists)

---

## COMPONENT 14: FOOTER

**File:** `components/marketing/sections/Footer.tsx`

### Container
- Background: navy `#1B2A4A`
- Padding: py-20 px-4
- Color: white

### Top Section

**Logo & Brand Description**
- Logo: `<BarpelLogoWhite size={40} />`
- Tagline: "AI-powered voice support for modern e-commerce. Handle customer calls automatically, 24/7."
- Font: `text-white/70 text-base`
- Max-width: 400px
- Margin-bottom: mb-12

**Footer Links Grid**
- Layout: `grid grid-cols-2 md:grid-cols-5`
- Gap: `gap-8`
- Text color: white
- Link hover: text-teal

**Column 1: Product**
- Links:
  - "Features" → href="#features"
  - "How it Works" → href="#how-it-works"
  - "Integrations" → href="#integrations"
  - "Pricing" → href="#pricing"
  - "API Documentation" → href="/docs/api"

**Column 2: Solutions**
- Links:
  - "For Dropshippers" → href="#dropshippers"
  - "For Shopify Stores" → href="#shopify"
  - "For TikTok Shop" → href="#tiktok"
  - "For Amazon Sellers" → href="#amazon"

**Column 3: Resources**
- Links:
  - "Help Center" → href="/help"
  - "Blog" → href="/blog"
  - "Customer Stories" → href="/stories"
  - "FAQ" → href="#faq"
  - "Developer Tools" → href="/dev"

**Column 4: Company**
- Links:
  - "About Us" → href="/about"
  - "Careers" → href="/careers"
  - "Contact" → href="/contact"
  - "Partners" → href="/partners"
  - "Press Kit" → href="/press"

**Column 5: Social (Icons Only on Mobile/Tablet)**
- Icons (lucide-react or links):
  - "Facebook" → href="https://facebook.com/barpelai"
  - "X (Twitter)" → href="https://twitter.com/barpelai"
  - "LinkedIn" → href="https://linkedin.com/company/barpelai"
  - "YouTube" → href="https://youtube.com/barpelai"
  - "TikTok" → href="https://tiktok.com/@barpelai"
- Icon color: white
- Icon size: 20px
- Hover: color changes to teal
- Display: flex gap-4

### Divider
- Border-top: 1px solid white/10
- Margin: my-8

### Bottom Section

**Left Side**
- Copyright text: "© 2026 Barpel AI Inc. All rights reserved."
- Color: white/50
- Font-size: text-sm

**Right Side (Links)**
- Layout: flex gap-6
- Links:
  - "Privacy Policy" → href="/privacy"
  - "Terms of Service" → href="/terms"
  - "Data Processing" → href="/dpa"
  - "Cookies" → href="/cookies"
- Color: white/50
- Font-size: text-sm
- Hover: color becomes white

**Layout (Bottom Section):** flex justify-between items-center, wrap on mobile

---

## GLOBAL STYLING REQUIREMENTS

### Responsive Breakpoints
- Mobile: 375px
- Tablet: 768px
- Desktop: 1024px+
- Large: 1440px+

### Font Stack
- **Display:** `'Syne', 'Instrument Serif', Georgia`
- **Body:** `'DM Sans', 'Plus Jakarta Sans', system-ui`
- **Code:** `'Geist Mono', 'JetBrains Mono', Fira Code`

### Animations (All using Framer Motion)

**1. Hero Content (Staggered)**
- Badge: fade-in + slide-up, delay 0.2s
- H1: fade-in + slide-up, delay 0.4s
- Subtitle: fade-in + slide-up, delay 0.6s
- Primary CTA: fade-in + slide-up, delay 0.8s
- Secondary CTA: fade-in + slide-up, delay 1s
- Trust indicators: fade-in + slide-up, delay 1.2s

**2. Section Headers**
- whileInView: { opacity: 1, y: 0 }
- initial: { opacity: 0, y: 20 }
- transition: { duration: 0.8 }

**3. Feature Cards**
- whileInView: { opacity: 1, y: 0, scale: 1 }
- initial: { opacity: 0, y: 40, scale: 0.95 }
- transition: { duration: 0.6 }
- staggerChildren: 0.1s (each card delays)
- viewport: { once: true, amount: 0.3 }

**4. Hover Effects (Non-Framer)**
- Scale: scale(1.05)
- Box-shadow: 0 0 20px rgba(0,169,157,0.4) [teal glow]
- Transition: all 300ms ease-out

### Accessibility Requirements

- All interactive elements (buttons, links) must have visible focus states
- Minimum color contrast: WCAG AA (4.5:1 for text)
- All icons must have alt text or aria-label
- Semantic HTML: `<button>`, `<a>`, `<nav>`, `<section>`, etc.
- Form inputs must have associated `<label>` elements
- Keyboard navigation must work for all dropdowns/modals
- Use `aria-current="page"` for active nav links
- Provide `aria-expanded` for accordion items

### SEO/Head Tags (in app/page.tsx)

```html
<title>Barpel AI | AI Voice Support for E-Commerce Stores</title>
<meta name="description" content="AI phone agent for e-commerce stores. Answers calls 24/7, tracks orders, handles returns, recovers carts. 2.3s response. Free 14-day trial." />
<link rel="canonical" href="https://dropship.barpel.ai" />
<script type="application/ld+json">{jsonLd}</script>
```

---

## TESTING CHECKLIST

### Visual/Layout
- [ ] All sections display correctly at 375px, 768px, 1440px
- [ ] No horizontal scrolling on mobile
- [ ] Hero takes up full viewport on desktop
- [ ] Typography sizes match (h1, h2, h3, body)
- [ ] Color accuracy (all teal/navy/mint match brand)
- [ ] Spacing is consistent (use Tailwind spacing scale)

### Interactions
- [ ] Navigation dropdowns open/close
- [ ] Mobile hamburger menu works
- [ ] All CTAs link to correct routes
- [ ] Scroll animations trigger when sections enter viewport
- [ ] Hover effects work on cards/buttons
- [ ] Pricing toggle switches between monthly/yearly
- [ ] FAQ accordion expands/collapses

### Performance
- [ ] Page loads in <3 seconds on 3G
- [ ] Lighthouse performance score >90
- [ ] Lighthouse accessibility score >95
- [ ] Lighthouse SEO score >90

### Accessibility
- [ ] Tab through page using keyboard only
- [ ] All buttons/links have focus states
- [ ] Form inputs have labels
- [ ] Color contrast passes WCAG AA
- [ ] Screen reader can navigate all sections

### Browser/Device
- [ ] Chrome/Safari/Firefox on desktop
- [ ] iPhone SE, iPhone 14+
- [ ] Android (Samsung Galaxy)
- [ ] Tablet (iPad)

---

**END OF DETAILED BREAKDOWN**

Use this document section-by-section and build each component methodically. Every color, spacing, animation, and text element is specified.
