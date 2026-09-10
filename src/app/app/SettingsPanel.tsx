"use client";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant } from "@/lib/types";
import { CURRENCIES, DEFAULT_ACCENT } from "@/lib/constants";
import { useToast } from "@/components/Toast";
import { IconBell, IconReceipt, IconGlass, IconAlert, IconCheck, IconTable, IconDish, IconCard, IconStore, IconBolt } from "@/components/icons";

interface Props {
  restaurant: Restaurant;
  /** Server-side: is a Stripe key configured on this deployment? */
  paymentsAvailable?: boolean;
}

const ACCENT_PRESETS = [
  "#E85D2F", "#dc2626", "#d97706", "#059669",
  "#0d9488", "#2563eb", "#7c3aed", "#db2777",
];
const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

type Tab = "general" | "menu" | "payments" | "danger";

const TABS: { id: Tab; label: string; Icon: (p: { width?: number; height?: number; style?: React.CSSProperties }) => React.ReactElement }[] = [
  { id: "general", label: "General", Icon: IconStore },
  { id: "menu", label: "Guest menu", Icon: IconDish },
  { id: "payments", label: "Payments", Icon: IconCard },
  { id: "danger", label: "Danger zone", Icon: IconAlert },
];

/** A titled block inside a tab. */
function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "20px 22px",
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: "var(--fs-md)", fontWeight: 700, color: "var(--text)" }}>{title}</div>
        {desc && <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)", marginTop: 3, lineHeight: 1.5 }}>{desc}</div>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>
    </section>
  );
}

