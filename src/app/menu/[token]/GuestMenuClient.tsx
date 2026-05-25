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

export default function GuestMenuClient({ table, restaurant, categories, items }: Props) {
  const supabase = createClient();
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");
  const [toast, setToast] = useState("");
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState("");
  const [noteFor, setNoteFor] = useState<{ type: RequestType; item?: MenuItem } | null>(null);

  async function sendRequest(type: RequestType, item?: MenuItem, extraNote?: string) {
    if (sending) return;
    setSending(true);
    const { error } = await supabase.from("table_requests").insert({
      restaurant_id: restaurant.id,
      table_id: table.id,
      type,
      item_id: item?.id ?? null,
      item_name: item?.name ?? null,
      note: extraNote ?? null,
      status: "pending",
    });
    setSending(false);
    if (!error) {
      const msgs: Record<RequestType, string> = {
        waiter: "👋 Waiter on the way!",
        bill: "💳 Bill is coming!",
        refill: "🔄 Refill requested!",
        item_request: `✅ ${item?.name ?? "Request"} sent!`,
      };
      showToast(msgs[type]);
      setNoteFor(null);
      setNote("");
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  const visibleItems = items.filter(i => i.category_id === activeCategory);
  const accentColor = restaurant.accent_color || "#E85D2F";

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF8", fontFamily: "Inter, sans-serif" }}>
      {/* HEADER */}
      <header style={{ background: accentColor, color: "white", padding: "20px 16px 16px", textAlign: "center" }}>
        <h1 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>{restaurant.name}</h1>
        <p style={{ margin: "4px 0 0", opacity: 0.85, fontSize: 14 }}>🪑 {table.name}</p>
      </header>

      {/* QUICK ACTIONS */}
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {([
            ["waiter", "🙋", "Waiter"],
            ["bill", "💳", "Bill"],
            ["refill", "🔄", "Refill"],
          ] as [RequestType, string, string][]).map(([type, icon, label]) => (
            <button key={type} onClick={() => sendRequest(type)}
              style={{ padding: "14px 8px", borderRadius: 12, border: "2px solid " + accentColor, background: "white", cursor: "pointer", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 24 }}>{icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: accentColor }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CATEGORY TABS */}
      {categories.length > 0 && (
        <div style={{ padding: "16px 0 0" }}>
          <div style={{ overflowX: "auto", display: "flex", gap: 0, borderBottom: "1px solid #e5e7eb", paddingLeft: 16 }}>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                style={{ padding: "10px 16px", border: "none", borderBottom: activeCategory === cat.id ? `2px solid ${accentColor}` : "2px solid transparent", background: "none", cursor: "pointer", fontWeight: activeCategory === cat.id ? 700 : 500, color: activeCategory === cat.id ? accentColor : "#6b7280", whiteSpace: "nowrap", fontSize: 14 }}>
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MENU ITEMS */}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {visibleItems.length === 0 ? (
          <p style={{ color: "#9ca3af", textAlign: "center", padding: 32 }}>No items in this category right now.</p>
        ) : visibleItems.map(item => (
          <div key={item.id} style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{item.name}</div>
              {item.description && <div style={{ color: "#6b7280", fontSize: 13, marginTop: 2 }}>{item.description}</div>}
              {item.price && <div style={{ fontWeight: 700, color: accentColor, marginTop: 4, fontSize: 14 }}>{item.price} kr</div>}
            </div>
            <button onClick={() => setNoteFor({ type: "item_request", item })}
              style={{ padding: "8px 16px", borderRadius: 8, background: accentColor, color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" }}>
              + Order
            </button>
          </div>
        ))}
      </div>

      {/* NOTE MODAL */}
      {noteFor && (
        <div onClick={() => setNoteFor(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: "20px 20px 0 0", padding: "24px 20px 32px", width: "100%", maxWidth: 480 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>
              {noteFor.item ? `Order: ${noteFor.item.name}` : "Add a note"}
            </h3>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Any special requests? (optional)"
              rows={3}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", resize: "none" }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={() => sendRequest(noteFor.type, noteFor.item, note || undefined)}
                style={{ flex: 1, padding: "12px", borderRadius: 10, background: accentColor, color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15 }}>
                {sending ? "Sending..." : "✅ Send request"}
              </button>
              <button onClick={() => setNoteFor(null)} style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#111", color: "white", padding: "12px 24px", borderRadius: 99, fontWeight: 600, fontSize: 15, zIndex: 100, whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
