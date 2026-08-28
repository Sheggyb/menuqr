"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant } from "@/lib/types";
import SetupRestaurant from "./SetupRestaurant";
import MenuBuilder from "./MenuBuilder";
import TableManager from "./TableManager";
import LiveOrders from "./LiveOrders";
import SettingsPanel from "./SettingsPanel";
import Analytics from "./Analytics";
import RequestHistory from "./RequestHistory";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/Toast";
import { ConfirmProvider } from "@/components/ConfirmDialog";
import { useTheme } from "@/lib/theme";

type Tab = "orders" | "menu" | "tables" | "analytics" | "history" | "settings";

interface Props {
  user: { id: string; email?: string };
  restaurant: Restaurant | null;
}

export default function AppShell({ user, restaurant: initialRestaurant }: Props) {
  const supabase = createClient();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(initialRestaurant);
  const [tab, setTab] = useState<Tab>("orders");
  const [restaurantVersion, setRestaurantVersion] = useState(0);
  // Signature of the last restaurant row we fetched — remounts only happen when
  // the data actually CHANGED, not on every tab switch (avoids double-mounting
  // every panel and tearing down LiveOrders' realtime channel for nothing)
  const lastFetchedSig = useRef<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [clock, setClock] = useState("");
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fmt = () => {
      const now = new Date();
      const date = now.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
      const time = now.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
      setClock(`${date} · ${time}`);
    };
    fmt();
    clockRef.current = setInterval(fmt, 10000);
    return () => { if (clockRef.current) clearInterval(clockRef.current); };
  }, []);

  useEffect(() => {
    if (!restaurant) return;
    const fetchPending = async () => {
      const { count } = await supabase
        .from("table_requests")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", restaurant.id)
        .eq("status", "pending");
      setPendingCount(count ?? 0);
    };
    fetchPending();
    const channel = supabase.channel("appshell-pending")
      .on("postgres_changes", { event: "*", schema: "public", table: "table_requests", filter: `restaurant_id=eq.${restaurant.id}` }, () => fetchPending())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurant?.id]);

  // Re-fetch the restaurant whenever the tab changes so Settings / Menu Builder
  // remount with freshly saved values (fixes changes appearing to "not stick"
  // — e.g. currency reverting to SEK after switching tabs).
  useEffect(() => {
    if (!restaurant) return;
    supabase
      .from("restaurants")
      .select("*")
      .eq("id", restaurant.id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        const sig = `${data.updated_at}|${data.name}|${data.currency}|${data.accent_color}|${data.venue_type}|${JSON.stringify(data.quick_actions)}|${data.logo_url ?? ""}`;
        // First fetch: just sync the prop, no remount needed.
        if (lastFetchedSig.current === null) {
          lastFetchedSig.current = sig;
          setRestaurant(data as Restaurant);
          return;
        }
        if (sig !== lastFetchedSig.current) {
          lastFetchedSig.current = sig;
          setRestaurant(data as Restaurant);
          // Bump the version so the ACTIVE panel remounts with the fresh prop —
          // only when the data really changed (audit 4)
          setRestaurantVersion(v => v + 1);
        }
      });
  }, [tab, restaurant?.id]);

  if (!restaurant) {
    return <SetupRestaurant userId={user.id} onCreated={setRestaurant} />;
  }

  return (
    <ToastProvider>
    <ConfirmProvider>
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* TOP NAV */}
      <header style={{ background: resolvedTheme === "dark" ? "rgba(18,18,21,0.92)" : "var(--surface)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)", padding: "12px 24px", display: "flex", alignItems: "center", gap: 16, justifyContent: "space-between", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 20, color: "var(--accent)", letterSpacing: "-0.3px" }}>MenuQR</span>
          {restaurant.logo_url && (
            <img
              src={restaurant.logo_url}
              alt=""
              referrerPolicy="no-referrer"
              onError={e => { e.currentTarget.style.display = "none"; }}
              style={{ height: 22, width: "auto", maxWidth: 120, objectFit: "contain", borderRadius: 4, border: "1px solid var(--border)", flexShrink: 0 }}
            />
          )}
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>/ {restaurant.name}</span>
        </div>
        {clock && <span style={{ fontSize: 12, color: "var(--text-muted)", display: "none" }} className="header-clock">{clock}</span>}
        <style>{`.header-clock { display: inline !important; } @media(max-width:639px){.header-clock{display:none!important;}}`}</style>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a
            href="/kitchen"
            target="_blank"
            rel="noopener noreferrer"
            title="Open kitchen display in a new tab"
            style={{ fontSize: 13, color: "var(--text-muted)", background: "none", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", padding: "5px 10px", lineHeight: 1, textDecoration: "none" }}
          >Kitchen</a>
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            style={{ fontSize: 16, color: "var(--text-muted)", background: "none", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", padding: "5px 9px", lineHeight: 1 }}
          >
            {resolvedTheme === "dark" ? "☀️" : "🌙"}
          </button>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            style={{ fontSize: 13, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
          >Sign out</button>
        </div>
      </header>

      {/* TABS — sticky top on desktop, fixed bottom on mobile */}
      <nav aria-label="Main navigation" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "0 32px", display: "flex", gap: 2 }} className="desktop-tabs">
        {([
          ["orders", "bolt", "Live Orders"],
          ["menu", "fork", "Menu"],
          ["tables", "table", "Tables"],
          ["analytics", "chart", "Stats"],
          ["history", "clock", "History"],
          ["settings", "gear", "Settings"],
        ] as [Tab, string, string][]).map(([id, icon, label]) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                padding: "0 18px",
                height: 48,
                border: "none",
                borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
                background: "none",
                cursor: "pointer",
                fontWeight: active ? 700 : 500,
                color: active ? "var(--accent)" : "var(--text-muted)",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 7,
                whiteSpace: "nowrap",
                transition: "color 0.15s",
              }}
            >
              {icon === "bolt" && <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>}
              {icon === "fork" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3h18M3 3v5a6 6 0 0012 0V3M9 8v13M15 8v13"/></svg>}
              {icon === "table" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="6" width="18" height="3" rx="1"/><line x1="6" y1="9" x2="6" y2="18"/><line x1="18" y1="9" x2="18" y2="18"/></svg>}
              {icon === "chart" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
              {icon === "clock" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
              {icon === "gear" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>}
              {id === "orders" && pendingCount > 0
                ? <>{label} <span style={{ background: "var(--accent)", color: "white", fontSize: 10, padding: "1px 6px", borderRadius: 99, fontWeight: 700, lineHeight: 1.6 }}>{pendingCount}</span></>
                : label}
            </button>
          );
        })}
      </nav>

      {/* MOBILE BOTTOM NAV */}
      <nav aria-label="Mobile navigation" className="mobile-tabs" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--surface)", borderTop: "1px solid var(--border)", display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {([
          ["orders", "⚡", "Orders"],
          ["menu", "🍽️", "Menu"],
          ["tables", "table-svg", "Tables"],
          ["analytics", "📊", "Stats"],
          ["history", "🕐", "History"],
          ["settings", "⚙️", "Settings"],
        ] as [Tab, string, string][]).map(([id, icon, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1,
              padding: "10px 4px 8px",
              border: "none",
              background: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              color: tab === id ? "var(--accent)" : "var(--text-muted)",
              fontSize: 10,
              fontWeight: tab === id ? 700 : 400,
              position: "relative",
            }}
          >
            {icon === "table-svg" ? (
              <span style={{ height: 24, width: 24, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="6" width="18" height="3" rx="1"/>
                  <line x1="6" y1="9" x2="6" y2="18"/>
                  <line x1="18" y1="9" x2="18" y2="18"/>
                </svg>
              </span>
            ) : <span style={{ fontSize: 20, height: 24, width: 24, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</span>}
            {id === "orders" && pendingCount > 0 && (
              <span style={{ position: "absolute", top: 6, right: "calc(50% - 16px)", background: "var(--accent)", color: "white", fontSize: 9, padding: "1px 4px", borderRadius: 99, fontWeight: 700 }}>{pendingCount}</span>
            )}
            {label}
          </button>
        ))}
      </nav>
      <style>{`
        @media (min-width: 640px) { .mobile-tabs { display: none !important; } }
        @media (max-width: 639px) { .desktop-tabs { display: none !important; } }
        @media (max-width: 639px) { main { padding-bottom: 72px !important; } }
      `}</style>

      {/* CONTENT */}
      <main style={{ padding: "28px 24px" }}>
        {tab === "orders" && <ErrorBoundary key={`orders-${restaurantVersion}`} fallbackTitle="Failed to load orders"><LiveOrders restaurant={restaurant} /></ErrorBoundary>}
        {tab === "menu" && <ErrorBoundary key={`menu-${restaurantVersion}`} fallbackTitle="Failed to load menu"><MenuBuilder restaurant={restaurant} /></ErrorBoundary>}
        {tab === "tables" && <ErrorBoundary key={`tables-${restaurantVersion}`} fallbackTitle="Failed to load tables"><TableManager restaurant={restaurant} /></ErrorBoundary>}
        {tab === "analytics" && <ErrorBoundary key={`analytics-${restaurantVersion}`} fallbackTitle="Failed to load analytics"><Analytics restaurant={restaurant} /></ErrorBoundary>}
        {tab === "history" && <ErrorBoundary key={`history-${restaurantVersion}`} fallbackTitle="Failed to load history"><RequestHistory restaurant={restaurant} /></ErrorBoundary>}
        {tab === "settings" && <ErrorBoundary key={`settings-${restaurantVersion}`} fallbackTitle="Failed to load settings"><SettingsPanel restaurant={restaurant} /></ErrorBoundary>}
      </main>
    </div>
    </ConfirmProvider>
    </ToastProvider>
  );
}

