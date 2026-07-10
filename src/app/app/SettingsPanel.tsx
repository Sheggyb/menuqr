"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant } from "@/lib/types";
import { CURRENCIES } from "@/lib/constants";
import { useToast } from "@/components/Toast";
import { IconBell, IconReceipt, IconGlass, IconAlert } from "@/components/icons";

interface Props { restaurant: Restaurant }

function SectionLabel({ children, first }: { children: React.ReactNode; first?: boolean }) {
  return (
    <div style={{ borderTop: first ? "none" : "1px solid var(--border)", paddingTop: first ? 0 : 20, marginTop: first ? 0 : 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 12 }}>{children}</div>
    </div>
  );
}

export default function SettingsPanel({ restaurant }: Props) {
  const supabase = createClient();
  const toast = useToast();
  const [name, setName] = useState(restaurant.name);
  const [accent, setAccent] = useState(restaurant.accent_color || "#E85D2F");
  const [logoUrl, setLogoUrl] = useState(restaurant.logo_url ?? "");
  const [venueType, setVenueType] = useState<Restaurant["venue_type"]>(
    restaurant.venue_type ?? "table_service"
  );
  const [quickActions, setQuickActions] = useState<string[]>(
    restaurant.quick_actions ?? ["waiter", "bill", "refill"]
  );
  const [currency, setCurrency] = useState(() => {
    if (restaurant.currency) return restaurant.currency;
    try { return localStorage.getItem(`menuqr_currency_${restaurant.id}`) || "SEK"; } catch { return "SEK"; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  // Sound alerts — browser-local, read by LiveOrders (key: menuqr_sound)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("menuqr_sound") !== "off";
  });

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("menuqr_sound", next ? "on" : "off");
    // Play a test beep if turning on
    if (next) {
      try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880; gain.gain.value = 0.15;
        osc.start(); osc.stop(ctx.currentTime + 0.15);
      } catch { /* ignore */ }
    }
  }

  const ALL_ACTIONS = [
    { id: "waiter", label: "Call Waiter", Icon: IconBell, desc: "Guest can call a staff member to the table" },
    { id: "bill", label: "Request Bill", Icon: IconReceipt, desc: "Guest can request the bill at the table" },
    { id: "refill", label: "Refill Drinks", Icon: IconGlass, desc: "Guest can request a drink refill" },
  ];

  const VENUE_TYPES = [
    { id: "table_service", label: "Table Service", desc: "Sit-down — guests order at the table" },
    { id: "cafe", label: "Café / Counter", desc: "Order at counter, notified when ready" },
    { id: "takeaway", label: "Takeaway / Pickup", desc: "Order ahead, kitchen notifies" },
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
      .update({ name: name.trim(), accent_color: accent, logo_url: logoUrl.trim() || null, quick_actions: quickActions, venue_type: venueType, currency })
      .eq("id", restaurant.id);
    setLoading(false);
    if (err) {
      setError(err.message);
      toast.error("Could not save changes");
    } else {
      toast.success("Settings saved");
    }
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

  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4, color: "var(--text)" };
  const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 14, outline: "none" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 560 }}>
      <h2 style={{ fontWeight: 800, fontSize: 18, margin: 0, color: "var(--text)" }}>Settings</h2>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 24px" }}>
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Restaurant info */}
          <SectionLabel first>Restaurant info</SectionLabel>
          <div>
            <label style={labelStyle}>Restaurant name</label>
            <input value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Accent color</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="color" value={accent} onChange={e => setAccent(e.target.value)}
                style={{ width: 44, height: 36, border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", padding: 2, background: "var(--surface)" }} />
              <input value={accent} onChange={e => setAccent(e.target.value)} style={{ ...inputStyle, width: 110, fontFamily: "monospace", fontSize: 13 }} />
              <div style={{ width: 28, height: 28, borderRadius: 8, background: accent, border: "1px solid var(--border)", flexShrink: 0 }} />
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Used on guest menus as the brand color.</p>
          </div>
          <div>
            <label style={labelStyle}>Logo URL</label>
            <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://…" style={inputStyle} />
          </div>

          {/* Venue type */}
          <SectionLabel>Venue type</SectionLabel>
          <div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 10px" }}>Controls which features are available to your guests.</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {VENUE_TYPES.map(v => {
                const selected = venueType === v.id;
                return (
                  <button
                    type="button"
                    key={v.id}
                    onClick={() => setVenueType(v.id as Restaurant["venue_type"])}
                    title={v.desc}
                    style={{ padding: "8px 16px", borderRadius: 99, border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`, background: selected ? "var(--accent)" : "var(--surface)", color: selected ? "white" : "var(--text-muted)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
              {VENUE_TYPES.find(v => v.id === venueType)?.desc}
            </p>
          </div>

          {/* Quick actions */}
          <SectionLabel>Quick actions</SectionLabel>
          <div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 10px" }}>Choose which buttons guests can see and use.</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {ALL_ACTIONS.map(({ id, label, Icon, desc }) => {
                const on = quickActions.includes(id);
                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() => toggleAction(id)}
                    title={desc}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 99, border: `1px solid ${on ? "var(--accent)" : "var(--border)"}`, background: on ? "var(--accent)" : "var(--surface)", color: on ? "white" : "var(--text-muted)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                  >
                    <Icon width={14} height={14} /> {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Currency */}
          <SectionLabel>Currency</SectionLabel>
          <div>
            <select
              value={currency}
              onChange={e => { setCurrency(e.target.value); localStorage.setItem(`menuqr_currency_${restaurant.id}`, e.target.value); }}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {Object.entries(CURRENCIES).map(([code, sym]) => (
                <option key={code} value={code}>{sym} — {code}</option>
              ))}
            </select>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Shown on guest menus next to prices.</p>
          </div>

          {/* Notifications */}
          <SectionLabel>Notifications</SectionLabel>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>Sound alerts</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Play an audio ping when a new order comes in. Stored per browser.</div>
            </div>
            <button
              type="button"
              onClick={toggleSound}
              style={{
                width: 52, height: 28, borderRadius: 99,
                background: soundEnabled ? "var(--accent)" : "var(--border)",
                border: "none", cursor: "pointer", position: "relative", flexShrink: 0, transition: "background 0.2s",
              }}
              aria-label={soundEnabled ? "Disable sound" : "Enable sound"}
              aria-pressed={soundEnabled}
            >
              <div style={{
                width: 22, height: 22, borderRadius: "50%", background: "var(--surface)",
                position: "absolute", top: 3, left: soundEnabled ? 27 : 3,
                transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </button>
          </div>

          {error && <p style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>{error}</p>}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ maxWidth: 160 }}>
              {loading ? "Saving..." : "Save settings"}
            </button>
          </div>

          {/* Danger zone */}
          <SectionLabel>Danger zone</SectionLabel>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "#dc2626" }}>
              <IconAlert width={16} height={16} />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Delete this restaurant</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 12px" }}>
              Permanently delete <strong style={{ color: "var(--text)" }}>{restaurant.name}</strong> and all its data — tables, menu, requests. This cannot be undone.
            </p>
            {!deleteConfirm ? (
              <button
                type="button"
                onClick={() => setDeleteConfirm(true)}
                style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #dc2626", background: "var(--surface)", color: "#dc2626", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
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
                  style={{ ...inputStyle, border: "2px solid #fecaca" }}
                />
                {deleteError && <p style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>{deleteError}</p>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#dc2626", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: deleting ? 0.7 : 1 }}
                  >
                    {deleting ? "Deleting..." : "Yes, delete everything"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDeleteConfirm(false); setDeleteInput(""); setDeleteError(""); }}
                    style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)", fontSize: 14, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
