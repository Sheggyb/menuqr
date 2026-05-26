"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant, MenuCategory, MenuItem, TableRow } from "@/lib/types";

interface Props {
  table: TableRow & { restaurant: Restaurant };
  restaurant: Restaurant;
  categories: MenuCategory[];
  items: MenuItem[];
}

type RequestType = "waiter" | "bill" | "refill" | "item_request";

interface CartItem {
  item: MenuItem;
  quantity: number;
  note: string;
}

export default function GuestMenuClient({ table, restaurant, categories, items }: Props) {
  const supabase = createClient();
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");
  const [toast, setToast] = useState("");
  const [sending, setSending] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [noteFor, setNoteFor] = useState<{ item: MenuItem } | null>(null);
  const [noteText, setNoteText] = useState("");
  const [qty, setQty] = useState(1);

  const accentColor = restaurant.accent_color || "#E85D2F";

  async function sendRequest(type: RequestType, item?: MenuItem, note?: string, quantity?: number) {
    if (sending) return;
    setSending(true);
    const { error } = await supabase.from("table_requests").insert({
      restaurant_id: restaurant.id,
      table_id: table.id,
      type,
      item_id: item?.id ?? null,
      item_name: item ? `${quantity && quantity > 1 ? `x${quantity} ` : ""}${item.name}` : null,
      note: note ?? null,
      status: "pending",
    });
    setSending(false);
    if (!error) {
      showToast("✅ Request sent!");
      setRequestCount(c => c + 1);
    }
  }

  async function submitCart() {
    if (sending || cart.length === 0) return;
    setSending(true);
    await Promise.all(cart.map(ci =>
      supabase.from("table_requests").insert({
        restaurant_id: restaurant.id,
        table_id: table.id,
        type: "item_request",
        item_id: ci.item.id,
        item_name: `x${ci.quantity} ${ci.item.name}`,
        note: ci.note || null,
        status: "pending",
      })
    ));
    setSending(false);
    setCart([]);
    setCartOpen(false);
    setRequestCount(c => c + cart.length);
    showToast(`✅ ${cart.length} item${cart.length > 1 ? "s" : ""} ordered!`);
  }

  function addToCart(item: MenuItem) {
    setNoteFor({ item });
    setQty(1);
    setNoteText("");
  }

  function confirmAddToCart() {
    if (!noteFor) return;
    setCart(prev => {
      const existing = prev.find(c => c.item.id === noteFor.item.id && c.note === noteText);
      if (existing) {
        return prev.map(c => c === existing ? { ...c, quantity: c.quantity + qty } : c);
      }
      return [...prev, { item: noteFor.item, quantity: qty, note: noteText }];
    });
    setNoteFor(null);
    showToast(`Added to order!`);
  }

  function removeFromCart(idx: number) {
    setCart(prev => prev.filter((_, i) => i !== idx));
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  const visibleItems = items.filter(i => i.category_id === activeCategory);
  const cartTotal = cart.reduce((sum, c) => sum + c.quantity * (c.item.price ?? 0), 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF8", fontFamily: "Inter, system-ui, sans-serif", paddingBottom: 90 }}>
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        * { box-sizing: border-box; }
      `}</style>

      {/* HEADER */}
      <header style={{ background: accentColor, color: "white", padding: "20px 16px 16px", textAlign: "center", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
        <h1 style={{ fontWeight: 800, fontSize: 20, margin: 0, letterSpacing: "-0.3px" }}>{restaurant.name}</h1>
        <p style={{ margin: "3px 0 0", opacity: 0.88, fontSize: 13 }}>🪑 {table.name}</p>
      </header>

      {/* QUICK ACTIONS */}
      <div style={{ padding: "16px 16px 0" }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af", marginBottom: 8 }}>Quick actions</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {([
            ["waiter", "🙋", "Call Waiter"],
            ["bill", "💳", "Request Bill"],
            ["refill", "🔄", "Refill Drinks"],
          ] as [RequestType, string, string][]).map(([type, icon, label]) => (
            <button key={type} onClick={() => sendRequest(type)}
              style={{ padding: "16px 8px", borderRadius: 14, border: `2px solid ${accentColor}`, background: "white", cursor: "pointer", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, WebkitTapHighlightColor: "transparent", transition: "transform 0.1s, box-shadow 0.1s", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
              onTouchStart={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.95)"; }}
              onTouchEnd={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}>
              <span style={{ fontSize: 26 }}>{icon}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: accentColor, lineHeight: 1.2 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* DIVIDER */}
      <div style={{ margin: "16px 16px 0", borderTop: "1px solid #e5e7eb" }} />

      {/* CATEGORY TABS */}
      {categories.length > 0 && (
        <div style={{ paddingTop: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af", marginBottom: 8, paddingLeft: 16 }}>Menu</p>
          <div style={{ overflowX: "auto", display: "flex", gap: 0, borderBottom: "2px solid #f0f0ef", paddingLeft: 16 }}>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                style={{ padding: "8px 16px", border: "none", borderBottom: activeCategory === cat.id ? `2px solid ${accentColor}` : "2px solid transparent", marginBottom: "-2px", background: "none", cursor: "pointer", fontWeight: activeCategory === cat.id ? 700 : 500, color: activeCategory === cat.id ? accentColor : "#6b7280", whiteSpace: "nowrap", fontSize: 14 }}>
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MENU ITEMS */}
      <div style={{ padding: "12px 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {visibleItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 16px", color: "#9ca3af" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🍽️</div>
            <p style={{ fontSize: 14, fontWeight: 500 }}>No items in this category.</p>
          </div>
        ) : visibleItems.map(item => (
          <div key={item.id}
            style={{ background: "white", borderRadius: 14, border: "1px solid #f0f0ef", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{item.name}</div>
              {item.description && <div style={{ color: "#6b7280", fontSize: 13, marginTop: 3, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{item.description}</div>}
              {item.price ? <div style={{ fontWeight: 800, color: accentColor, marginTop: 6, fontSize: 16 }}>{item.price} kr</div> : null}
            </div>
            <button onClick={() => addToCart(item)}
              style={{ width: 38, height: 38, borderRadius: "50%", background: accentColor, color: "white", border: "none", cursor: "pointer", fontWeight: 800, fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 2px 8px ${accentColor}55` }}>
              +
            </button>
          </div>
        ))}
      </div>

      {/* FLOATING CART BUTTON */}
      {cart.length > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: accentColor, color: "white", border: "none", borderRadius: 99, padding: "14px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer", zIndex: 40, boxShadow: `0 4px 20px ${accentColor}66`, display: "flex", alignItems: "center", gap: 10, animation: "fadeIn 0.2s ease" }}>
          <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: "50%", width: 26, height: 26, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>{cartCount}</span>
          View Order
          {cartTotal > 0 && <span style={{ opacity: 0.85, fontSize: 14 }}>· {cartTotal} kr</span>}
        </button>
      )}

      {/* CART MODAL */}
      {cartOpen && (
        <div onClick={() => setCartOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 50, display: "flex", alignItems: "flex-end", animation: "fadeIn 0.15s ease" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: "20px 20px 0 0", padding: "20px 20px 36px", width: "100%", maxWidth: 480, margin: "0 auto", animation: "slideUp 0.22s ease", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontWeight: 800, fontSize: 18, margin: 0 }}>Your Order</h3>
              <button onClick={() => setCartOpen(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af", lineHeight: 1 }}>×</button>
            </div>
            {cart.map((ci, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0ef" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>x{ci.quantity} {ci.item.name}</div>
                  {ci.note && <div style={{ fontSize: 12, color: "#9ca3af" }}>📝 {ci.note}</div>}
                  {ci.item.price ? <div style={{ fontSize: 13, color: accentColor, fontWeight: 700 }}>{ci.quantity * ci.item.price} kr</div> : null}
                </div>
                <button onClick={() => removeFromCart(idx)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 18, fontWeight: 700, padding: "0 4px" }}>×</button>
              </div>
            ))}
            {cartTotal > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 4px", fontWeight: 800, fontSize: 15 }}>
                <span>Total</span>
                <span style={{ color: accentColor }}>{cartTotal} kr</span>
              </div>
            )}
            <button onClick={submitCart}
              disabled={sending}
              style={{ width: "100%", padding: "14px", borderRadius: 12, background: accentColor, color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 16, marginTop: 16, opacity: sending ? 0.7 : 1 }}>
              {sending ? "Sending..." : `✅ Send Order (${cartCount} item${cartCount !== 1 ? "s" : ""})`}
            </button>
          </div>
        </div>
      )}

      {/* ADD ITEM MODAL */}
      {noteFor && (
        <div onClick={() => setNoteFor(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 50, display: "flex", alignItems: "flex-end", animation: "fadeIn 0.15s ease" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: "20px 20px 0 0", padding: "24px 20px 36px", width: "100%", maxWidth: 480, margin: "0 auto", animation: "slideUp 0.22s ease" }}>
            <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: 17 }}>
              {noteFor.item.name}
              {noteFor.item.price ? <span style={{ color: accentColor, marginLeft: 8, fontSize: 15 }}>{noteFor.item.price} kr</span> : null}
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
              <span style={{ fontSize: 14, color: "#6b7280", fontWeight: 500 }}>Qty:</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, borderRadius: "50%", border: `2px solid ${accentColor}`, background: "white", cursor: "pointer", fontSize: 20, fontWeight: 700, color: accentColor, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                <span style={{ fontSize: 20, fontWeight: 800, minWidth: 28, textAlign: "center" }}>{qty}</span>
                <button onClick={() => setQty(q => q + 1)} style={{ width: 36, height: 36, borderRadius: "50%", border: `2px solid ${accentColor}`, background: accentColor, cursor: "pointer", fontSize: 20, fontWeight: 700, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
              </div>
            </div>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Special request? (e.g. no onions)"
              rows={2}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", resize: "none" }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={confirmAddToCart}
                style={{ flex: 1, padding: "13px", borderRadius: 12, background: accentColor, color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15 }}>
                Add to order
              </button>
              <button onClick={() => setNoteFor(null)} style={{ padding: "13px 16px", borderRadius: 12, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", color: "#6b7280" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS BANNER after send */}
      {requestCount >= 1 && cart.length === 0 && !cartOpen && (
        <div style={{ margin: "16px 16px 0", padding: "10px 14px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, textAlign: "center", fontSize: 13, color: "#166534", fontWeight: 500 }}>
          Your request is with the team! Need anything else? 👆
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "#16a34a", color: "white", padding: "12px 24px", borderRadius: 99, fontWeight: 600, fontSize: 15, zIndex: 100, whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(22,163,74,0.35)", animation: "fadeIn 0.2s ease" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
