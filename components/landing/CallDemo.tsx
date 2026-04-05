"use client";

import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Phone, Bot, User } from "lucide-react";

const DEMO_ORDERS = ['#4521', '#7834', '#2109', '#6452', '#3891', '#5023'];
const DEMO_NAMES = ['Adaeze', 'Chukwuma', 'Fatima', 'James', 'Amara', 'Tobi', 'Sarah', 'Michael'];

function buildConversation(orderNumber: string, customerName: string) {
  return [
    { role: "system", text: "Incoming call from +234 801 XXX XXXX..." },
    { role: "ai", text: "Hello! Welcome to PowerFit Gadgets. How can I help you today?" },
    { role: "customer", text: `Hi, I want to know where my order is. It's ORD-${orderNumber.replace('#', '')}.` },
    { role: "ai", text: "Let me check that for you right away..." },
    { role: "system", text: "Looking up order... Querying Shopify... Checking AfterShip..." },
    { role: "ai", text: `Your order ORD-${orderNumber.replace('#', '')} was shipped via DHL and is currently in Lagos. Expected delivery is tomorrow between 10 AM and 2 PM.` },
    { role: "customer", text: "Great, thank you so much!" },
    { role: "ai", text: "You're welcome! Is there anything else I can help with?" },
    { role: "system", text: `Call ended. Duration: 1m 23s. Sentiment: Happy. Customer: ${customerName}.` },
  ];
}

/** Animated AI call simulation showing a WISMO interaction. */
export function CallDemo() {
  const [orderNumber] = useState(() => DEMO_ORDERS[Math.floor(Math.random() * DEMO_ORDERS.length)]);
  const [customerName] = useState(() => DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)]);
  const conversation = buildConversation(orderNumber, customerName);

  const [visibleMessages, setVisibleMessages] = useState(0);

  useEffect(() => {
    if (visibleMessages >= conversation.length) return;

    const delay = conversation[visibleMessages]?.role === "system" ? 1200 : 2000;
    const timer = setTimeout(() => {
      setVisibleMessages((prev) => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [visibleMessages, conversation]);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Phone frame */}
      <div className="bg-white rounded-3xl border-2 border-[#D0EDE8] shadow-lg overflow-hidden">
        {/* Phone header */}
        <div
          className="px-6 py-4 flex items-center gap-3"
          style={{ background: "linear-gradient(135deg, #00A99D, #7DD9C0)" }}
        >
          <Phone className="w-5 h-5 text-white" />
          <div>
            <p className="text-white text-sm font-semibold">Barpel AI Agent</p>
            <p className="text-white/80 text-xs">Active call</p>
          </div>
          <div className="ml-auto flex gap-1">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse delay-100" />
            <div className="w-2 h-2 rounded-full bg-white/30 animate-pulse delay-200" />
          </div>
        </div>

        {/* Messages */}
        <div className="p-4 space-y-3 min-h-[320px] max-h-[400px] overflow-y-auto bg-[#F0F9F8]">
          <AnimatePresence>
            {conversation.slice(0, visibleMessages).map((msg, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={`flex gap-2 ${msg.role === "customer" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "ai" && (
                  <div className="w-7 h-7 rounded-full bg-teal flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                {msg.role === "system" && (
                  <div className="w-full text-center">
                    <span className="text-[10px] text-[#8AADA6] italic">{msg.text}</span>
                  </div>
                )}
                {msg.role !== "system" && (
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                      msg.role === "ai"
                        ? "bg-white text-navy border border-[#D0EDE8]"
                        : "bg-teal text-white"
                    }`}
                  >
                    {msg.text}
                  </div>
                )}
                {msg.role === "customer" && (
                  <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </m.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Replay button */}
      {visibleMessages >= conversation.length && (
        <m.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setVisibleMessages(0)}
          className="mt-4 mx-auto block text-sm text-teal hover:underline"
        >
          Replay demo
        </m.button>
      )}
    </div>
  );
}
