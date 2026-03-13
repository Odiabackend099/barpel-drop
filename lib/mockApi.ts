if (process.env.NODE_ENV === "production") throw new Error("mockApi imported in production");

import { format, subDays } from "date-fns";

// ============================================================================
// TYPES
// ============================================================================
export interface CallLog {
  id: string;
  direction: "inbound" | "outbound";
  caller_number: string;
  customer_name: string;
  order_number: string | null;
  call_type: string;
  duration_secs: number;
  ai_summary: string;
  sentiment: "happy" | "neutral" | "angry";
  credits_charged: number;
  started_at: string;
  transcript: string;
}

export interface ChartPoint {
  date: string;
  count: number;
}

export interface UsagePoint {
  date: string;
  credits: number;
}

export interface CreditTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
}

export interface MerchantData {
  id: string;
  business_name: string;
  email: string;
  shopify_domain: string | null;
  shopify_connected: boolean;
  vapi_agent_id: string;
  phone_number: string;
  support_phone?: string;
  custom_prompt: string;
  provisioning_status?: string;
  provisioning_error?: string;
  country?: string;
  onboarding_step?: number;
  credits_remaining_secs: number;
  credits_total_secs: number;
  credit_balance?: number;
  ai_first_message?: string;
  ai_voice_id?: string;
  ai_voice_provider?: string;
  ai_model?: string;
}

