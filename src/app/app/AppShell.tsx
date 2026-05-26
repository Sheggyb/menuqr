"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant, MenuCategory, TableRow } from "@/lib/types";
import SetupRestaurant from "./SetupRestaurant";
import MenuBuilder from "./MenuBuilder";
import TableManager from "./TableManager";
import LiveOrders from "./LiveOrders";
import SettingsPanel from "./SettingsPanel";
import OnboardingChecklist from "./OnboardingChecklist";

type Tab = "orders" | "menu" | "tables" | "settings";

interface Props {
  user: { id: string; email?: string };
  restaurant: Restaurant | null;
}

export default function AppShell({ user, restaurant: initialRestaurant }: Props) {
  const supabase = createClient();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(initialRestaurant);
  const [tab, setTab] = useState<Tab>("orders");
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [tables, setTables] = useState<TableRow[]>([]);
  const [checklistDismissed, setChecklistDismissed] = useState(false);

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
        <form action="/auth/signout" method="post">
          <button type="submit" style={{ fontSize: 13, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>Sign out</button>
        </form>
      </header>

      {/* TABS — sticky top on desktop, fixed bottom on mobile */}
      <nav style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "0 24px", display: "flex", gap: 0 }}
        className="desktop-tabs">
        {([ ["orders", "⚡ Live Orders"], ["menu", "🍽️ Menu"], ["tables", "🪑 Tables"], ["settings", "⚙️ Settings"] ] as [Tab, string][]).map(([id, label]) => (
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
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* MOBILE BOTTOM NAV */}
      <nav className="mobile-tabs" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--surface)", borderTop: "1px solid var(--border)", display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {([ ["orders", "⚡", "Orders"], ["menu", "🍽️", "Menu"], ["tables", "🪑", "Tables"], ["settings", "⚙️", "Settings"] ] as [Tab, string, string][]).map(([id, icon, label]) => (
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
            }}
          >
            <span style={{ fontSize: 20 }}>{icon}</span>
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
        {tab === "orders" && <LiveOrders restaurant={restaurant} />}
        {tab === "menu" && <MenuBuilder restaurant={restaurant} />}
        {tab === "tables" && <TableManager restaurant={restaurant} />}
        {tab === "settings" && <SettingsPanel restaurant={restaurant} />}
      </main>
    </div>
  );
}