/** Labelled row with a control on the right — for toggles. */
function Row({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text)" }}>{title}</div>
        {desc && <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)", marginTop: 3, lineHeight: 1.5 }}>{desc}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Switch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-pressed={on}
      style={{
        width: 52, height: 28, borderRadius: "var(--radius-pill)", flexShrink: 0,
        background: on ? "var(--accent)" : "var(--border)",
        border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s",
      }}
    >
      <div style={{
        width: 22, height: 22, borderRadius: "50%", background: "var(--surface)",
        position: "absolute", top: 3, left: on ? 27 : 3,
        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

export default function SettingsPanel({ restaurant, paymentsAvailable = false }: Props) {
  const supabase = createClient();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("general");
  const [name, setName] = useState(restaurant.name);
  const [accent, setAccent] = useState(restaurant.accent_color || DEFAULT_ACCENT);
  const [logoUrl, setLogoUrl] = useState(restaurant.logo_url ?? "");
  const [venueType, setVenueType] = useState<Restaurant["venue_type"]>(
    restaurant.venue_type ?? "table_service"
  );
  const [quickActions, setQuickActions] = useState<string[]>(
    restaurant.quick_actions ?? ["waiter", "bill", "refill"]
  );
  // Currency — DB value is NOT NULL (default SEK), so it's the only source of truth
  const [currency, setCurrency] = useState(() => restaurant.currency || "SEK");
  // Payments at the table (column defaults to true — behaviour is unchanged until switched off)
  const [acceptsPayments, setAcceptsPayments] = useState(restaurant.accepts_payments !== false);
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

  function playPing() {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880; gain.gain.value = 0.15;
      osc.start(); osc.stop(ctx.currentTime + 0.15);
    } catch { /* ignore */ }
  }

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("menuqr_sound", next ? "on" : "off");
    if (next) playPing();
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

  // Auto-save routine — accepts overrides so toggles persist immediately
  // (state updates are async).
  async function persist(override: Partial<{
    name: string; accent: string; logoUrl: string; acceptsPayments: boolean;
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
    const finalLogo = (override.logoUrl ?? logoUrl).trim();
    // Logo URL must be an absolute http(s) URL
    if (finalLogo && !/^https?:\/\/.+/.test(finalLogo)) {
      toast.error("Logo URL must start with http:// or https:// — not saved");
      return;
    }
    const finalName = (override.name ?? name).trim();
    if (!finalName) {
      // Blanking the name saves nothing — say so instead of failing silently
      setNameError("Restaurant name can't be empty");
      toast.error("Restaurant name can't be empty");
      return;
    }
    setNameError("");
    const payload = {
      name: finalName,
      accent_color: finalAccent,
      logo_url: finalLogo || null,
      quick_actions: override.quickActions ?? quickActions,
      venue_type: override.venueType ?? venueType,
      currency: override.currency ?? currency,
      accepts_payments: override.acceptsPayments ?? acceptsPayments,
    };
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

  function togglePayments() {
    const next = !acceptsPayments;
    setAcceptsPayments(next);
    persist({ acceptsPayments: next });
  }

  async function handleDelete() {
    if (deleteInput !== restaurant.name) {
      setDeleteError("Restaurant name does not match.");
      return;
    }
    setDeleting(true);
    setDeleteError("");
    // Child tables cascade on delete in the schema — deleting the restaurant
    // row removes everything.
    const { error: err } = await supabase.from("restaurants").delete().eq("id", restaurant.id);
    if (err) {
      setDeleteError(err.message);
      setDeleting(false);
    } else {
      window.location.href = "/app";
    }
  }

  const labelStyle: React.CSSProperties = { fontSize: "var(--fs-sm)", fontWeight: 600, display: "block", marginBottom: 6, color: "var(--text)" };
  const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)", fontSize: "var(--fs-md)", outline: "none" };
  const metaStyle: React.CSSProperties = { fontSize: "var(--fs-xs)", color: "var(--text-muted)", margin: "6px 0 0", lineHeight: 1.5 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 760 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: "var(--fs-lg)", margin: 0, color: "var(--text)" }}>Settings</h2>
          <p style={{ margin: "4px 0 0", fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
            {restaurant.name} · changes save automatically
          </p>
        </div>
        <div
          aria-live="polite"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: "var(--fs-sm)", fontWeight: 500, color: "var(--accent)",
            opacity: saved ? 1 : 0, transition: "opacity 0.4s ease",
            pointerEvents: "none",
          }}
        >
          <IconCheck width={15} height={15} />
          <span>Saved</span>
        </div>
      </div>

      {/* ── TABS ── */}
      <div
        role="tablist"
        aria-label="Settings sections"
        style={{
          display: "flex", gap: 6, flexWrap: "wrap",
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-pill)", padding: 5,
        }}
      >
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "8px 16px", borderRadius: "var(--radius-pill)", cursor: "pointer",
                border: "none", fontWeight: 600, fontSize: "var(--fs-sm)",
                background: active
                  ? id === "danger" ? "color-mix(in srgb, #dc2626 12%, transparent)" : "color-mix(in srgb, var(--accent) 13%, transparent)"
                  : "transparent",
                color: active ? (id === "danger" ? "#dc2626" : "var(--accent)") : "var(--text-muted)",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              <Icon width={15} height={15} /> {label}
            </button>
          );
        })}
      </div>

      {error && (
        <p style={{ color: "#dc2626", fontSize: "var(--fs-sm)", margin: 0 }}>{error}</p>
      )}

      {/* ── GENERAL ── */}
      {tab === "general" && (
        <form onSubmit={e => { e.preventDefault(); persist(); }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Identity" desc="How your restaurant appears to guests and staff.">
            <div>
              <label style={labelStyle}>Restaurant name</label>
              <input
                value={name}
                onChange={e => { setName(e.target.value); if (e.target.value.trim()) setNameError(""); }}
                onBlur={() => persist()}
                required
                style={{ ...inputStyle, border: nameError ? "1px solid #dc2626" : "1px solid var(--border)" }}
              />
              {nameError && <p style={{ color: "#dc2626", fontSize: "var(--fs-sm)", margin: "6px 0 0" }}>{nameError}</p>}
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
                      background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
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
                    <span style={{ color: "#dc2626", fontSize: "var(--fs-xs)" }}>Couldn&apos;t load that image — check the URL</span>
                  ) : (
                    <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)", lineHeight: 1.5 }}>
                      Shown in the guest menu header and the dashboard header.
                    </span>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card title="Brand colour" desc="Used across the guest menu, buttons and highlights.">
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div
                aria-hidden
                style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
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
                style={{ ...inputStyle, width: 140, fontFamily: "monospace", fontSize: "var(--fs-sm)", border: accentError ? "1px solid #dc2626" : "1px solid var(--border)" }}
              />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {ACCENT_PRESETS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setAccent(c); setAccentError(""); persist({ accent: c }); }}
                    aria-label={`Use ${c}`}
                    title={c}
                    style={{
                      width: 26, height: 26, borderRadius: "50%", cursor: "pointer",
                      background: c, padding: 0,
                      border: accent.toLowerCase() === c.toLowerCase()
                        ? "2px solid var(--text)"
                        : "1px solid var(--border)",
                    }}
                  />
                ))}
              </div>
            </div>
            {accentError && <p style={{ color: "#dc2626", fontSize: "var(--fs-sm)", margin: 0 }}>{accentError}</p>}
          </Card>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "9px 16px", borderRadius: "var(--radius-md)", cursor: "pointer",
                border: "1px solid var(--border)", background: "var(--surface)",
                color: "var(--text-muted)", fontSize: "var(--fs-sm)", fontWeight: 500,
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "Saving…" : "Save now"}
            </button>
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>Changes also save when you click away.</span>
          </div>
        </form>
      )}

      {/* ── GUEST MENU ── */}
      {tab === "menu" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Service style" desc="Controls which features your guests see.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
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
                      padding: 14, borderRadius: "var(--radius-lg)",
                      border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                      background: selected ? "color-mix(in srgb, var(--accent) 10%, var(--surface-2))" : "var(--surface-2)",
                      color: "var(--text)", transition: "border-color 0.15s, background 0.15s",
                    }}
                  >
                    <v.Icon width={20} height={20} style={{ color: selected ? "var(--accent)" : "var(--text-muted)" }} />
                    <span style={{ fontSize: "var(--fs-sm)", fontWeight: 600 }}>{v.label}</span>
                    <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)", lineHeight: 1.4 }}>{v.desc}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card title="Quick actions" desc="Buttons guests can tap at the table.">
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
                      padding: "8px 14px", borderRadius: "var(--radius-pill)", cursor: "pointer",
                      fontWeight: 500, fontSize: "var(--fs-sm)",
                      border: `1px solid ${on ? "var(--accent)" : "var(--border)"}`,
                      background: on ? "color-mix(in srgb, var(--accent) 14%, var(--surface-2))" : "var(--surface-2)",
                      color: on ? "var(--accent)" : "var(--text-muted)",
                      transition: "background 0.15s, color 0.15s, border-color 0.15s",
                    }}
                  >
                    <Icon width={15} height={15} /> {label}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card title="Menu display">
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
              <p style={metaStyle}>Prices are formatted for this currency&apos;s locale — 89,50 kr or $89.50.</p>
            </div>

            <Row title="Sound alerts" desc="Play a ping when a new order arrives. Stored per browser.">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  onClick={playPing}
                  style={{
                    padding: "6px 12px", borderRadius: "var(--radius-pill)", cursor: "pointer",
                    border: "1px solid var(--border)", background: "var(--surface-2)",
                    color: "var(--text-muted)", fontSize: "var(--fs-xs)", fontWeight: 600,
                  }}
                >
                  Test
                </button>
                <Switch on={soundEnabled} onToggle={toggleSound} label={soundEnabled ? "Disable sound" : "Enable sound"} />
              </div>
            </Row>
          </Card>

          <Card title="Shortcuts">
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a
                href="/kitchen"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "9px 14px", borderRadius: "var(--radius-md)", textDecoration: "none",
                  border: "1px solid var(--border)", background: "var(--surface-2)",
                  color: "var(--text)", fontSize: "var(--fs-sm)", fontWeight: 600,
                }}
              >
                <IconDish width={15} height={15} /> Open kitchen screen
              </a>
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)", alignSelf: "center" }}>
                Tables and QR codes live in the Tables tab.
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* ── PAYMENTS ── */}
      {tab === "payments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card
            title="Payments at the table"
            desc="Guests pay by card from their phone before the order is sent."
          >
            <Row
              title="Accept card payments"
              desc={
                paymentsAvailable
                  ? acceptsPayments
                    ? "On — orders only reach the kitchen once the payment has gone through."
                    : "Off — guests order as usual and pay you however you already take payment."
                  : "Unavailable — no payment provider is configured on this deployment yet."
              }
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                  color: paymentsAvailable && acceptsPayments ? "var(--success)" : "var(--text-muted)",
                }}>
                  {paymentsAvailable && acceptsPayments ? "On" : "Off"}
                </span>
                <Switch
                  on={paymentsAvailable && acceptsPayments}
                  onToggle={() => { if (paymentsAvailable) togglePayments(); }}
                  label={acceptsPayments ? "Disable payments" : "Enable payments"}
                />
              </div>
            </Row>
          </Card>

          <Card title="How it works" desc="The pre-pay gate keeps unpaid food off the pass.">
            <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                "Guest fills their cart and taps Pay & order.",
                "The server prices the order from your menu — never from the phone.",
                "The guest pays on the card page (test mode uses 4242 4242 4242 4242).",
                "Only after the payment confirms does the ticket appear on Live Orders and the kitchen screen.",
              ].map((t, i) => (
                <li key={i} style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", lineHeight: 1.5 }}>{t}</li>
              ))}
            </ol>
            <p style={{ ...metaStyle, marginTop: 0 }}>
              Abandoned checkouts are removed automatically — they never reach the kitchen and never count in your stats.
            </p>
          </Card>

          <Card title="Fees" desc="You keep the order value; MenuQR charges a small fee per paid order.">
            <p style={{ ...metaStyle, marginTop: 0 }}>
              No monthly subscription. Card processing fees are set by the payment provider on top of the per-order fee.
            </p>
          </Card>

          {!paymentsAvailable && (
            <p style={{ ...metaStyle, marginTop: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <IconBolt width={14} height={14} /> Payments will appear here as soon as the provider keys are added.
            </p>
          )}
        </div>
      )}

      {/* ── DANGER ── */}
      {tab === "danger" && (
        <Card title="Delete restaurant" desc={`Permanently removes ${restaurant.name} and all of its data.`}>
          {!deleteConfirm ? (
            <div>
              <button
                type="button"
                onClick={() => setDeleteConfirm(true)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "9px 16px", borderRadius: "var(--radius-md)", cursor: "pointer",
                  border: "1px solid color-mix(in srgb, #dc2626 40%, var(--border))",
                  background: "color-mix(in srgb, #dc2626 8%, transparent)",
                  color: "#dc2626", fontSize: "var(--fs-sm)", fontWeight: 700,
                }}
              >
                <IconAlert width={15} height={15} /> Delete this restaurant
              </button>
              <p style={metaStyle}>
                Removes tables, menu, orders and history. This cannot be undone.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#dc2626" }}>
                <IconAlert width={16} height={16} />
                <span style={{ fontWeight: 700, fontSize: "var(--fs-md)" }}>This cannot be undone</span>
              </div>
              <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                Deleting <strong style={{ color: "var(--text)" }}>{restaurant.name}</strong> also removes every
                table, menu item and past order.
              </p>
              <label style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "#dc2626" }}>
                Type <strong>{restaurant.name}</strong> to confirm:
              </label>
              <input
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                placeholder={restaurant.name}
                style={{ ...inputStyle, border: "2px solid #fecaca" }}
              />
              {deleteError && <p style={{ color: "#dc2626", fontSize: "var(--fs-sm)", margin: 0 }}>{deleteError}</p>}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{ padding: "9px 18px", borderRadius: "var(--radius-md)", border: "none", background: "#dc2626", color: "white", fontWeight: 700, fontSize: "var(--fs-sm)", cursor: "pointer", opacity: deleting ? 0.7 : 1 }}
                >
                  {deleting ? "Deleting..." : "Yes, delete everything"}
                </button>
                <button
                  type="button"
                  onClick={() => { setDeleteConfirm(false); setDeleteInput(""); setDeleteError(""); }}
                  style={{ padding: "9px 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)", fontSize: "var(--fs-sm)", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
