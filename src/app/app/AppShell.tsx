"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant, MenuCategory, TableRow } from "@/lib/types";
import SetupRestaurant from "./SetupRestaurant";
import MenuBuilder from "./MenuBuilder";
import TableManager from "./TableManager";
import LiveOrders from "./LiveOrders";
import SettingsPanel from "./SettingsPanel";
import OnboardingChecklist from "./OnboardingChecklist";
import Analytics from "./Analytics";
import RequestHistory from "./RequestHistory";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [tables, setTables] = useState<TableRow[]>([]);
  const [checklistDismissed, setChecklistDismissed] = useState(false);
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

  useEffect(() => {
    if (!restaurant) return;
    Promise.all([
      supabase.from("menu_categories").select("id").eq("restaurant_id", restaurant.id),
      supabase.from("restaurant_tables").select("id").eq("restaurant_id", restaurant.id),
    ]).then(([{ data: cats }, { data: tbls }]) => {
      setCategories((cats as MenuCategory[]) ?? []);
      setTables((tbls as TableRow[]) ?? []);
    });
  }, [restaurant?.id]);

  if (!restaurant) {
    return <SetupRestaurant userId={user.id} onCreated={setRestaurant} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* TOP NAV */}
      <header style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "12px 24px", display: "flex", alignItems: "center", gap: 16, justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 800, fontSize: 20, color: "var(--accent)" }}>MenuQR</span>
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>/ {restaurant.name}</span>
        </div>
        {clock && <span style={{ fontSize: 12, color: "var(--text-muted)", display: "none" }} className="header-clock">{clock}</span>}
        <style>{`.header-clock { display: inline !important; } @media(max-width:639px){.header-clock{display:none!important;}}`}</style>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
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
      <nav aria-label="Main navigation" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "0 24px", display: "flex", gap: 0 }}
        className="desktop-tabs">
        {([
          ["orders", null, "⚡", "Live Orders"],
          ["menu", null, "🍽️", "Menu"],
          ["tables", "table", null, "Tables"],
          ["analytics", null, "📊", "Analytics"],
          ["history", null, "📋", "History"],
          ["settings", null, "⚙️", "Settings"],
        ] as [Tab, string | null, string | null, string][]).map(([id, icon, emoji, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              padding: "12px 20px",
              border: "none",
              borderBottom: tab === id ? "2px solid var(--accent)" : "2px solid transparent",
              background: "none",
              cursor: "pointer",
              fontWeight: tab === id ? 700 : 500,
              color: tab === id ? "var(--accent)" : "var(--text-muted)",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {icon === "table" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="6" width="18" height="3" rx="1"/>
                <line x1="6" y1="9" x2="6" y2="18"/>
                <line x1="18" y1="9" x2="18" y2="18"/>
              </svg>
            ) : emoji}
            {id === "orders" && pendingCount > 0
              ? <>{label} <span style={{ background: "#E85D2F", color: "white", fontSize: 11, padding: "1px 6px", borderRadius: 99, fontWeight: 700 }}>{pendingCount}</span></>
              : label}
          </button>
        ))}
      </nav>

      {/* MOBILE BOTTOM NAV */}
      <nav aria-label="Mobile navigation" className="mobile-tabs" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--surface)", borderTop: "1px solid var(--border)", display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {([
          ["orders", "⚡", "Orders"],
          ["menu", "🍽️", "Menu"],
          ["tables", "table-svg", "Tables"],
          ["analytics", "📊", "Stats"],
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="6" width="18" height="3" rx="1"/>
                <line x1="6" y1="9" x2="6" y2="18"/>
                <line x1="18" y1="9" x2="18" y2="18"/>
              </svg>
            ) : <span style={{ fontSize: 20 }}>{icon}</span>}
            {id === "orders" && pendingCount > 0 && (
              <span style={{ position: "absolute", top: 6, right: "calc(50% - 16px)", background: "#E85D2F", color: "white", fontSize: 9, padding: "1px 4px", borderRadius: 99, fontWeight: 700 }}>{pendingCount}</span>
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
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        {!checklistDismissed && (
          <OnboardingChecklist
            restaurant={restaurant}
            categories={categories}
            tables={tables}
            onDismiss={() => setChecklistDismissed(true)}
          />
        )}
        {tab === "orders" && <ErrorBoundary fallbackTitle="Failed to load orders"><LiveOrders restaurant={restaurant} /></ErrorBoundary>}
        {tab === "menu" && <ErrorBoundary fallbackTitle="Failed to load menu"><MenuBuilder restaurant={restaurant} /></ErrorBoundary>}
        {tab === "tables" && <ErrorBoundary fallbackTitle="Failed to load tables"><TableManager restaurant={restaurant} /></ErrorBoundary>}
        {tab === "analytics" && <ErrorBoundary fallbackTitle="Failed to load analytics"><Analytics restaurant={restaurant} /></ErrorBoundary>}
        {tab === "history" && <ErrorBoundary fallbackTitle="Failed to load history"><RequestHistory restaurant={restaurant} /></ErrorBoundary>}
        {tab === "settings" && <ErrorBoundary fallbackTitle="Failed to load settings"><SettingsPanel restaurant={restaurant} /></ErrorBoundary>}
      </main>
    </div>
  );
}

