"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Restaurant, MenuCategory, MenuItem, MenuItemOption, TableRow } from "@/lib/types";

interface Props {
  table: TableRow & { restaurant: Restaurant };
  restaurant: Restaurant;
  categories: MenuCategory[];
  items: MenuItem[];
  options: MenuItemOption[];
}

type RequestType = "waiter" | "bill" | "refill" | "item_request";
type QuickType = "waiter" | "bill" | "refill";

const QUICK_TYPES: QuickType[] = ["waiter", "bill", "refill"];
const QUICK_TTL_MS = 10 * 60 * 1000; // re-enable after 10 min if we never learn the status
const QUICK_DONE_LABEL: Record<QuickType, string> = {
  waiter: "Waiter notified",
  bill: "Bill requested",
  refill: "Refill requested",
};

interface QuickDoneEntry { ts: number; id?: string }

interface CartItem {
  item: MenuItem;
  quantity: number;
  note: string;
  options: { label: string; priceDelta: number; kind: "choice" | "ingredient" }[];
}

interface SessionRequest {
  id: string;       // table_request id from DB
  name: string;
  qty: number;
  price: number;
  time: string;
  status: "pending" | "seen" | "done"; // live status from DB
}

/* ── Minimal line icons (stroke 1.5, currentColor) ──────────────── */
function icon(path: React.ReactNode, size = 20) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {path}
    </svg>
  );
}
const IconDish = (size = 40) => icon(<><path d="M4 16a8 8 0 0 1 16 0" /><path d="M12 8V6" /><path d="M2.5 16h19" /><path d="M5 20h14" /></>, size);
const IconClock = (size = 40) => icon(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>, size);
const IconLock = (size = 40) => icon(<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7.5a4 4 0 0 1 8 0V11" /></>, size);
const IconBell = (size = 20) => icon(<><path d="M18 9.5a6 6 0 0 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" /><path d="M10.3 19.5a2 2 0 0 0 3.4 0" /></>, size);
const IconCard = (size = 20) => icon(<><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10.5h18" /></>, size);
const IconRefresh = (size = 20) => icon(<><path d="M20.5 12a8.5 8.5 0 1 1-2.5-6" /><path d="M20.5 3.5v4h-4" /></>, size);
const IconReceipt = (size = 18) => icon(<><path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3v-17Z" /><path d="M9 8.5h6" /><path d="M9 12h6" /></>, size);
const IconChevron = (up: boolean, size = 14) => icon(up ? <path d="M6 14.5l6-6 6 6" /> : <path d="M6 9.5l6 6 6-6" />, size);
const IconArrowUp = (size = 18) => icon(<><path d="M12 19V5" /><path d="M6 11l6-6 6 6" /></>, size);
const IconTick = (size = 18) => icon(<path d="M5 12.5l4.5 4.5L19 7.5" />, size);
const IconQr = (size = 40) => icon(<><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><path d="M14 14h2.5v2.5H14z" /><path d="M17.5 17.5H20V20h-2.5z" /></>, size);

export default function GuestMenuClient({ table, restaurant, categories, items, options }: Props) {
  // Only show categories that actually have available items
  const itemCountByCategory: Record<string, number> = {};
  for (const item of items) {
    itemCountByCategory[item.category_id] = (itemCountByCategory[item.category_id] ?? 0) + 1;
  }
  const visibleCategories = categories.filter(c => (itemCountByCategory[c.id] ?? 0) > 0);

  const [activeCategory, setActiveCategory] = useState(visibleCategories[0]?.id ?? "");
  const [toast, setToast] = useState("");
  const [tableActive, setTableActive] = useState(table.is_active);
  // Server-safe initial state; sessionStorage is read after mount (audit 2.7 —
  // reading storage in state initializers causes hydration mismatches)
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<"idle" | "pending" | "active" | "declined">("idle");
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`menuqr_sid_${table.id}`);
      if (stored) {
        setSessionId(stored);
        setSessionStatus("pending"); // exact state confirmed by the poll
      }
    } catch { /* ignore */ }
  }, [table.id]);
  const [sending, setSending] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [noteFor, setNoteFor] = useState<{ item: MenuItem } | null>(null);
  // optionId -> selected choiceId (per item sheet session)
  const [selOptions, setSelOptions] = useState<Record<string, string>>({});
  // optionId -> KEPT ingredient choiceIds (ingredients groups; default = all)
  const [selIngredients, setSelIngredients] = useState<Record<string, string[]>>({});
  const [noteText, setNoteText] = useState("");
  const [qty, setQty] = useState(1);
  const [sessionRequests, setSessionRequests] = useState<SessionRequest[]>([]);
  const [sessionPanelOpen, setSessionPanelOpen] = useState(false);

  // Quick-action (waiter/bill/refill) "already requested" state — per table, survives reload
  const quickStorageKey = `menuqr_qa_${table.id}`;
  const [quickDone, setQuickDone] = useState<Partial<Record<QuickType, QuickDoneEntry>>>({});
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`menuqr_qa_${table.id}`);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Record<QuickType, QuickDoneEntry>>;
      const now = Date.now();
      const out: Partial<Record<QuickType, QuickDoneEntry>> = {};
      for (const t of QUICK_TYPES) {
        const e = parsed[t];
        if (e && typeof e.ts === "number" && now - e.ts < QUICK_TTL_MS) out[t] = e;
      }
      setQuickDone(out);
    } catch { /* ignore */ }
  }, [table.id]);

  function persistQuick(next: Partial<Record<QuickType, QuickDoneEntry>>) {
    setQuickDone(next);
    try { sessionStorage.setItem(quickStorageKey, JSON.stringify(next)); } catch { /* ignore */ }
  }
  function markQuickDone(type: QuickType, id?: string) {
    persistQuick({ ...quickDone, [type]: { ts: Date.now(), id } });
  }
  function clearAllQuick() {
    setQuickDone({});
    try { sessionStorage.removeItem(quickStorageKey); } catch { /* ignore */ }
  }

  // Re-enable quick actions: when staff marks the request done (poll by id), after TTL, or on table close
  useEffect(() => {
    const entries = QUICK_TYPES.filter(t => quickDone[t]);
    if (entries.length === 0) return;
    let cancelled = false;
    const check = async () => {
      const now = Date.now();
      let next = quickDone;
      let changed = false;

      // TTL expiry
      for (const t of entries) {
        const e = quickDone[t];
        if (e && now - e.ts >= QUICK_TTL_MS) {
          if (!changed) { next = { ...next }; changed = true; }
          delete next[t];
        }
      }

      // Status poll for entries where we know the request id
      const withIds = entries.filter(t => quickDone[t]?.id && next[t]);
      if (withIds.length > 0) {
        try {
          const ids = withIds.map(t => quickDone[t]!.id).join(",");
          const res = await fetch(`/api/orders/status?ids=${ids}`);
          const data = await res.json();
          for (const t of withIds) {
            const id = quickDone[t]!.id!;
            if (data.statuses?.[id] === "done") {
              if (!changed) { next = { ...next }; changed = true; }
              delete next[t];
            }
          }
        } catch { /* ignore */ }
      }

      if (changed && !cancelled) persistQuick(next);
    };
    check();
    const interval = setInterval(check, 10_000);
    return () => { cancelled = true; clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickDone, table.id]);

  useEffect(() => {
    if (!tableActive) clearAllQuick();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableActive]);

  const accentColor = restaurant.accent_color || "#E85D2F";

  // Currency — DB value (NOT NULL, default SEK) is the only source of truth
  const currencySymbol = (() => {
    const map: Record<string, string> = { SEK: "kr", USD: "$", EUR: "€", GBP: "£", NOK: "kr", DKK: "kr", CHF: "CHF", JPY: "¥", AUD: "$", CAD: "$" };
    return map[restaurant.currency] ?? restaurant.currency ?? "kr";
  })();
  // Money — format consistently: no float artifacts (17.400000000000002),
  // whole numbers stay "12", fractional show two decimals "12.50" (audit 2.2)
  const fmtPrice = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

  const [readyBanner, setReadyBanner] = useState<string[]>([]); // item names that just became "done"

  // Poll order statuses every 4s so guest sees pending→seen→done live
  useEffect(() => {
    if (sessionRequests.length === 0) return;
    const ids = sessionRequests.map(r => r.id).filter(Boolean).join(",");
    if (!ids) return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/status?ids=${ids}`);
        const data = await res.json();
        setSessionRequests(prev => {
          const next = prev.map(r => data.statuses[r.id] ? { ...r, status: data.statuses[r.id] as SessionRequest["status"] } : r);
          // Detect transitions to "done" — show collect notification
          const justDone = prev
            .filter(r => r.status !== "done" && data.statuses[r.id] === "done")
            .map(r => r.name);
          if (justDone.length > 0 && restaurant.venue_type !== "table_service") setReadyBanner(justDone);
          return next;
        });
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 4000);
    return () => clearInterval(interval);
  }, [sessionRequests.length]);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`menuqr_session_${table.id}`);
      if (stored) setSessionRequests(JSON.parse(stored));
    } catch { /* ignore */ }
  }, [table.id]);

  function saveSessionRequest(id: string, name: string, quantity: number, price: number) {
    const req: SessionRequest = {
      id,
      name,
      qty: quantity,
      price,
      time: new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }),
      status: "pending",
    };
    setSessionRequests(prev => {
      const updated = [...prev, req];
      try { sessionStorage.setItem(`menuqr_session_${table.id}`, JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  }

  async function requestSession() {
    setSessionStatus("pending");
    // Clear previous order history — fresh session for new guest
    sessionStorage.removeItem(`menuqr_session_${table.id}`);
    setSessionRequests([]);
    clearAllQuick();
    try {
      const res = await fetch("/api/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table_token: table.token }),
      });
      const data = await res.json();
      if (data.session_id) {
        sessionStorage.setItem(`menuqr_sid_${table.id}`, data.session_id);
        setSessionId(data.session_id);
        // Always wait for staff to approve — regardless of venue type
        setSessionStatus("pending");
      } else if (data.error === "table_closed") {
        setSessionStatus("idle");
        showToast("Table is closed");
      }
    } catch {
      setSessionStatus("idle");
    }
  }

  async function sendRequest(type: RequestType, item?: MenuItem, note?: string, quantity?: number) {
    if (type !== "item_request" && quickDone[type as QuickType]) return;
    const sid = sessionStorage.getItem(`menuqr_sid_${table.id}`);
    if (sending || !tableActive || !sid || sessionStatus !== "active") {
      if (!tableActive) showToast("Table is closed");
      else if (!sid || sessionStatus !== "active") showToast("Session not approved");
      return;
    }
    setSending(true);
    const res = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sid,
        restaurant_id: restaurant.id,
        table_id: table.id,
        type,
        item_id: item?.id ?? null,
        item_name: item ? `${quantity && quantity > 1 ? `x${quantity} ` : ""}${item.name}` : null,
        note: note ?? null,
      }),
    });
    const data = await res.json();
    setSending(false);
    if (data.ok) {
      if (type !== "item_request") {
        markQuickDone(type as QuickType, typeof data.id === "string" ? data.id : undefined);
        showToast(QUICK_DONE_LABEL[type as QuickType]);
      } else {
        showToast("Request sent");
      }
    } else if (res.status === 409 && data.error === "duplicate_request" && type !== "item_request") {
      // Someone at the table already asked — reflect the same "requested" state
      markQuickDone(type as QuickType);
      showToast(QUICK_DONE_LABEL[type as QuickType]);
    } else if (data.error === "session_invalid") {
      setSessionStatus("declined");
      showToast("Session expired, please request again");
    } else if (res.status === 429) {
      showToast("Too many requests — try again in a moment");
    } else if (data.error === "table_closed") {
      setTableActive(false);
      showToast("Table is closed");
    } else {
      showToast("Something went wrong — please try again");
    }
  }

  async function submitCart() {
    const sid = sessionStorage.getItem(`menuqr_sid_${table.id}`);
    if (sending || cart.length === 0 || !tableActive || !sid || sessionStatus !== "active") {
      if (!tableActive) showToast("Table is closed");
      else if (!sid || sessionStatus !== "active") showToast("Session not approved");
      return;
    }
    setSending(true);
    const snapshot = [...cart];
    // Merge all cart items into ONE order line
    const combinedName = snapshot.map(ci =>
      `x${ci.quantity} ${ci.item.name}${ci.options.length > 0 ? ` (${ci.options.map(o => o.label).join(", ")})` : ""}${ci.note ? ` (${ci.note})` : ""}`
    ).join("\n");
    const combinedNote = snapshot.filter(ci => ci.note).length > 0
      ? snapshot.map(ci => `${ci.item.name}: ${ci.note}`).join("; ")
      : null;
    const totalPrice = snapshot.reduce((s, ci) => s + ci.quantity * ((ci.item.price ?? 0) + ci.options.reduce((x, o) => x + o.priceDelta, 0)), 0);

    const res = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sid,
        restaurant_id: restaurant.id,
        table_id: table.id,
        type: "item_request",
        item_id: null,
        item_name: combinedName,
        note: combinedNote,
      }),
    });
    const data = await res.json();
    setSending(false);
    if (data.ok) {
      saveSessionRequest(data.id ?? crypto.randomUUID(), combinedName, 1, totalPrice);
      setCart([]);
      setCartOpen(false);
      showToast("Order sent");
    } else if (data.error === "session_invalid") {
      setSessionStatus("declined");
      showToast("Session expired, please request again");
    } else if (res.status === 429) {
      showToast("Too many requests — try again in a moment");
    } else if (data.error === "table_closed") {
      setTableActive(false);
      showToast("Table is closed");
    } else {
      showToast("Something went wrong — please try again");
    }
  }

  function addToCart(item: MenuItem) {
    setNoteFor({ item });
    setQty(1);
    setNoteText("");
    setSelOptions({});
    setSelIngredients({});
  }

  function toggleIngredient(oId: string, cId: string, allIds: string[]) {
    setSelIngredients(s => {
      const current = s[oId] ?? allIds;
      return { ...s, [oId]: current.includes(cId) ? current.filter(x => x !== cId) : [...current, cId] };
    });
  }

  function confirmAddToCart() {
    if (!noteFor) return;
    const itemOptions = options.filter(o => o.item_id === noteFor.item.id);
    // Required choice groups must have a selection
    for (const o of itemOptions) {
      if (o.type === "choice" && o.is_required && !selOptions[o.id]) {
        showToast(`Please choose: ${o.name}`);
        return;
      }
    }
    const chosen: CartItem["options"] = [];
    for (const o of itemOptions) {
      if (o.type === "ingredients") {
        // All ingredients on by default — removed ones become "utan X"
        const kept = selIngredients[o.id] ?? o.choices.map(c => c.id);
        for (const c of o.choices) {
          if (!kept.includes(c.id)) chosen.push({ label: `utan ${c.label}`, priceDelta: 0, kind: "ingredient" });
        }
      } else if (selOptions[o.id]) {
        const c = o.choices.find(c => c.id === selOptions[o.id]);
        if (c) chosen.push({ label: c.label, priceDelta: c.price_delta, kind: "choice" });
      }
    }
    const optKey = chosen.map(c => c.label).join("|");
    setCart(prev => {
      const existing = prev.find(c => c.item.id === noteFor.item.id && c.note === noteText && c.options.map(o => o.label).join("|") === optKey);
      if (existing) {
        return prev.map(c => c === existing ? { ...c, quantity: c.quantity + qty } : c);
      }
      return [...prev, { item: noteFor.item, quantity: qty, note: noteText, options: chosen }];
    });
    setNoteFor(null);
    showToast("Added to order");
  }

  function removeFromCart(idx: number) {
    setCart(prev => prev.filter((_, i) => i !== idx));
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  const visibleItems = items.filter(i => i.category_id === activeCategory);
  const cartTotal = cart.reduce((sum, c) => sum + c.quantity * ((c.item.price ?? 0) + c.options.reduce((s, o) => s + o.priceDelta, 0)), 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  // itemCountByCategory and visibleCategories computed at top of component

  // Back-to-top + scrolled state (for sticky pill row border)
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    function onScroll() {
      setShowBackToTop(window.scrollY > 300);
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Poll table status + session status every 3s
  useEffect(() => {
    const check = async () => {
      try {
        // Check table active
        const r1 = await fetch(`/api/table-status/${table.token}`);
        const d1 = await r1.json();
        setTableActive(d1.is_active);

        // Check session status if we have a session
        const sid = sessionStorage.getItem(`menuqr_sid_${table.id}`);
        if (sid) {
          const r2 = await fetch(`/api/session/check?session_id=${sid}`);
          const d2 = await r2.json();
          if (d2.status === "active") setSessionStatus("active");
          else if (d2.status === "closed" || d2.status === "not_found") {
            // Session was invalidated (table closed/reopened) — must request again
            setSessionStatus("idle");
            sessionStorage.removeItem(`menuqr_sid_${table.id}`);
            setSessionId(null);
          }
        }
      } catch {}
    };
    check(); // immediate
    const poll = setInterval(check, 3000);
    const onVisible = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(poll); document.removeEventListener("visibilitychange", onVisible); };
  }, [table.id, table.token]);


  // --- SESSION GATE ---
  // If table is active but no approved session yet, show waiting/request screen
  if (tableActive && sessionStatus !== "active") {
    if (sessionStatus === "idle" || sessionStatus === "declined") {
      return (
        <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48, fontFamily: "Inter, system-ui, sans-serif", textAlign: "center", animation: "gmFadeIn 0.4s ease both" }}>
          <style>{`@keyframes gmFadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
          <div aria-hidden="true" style={{ color: "var(--text-muted)", marginBottom: 28 }}>{IconQr(44)}</div>
          <h1 style={{ fontWeight: 700, fontSize: 28, color: "var(--text)", margin: "0 0 4px", fontFamily: "'Playfair Display', serif", letterSpacing: "0.02em" }}>{restaurant.name}</h1>
          <div aria-hidden="true" style={{ width: 32, height: 2, background: accentColor, margin: "16px auto 20px" }} />
          <p style={{ color: "var(--text-muted)", fontSize: 15, maxWidth: 300, marginBottom: 36, lineHeight: 1.7 }}>
            {sessionStatus === "declined" ? "Your session was declined. Tap below to request again." : "Welcome. Tap below to request access to the menu."}
          </p>
          <button
            onClick={requestSession}
            style={{ background: accentColor, color: "#fff", border: "none", borderRadius: 12, padding: "15px 44px", fontSize: 16, fontWeight: 600, letterSpacing: "0.01em", cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}
          >
            {sessionStatus === "declined" ? "Request Again" : "Request Menu Access"}
          </button>
        </div>
      );
    }

    if (sessionStatus === "pending") {
      return (
        <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48, fontFamily: "Inter, system-ui, sans-serif", textAlign: "center", animation: "gmFadeIn 0.4s ease both" }}>
          <style>{`
            @keyframes gmFadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes gmDot { 0%, 80%, 100% { opacity: 0.25; } 40% { opacity: 1; } }
          `}</style>
          <div aria-hidden="true" style={{ color: "var(--text-muted)", marginBottom: 28 }}>{IconClock(44)}</div>
          <h1 style={{ fontWeight: 700, fontSize: 24, color: "var(--text)", margin: "0 0 12px", fontFamily: "'Playfair Display', serif" }}>Waiting for staff</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 15, maxWidth: 300, lineHeight: 1.7, marginBottom: 32 }}>
            A staff member will approve your access in a moment. Please wait.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: accentColor, animation: `gmDot 1.4s ease-in-out ${i * 0.22}s infinite` }} />
            ))}
          </div>
        </div>
      );
    }
  }

  // --- CLOSED CHECK ---
  if (!tableActive) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48, fontFamily: "Inter, system-ui, sans-serif", textAlign: "center" }}>
        <div aria-hidden="true" style={{ color: "var(--text-muted)", marginBottom: 28 }}>{IconLock(44)}</div>
        <h1 style={{ fontWeight: 700, fontSize: 26, color: "var(--text)", margin: "0 0 12px", fontFamily: "'Playfair Display', serif" }}>We&apos;re closed</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 15, maxWidth: 300, lineHeight: 1.7 }}>This table is currently not taking orders. Please ask a staff member for assistance.</p>
        <div style={{ marginTop: 32, color: "var(--text-muted)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", borderTop: "1px solid var(--border)", paddingTop: 16 }}>{restaurant.name}</div>
      </div>
    );
  }

  // --- MAIN MENU ---
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "Inter, system-ui, sans-serif", paddingBottom: sessionRequests.length > 0 ? 110 : 90, animation: "gmFadeIn 0.35s ease both" }}>
      <style>{`
        @keyframes gmSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes gmFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes gmScaleIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes gmItemIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes gmPulse { 0% { transform: scale(1); } 40% { transform: scale(1.18); } 100% { transform: scale(1); } }
        [data-cattabs] { scrollbar-width: none; }
        [data-cattabs]::-webkit-scrollbar { display: none; }
        [data-gm-add]:active { transform: scale(0.94); }
        [data-gm-add] { transition: transform 0.12s ease, background 0.15s ease; }
      `}</style>

      {/* COLLECT NOTIFICATION BANNER */}
      {readyBanner.length > 0 && (
        <div
          onClick={() => setReadyBanner([])}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.55)", zIndex: 200,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24, animation: "gmFadeIn 0.2s ease",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "var(--surface)", borderRadius: 20, border: "1px solid var(--border)",
              padding: "36px 28px 28px", textAlign: "center", maxWidth: 320, width: "100%",
              boxShadow: "0 12px 48px rgba(0,0,0,0.25)",
              animation: "gmScaleIn 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          >
            <div aria-hidden="true" style={{ color: accentColor, marginBottom: 18 }}>{IconBell(40)}</div>
            <h2 style={{ color: "var(--text)", fontWeight: 700, fontSize: 22, margin: "0 0 10px", fontFamily: "'Playfair Display', serif" }}>
              {readyBanner.length === 1 ? "Your order is ready" : "Orders are ready"}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 26, lineHeight: 1.6 }}>
              {readyBanner.length === 1
                ? <><strong style={{ color: "var(--text)" }}>{readyBanner[0]}</strong> is ready to collect.</>
                : <>
                    {readyBanner.slice(0, -1).join(", ")} and <strong style={{ color: "var(--text)" }}>{readyBanner[readyBanner.length - 1]}</strong> are ready.
                  </>
              }
            </p>
            <button
              onClick={() => setReadyBanner([])}
              style={{ background: accentColor, color: "#fff", border: "none", borderRadius: 12, padding: "13px 36px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header style={{ background: "var(--bg)", padding: "22px 20px 18px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {restaurant.logo_url && (
            <img
              src={restaurant.logo_url}
              alt={`${restaurant.name} logo`}
              referrerPolicy="no-referrer"
              style={{ height: 46, width: "auto", maxWidth: 160, objectFit: "contain", flexShrink: 0, background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}
            />
          )}
          <div style={{ borderLeft: `2px solid ${accentColor}`, paddingLeft: 14, minWidth: 0 }}>
            <h1 style={{ fontWeight: 700, fontSize: 21, margin: 0, letterSpacing: "0.03em", fontFamily: "'Playfair Display', serif", color: "var(--text)", lineHeight: 1.25 }}>{restaurant.name}</h1>
            <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: 12, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>{table.name}</p>
          </div>
        </div>
      </header>

      {/* QUICK ACTIONS */}
      {(restaurant.quick_actions ?? ["waiter","bill","refill"]).length > 0 && (
      <div style={{ padding: "20px 20px 0" }}>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 10 }}>Quick actions</p>
        <div role="group" aria-label="Quick actions" style={{ display: "grid", gridTemplateColumns: `repeat(${(restaurant.quick_actions ?? ["waiter","bill","refill"]).length}, 1fr)`, gap: 10 }}>
          {(([
            ["waiter", IconBell(22), "Call Waiter"],
            ["bill", IconCard(22), "Request Bill"],
            ["refill", IconRefresh(22), "Refill Drinks"],
          ] as [string, React.ReactNode, string][]).filter(([type]) => (restaurant.quick_actions ?? ["waiter","bill","refill"]).includes(type as string)) as [RequestType, React.ReactNode, string][]).map(([type, iconEl, label]) => {
            const requested = type !== "item_request" && Boolean(quickDone[type as QuickType]);
            return (
            <button key={type} onClick={() => { if (!requested) sendRequest(type); }}
              aria-disabled={requested}
              style={{ padding: "15px 8px", borderRadius: 14, border: "1px solid var(--border)", background: requested ? "var(--surface-2)" : "var(--surface)", cursor: requested ? "default" : "pointer", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 7, WebkitTapHighlightColor: "transparent", boxShadow: requested ? "none" : "0 1px 3px rgba(0,0,0,0.04)", transition: "transform 0.12s ease", opacity: requested ? 0.75 : 1 }}
              onTouchStart={e => { if (!requested) (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.96)"; }}
              onTouchEnd={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}>
              <span aria-hidden="true" style={{ color: requested ? "var(--text-muted)" : accentColor, display: "inline-flex" }}>{requested ? IconTick(22) : iconEl}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: requested ? "var(--text-muted)" : "var(--text)", lineHeight: 1.2 }}>{requested ? QUICK_DONE_LABEL[type as QuickType] : label}</span>
            </button>
            );
          })}
        </div>
      </div>
      )}

      <div style={{ margin: "20px 20px 0", borderTop: "1px solid var(--border)" }} />

      {/* EMPTY MENU */}
      {items.length === 0 && (
        <div style={{ textAlign: "center", padding: "72px 32px", color: "var(--text-muted)" }}>
          <div aria-hidden="true" style={{ color: "var(--text-muted)", opacity: 0.7, marginBottom: 20 }}>{IconDish(40)}</div>
          <h2 style={{ fontWeight: 700, fontSize: 21, color: "var(--text)", margin: "0 0 10px", fontFamily: "'Playfair Display', serif" }}>Menu coming soon</h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 280, margin: "0 auto" }}>The restaurant is still setting up their menu. Please ask your server.</p>
        </div>
      )}

      {/* CATEGORY TABS */}
      {visibleCategories.length > 0 && items.length > 0 && (
        <div style={{ paddingTop: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 6, paddingLeft: 20 }}>Menu</p>
          <div
            role="tablist"
            aria-label="Menu categories"
            data-cattabs=""
            style={{ overflowX: "auto", display: "flex", gap: 22, paddingLeft: 20, paddingRight: 20, position: "sticky", top: 0, zIndex: 9, background: "var(--bg)", borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent", transition: "border-color 0.2s ease" }}
          >
            {visibleCategories.map(cat => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    padding: "12px 2px 10px",
                    border: "none",
                    borderBottom: active ? `2px solid ${accentColor}` : "2px solid transparent",
                    background: "transparent",
                    color: active ? "var(--text)" : "var(--text-muted)",
                    cursor: "pointer",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexShrink: 0,
                    transition: "color 0.15s, border-color 0.15s",
                  }}
                >
                  {cat.name}
                  {(itemCountByCategory[cat.id] ?? 0) > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: active ? accentColor : "var(--text-muted)", letterSpacing: 0 }}>
                      {itemCountByCategory[cat.id]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* MENU ITEMS */}
      {items.length > 0 && (
        <div key={activeCategory} role="list" aria-label="Menu items" style={{ padding: "14px 20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
          {visibleItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "72px 24px", color: "var(--text-muted)", animation: "gmItemIn 0.3s ease both" }}>
              <div aria-hidden="true" style={{ opacity: 0.7, marginBottom: 16 }}>{IconDish(36)}</div>
              <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>No items in this category.</p>
            </div>
          ) : visibleItems.map((item, idx) => (
            <div key={item.id} role="listitem"
              style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", animation: `gmItemIn 0.3s ease ${Math.min(idx * 0.03, 0.24)}s both` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "var(--text)", lineHeight: 1.35 }}>{item.name}</div>
                  {item.price ? (
                    <span style={{ fontWeight: 600, color: accentColor, fontSize: 13, background: `color-mix(in srgb, ${accentColor} 10%, transparent)`, borderRadius: 99, padding: "3px 10px", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {fmtPrice(item.price)} {currencySymbol}
                    </span>
                  ) : null}
                </div>
                {item.description && <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 5, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{item.description}</div>}
              </div>
              <button onClick={() => addToCart(item)}
                data-gm-add=""
                aria-label={`Add ${item.name} to order`}
                style={{ padding: "8px 18px", borderRadius: 99, background: "transparent", color: accentColor, border: `1px solid color-mix(in srgb, ${accentColor} 45%, transparent)`, cursor: "pointer", fontWeight: 600, fontSize: 13, letterSpacing: "0.01em", flexShrink: 0, WebkitTapHighlightColor: "transparent" }}>
                Add
              </button>
            </div>
          ))}
        </div>
      )}

      {/* FLOATING CART BUTTON */}
      {cart.length > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          style={{ position: "fixed", bottom: sessionRequests.length > 0 ? 60 : 24, left: "50%", transform: "translateX(-50%)", background: accentColor, color: "white", border: "none", borderRadius: 99, padding: "14px 26px", fontWeight: 600, fontSize: 15, cursor: "pointer", zIndex: 40, boxShadow: "0 6px 24px rgba(0,0,0,0.18)", display: "flex", alignItems: "center", gap: 10, animation: "gmFadeIn 0.2s ease", whiteSpace: "nowrap" }}>
          <span key={cartCount} style={{ background: "rgba(255,255,255,0.22)", borderRadius: "50%", width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, animation: "gmPulse 0.35s ease" }}>{cartCount}</span>
          View Order
          {cartTotal > 0 && <span style={{ opacity: 0.85, fontSize: 14, fontWeight: 500 }}>· {fmtPrice(cartTotal)} {currencySymbol}</span>}
        </button>
      )}

      {/* CART MODAL */}
      {cartOpen && (
        <div onClick={() => setCartOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 50, display: "flex", alignItems: "flex-end", animation: "gmFadeIn 0.18s ease" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: "20px 20px 0 0", borderTop: "1px solid var(--border)", padding: "22px 20px 36px", width: "100%", maxWidth: 480, margin: "0 auto", animation: "gmSlideUp 0.32s cubic-bezier(0.32, 0.72, 0, 1)", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, fontSize: 19, margin: 0, fontFamily: "'Playfair Display', serif", color: "var(--text)" }}>Your Order</h3>
              <button onClick={() => setCartOpen(false)} aria-label="Close order" style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--text-muted)", lineHeight: 1 }}>×</button>
            </div>
            {cart.map((ci, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>x{ci.quantity} {ci.item.name}</div>
                  {ci.options.length > 0 && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{ci.options.map(o => o.label).join(", ")}</div>}
                  {ci.note && <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", marginTop: 2 }}>{ci.note}</div>}
                  {ci.item.price ? <div style={{ fontSize: 13, color: accentColor, fontWeight: 600, marginTop: 2 }}>{fmtPrice(ci.quantity * ((ci.item.price ?? 0) + ci.options.reduce((s, o) => s + o.priceDelta, 0)))} {currencySymbol}</div> : null}
                </div>
                <button onClick={() => removeFromCart(idx)} aria-label={`Remove ${ci.item.name} from order`} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 18, fontWeight: 600, padding: "0 4px" }}>×</button>
              </div>
            ))}
            {cartTotal > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0 4px", fontWeight: 700, fontSize: 15, color: "var(--text)" }}>
                <span>Total</span>
                <span style={{ color: accentColor }}>{fmtPrice(cartTotal)} {currencySymbol}</span>
              </div>
            )}
            <button onClick={submitCart}
              disabled={sending}
              style={{ width: "100%", padding: "14px", borderRadius: 12, background: accentColor, color: "white", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 15, letterSpacing: "0.01em", marginTop: 16, opacity: sending ? 0.7 : 1, boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}>
              {sending ? "Sending..." : `Send Order (${cartCount} item${cartCount !== 1 ? "s" : ""})`}
            </button>
          </div>
        </div>
      )}

      {/* ADD ITEM MODAL */}
      {noteFor && (
        <div onClick={() => setNoteFor(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 50, display: "flex", alignItems: "flex-end", animation: "gmFadeIn 0.18s ease" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: "20px 20px 0 0", borderTop: "1px solid var(--border)", padding: "24px 20px 36px", width: "100%", maxWidth: 480, margin: "0 auto", animation: "gmSlideUp 0.32s cubic-bezier(0.32, 0.72, 0, 1)" }}>
            <h3 style={{ fontWeight: 700, marginBottom: 14, fontSize: 18, fontFamily: "'Playfair Display', serif", color: "var(--text)" }}>
              {noteFor.item.name}
              {noteFor.item.price ? <span style={{ color: accentColor, marginLeft: 10, fontSize: 14, fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600 }}>{fmtPrice(noteFor.item.price)} {currencySymbol}</span> : null}
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
              <span style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 500 }}>Qty:</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Decrease quantity" style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontSize: 18, fontWeight: 600, color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                <span style={{ fontSize: 18, fontWeight: 700, minWidth: 28, textAlign: "center", color: "var(--text)" }}>{qty}</span>
                <button onClick={() => setQty(q => q + 1)} aria-label="Increase quantity" style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${accentColor}`, background: accentColor, cursor: "pointer", fontSize: 18, fontWeight: 600, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
              </div>
            </div>
            {(() => {
              const itemOptions = options.filter(o => o.item_id === noteFor.item.id);
              if (itemOptions.length === 0) return null;
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
                  {itemOptions.map(o => (
                    <div key={o.id}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
                        {o.name}
                        {o.type === "choice" && o.is_required && <span style={{ color: accentColor, marginLeft: 4 }}>*</span>}
                        {o.type === "ingredients" && <span style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 500, marginLeft: 6 }}>— tap to remove</span>}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {o.type === "ingredients" ? o.choices.map(c => {
                          const all = o.choices.map(x => x.id);
                          const on = (selIngredients[o.id] ?? all).includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => toggleIngredient(o.id, c.id, all)}
                              style={{
                                padding: "8px 14px", borderRadius: 99, cursor: "pointer", fontSize: 13, fontWeight: 600,
                                border: `1px solid ${on ? accentColor : "var(--border)"}`,
                                background: on ? `color-mix(in srgb, ${accentColor} 12%, transparent)` : "var(--bg)",
                                color: on ? accentColor : "var(--text-muted)",
                                textDecoration: on ? "none" : "line-through",
                                opacity: on ? 1 : 0.6,
                              }}
                            >
                              {c.label}
                            </button>
                          );
                        }) : o.choices.map(c => {
                          const on = selOptions[o.id] === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setSelOptions(s => ({ ...s, [o.id]: c.id }))}
                              style={{
                                padding: "8px 14px", borderRadius: 99, cursor: "pointer", fontSize: 13, fontWeight: 600,
                                border: `1px solid ${on ? accentColor : "var(--border)"}`,
                                background: on ? `color-mix(in srgb, ${accentColor} 12%, transparent)` : "var(--bg)",
                                color: on ? accentColor : "var(--text)",
                              }}
                            >
                              {c.label}{c.price_delta > 0 ? ` +${fmtPrice(c.price_delta)}` : ""}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Special request? (e.g. no onions)"
              rows={2}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 10, fontSize: 14, outline: "none", resize: "none", background: "var(--bg)", color: "var(--text)" }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={confirmAddToCart}
                style={{ flex: 1, padding: "13px", borderRadius: 12, background: accentColor, color: "white", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 15 }}>
                Add to order
              </button>
              <button onClick={() => setNoteFor(null)} style={{ padding: "13px 18px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", color: "var(--text-muted)", fontWeight: 500, fontSize: 14 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STICKY SESSION SUMMARY */}
      {sessionRequests.length > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30, boxShadow: "0 -4px 24px rgba(0,0,0,0.12)" }}>
          {/* Toggle bar */}
          <button
            onClick={() => setSessionPanelOpen(o => !o)}
            style={{ width: "100%", background: "color-mix(in srgb, var(--surface) 82%, transparent)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", color: "var(--text)", border: "none", borderTop: "1px solid var(--border)", padding: "13px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
          >
            <span style={{ fontWeight: 600, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span aria-hidden="true" style={{ color: "var(--text-muted)", display: "inline-flex" }}>{IconReceipt(17)}</span>
              My Bill
              {sessionRequests.some(r => r.price > 0) && (
                <span style={{ color: accentColor, fontWeight: 700 }}>
                  {fmtPrice(sessionRequests.reduce((s, r) => s + r.qty * r.price, 0))} {currencySymbol}
                </span>
              )}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8 }}>
              {sessionRequests.filter(r => r.status !== "done").length > 0 && (
                <span style={{ background: `color-mix(in srgb, ${accentColor} 10%, transparent)`, color: accentColor, borderRadius: 99, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                  {sessionRequests.filter(r => r.status !== "done").length} on the way
                </span>
              )}
              <span aria-hidden="true" style={{ display: "inline-flex" }}>{IconChevron(!sessionPanelOpen)}</span>
            </span>
          </button>

          {sessionPanelOpen && (
            <div style={{ background: "color-mix(in srgb, var(--surface) 92%, transparent)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderTop: "1px solid var(--border)", maxHeight: 320, overflowY: "auto" }}>
              {/* On the way */}
              {sessionRequests.filter(r => r.status !== "done").length > 0 && (
                <div style={{ padding: "12px 20px 0" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>On the way</div>
                  {sessionRequests.filter(r => r.status !== "done").map((r, i) => {
                    const pill = r.status === "seen"
                      ? { label: "Preparing", bg: `color-mix(in srgb, ${accentColor} 10%, transparent)`, color: accentColor }
                      : { label: "Pending", bg: "var(--surface-2)", color: "var(--text-muted)" };
                    return (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                        <div>
                          <span style={{ fontWeight: 600, whiteSpace: "pre-line", color: "var(--text)" }}>{r.name}</span>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>{r.time}</span>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          {r.price > 0 && <span style={{ fontWeight: 600, color: accentColor }}>{fmtPrice(r.qty * r.price)} {currencySymbol}</span>}
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 99, background: pill.bg, color: pill.color, letterSpacing: "0.02em" }}>{pill.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Delivered */}
              {sessionRequests.filter(r => r.status === "done").length > 0 && (
                <div style={{ padding: "12px 20px 0" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Delivered</div>
                  {sessionRequests.filter(r => r.status === "done").map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13, opacity: 0.65 }}>
                      <div>
                        <span style={{ fontWeight: 600, whiteSpace: "pre-line", color: "var(--text)" }}>{r.name}</span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>{r.time}</span>
                      </div>
                      {r.price > 0 && <span style={{ fontWeight: 600, color: accentColor }}>{fmtPrice(r.qty * r.price)} {currencySymbol}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Total */}
              {sessionRequests.some(r => r.price > 0) && (
                <div style={{ padding: "13px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>My Total</span>
                  <span style={{ fontWeight: 700, fontSize: 17, color: accentColor }}>{fmtPrice(sessionRequests.reduce((s, r) => s + r.qty * r.price, 0))} {currencySymbol}</span>
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
          style={{ position: "fixed", bottom: sessionRequests.length > 0 ? 76 : 24, right: 16, zIndex: 35, width: 42, height: 42, borderRadius: "50%", background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", animation: "gmFadeIn 0.2s ease" }}
          aria-label="Back to top"
        >{IconArrowUp(18)}</button>
      )}

      {/* TOAST */}
      {toast && (
        <div role="status" aria-live="polite" style={{ position: "fixed", top: 78, left: "50%", transform: "translateX(-50%)", background: "var(--text)", color: "var(--bg)", padding: "10px 22px", borderRadius: 99, fontWeight: 500, fontSize: 13, letterSpacing: "0.01em", zIndex: 100, whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(0,0,0,0.2)", animation: "gmFadeIn 0.2s ease" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
