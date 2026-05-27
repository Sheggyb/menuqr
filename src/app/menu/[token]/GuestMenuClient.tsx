"use client";
import { useState, useEffect } from "react";
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

interface SessionRequest {
  name: string;
  qty: number;
  price: number;
  time: string;
}

export default function GuestMenuClient({ table, restaurant, categories, items }: Props) {
  const supabase = createClient();
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");
  const [toast, setToast] = useState("");
  const [tableActive, setTableActive] = useState(table.is_active);
  const [sending, setSending] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [noteFor, setNoteFor] = useState<{ item: MenuItem } | null>(null);
  const [noteText, setNoteText] = useState("");
  const [qty, setQty] = useState(1);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [sessionRequests, setSessionRequests] = useState<SessionRequest[]>([]);
  const [sessionPanelOpen, setSessionPanelOpen] = useState(false);

  const accentColor = restaurant.accent_color || "#E85D2F";

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`menuqr_session_${table.id}`);
      if (stored) setSessionRequests(JSON.parse(stored));
    } catch { /* ignore */ }
  }, [table.id]);

  function saveSessionRequest(name: string, quantity: number, price: number) {
    const req: SessionRequest = {
      name,
      qty: quantity,
      price,
      time: new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }),
    };
    setSessionRequests(prev => {
      const updated = [...prev, req];
      try { sessionStorage.setItem(`menuqr_session_${table.id}`, JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  }

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
    }
  }

  async function submitCart() {
    if (sending || cart.length === 0) return;
    setSending(true);
    const snapshot = [...cart];
    await Promise.all(snapshot.map(ci =>
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
    snapshot.forEach(ci => saveSessionRequest(ci.item.name, ci.quantity, ci.item.price ?? 0));
    setCart([]);
    setCartOpen(false);
    setShowConfirmation(true);
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
    showToast("Added to order!");
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

  const itemCountByCategory: Record<string, number> = {};
  for (const item of items) {
    itemCountByCategory[item.category_id] = (itemCountByCategory[item.category_id] ?? 0) + 1;
  }

  // Back-to-top
  const [showBackToTop, setShowBackToTop] = useState(false);
  useEffect(() => {
    function onScroll() { setShowBackToTop(window.scrollY > 300); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Realtime: update tableActive if staff closes/opens this table
  useEffect(() => {
    const channel = supabase
      .channel("table-status-" + table.id)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "restaurant_tables",
        filter: `id=eq.${table.id}`,
      }, (payload) => {
        setTableActive((payload.new as { is_active: boolean }).is_active);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [table.id]);


  // --- CLOSED CHECK ---
  if (!tableActive) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, fontFamily: "Inter, system-ui, sans-serif", textAlign: "center" }}>
        <div style={{ fontSize: 72, marginBottom: 20 }}>🔒</div>
        <h1 style={{ fontWeight: 900, fontSize: 26, color: "var(--text)", marginBottom: 12 }}>We&apos;re closed</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 15, maxWidth: 280 }}>This table is currently not taking orders. Please ask a staff member for assistance.</p>
        <div style={{ marginTop: 24, background: accentColor, color: "white", borderRadius: 99, padding: "10px 24px", fontWeight: 700, fontSize: 14 }}>{restaurant.name}</div>
      </div>
    );
  }

  // --- CONFIRMATION SCREEN ---
  if (showConfirmation) {
    return (
      <div style={{ minHeight: "100vh", background: accentColor, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, fontFamily: "Inter, system-ui, sans-serif" }}>
        <style>{`
          @keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
          @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          * { box-sizing: border-box; }
        `}</style>
        <div style={{ animation: "popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)", fontSize: 80, marginBottom: 24, lineHeight: 1 }}>✅</div>
        <h1 style={{ color: "white", fontWeight: 900, fontSize: 32, margin: "0 0 12px", textAlign: "center", animation: "fadeUp 0.4s ease 0.2s both" }}>Order sent!</h1>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 17, textAlign: "center", marginBottom: 36, animation: "fadeUp 0.4s ease 0.35s both", maxWidth: 300 }}>
          Your order is with the kitchen. Sit back and relax! 🍽️
        </p>
        <button
          onClick={() => setShowConfirmation(false)}
          style={{ padding: "14px 36px", borderRadius: 14, background: "var(--surface)", color: accentColor, border: "none", fontWeight: 800, fontSize: 16, cursor: "pointer", animation: "fadeUp 0.4s ease 0.5s both", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}
        >
          Back to menu
        </button>
      </div>
    );
  }

  // --- MAIN MENU ---
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(184,138,30,0.05) 0%, transparent 50%)", fontFamily: "Inter, system-ui, sans-serif", paddingBottom: sessionRequests.length > 0 ? 110 : 90 }}>
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        * { box-sizing: border-box; }
      `}</style>

      {/* HEADER */}
      <header style={{ background: accentColor, color: "white", padding: "20px 16px 16px", textAlign: "center", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
        <h1 style={{ fontWeight: 800, fontSize: 20, margin: 0, letterSpacing: "-0.3px", fontFamily: "'Playfair Display', serif" }}>{restaurant.name}</h1>
        <p style={{ margin: "3px 0 0", opacity: 0.88, fontSize: 13 }}>🍽️ {table.name}</p>
      </header>

      {/* QUICK ACTIONS */}
      <div style={{ padding: "16px 16px 0" }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8 }}>Quick actions</p>
        <div role="group" aria-label="Quick actions" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {([
            ["waiter", "🙋", "Call Waiter"],
            ["bill", "💳", "Request Bill"],
            ["refill", "🔄", "Refill Drinks"],
          ] as [RequestType, string, string][]).map(([type, icon, label]) => (
            <button key={type} onClick={() => sendRequest(type)}
              style={{ padding: "16px 8px", borderRadius: 14, border: `2px solid ${accentColor}`, background: "var(--surface)", cursor: "pointer", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, WebkitTapHighlightColor: "transparent", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
              onTouchStart={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.95)"; }}
              onTouchEnd={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}>
              <span style={{ fontSize: 26 }}>{icon}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: accentColor, lineHeight: 1.2 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ margin: "16px 16px 0", borderTop: "1px solid var(--border)" }} />

      {/* EMPTY MENU */}
      {items.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
          <h2 style={{ fontWeight: 700, fontSize: 20, color: "var(--text)", marginBottom: 8 }}>Menu coming soon</h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>The restaurant is still setting up their menu. Please ask your server.</p>
        </div>
      )}

      {/* CATEGORY TABS */}
      {categories.length > 0 && items.length > 0 && (
        <div style={{ paddingTop: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8, paddingLeft: 16 }}>Menu</p>
          <div role="tablist" aria-label="Menu categories" style={{ overflowX: "auto", display: "flex", gap: 0, borderBottom: "2px solid var(--border)", paddingLeft: 16 }}>
            {categories.map(cat => (
              <button key={cat.id} role="tab" aria-selected={activeCategory === cat.id} onClick={() => setActiveCategory(cat.id)}
                style={{ padding: "8px 14px", border: "none", borderBottom: activeCategory === cat.id ? `2px solid ${accentColor}` : "2px solid transparent", marginBottom: "-2px", background: "none", cursor: "pointer", fontWeight: activeCategory === cat.id ? 700 : 500, color: activeCategory === cat.id ? accentColor : "var(--text-muted)", whiteSpace: "nowrap", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                {cat.icon} {cat.name}
                {(itemCountByCategory[cat.id] ?? 0) > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, background: activeCategory === cat.id ? accentColor : "var(--border)", color: activeCategory === cat.id ? "white" : "var(--text-muted)", borderRadius: 99, padding: "1px 6px", minWidth: 18, textAlign: "center" }}>
                    {itemCountByCategory[cat.id]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MENU ITEMS */}
      {items.length > 0 && (
        <div role="list" aria-label="Menu items" style={{ padding: "12px 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
          {visibleItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 16px", color: "var(--text-muted)" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🍽️</div>
              <p style={{ fontSize: 14, fontWeight: 500 }}>No items in this category.</p>
            </div>
          ) : visibleItems.map(item => (
            <div key={item.id} role="listitem"
              style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{item.name}</div>
                {item.description && <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 3, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{item.description}</div>}
                {item.price ? <div style={{ fontWeight: 800, color: accentColor, marginTop: 6, fontSize: 16 }}>{item.price} kr</div> : null}
              </div>
              <button onClick={() => addToCart(item)}
                style={{ width: 38, height: 38, borderRadius: "50%", background: accentColor, color: "white", border: "none", cursor: "pointer", fontWeight: 800, fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 2px 8px ${accentColor}55` }}>
                +
              </button>
            </div>
          ))}
        </div>
      )}

      {/* FLOATING CART BUTTON */}
      {cart.length > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          style={{ position: "fixed", bottom: sessionRequests.length > 0 ? 60 : 24, left: "50%", transform: "translateX(-50%)", background: accentColor, color: "white", border: "none", borderRadius: 99, padding: "14px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer", zIndex: 40, boxShadow: `0 4px 20px ${accentColor}66`, display: "flex", alignItems: "center", gap: 10, animation: "fadeIn 0.2s ease", whiteSpace: "nowrap" }}>
          <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: "50%", width: 26, height: 26, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>{cartCount}</span>
          View Order
          {cartTotal > 0 && <span style={{ opacity: 0.85, fontSize: 14 }}>· {cartTotal} kr</span>}
        </button>
      )}

      {/* CART MODAL */}
      {cartOpen && (
        <div onClick={() => setCartOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 50, display: "flex", alignItems: "flex-end", animation: "fadeIn 0.15s ease" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: "20px 20px 0 0", padding: "20px 20px 36px", width: "100%", maxWidth: 480, margin: "0 auto", animation: "slideUp 0.22s ease", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontWeight: 800, fontSize: 18, margin: 0 }}>Your Order</h3>
              <button onClick={() => setCartOpen(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--text-muted)", lineHeight: 1 }}>×</button>
            </div>
            {cart.map((ci, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>x{ci.quantity} {ci.item.name}</div>
                  {ci.note && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>📝 {ci.note}</div>}
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
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: "20px 20px 0 0", padding: "24px 20px 36px", width: "100%", maxWidth: 480, margin: "0 auto", animation: "slideUp 0.22s ease" }}>
            <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: 17 }}>
              {noteFor.item.name}
              {noteFor.item.price ? <span style={{ color: accentColor, marginLeft: 8, fontSize: 15 }}>{noteFor.item.price} kr</span> : null}
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
              <span style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 500 }}>Qty:</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, borderRadius: "50%", border: `2px solid ${accentColor}`, background: "var(--surface)", cursor: "pointer", fontSize: 20, fontWeight: 700, color: accentColor, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                <span style={{ fontSize: 20, fontWeight: 800, minWidth: 28, textAlign: "center" }}>{qty}</span>
                <button onClick={() => setQty(q => q + 1)} style={{ width: 36, height: 36, borderRadius: "50%", border: `2px solid ${accentColor}`, background: accentColor, cursor: "pointer", fontSize: 20, fontWeight: 700, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
              </div>
            </div>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Special request? (e.g. no onions)"
              rows={2}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, outline: "none", resize: "none", background: "var(--bg)", color: "var(--text)" }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={confirmAddToCart}
                style={{ flex: 1, padding: "13px", borderRadius: 12, background: accentColor, color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15 }}>
                Add to order
              </button>
              <button onClick={() => setNoteFor(null)} style={{ padding: "13px 16px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", color: "var(--text-muted)" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STICKY SESSION SUMMARY */}
      {sessionRequests.length > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30 }}>
          <button
            onClick={() => setSessionPanelOpen(o => !o)}
            style={{ width: "100%", background: "var(--surface)", color: "var(--text)", border: "none", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", fontSize: 14, fontWeight: 700 }}
          >
            <span>🧾 <b>{sessionRequests.reduce((s, r) => s + r.qty, 0)}</b> items ordered{sessionRequests.some(r => r.price > 0) ? <span style={{ fontWeight: 800, color: accentColor }}>&nbsp;·&nbsp;{sessionRequests.reduce((s, r) => s + r.qty * r.price, 0)} kr</span> : ""}</span>
            <span style={{ fontSize: 18 }}>{sessionPanelOpen ? "▼" : "▲"}</span>
          </button>
          {sessionPanelOpen && (
            <div style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", padding: "12px 16px", maxHeight: 200, overflowY: "auto" }}>
              {sessionRequests.map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>x{r.qty} {r.name}</span>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {r.price > 0 && <span style={{ fontWeight: 700, color: accentColor }}>{r.qty * r.price} kr</span>}
                    <span style={{ color: "var(--text-muted)" }}>{r.time}</span>
                  </div>
                </div>
              ))}
              {sessionRequests.some(r => r.price > 0) && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 2px", fontWeight: 800, fontSize: 14, borderTop: "2px solid var(--border)", marginTop: 4 }}>
                  <span>Total spent</span>
                  <span style={{ color: accentColor }}>{sessionRequests.reduce((s, r) => s + r.qty * r.price, 0)} kr</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* BACK TO TOP */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{ position: "fixed", bottom: sessionRequests.length > 0 ? 80 : 80, right: 16, zIndex: 35, width: 44, height: 44, borderRadius: "50%", background: accentColor, color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 16px ${accentColor}66`, animation: "fadeIn 0.2s ease" }}
          aria-label="Back to top"
        >↑</button>
      )}

      {/* TOAST */}
      {toast && (
        <div role="status" aria-live="polite" style={{ position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)", background: "#16a34a", color: "white", padding: "10px 22px", borderRadius: 99, fontWeight: 600, fontSize: 14, zIndex: 100, whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(22,163,74,0.4)", animation: "fadeIn 0.2s ease" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
