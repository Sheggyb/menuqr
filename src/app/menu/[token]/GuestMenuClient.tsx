     1|"use client";
     2|import { useState, useEffect } from "react";
     3|import { createClient } from "@/lib/supabase/client";
     4|import type { Restaurant, MenuCategory, MenuItem, TableRow } from "@/lib/types";
     5|
     6|interface Props {
     7|  table: TableRow & { restaurant: Restaurant };
     8|  restaurant: Restaurant;
     9|  categories: MenuCategory[];
    10|  items: MenuItem[];
    11|}
    12|
    13|type RequestType = "waiter" | "bill" | "refill" | "item_request";
    14|
    15|interface CartItem {
    16|  item: MenuItem;
    17|  quantity: number;
    18|  note: string;
    19|}
    20|
    21|interface SessionRequest {
    22|  name: string;
    23|  qty: number;
    24|  time: string;
    25|}
    26|
    27|export default function GuestMenuClient({ table, restaurant, categories, items }: Props) {
    28|  const supabase = createClient();
    29|  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");
    30|  const [toast, setToast] = useState("");
    31|  const [sending, setSending] = useState(false);
    32|  const [cart, setCart] = useState<CartItem[]>([]);
    33|  const [cartOpen, setCartOpen] = useState(false);
    34|  const [noteFor, setNoteFor] = useState<{ item: MenuItem } | null>(null);
    35|  const [noteText, setNoteText] = useState("");
    36|  const [qty, setQty] = useState(1);
    37|  const [showConfirmation, setShowConfirmation] = useState(false);
    38|  const [sessionRequests, setSessionRequests] = useState<SessionRequest[]>([]);
    39|  const [sessionPanelOpen, setSessionPanelOpen] = useState(false);
    40|
    41|  const accentColor = restaurant.accent_color || "#E85D2F";
    42|
    43|  useEffect(() => {
    44|    try {
    45|      const stored = sessionStorage.getItem(`menuqr_session_${table.id}`);
    46|      if (stored) setSessionRequests(JSON.parse(stored));
    47|    } catch { /* ignore */ }
    48|  }, [table.id]);
    49|
    50|  function saveSessionRequest(name: string, quantity: number) {
    51|    const req: SessionRequest = {
    52|      name,
    53|      qty: quantity,
    54|      time: new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }),
    55|    };
    56|    setSessionRequests(prev => {
    57|      const updated = [...prev, req];
    58|      try { sessionStorage.setItem(`menuqr_session_${table.id}`, JSON.stringify(updated)); } catch { /* ignore */ }
    59|      return updated;
    60|    });
    61|  }
    62|
    63|  async function sendRequest(type: RequestType, item?: MenuItem, note?: string, quantity?: number) {
    64|    if (sending) return;
    65|    setSending(true);
    66|    const { error } = await supabase.from("table_requests").insert({
    67|      restaurant_id: restaurant.id,
    68|      table_id: table.id,
    69|      type,
    70|      item_id: item?.id ?? null,
    71|      item_name: item ? `${quantity && quantity > 1 ? `x${quantity} ` : ""}${item.name}` : null,
    72|      note: note ?? null,
    73|      status: "pending",
    74|    });
    75|    setSending(false);
    76|    if (!error) {
    77|      showToast("✅ Request sent!");
    78|    }
    79|  }
    80|
    81|  async function submitCart() {
    82|    if (sending || cart.length === 0) return;
    83|    setSending(true);
    84|    const snapshot = [...cart];
    85|    await Promise.all(snapshot.map(ci =>
    86|      supabase.from("table_requests").insert({
    87|        restaurant_id: restaurant.id,
    88|        table_id: table.id,
    89|        type: "item_request",
    90|        item_id: ci.item.id,
    91|        item_name: `x${ci.quantity} ${ci.item.name}`,
    92|        note: ci.note || null,
    93|        status: "pending",
    94|      })
    95|    ));
    96|    setSending(false);
    97|    snapshot.forEach(ci => saveSessionRequest(ci.item.name, ci.quantity));
    98|    setCart([]);
    99|    setCartOpen(false);
   100|    setShowConfirmation(true);
   101|  }
   102|
   103|  function addToCart(item: MenuItem) {
   104|    setNoteFor({ item });
   105|    setQty(1);
   106|    setNoteText("");
   107|  }
   108|
   109|  function confirmAddToCart() {
   110|    if (!noteFor) return;
   111|    setCart(prev => {
   112|      const existing = prev.find(c => c.item.id === noteFor.item.id && c.note === noteText);
   113|      if (existing) {
   114|        return prev.map(c => c === existing ? { ...c, quantity: c.quantity + qty } : c);
   115|      }
   116|      return [...prev, { item: noteFor.item, quantity: qty, note: noteText }];
   117|    });
   118|    setNoteFor(null);
   119|    showToast("Added to order!");
   120|  }
   121|
   122|  function removeFromCart(idx: number) {
   123|    setCart(prev => prev.filter((_, i) => i !== idx));
   124|  }
   125|
   126|  function showToast(msg: string) {
   127|    setToast(msg);
   128|    setTimeout(() => setToast(""), 3000);
   129|  }
   130|
   131|  const visibleItems = items.filter(i => i.category_id === activeCategory);
   132|  const cartTotal = cart.reduce((sum, c) => sum + c.quantity * (c.item.price ?? 0), 0);
   133|  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);
   134|
   135|  const itemCountByCategory: Record<string, number> = {};
   136|  for (const item of items) {
   137|    itemCountByCategory[item.category_id] = (itemCountByCategory[item.category_id] ?? 0) + 1;
   138|  }
   139|
   140|  // Back-to-top
   141|  const [showBackToTop, setShowBackToTop] = useState(false);
   142|  useEffect(() => {
   143|    function onScroll() { setShowBackToTop(window.scrollY > 300); }
   144|    window.addEventListener("scroll", onScroll, { passive: true });
   145|    return () => window.removeEventListener("scroll", onScroll);
   146|  }, []);
   147|
   148|  // --- CLOSED CHECK ---
   149|  if ((table as { status?: string }).status === "closed") {
   150|    return (
   151|      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, fontFamily: "Inter, system-ui, sans-serif", textAlign: "center" }}>
   152|        <div style={{ fontSize: 72, marginBottom: 20 }}>🔒</div>
   153|        <h1 style={{ fontWeight: 900, fontSize: 26, color: "var(--text)", marginBottom: 12 }}>We&apos;re closed</h1>
   154|        <p style={{ color: "var(--text-muted)", fontSize: 15, maxWidth: 280 }}>This table is currently not taking orders. Please ask a staff member for assistance.</p>
   155|        <div style={{ marginTop: 24, background: accentColor, color: "white", borderRadius: 99, padding: "10px 24px", fontWeight: 700, fontSize: 14 }}>{restaurant.name}</div>
   156|      </div>
   157|    );
   158|  }
   159|
   160|  // --- CONFIRMATION SCREEN ---
   161|  if (showConfirmation) {
   162|    return (
   163|      <div style={{ minHeight: "100vh", background: accentColor, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, fontFamily: "Inter, system-ui, sans-serif" }}>
   164|        <style>{`
   165|          @keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
   166|          @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
   167|          * { box-sizing: border-box; }
   168|        `}</style>
   169|        <div style={{ animation: "popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)", fontSize: 80, marginBottom: 24, lineHeight: 1 }}>✅</div>
   170|        <h1 style={{ color: "white", fontWeight: 900, fontSize: 32, margin: "0 0 12px", textAlign: "center", animation: "fadeUp 0.4s ease 0.2s both" }}>Order sent!</h1>
   171|        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 17, textAlign: "center", marginBottom: 36, animation: "fadeUp 0.4s ease 0.35s both", maxWidth: 300 }}>
   172|          Your order is with the kitchen. Sit back and relax! 🍽️
   173|        </p>
   174|        <button
   175|          onClick={() => setShowConfirmation(false)}
   176|          style={{ padding: "14px 36px", borderRadius: 14, background: "var(--surface)", color: accentColor, border: "none", fontWeight: 800, fontSize: 16, cursor: "pointer", animation: "fadeUp 0.4s ease 0.5s both", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}
   177|        >
   178|          Back to menu
   179|        </button>
   180|      </div>
   181|    );
   182|  }
   183|
   184|  // --- MAIN MENU ---
   185|  return (
   186|    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "Inter, system-ui, sans-serif", paddingBottom: sessionRequests.length > 0 ? 110 : 90 }}>
   187|      <style>{`
   188|        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
   189|        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
   190|        * { box-sizing: border-box; }
   191|      `}</style>
   192|
   193|      {/* HEADER */}
   194|      <header style={{ background: accentColor, color: "white", padding: "20px 16px 16px", textAlign: "center", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
   195|        <h1 style={{ fontWeight: 800, fontSize: 20, margin: 0, letterSpacing: "-0.3px" }}>{restaurant.name}</h1>
   196|        <p style={{ margin: "3px 0 0", opacity: 0.88, fontSize: 13 }}>🍽️ {table.name}</p>
   197|      </header>
   198|
   199|      {/* QUICK ACTIONS */}
   200|      <div style={{ padding: "16px 16px 0" }}>
   201|        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8 }}>Quick actions</p>
   202|        <div role="group" aria-label="Quick actions" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
   203|          {([
   204|            ["waiter", "🙋", "Call Waiter"],
   205|            ["bill", "💳", "Request Bill"],
   206|            ["refill", "🔄", "Refill Drinks"],
   207|          ] as [RequestType, string, string][]).map(([type, icon, label]) => (
   208|            <button key={type} onClick={() => sendRequest(type)}
   209|              style={{ padding: "16px 8px", borderRadius: 14, border: `2px solid ${accentColor}`, background: "var(--surface)", cursor: "pointer", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, WebkitTapHighlightColor: "transparent", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
   210|              onTouchStart={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.95)"; }}
   211|              onTouchEnd={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}>
   212|              <span style={{ fontSize: 26 }}>{icon}</span>
   213|              <span style={{ fontSize: 12, fontWeight: 700, color: accentColor, lineHeight: 1.2 }}>{label}</span>
   214|            </button>
   215|          ))}
   216|        </div>
   217|      </div>
   218|
   219|      <div style={{ margin: "16px 16px 0", borderTop: "1px solid var(--border)" }} />
   220|
   221|      {/* EMPTY MENU */}
   222|      {items.length === 0 && (
   223|        <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
   224|          <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
   225|          <h2 style={{ fontWeight: 700, fontSize: 20, color: "var(--text)", marginBottom: 8 }}>Menu coming soon</h2>
   226|          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>The restaurant is still setting up their menu. Please ask your server.</p>
   227|        </div>
   228|      )}
   229|
   230|      {/* CATEGORY TABS */}
   231|      {categories.length > 0 && items.length > 0 && (
   232|        <div style={{ paddingTop: 12 }}>
   233|          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8, paddingLeft: 16 }}>Menu</p>
   234|          <div role="tablist" aria-label="Menu categories" style={{ overflowX: "auto", display: "flex", gap: 0, borderBottom: "2px solid var(--border)", paddingLeft: 16 }}>
   235|            {categories.map(cat => (
   236|              <button key={cat.id} role="tab" aria-selected={activeCategory === cat.id} onClick={() => setActiveCategory(cat.id)}
   237|                style={{ padding: "8px 14px", border: "none", borderBottom: activeCategory === cat.id ? `2px solid ${accentColor}` : "2px solid transparent", marginBottom: "-2px", background: "none", cursor: "pointer", fontWeight: activeCategory === cat.id ? 700 : 500, color: activeCategory === cat.id ? accentColor : "#6b7280", whiteSpace: "nowrap", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
   238|                {cat.icon} {cat.name}
   239|                {(itemCountByCategory[cat.id] ?? 0) > 0 && (
   240|                  <span style={{ fontSize: 11, fontWeight: 700, background: activeCategory === cat.id ? accentColor : "#e5e7eb", color: activeCategory === cat.id ? "white" : "#6b7280", borderRadius: 99, padding: "1px 6px", minWidth: 18, textAlign: "center" }}>
   241|                    {itemCountByCategory[cat.id]}
   242|                  </span>
   243|                )}
   244|              </button>
   245|            ))}
   246|          </div>
   247|        </div>
   248|      )}
   249|
   250|      {/* MENU ITEMS */}
   251|      {items.length > 0 && (
   252|        <div role="list" aria-label="Menu items" style={{ padding: "12px 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
   253|          {visibleItems.length === 0 ? (
   254|            <div style={{ textAlign: "center", padding: "48px 16px", color: "var(--text-muted)" }}>
   255|              <div style={{ fontSize: 36, marginBottom: 8 }}>🍽️</div>
   256|              <p style={{ fontSize: 14, fontWeight: 500 }}>No items in this category.</p>
   257|            </div>
   258|          ) : visibleItems.map(item => (
   259|            <div key={item.id} role="listitem"
   260|              style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
   261|              <div style={{ flex: 1, minWidth: 0 }}>
   262|                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{item.name}</div>
   263|                {item.description && <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 3, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{item.description}</div>}
   264|                {item.price ? <div style={{ fontWeight: 800, color: accentColor, marginTop: 6, fontSize: 16 }}>{item.price} kr</div> : null}
   265|              </div>
   266|              <button onClick={() => addToCart(item)}
   267|                style={{ width: 38, height: 38, borderRadius: "50%", background: accentColor, color: "white", border: "none", cursor: "pointer", fontWeight: 800, fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 2px 8px ${accentColor}55` }}>
   268|                +
   269|              </button>
   270|            </div>
   271|          ))}
   272|        </div>
   273|      )}
   274|
   275|      {/* FLOATING CART BUTTON */}
   276|      {cart.length > 0 && !cartOpen && (
   277|        <button
   278|          onClick={() => setCartOpen(true)}
   279|          style={{ position: "fixed", bottom: sessionRequests.length > 0 ? 60 : 24, left: "50%", transform: "translateX(-50%)", background: accentColor, color: "white", border: "none", borderRadius: 99, padding: "14px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer", zIndex: 40, boxShadow: `0 4px 20px ${accentColor}66`, display: "flex", alignItems: "center", gap: 10, animation: "fadeIn 0.2s ease", whiteSpace: "nowrap" }}>
   280|          <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: "50%", width: 26, height: 26, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>{cartCount}</span>
   281|          View Order
   282|          {cartTotal > 0 && <span style={{ opacity: 0.85, fontSize: 14 }}>· {cartTotal} kr</span>}
   283|        </button>
   284|      )}
   285|
   286|      {/* CART MODAL */}
   287|      {cartOpen && (
   288|        <div onClick={() => setCartOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 50, display: "flex", alignItems: "flex-end", animation: "fadeIn 0.15s ease" }}>
   289|          <div onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: "20px 20px 0 0", padding: "20px 20px 36px", width: "100%", maxWidth: 480, margin: "0 auto", animation: "slideUp 0.22s ease", maxHeight: "80vh", overflowY: "auto" }}>
   290|            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
   291|              <h3 style={{ fontWeight: 800, fontSize: 18, margin: 0 }}>Your Order</h3>
   292|              <button onClick={() => setCartOpen(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--text-muted)", lineHeight: 1 }}>×</button>
   293|            </div>
   294|            {cart.map((ci, idx) => (
   295|              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
   296|                <div style={{ flex: 1 }}>
   297|                  <div style={{ fontWeight: 600, fontSize: 14 }}>x{ci.quantity} {ci.item.name}</div>
   298|                  {ci.note && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>📝 {ci.note}</div>}
   299|                  {ci.item.price ? <div style={{ fontSize: 13, color: accentColor, fontWeight: 700 }}>{ci.quantity * ci.item.price} kr</div> : null}
   300|                </div>
   301|                <button onClick={() => removeFromCart(idx)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 18, fontWeight: 700, padding: "0 4px" }}>×</button>
   302|              </div>
   303|            ))}
   304|            {cartTotal > 0 && (
   305|              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 4px", fontWeight: 800, fontSize: 15 }}>
   306|                <span>Total</span>
   307|                <span style={{ color: accentColor }}>{cartTotal} kr</span>
   308|              </div>
   309|            )}
   310|            <button onClick={submitCart}
   311|              disabled={sending}
   312|              style={{ width: "100%", padding: "14px", borderRadius: 12, background: accentColor, color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 16, marginTop: 16, opacity: sending ? 0.7 : 1 }}>
   313|              {sending ? "Sending..." : `✅ Send Order (${cartCount} item${cartCount !== 1 ? "s" : ""})`}
   314|            </button>
   315|          </div>
   316|        </div>
   317|      )}
   318|
   319|      {/* ADD ITEM MODAL */}
   320|      {noteFor && (
   321|        <div onClick={() => setNoteFor(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 50, display: "flex", alignItems: "flex-end", animation: "fadeIn 0.15s ease" }}>
   322|          <div onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: "20px 20px 0 0", padding: "24px 20px 36px", width: "100%", maxWidth: 480, margin: "0 auto", animation: "slideUp 0.22s ease" }}>
   323|            <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: 17 }}>
   324|              {noteFor.item.name}
   325|              {noteFor.item.price ? <span style={{ color: accentColor, marginLeft: 8, fontSize: 15 }}>{noteFor.item.price} kr</span> : null}
   326|            </h3>
   327|            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
   328|              <span style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 500 }}>Qty:</span>
   329|              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
   330|                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, borderRadius: "50%", border: `2px solid ${accentColor}`, background: "var(--surface)", cursor: "pointer", fontSize: 20, fontWeight: 700, color: accentColor, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
   331|                <span style={{ fontSize: 20, fontWeight: 800, minWidth: 28, textAlign: "center" }}>{qty}</span>
   332|                <button onClick={() => setQty(q => q + 1)} style={{ width: 36, height: 36, borderRadius: "50%", border: `2px solid ${accentColor}`, background: accentColor, cursor: "pointer", fontSize: 20, fontWeight: 700, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
   333|              </div>
   334|            </div>
   335|            <textarea
   336|              value={noteText}
   337|              onChange={e => setNoteText(e.target.value)}
   338|              placeholder="Special request? (e.g. no onions)"
   339|              rows={2}
   340|              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, outline: "none", resize: "none", background: "var(--surface)", color: "var(--text)", background: "var(--surface)", color: "var(--text)" }}
   341|            />
   342|            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
   343|              <button onClick={confirmAddToCart}
   344|                style={{ flex: 1, padding: "13px", borderRadius: 12, background: accentColor, color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15 }}>
   345|                Add to order
   346|              </button>
   347|              <button onClick={() => setNoteFor(null)} style={{ padding: "13px 16px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", color: "var(--text-muted)" }}>
   348|                Cancel
   349|              </button>
   350|            </div>
   351|          </div>
   352|        </div>
   353|      )}
   354|
   355|      {/* STICKY SESSION SUMMARY */}
   356|      {sessionRequests.length > 0 && (
   357|        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30 }}>
   358|          <button
   359|            onClick={() => setSessionPanelOpen(o => !o)}
   360|            style={{ width: "100%", background: "var(--surface)", color: "var(--text)", border: "none", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", fontSize: 14, fontWeight: 700 }}
   361|          >
   362|            <span>🧾 Your requests ({sessionRequests.reduce((s, r) => s + r.qty, 0)} items)</span>
   363|            <span style={{ fontSize: 18 }}>{sessionPanelOpen ? "▼" : "▲"}</span>
   364|          </button>
   365|          {sessionPanelOpen && (
   366|            <div style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", padding: "12px 16px", maxHeight: 200, overflowY: "auto" }}>
   367|              {sessionRequests.map((r, i) => (
   368|                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13 }}>
   369|                  <span style={{ fontWeight: 600 }}>x{r.qty} {r.name}</span>
   370|                  <span style={{ color: "var(--text-muted)" }}>{r.time}</span>
   371|                </div>
   372|              ))}
   373|            </div>
   374|          )}
   375|        </div>
   376|      )}
   377|
   378|      {/* BACK TO TOP */}
   379|      {showBackToTop && (
   380|        <button
   381|          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
   382|          style={{ position: "fixed", bottom: sessionRequests.length > 0 ? 80 : 80, right: 16, zIndex: 35, width: 44, height: 44, borderRadius: "50%", background: accentColor, color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 16px ${accentColor}66`, animation: "fadeIn 0.2s ease" }}
   383|          aria-label="Back to top"
   384|        >↑</button>
   385|      )}
   386|
   387|      {/* TOAST */}
   388|      {toast && (
   389|        <div role="status" aria-live="polite" style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "#16a34a", color: "white", padding: "12px 24px", borderRadius: 99, fontWeight: 600, fontSize: 15, zIndex: 100, whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(22,163,74,0.35)", animation: "fadeIn 0.2s ease" }}>
   390|          {toast}
   391|        </div>
   392|      )}
   393|    </div>
   394|  );
   395|}
   396|