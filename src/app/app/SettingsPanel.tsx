"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant } from "@/lib/types";

interface Props { restaurant: Restaurant }

export default function SettingsPanel({ restaurant }: Props) {
  const supabase = createClient();
  const [name, setName] = useState(restaurant.name);
  const [accent, setAccent] = useState(restaurant.accent_color || "#E85D2F");
  const [venueType, setVenueType] = useState<Restaurant["venue_type"]>(
    restaurant.venue_type ?? "table_service"
  );
  const [quickActions, setQuickActions] = useState<string[]>(
    restaurant.quick_actions ?? ["waiter", "bill", "refill"]
  );
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const ALL_ACTIONS = [
    { id: "waiter", label: "Call Waiter", icon: "🙋", desc: "Guest can call a staff member to the table" },
    { id: "bill", label: "Request Bill", icon: "💳", desc: "Guest can request the bill at the table" },
    { id: "refill", label: "Refill Drinks", icon: "🔄", desc: "Guest can request a drink refill" },
  ];

  const VENUE_TYPES = [
    { id: "table_service", icon: "🍽️", label: "Table Service", desc: "Sit-down restaurant — guests order at the table" },
    { id: "cafe", icon: "☕", label: "Café / Counter", desc: "Guest orders, gets notified when ready to collect" },
    { id: "takeaway", icon: "🥡", label: "Takeaway / Pickup", desc: "Guest orders ahead, kitchen notifies when ready" },
  ];

  function toggleAction(id: string) {
    setQuickActions(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await supabase
      .from("restaurants")
      .update({ name: name.trim(), accent_color: accent, quick_actions: quickActions, venue_type: venueType })
      .eq("id", restaurant.id);
    setLoading(false);
    if (err) { setError(err.message); } else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  }

  async function handleDelete() {
    if (deleteInput !== restaurant.name) {
      setDeleteError("Restaurant name does not match.");
      return;
    }
    setDeleting(true);
    setDeleteError("");
    // Delete related data first
    await supabase.from("table_requests").delete().eq("restaurant_id", restaurant.id);
    await supabase.from("menu_items").delete().eq("restaurant_id", restaurant.id);
    await supabase.from("menu_categories").delete().eq("restaurant_id", restaurant.id);
    await supabase.from("restaurant_tables").delete().eq("restaurant_id", restaurant.id);
    const { error: err } = await supabase.from("restaurants").delete().eq("id", restaurant.id);
    if (err) {
      setDeleteError(err.message);
      setDeleting(false);
    } else {
      window.location.href = "/app";
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h2 style={{ fontWeight: 700, fontSize: 20 }}>⚙️ Settings</h2>
      <div className="card" style={{ maxWidth: 520 }}>
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Venue type</label>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>This controls which features are available to your guests.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {VENUE_TYPES.map(v => {
                const selected = venueType === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => setVenueType(v.id as Restaurant["venue_type"])}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, border: `2px solid ${selected ? "var(--accent)" : "var(--border)"}`, background: selected ? "var(--item-available-bg)" : "var(--surface)", cursor: "pointer" }}
                  >
                    <span style={{ fontSize: 24 }}>{v.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{v.label}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{v.desc}</div>
                    </div>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${selected ? "var(--accent)" : "var(--border)"}`, background: selected ? "var(--accent)" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {selected && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Restaurant name</label>
            <input value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Accent color</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="color" value={accent} onChange={e => setAccent(e.target.value)}
                style={{ width: 48, height: 40, border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", padding: 2 }} />
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{accent}</span>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: accent, border: "1px solid var(--border)" }} />
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>This color is used on guest menus as the brand color.</p>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Quick actions on guest menu</label>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>Choose which buttons guests can see and use.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ALL_ACTIONS.map(action => {
                const on = quickActions.includes(action.id);
                return (
                  <div
                    key={action.id}
                    onClick={() => toggleAction(action.id)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 10, border: `1px solid ${on ? "var(--accent)" : "var(--border)"}`, background: on ? "var(--item-available-bg)" : "var(--surface)", cursor: "pointer", gap: 12 }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{action.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{action.label}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{action.desc}</div>
                      </div>
                    </div>
                    <div style={{ width: 40, height: 22, borderRadius: 99, background: on ? "var(--accent)" : "var(--border)", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
                      <div style={{ position: "absolute", top: 2, left: on ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {error && <p style={{ color: "#dc2626", fontSize: 13 }}>{error}</p>}
          {saved && <p style={{ color: "#16a34a", fontSize: 13, fontWeight: 600 }}>✅ Settings saved!</p>}
          <button type="submit" className="btn-primary" disabled={loading} style={{ maxWidth: 160 }}>
            {loading ? "Saving..." : "Save settings"}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div style={{ maxWidth: 520, border: "2px solid #fecaca", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ background: "var(--card-bill-bg)", padding: "14px 20px", borderBottom: "1px solid #fecaca", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#dc2626" }}>Danger Zone</span>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <p style={{ fontSize: 14, color: "var(--text)", marginBottom: 14 }}>
            Permanently delete <strong>{restaurant.name}</strong> and all its data — tables, menu, requests. This action cannot be undone.
          </p>
          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              style={{ padding: "9px 18px", borderRadius: 8, border: "2px solid #dc2626", background: "var(--surface)", color: "#dc2626", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
            >
              Delete restaurant…
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#dc2626" }}>
                Type <strong>{restaurant.name}</strong> to confirm:
              </label>
              <input
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                placeholder={restaurant.name}
                style={{ padding: "8px 12px", borderRadius: 8, border: "2px solid #fecaca", fontSize: 14 }}
              />
              {deleteError && <p style={{ color: "#dc2626", fontSize: 13 }}>{deleteError}</p>}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#dc2626", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: deleting ? 0.7 : 1 }}
                >
                  {deleting ? "Deleting..." : "Yes, delete everything"}
                </button>
                <button
                  onClick={() => { setDeleteConfirm(false); setDeleteInput(""); setDeleteError(""); }}
                  style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)", fontSize: 14, cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
