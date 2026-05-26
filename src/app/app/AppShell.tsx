"use client";
import { useState } from "react";
import type { Restaurant } from "@/lib/types";
import SetupRestaurant from "./SetupRestaurant";
import MenuBuilder from "./MenuBuilder";
import TableManager from "./TableManager";
import LiveOrders from "./LiveOrders";
import SettingsPanel from "./SettingsPanel";

type Tab = "orders" | "menu" | "tables" | "settings";

interface Props {
  user: { id: string; email?: string };
  restaurant: Restaurant | null;
}

export default function AppShell({ user, restaurant: initialRestaurant }: Props) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(initialRestaurant);
  const [tab, setTab] = useState<Tab>("orders");

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

      {/* TABS */}
      <nav style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "0 24px", display: "flex", gap: 0 }}>
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

      {/* CONTENT */}
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        {tab === "orders" && <LiveOrders restaurant={restaurant} />}
        {tab === "menu" && <MenuBuilder restaurant={restaurant} />}
        {tab === "tables" && <TableManager restaurant={restaurant} />}
        {tab === "settings" && <SettingsPanel restaurant={restaurant} />}
      </main>
    </div>
  );
}
