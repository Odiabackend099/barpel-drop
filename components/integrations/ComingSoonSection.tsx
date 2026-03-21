import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide"
      style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}
    >
      {children}
    </span>
  );
}

const cards = [
  {
    name: "TikTok Shop",
    description: "Sync with TikTok Shop for order management",
    iconBg: "bg-black/10",
    iconColor: "text-black/60",
    iconStyle: undefined as React.CSSProperties | undefined,
    bgStyle: undefined as React.CSSProperties | undefined,
  },
  {
    name: "WooCommerce",
    description: "Connect your WooCommerce store",
    iconBg: "",
    iconColor: "",
    iconStyle: { color: "#96588A80" } as React.CSSProperties,
    bgStyle: { backgroundColor: "#96588A20" } as React.CSSProperties,
  },
];

export function ComingSoonSection() {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider font-sans">
        Coming Soon
      </h3>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        {cards.map((card, i) => (
          <motion.div
            key={card.name}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm cursor-not-allowed pointer-events-none opacity-50"
            variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 0.5, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}
          >
            <div className="flex items-start gap-4">
              <motion.div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.iconBg}`}
                style={card.bgStyle}
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
              >
                <ShoppingBag className={`w-6 h-6 ${card.iconColor}`} style={card.iconStyle} />
              </motion.div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-slate-900 font-sans">{card.name}</h3>
                  <Badge color="#8AADA6">Coming Soon</Badge>
                </div>
                <p className="text-sm text-muted-foreground font-sans">
                  {card.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
