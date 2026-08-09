"use client";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant } from "@/lib/types";
import { CURRENCIES } from "@/lib/constants";
import { useToast } from "@/components/Toast";
import { IconBell, IconReceipt, IconGlass, IconAlert, IconCheck, IconTable, IconDish } from "@/components/icons";

interface Props { restaurant: Restaurant }

function Section({ title, first, children }: { title: string; first?: boolean; children: React.ReactNode }) {
  return (
    <section
      style={{
        borderTop: first ? "none" : "1px solid var(--border)",
        paddingTop: first ? 0 : 24,
        marginTop: first ? 0 : 4,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.09em",
          color: "var(--text-muted)",
          marginBottom: 16,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>{children}</div>
    </section>
  );
}

const ACCENT_PRESETS = ["#E85D2F", "#2563eb", "#059669", "#7c3aed", "#db2777"];
const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

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
  // Currency — DB value is NOT NULL (default SEK), so it's the only source of truth
  const [currency, setCurrency] = useState(() => restaurant.currency || "SEK");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [accentError, setAccentError] = useState("");
  const [nameError, setNameError] = useState("");
  const [logoError, setLogoError] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    { id: "waiter", label: "Call waiter", Icon: IconBell, desc: "Guest can call a staff member to the table" },
    { id: "bill", label: "Request bill", Icon: IconReceipt, desc: "Guest can request the bill at the table" },
    { id: "refill", label: "Refill drinks", Icon: IconGlass, desc: "Guest can request a drink refill" },
  ];

  const VENUE_TYPES = [
    { id: "table_service", label: "Table service", desc: "Sit-down — guests order at the table", Icon: IconTable },
    { id: "cafe", label: "Café / counter", desc: "Order at counter, notified when ready", Icon: IconDish },
    { id: "takeaway", label: "Takeaway / pickup", desc: "Order ahead, kitchen notifies", Icon: IconReceipt },
  ] as const;

  function flashSaved() {
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 2000);
  }

  // Auto-save routine — accepts overrides so chip/venue/preset changes persist
  // the new value immediately (state updates are async).
  async function persist(override: Partial<{
    name: string; accent: string; logoUrl: string;
    quickActions: string[]; venueType: Restaurant["venue_type"]; currency: string;
  }> = {}) {
    const finalAccent = (override.accent ?? accent).trim();
    // Never persist an invalid accent color — the guest menu uses it raw as a CSS color
    if (!HEX_RE.test(finalAccent)) {
      setAccentError("Enter a valid hex color, e.g. #E85D2F");
      toast.error("Invalid accent color — not saved");
      return;
    }
    setAccentError("");
    const payload = {
      name: (override.name ?? name).trim(),
      accent_color: finalAccent,
      logo_url: ((override.logoUrl ?? logoUrl).trim()) || null,
      quick_actions: override.quickActions ?? quickActions,
      venue_type: override.venueType ?? venueType,
      currency: override.currency ?? currency,
    };
    if (!payload.name) {
      // Blanking the name saves nothing — say so instead of failing silently
      setNameError("Restaurant name can't be empty");
      toast.error("Restaurant name can't be empty");
      return;
    }
    setNameError("");
    setSaving(true);
    setError("");
    const { error: err } = await supabase
      .from("restaurants")
      .update(payload)
      .eq("id", restaurant.id);
    setSaving(false);
    if (err) {
      setError(err.message);
      toast.error("Could not save changes");
    } else {
      flashSaved();
    }
  }

  function toggleAction(id: string) {
    const next = quickActions.includes(id)
      ? quickActions.filter(a => a !== id)
      : [...quickActions, id];
    setQuickActions(next);
    persist({ quickActions: next });
  }

  async function handleDelete() {
    if (deleteInput !== restaurant.name) {
      setDeleteError("Restaurant name does not match.");
      return;
    }
    setDeleting(true);
    setDeleteError("");
    // Child tables (table_requests, menu_items, menu_categories, restaurant_tables)
    // cascade on delete in the schema — deleting the restaurant row removes everything.
    const { error: err } = await supabase.from("restaurants").delete().eq("id", restaurant.id);
    if (err) {
      setDeleteError(err.message);
      setDeleting(false);
    } else {
      window.location.href = "/app";
    }
  }

  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6, color: "var(--text)" };
  const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)", fontSize: 15, outline: "none" };
  const metaStyle: React.CSSProperties = { fontSize: 11, color: "var(--text-muted)", margin: "6px 0 0" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 620 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ fontWeight: 700, fontSize: 18, margin: 0, color: "var(--text)" }}>Settings</h2>
        <div
          aria-live="polite"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 13, fontWeight: 500, color: "var(--accent)",
            opacity: saved ? 1 : 0, transition: "opacity 0.4s ease",
            pointerEvents: "none",
          }}
        >
          <IconCheck width={15} height={15} />
          <span>Saved</span>
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "24px 28px" }}>
        <form onSubmit={e => { e.preventDefault(); persist(); }} style={{ display: "flex", flexDirection: "column", gap: 28 }}>

          {/* ── Restaurant ── */}
          <Section title="Restaurant" first>
            <div>
              <label style={labelStyle}>Restaurant name</label>
              <input
                value={name}
                onChange={e => { setName(e.target.value); if (e.target.value.trim()) setNameError(""); }}
                onBlur={() => persist()}
                required
                style={{ ...inputStyle, border: nameError ? "1px solid #dc2626" : "1px solid var(--border)" }}
              />
              {nameError && <p style={{ color: "#dc2626", fontSize: 13, margin: "6px 0 0" }}>{nameError}</p>}
            </div>

            <div>
              <label style={labelStyle}>Accent color</label>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div
                  aria-hidden
                  style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    background: accent, border: "1px solid var(--border)",
                    boxShadow: "inset 0 0 0 2px var(--surface)",
                  }}
                />
                <input
                  value={accent}
                  onChange={e => {
                    setAccent(e.target.value);
                    if (HEX_RE.test(e.target.value.trim())) setAccentError("");
                  }}
                  onBlur={() => persist()}
                  placeholder="#E85D2F"
                  style={{ ...inputStyle, width: 130, fontFamily: "monospace", fontSize: 13, border: accentError ? "1px solid #dc2626" : "1px solid var(--border)" }}
                />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                {ACCENT_PRESETS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setAccent(c); setAccentError(""); persist({ accent: c }); }}
                    aria-label={`Use ${c}`}
                    title={c}
                    style={{
                      width: 24, height: 24, borderRadius: "50%", cursor: "pointer",
                      background: c, padding: 0,
                      border: accent.toLowerCase() === c.toLowerCase()
                        ? "2px solid var(--text)"
                        : "1px solid var(--border)",
                    }}
                  />
                ))}
              </div>
              {accentError && <p style={{ color: "#dc2626", fontSize: 13, margin: "6px 0 0" }}>{accentError}</p>}
              <p style={metaStyle}>Used on guest menus as the brand color.</p>
            </div>

            <div>
              <label style={labelStyle}>Logo URL</label>
              <input
                value={logoUrl}
                onChange={e => { setLogoUrl(e.target.value); setLogoError(false); }}
                onBlur={() => persist()}
                placeholder="https://…"
                style={inputStyle}
              />
              {logoUrl.trim() && (
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      minHeight: 64, padding: "6px 10px",
                      background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10,
                    }}
                  >
                    <img
                      src={logoUrl.trim()}
                      alt="Logo preview"
                      referrerPolicy="no-referrer"
                      onLoad={() => setLogoError(false)}
                      onError={() => setLogoError(true)}
                      style={{ maxHeight: 56, maxWidth: 180, objectFit: "contain" }}
                    />
                  </div>
                  {logoError ? (
                    <span style={{ color: "#dc2626", fontSize: 12 }}>Couldn't load that image — check the URL</span>
                  ) : (
                    <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
                      Preview — shown in the guest menu header and dashboard header. Height-capped, never cropped.
                    </span>
                  )}
                </div>
              )}
            </div>
          </Section>

          {/* ── Venue ── */}
          <Section title="Venue">
            <p style={{ ...metaStyle, marginTop: 0 }}>Controls which features are available to your guests.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {VENUE_TYPES.map(v => {
                const selected = venueType === v.id;
                return (
                  <button
                    type="button"
                    key={v.id}
                    onClick={() => { setVenueType(v.id); persist({ venueType: v.id }); }}
                    style={{
                      textAlign: "left", cursor: "pointer",
                      display: "flex", flexDirection: "column", gap: 8,
                      padding: 14, borderRadius: 12,
                      border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                      background: selected ? "color-mix(in srgb, var(--accent) 10%, var(--surface))" : "var(--surface-2)",
                      color: "var(--text)", transition: "border-color 0.15s, background 0.15s",
                    }}
                  >
                    <v.Icon width={20} height={20} style={{ color: selected ? "var(--accent)" : "var(--text-muted)" }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{v.label}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{v.desc}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ── Guest menu ── */}
          <Section title="Guest menu">
            <div>
              <label style={labelStyle}>Quick actions</label>
              <p style={{ ...metaStyle, marginTop: 0, marginBottom: 10 }}>Choose which buttons guests can see and use.</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {ALL_ACTIONS.map(({ id, label, Icon, desc }) => {
                  const on = quickActions.includes(id);
                  return (
                    <button
                      type="button"
                      key={id}
                      onClick={() => toggleAction(id)}
                      title={desc}
                      aria-pressed={on}
                      style={{
                        display: "flex", alignItems: "center", gap: 7,
                        padding: "8px 14px", borderRadius: 99, cursor: "pointer",
                        fontWeight: 500, fontSize: 13,
                        border: `1px solid ${on ? "var(--accent)" : "var(--border)"}`,
                        background: on ? "color-mix(in srgb, var(--accent) 14%, var(--surface))" : "var(--surface-2)",
                        color: on ? "var(--accent)" : "var(--text-muted)",
                        transition: "background 0.15s, color 0.15s, border-color 0.15s",
                      }}
                    >
                      <Icon width={15} height={15} /> {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Currency</label>
              <select
                value={currency}
                onChange={e => {
                  const v = e.target.value;
                  setCurrency(v);
                  persist({ currency: v });
                }}
                style={{ ...inputStyle, cursor: "pointer", maxWidth: 240 }}
              >
                {Object.entries(CURRENCIES).map(([code, sym]) => (
                  <option key={code} value={code}>{sym} — {code}</option>
                ))}
              </select>
              <p style={metaStyle}>Shown on guest menus next to prices.</p>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Sound alerts</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>Play an audio ping when a new order comes in. Stored per browser.</div>
              </div>
              <button
                type="button"
                onClick={toggleSound}
                style={{
                  width: 52, height: 28, borderRadius: 99, flexShrink: 0,
                  background: soundEnabled ? "var(--accent)" : "var(--border)",
                  border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s",
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
            {/* Fallback explicit save — changes also auto-save on blur/toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "7px 14px", borderRadius: 8, cursor: "pointer",
                  border: "1px solid var(--border)", background: "var(--surface-2)",
                  color: "var(--text-muted)", fontSize: 13, fontWeight: 500,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? "Saving…" : "Save now"}
              </button>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Changes save automatically.</span>
            </div>
          </Section>

          {/* ── Danger zone ── */}
          <Section title="Danger zone">
            {!deleteConfirm ? (
              <div>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(true)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    background: "none", border: "none", padding: 0, cursor: "pointer",
                    color: "#dc2626", fontSize: 13, fontWeight: 600, textDecoration: "underline",
                  }}
                >
                  <IconAlert width={15} height={15} /> Delete this restaurant
                </button>
                <p style={{ ...metaStyle }}>
                  Permanently removes {restaurant.name} and all its data — tables, menu, requests. This cannot be undone.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#dc2626" }}>
                  <IconAlert width={16} height={16} />
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Delete this restaurant</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                  Permanently delete <strong style={{ color: "var(--text)" }}>{restaurant.name}</strong> and all its data — tables, menu, requests. This cannot be undone.
                </p>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#dc2626" }}>
                  Type <strong>{restaurant.name}</strong> to confirm:
                </label>
                <input
                  value={deleteInput}
                  onChange={e => setDeleteInput(e.target.value)}
                  placeholder={restaurant.name}
                  style={{ ...inputStyle, background: "var(--surface)", border: "2px solid #fecaca" }}
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
          </Section>
        </form>
      </div>
    </div>
  );
}
