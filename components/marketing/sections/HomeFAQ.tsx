const faqs = [
  {
    question: 'What is Barpel AI?',
    answer:
      'Barpel AI is an AI-powered voice support agent built for e-commerce stores. It answers customer phone calls 24/7, handles order tracking, processes return requests, recovers abandoned carts via outbound calls, and responds to product questions — all automatically, without human involvement. It integrates with Shopify, TikTok Shop, WooCommerce, and Amazon. Plans start at $29/month.',
  },
  {
    question: 'How much does Barpel AI cost?',
    answer:
      'Barpel AI offers three plans: Starter at $29/month (30 credits, 1 phone number, Shopify integration), Growth at $79/month (100 credits, 3 phone numbers, cart recovery and returns), and Scale at $179/month (250 credits, 10 phone numbers, custom AI training). All plans include a 14-day free trial — no credit card required.',
  },
  {
    question: 'Does Barpel AI work with Shopify?',
    answer:
      'Yes. Barpel AI has a native Shopify integration. It connects to your store to pull real-time order data, tracking numbers, delivery estimates, and product inventory. When customers call your AI phone line, they get accurate answers directly from your live Shopify data — no manual lookup needed.',
  },
  {
    question: 'Does Barpel AI work with TikTok Shop?',
    answer:
      'Yes. Barpel AI integrates directly with TikTok Shop. It handles order tracking, return requests, and product questions for TikTok Shop customers. This helps sellers maintain high satisfaction scores and avoid account suspension from poor response rates.',
  },
  {
    question: 'How fast does Barpel AI answer calls?',
    answer:
      'Barpel AI answers calls with an average response time of 2.3 seconds. Unlike human agents, it operates 24/7 with no hold times, no voicemail, and no time zone limitations. Calls are handled instantly, any time of day.',
  },
  {
    question: 'Can Barpel AI handle returns and refunds?',
    answer:
      'Yes. Barpel AI explains your return policy to customers, collects return photos via SMS, and initiates the return process automatically. This eliminates manual back-and-forth, reduces support tickets, and speeds up refund resolution — all without human involvement.',
  },
  {
    question: 'What languages does Barpel AI support?',
    answer:
      'Barpel AI supports natural voice conversations in 30+ languages, including English, Spanish, French, German, Portuguese, Japanese, Korean, and Chinese. It automatically detects the caller\'s language and responds accordingly, letting you serve customers across regions without additional staff.',
  },
  {
    question: 'How do I set up Barpel AI?',
    answer:
      'Setup takes under 5 minutes: connect your Shopify or TikTok Shop store with one click, configure your brand voice and return policies, and get a dedicated phone number. The AI immediately starts answering calls using your live store data. No technical knowledge or coding required.',
  },
  {
    question: 'Is Barpel AI secure and compliant?',
    answer:
      'Yes. Barpel AI is SOC 2 Type II certified, GDPR compliant, and HIPAA ready. All customer call data is encrypted end-to-end in transit and at rest. Payments are processed securely via Flutterwave. We never share or sell your data.',
  },
  {
    question: 'Does Barpel AI replace my customer support team?',
    answer:
      'Barpel AI handles the high-volume, repetitive inquiries — order status, returns, cart recovery, product questions — that make up the majority of e-commerce support tickets. This frees your team (or eliminates the need to hire one) for complex, relationship-critical interactions. Most Barpel AI stores resolve 80%+ of inquiries without human escalation.',
  },
];

export default function HomeFAQ() {
  return (
    <section className="section-padding bg-white">
      <div className="container-default max-w-3xl">
        <div className="text-center mb-10">
          <h2 className="heading-section text-brand-navy mb-4">
            Frequently asked <span className="text-brand-teal">questions</span>
          </h2>
          <p className="body-large text-text-secondary">
            Everything you need to know about Barpel AI.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group bg-off-white rounded-xl border border-light-mint open:border-brand-teal/30 open:bg-white transition-colors duration-200"
            >
              <summary className="flex items-center justify-between px-6 py-5 cursor-pointer list-none font-semibold text-brand-navy select-none">
                {faq.question}
                <span className="ml-4 flex-shrink-0 w-5 h-5 rounded-full border border-brand-teal/40 flex items-center justify-center text-brand-teal text-xs transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="px-6 pb-5 text-text-secondary leading-relaxed">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