// ============================================================================
// MOCK CALL LOGS (20 entries)
// ============================================================================
export const mockCalls: CallLog[] = [
  // WISMO calls (8)
  { id: "1", direction: "inbound", caller_number: "+2348011111111", customer_name: "Chioma Nwosu", order_number: "ORD-4521", call_type: "WISMO", duration_secs: 145, ai_summary: "Customer inquired about order status, provided tracking update.", sentiment: "happy", credits_charged: 145, started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), transcript: "AI: Hello, this is PowerFit Gadgets. How can I help you today?\nCustomer: Hi, I want to know where my order is.\nAI: I'd be happy to help. Could you provide your order number?\nCustomer: It's ORD-4521.\nAI: Thank you. Your order was shipped via DHL and is currently in Lagos. It should arrive within 2-3 business days.\nCustomer: Great, thank you!" },
  { id: "2", direction: "inbound", caller_number: "+2348022222222", customer_name: "Tunde Bakare", order_number: "ORD-4523", call_type: "WISMO", duration_secs: 92, ai_summary: "Order status inquiry - out for delivery.", sentiment: "neutral", credits_charged: 92, started_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), transcript: "AI: Good afternoon! PowerFit Gadgets here. How may I assist you?\nCustomer: Where is my order?\nAI: I'd be glad to check. What's your order number?\nCustomer: ORD-4523.\nAI: Your order is out for delivery today. You should receive it by 6 PM." },
  { id: "3", direction: "inbound", caller_number: "+2348033333333", customer_name: "Ngozi Eze", order_number: "ORD-4525", call_type: "WISMO", duration_secs: 178, ai_summary: "Delayed order - escalated to courier.", sentiment: "neutral", credits_charged: 178, started_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), transcript: "AI: Welcome to PowerFit Gadgets! How can I help?\nCustomer: I ordered something last week and haven't received it.\nAI: I apologize for the delay. Let me check your order. What's the order number?\nCustomer: ORD-4525.\nAI: I see there was a delay with the courier. I've escalated this and you should receive it within 48 hours." },
  { id: "4", direction: "inbound", caller_number: "+2348044444444", customer_name: "Kunle Adeyemi", order_number: "ORD-4527", call_type: "WISMO", duration_secs: 67, ai_summary: "Order already delivered - customer confirmed receipt.", sentiment: "happy", credits_charged: 67, started_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), transcript: "AI: Hello! PowerFit Gadgets speaking.\nCustomer: Tracking my order ORD-4527.\nAI: Your order was delivered yesterday at 2:30 PM. Is there anything else?\nCustomer: Oh, I see it now. Thanks!" },
  { id: "5", direction: "inbound", caller_number: "+2348055555555", customer_name: "Amina Ibrahim", order_number: "ORD-4529", call_type: "WISMO", duration_secs: 134, ai_summary: "Order in transit - delivery expected tomorrow.", sentiment: "neutral", credits_charged: 134, started_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), transcript: "AI: Good day! This is PowerFit Gadgets customer service.\nCustomer: Hi, I'm waiting for my order ORD-4529.\nAI: Let me check that for you. Your order is currently in transit from our warehouse in Lagos. Expected delivery is tomorrow." },
  { id: "6", direction: "inbound", caller_number: "+2348066666666", customer_name: "Obi Nnamdi", order_number: "ORD-4531", call_type: "WISMO", duration_secs: 201, ai_summary: "Significant delay - customs hold, escalated for investigation.", sentiment: "angry", credits_charged: 201, started_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), transcript: "AI: PowerFit Gadgets, how can I assist you today?\nCustomer: My order hasn't arrived and it's been 2 weeks!\nAI: I sincerely apologize for this delay. Let me investigate immediately. Your order ORD-4531 appears to have been held at customs. I'm contacting them now and will update you within 24 hours." },
  { id: "7", direction: "inbound", caller_number: "+2348077777777", customer_name: "Fatima Bello", order_number: "ORD-4533", call_type: "WISMO", duration_secs: 89, ai_summary: "Delivery scheduled for today.", sentiment: "happy", credits_charged: 89, started_at: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(), transcript: "AI: Hello! Welcome to PowerFit Gadgets.\nCustomer: When will my package arrive?\nAI: Could you share your order number please?\nCustomer: ORD-4533.\nAI: Perfect! Your package will be delivered today between 10 AM and 2 PM." },
  { id: "8", direction: "inbound", caller_number: "+2348088888888", customer_name: "Yusuf Mohammed", order_number: "ORD-4535", call_type: "WISMO", duration_secs: 156, ai_summary: "Order processing - shipping tomorrow.", sentiment: "neutral", credits_charged: 156, started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), transcript: "AI: PowerFit Gadgets here. How may I help?\nCustomer: I need to know where my order is.\nAI: Of course! Order number please?\nCustomer: ORD-4535.\nAI: Your order is being processed at our warehouse and will ship tomorrow. You'll receive tracking info via email." },

  // Return/Refund calls (4)
  { id: "9", direction: "inbound", caller_number: "+2348099999999", customer_name: "Adaobi Chukwu", order_number: "ORD-4537", call_type: "Return/Refund", duration_secs: 234, ai_summary: "Return initiated for defective item - return label sent.", sentiment: "neutral", credits_charged: 234, started_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), transcript: "AI: Hello! PowerFit Gadgets customer service.\nCustomer: I want to return my order. The item is defective.\nAI: I'm sorry to hear that. I'll help you with the return. What's your order number?\nCustomer: ORD-4537.\nAI: Thank you. I've initiated your return. You'll receive a return label via email within 10 minutes. Your refund will be processed within 3-5 business days after we receive the item." },
  { id: "10", direction: "inbound", caller_number: "+2348100000000", customer_name: "Chidi Okeke", order_number: "ORD-4539", call_type: "Return/Refund", duration_secs: 312, ai_summary: "Refund delay complaint - escalated to finance, 24hr resolution promised.", sentiment: "angry", credits_charged: 312, started_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), transcript: "AI: Good afternoon! This is PowerFit Gadgets.\nCustomer: I returned my item two weeks ago and still no refund! This is unacceptable!\nAI: I sincerely apologize for this delay. Let me check on your refund status immediately. Order ORD-4539... I see the issue - there was a processing error. I'm escalating this to our finance team right now. Your refund of N45,000 will be processed within 24 hours." },
  { id: "11", direction: "inbound", caller_number: "+2348111111112", customer_name: "Zainab Usman", order_number: "ORD-4541", call_type: "Return/Refund", duration_secs: 187, ai_summary: "Exchange request processed - prepaid label to be sent.", sentiment: "neutral", credits_charged: 187, started_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), transcript: "AI: Welcome to PowerFit Gadgets! How can I help?\nCustomer: I ordered the wrong size. Can I exchange it?\nAI: Absolutely! We can help with that. What's your order number?\nCustomer: ORD-4541.\nAI: Perfect. I've noted your exchange request. Please return the item using the prepaid label I'll send you, and we'll ship the correct size within 24 hours of receiving it." },
  { id: "12", direction: "inbound", caller_number: "+2348122222222", customer_name: "Emmanuel John", order_number: "ORD-4543", call_type: "Return/Refund", duration_secs: 145, ai_summary: "Return processed - change of mind, standard return policy applied.", sentiment: "neutral", credits_charged: 145, started_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(), transcript: "AI: Hello! PowerFit Gadgets speaking.\nCustomer: I want a refund for order ORD-4543.\nAI: I can help with that. May I ask the reason for the return?\nCustomer: Changed my mind.\nAI: Understood. I've processed your return request. You'll receive a prepaid return label shortly. Once we receive the item in original condition, your refund will be processed within 5-7 business days." },

  // Abandoned Cart calls (4) - outbound
  { id: "13", direction: "outbound", caller_number: "+2348133333333", customer_name: "Blessing Adeleke", order_number: null, call_type: "Abandoned Cart", duration_secs: 78, ai_summary: "Cart abandonment follow-up - customer not ready to purchase.", sentiment: "neutral", credits_charged: 78, started_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), transcript: "AI: Hello! This is PowerFit Gadgets. I noticed you left some items in your cart. Can I help you complete your purchase?\nCustomer: Oh, I was just browsing. Not ready to buy yet.\nAI: No problem at all! I've saved your cart for you. When you're ready, just visit our website. Is there anything specific you're looking for?" },
  { id: "14", direction: "outbound", caller_number: "+2348144444444", customer_name: "Daniel Etim", order_number: null, call_type: "Abandoned Cart", duration_secs: 156, ai_summary: "Cart recovery successful - answered product question, customer converted.", sentiment: "happy", credits_charged: 156, started_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(), transcript: "AI: Hi! This is PowerFit Gadgets. I see you were interested in our wireless earbuds. Do you have any questions?\nCustomer: Actually yes, what's the battery life?\nAI: Great question! These earbuds have 8 hours of playtime on a single charge, and the case provides an additional 24 hours. They're also water-resistant!\nCustomer: That sounds good. I'll complete my purchase now.\nAI: Wonderful! I've sent you a direct link to your cart via SMS." },
  { id: "15", direction: "outbound", caller_number: "+2348155555555", customer_name: "Grace Ojo", order_number: null, call_type: "Abandoned Cart", duration_secs: 45, ai_summary: "Price comparison - informed about price match and free shipping.", sentiment: "neutral", credits_charged: 45, started_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), transcript: "AI: Hello from PowerFit Gadgets! You left some items in your cart. Need any help?\nCustomer: No thanks, just comparing prices.\nAI: I understand. Just so you know, we price match and offer free shipping on orders over N25,000. Your cart qualifies!" },
  { id: "16", direction: "outbound", caller_number: "+2348166666666", customer_name: "Samuel Okonkwo", order_number: null, call_type: "Abandoned Cart", duration_secs: 198, ai_summary: "Cart recovery with discount - compatibility question answered, converted.", sentiment: "happy", credits_charged: 198, started_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), transcript: "AI: Hi! PowerFit Gadgets here. I noticed you were looking at our smartwatch.\nCustomer: Yes, but I'm not sure if it works with my phone.\nAI: What phone do you have?\nCustomer: iPhone 13.\nAI: Perfect! Our smartwatch is fully compatible with iPhone 13. You can receive notifications, track fitness, and even make calls. Plus, I'm offering you a 10% discount code: SAVE10\nCustomer: Okay, I'll buy it now!\nAI: Done! I've sent payment alternatives to your email." },

  // Other calls (4)
  { id: "17", direction: "inbound", caller_number: "+2348177777777", customer_name: "Patience Ibe", order_number: "ORD-4545", call_type: "Product Inquiry", duration_secs: 123, ai_summary: "Product availability inquiry - item reserved for customer.", sentiment: "neutral", credits_charged: 123, started_at: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(), transcript: "AI: Welcome to PowerFit Gadgets! How can I assist?\nCustomer: Do you have the wireless charger in stock?\nAI: Let me check... Yes, we have 47 units in stock. Would you like me to reserve one for you?\nCustomer: Yes please, I'll order in an hour.\nAI: Reserved! It will be held for 24 hours." },
  { id: "18", direction: "inbound", caller_number: "+2348188888888", customer_name: "Victor Nwachukwu", order_number: null, call_type: "General Inquiry", duration_secs: 89, ai_summary: "Business hours inquiry.", sentiment: "neutral", credits_charged: 89, started_at: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString(), transcript: "AI: Hello! PowerFit Gadgets customer service.\nCustomer: What are your business hours?\nAI: Our AI assistant is available 24/7. Our human support team is available Monday to Friday, 9 AM to 6 PM WAT.\nCustomer: Great, thanks!" },
  { id: "19", direction: "inbound", caller_number: "+2348199999999", customer_name: "Rosemary Akpan", order_number: "ORD-4547", call_type: "Address Change", duration_secs: 167, ai_summary: "Delivery address updated successfully.", sentiment: "neutral", credits_charged: 167, started_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(), transcript: "AI: Good day! PowerFit Gadgets here.\nCustomer: I need to change the delivery address for my order.\nAI: Of course! What's your order number?\nCustomer: ORD-4547.\nAI: Thank you. What's the new address you'd like it delivered to?\nCustomer: 15 Admiralty Way, Lekki Phase 1, Lagos.\nAI: Perfect! I've updated your delivery address. Your order will now be delivered to the new address." },
  { id: "20", direction: "inbound", caller_number: "+2348200000000", customer_name: "Peter Adebayo", order_number: null, call_type: "Payment Issue", duration_secs: 234, ai_summary: "Payment troubleshooting - alternative options provided.", sentiment: "neutral", credits_charged: 234, started_at: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(), transcript: "AI: Hello! Welcome to PowerFit Gadgets.\nCustomer: My card keeps getting declined but I have money in my account.\nAI: I understand how frustrating that must be. This is usually a bank security measure. Here are a few things to try: 1) Contact your bank to authorize the transaction, 2) Try a different payment method, 3) Clear your browser cache and try again. Would you like me to send you alternative payment options?\nCustomer: Yes please, send me the options.\nAI: Done! I've sent payment alternatives to your email." },
];

