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

export function ComingSoonSection() {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider font-sans">
        Coming Soon
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* TikTok Shop */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm cursor-not-allowed pointer-events-none opacity-50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-black/10">
              <ShoppingBag className="w-6 h-6 text-black/60" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-slate-900 font-sans">TikTok Shop</h3>
                <Badge color="#8AADA6">Coming Soon</Badge>
              </div>
              <p className="text-sm text-muted-foreground font-sans">
                Sync with TikTok Shop for order management
              </p>
            </div>
          </div>
        </div>

        {/* WooCommerce */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm cursor-not-allowed pointer-events-none opacity-50">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#96588A20" }}
            >
              <ShoppingBag className="w-6 h-6" style={{ color: "#96588A80" }} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-slate-900 font-sans">WooCommerce</h3>
                <Badge color="#8AADA6">Coming Soon</Badge>
              </div>
              <p className="text-sm text-muted-foreground font-sans">
                Connect your WooCommerce store
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