// ============================================================================
// CHART DATA
// ============================================================================
export const chartData: ChartPoint[] = Array.from({ length: 14 }, (_, i) => ({
  date: format(subDays(new Date(), 13 - i), "MMM dd"),
  count: Math.floor(Math.random() * 15) + 5,
}));

export const usageData: UsagePoint[] = Array.from({ length: 30 }, (_, i) => ({
  date: format(subDays(new Date(), 29 - i), "MMM dd"),
  credits: Math.floor(Math.random() * 200) + 50,
}));

// ============================================================================
// MOCK MERCHANT
// ============================================================================
export const mockMerchant: MerchantData = {
  id: "merchant_001",
  business_name: "PowerFit Gadgets",
  email: "admin@powerfitgadgets.com",
  shopify_domain: "powerfit-gadgets.myshopify.com",
  shopify_connected: true,
  vapi_agent_id: "vapi_agent_123",
  phone_number: "+44 20 7946 0958",
  support_phone: "+44 20 7946 0958",
  custom_prompt: "",
  country: "NG",
  provisioning_status: "active",
  credits_remaining_secs: 6234,
  credits_total_secs: 12000,
};

// Mock integrations — used by useIntegrations hook in dev mode
export const mockIntegrations = [
  {
    id: "integration_001",
    platform: "shopify",
    shop_domain: "powerfit-gadgets.myshopify.com",
    shop_name: "PowerFit Gadgets",
    connection_active: true,
    last_synced_at: new Date().toISOString(),
    outbound_consent_confirmed_at: null,
    created_at: new Date().toISOString(),
  },
];

// ============================================================================
// MOCK TRANSACTIONS
// ============================================================================
export const mockTransactions: CreditTransaction[] = [
  { id: "txn_1", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), description: "Growth Package - 500 min", amount: 30000, type: "credit" },
  { id: "txn_2", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), description: "Call usage - 14 calls", amount: -1842, type: "debit" },
  { id: "txn_3", date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), description: "Starter Package - 100 min", amount: 6000, type: "credit" },
  { id: "txn_4", date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(), description: "Call usage - 23 calls", amount: -3124, type: "debit" },
];
