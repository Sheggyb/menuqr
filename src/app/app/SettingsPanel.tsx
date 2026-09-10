"use client";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant } from "@/lib/types";
import { CURRENCIES, DEFAULT_ACCENT } from "@/lib/constants";
import { useToast } from "@/components/Toast";
import { IconBell, IconReceipt, IconGlass, IconAlert, IconCheck, IconTable, IconDish, IconCard, IconStore, IconBolt } from "@/components/icons";
import { useT } from "@/lib/i18n/client";
import type { TKey } from "@/lib/i18n";

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

const TABS: { id: Tab; labelKey: TKey; Icon: (p: { width?: number; height?: number; style?: React.CSSProperties }) => React.ReactElement }[] = [
  { id: "general", labelKey: "settings.tab.general", Icon: IconStore },
  { id: "menu", labelKey: "settings.tab.menu", Icon: IconDish },
  { id: "payments", labelKey: "settings.tab.payments", Icon: IconCard },
  { id: "danger", labelKey: "settings.tab.danger", Icon: IconAlert },
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
  const t = useT();
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
    { id: "waiter", label: t("settings.action.waiter.label"), Icon: IconBell, desc: t("settings.action.waiter.desc") },
    { id: "bill", label: t("settings.action.bill.label"), Icon: IconReceipt, desc: t("settings.action.bill.desc") },
    { id: "refill", label: t("settings.action.refill.label"), Icon: IconGlass, desc: t("settings.action.refill.desc") },
  ];

  const VENUE_TYPES = [
    { id: "table_service", label: t("settings.venue.table.label"), desc: t("settings.venue.table.desc"), Icon: IconTable },
    { id: "cafe", label: t("settings.venue.cafe.label"), desc: t("settings.venue.cafe.desc"), Icon: IconDish },
    { id: "takeaway", label: t("settings.venue.takeaway.label"), desc: t("settings.venue.takeaway.desc"), Icon: IconReceipt },
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
      setAccentError(t("settings.error.accent"));
      toast.error(t("settings.error.accentToast"));
      return;
    }
    setAccentError("");
    const finalLogo = (override.logoUrl ?? logoUrl).trim();
    // Logo URL must be an absolute http(s) URL
    if (finalLogo && !/^https?:\/\/.+/.test(finalLogo)) {
      toast.error(t("settings.error.logoToast"));
      return;
    }
    const finalName = (override.name ?? name).trim();
    if (!finalName) {
      // Blanking the name saves nothing — say so instead of failing silently
      setNameError(t("settings.error.nameEmpty"));
      toast.error(t("settings.error.nameEmpty"));
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
      toast.error(t("settings.error.save"));
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
      setDeleteError(t("settings.error.deleteMismatch"));
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
          <h2 style={{ fontWeight: 700, fontSize: "var(--fs-lg)", margin: 0, color: "var(--text)" }}>{t("settings.title")}</h2>
          <p style={{ margin: "4px 0 0", fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
            {t("settings.subtitle", { name: restaurant.name })}
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
          <span>{t("common.saved")}</span>
        </div>
      </div>

      {/* ── TABS ── */}
      <div
        role="tablist"
        aria-label={t("settings.tabs.aria")}
        style={{
          display: "flex", gap: 6, flexWrap: "wrap",
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-pill)", padding: 5,
        }}
      >
        {TABS.map(({ id, labelKey, Icon }) => {
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
              <Icon width={15} height={15} /> {t(labelKey)}
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
          <Card title={t("settings.identity.title")} desc={t("settings.identity.desc")}>
            <div>
              <label style={labelStyle}>{t("settings.field.name")}</label>
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
              <label style={labelStyle}>{t("settings.field.logoUrl")}</label>
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
                      alt={t("settings.logo.alt")}
                      referrerPolicy="no-referrer"
                      onLoad={() => setLogoError(false)}
                      onError={() => setLogoError(true)}
                      style={{ maxHeight: 56, maxWidth: 180, objectFit: "contain" }}
                    />
                  </div>
                  {logoError ? (
                    <span style={{ color: "#dc2626", fontSize: "var(--fs-xs)" }}>{t("settings.logo.error")}</span>
                  ) : (
                    <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)", lineHeight: 1.5 }}>
                      {t("settings.logo.hint")}
                    </span>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card title={t("settings.brand.title")} desc={t("settings.brand.desc")}>
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
                    aria-label={t("settings.brand.usePreset", { color: c })}
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
              {saving ? t("common.saving") : t("settings.btn.saveNow")}
            </button>
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{t("settings.autosave.hint")}</span>
          </div>
        </form>
      )}

      {/* ── GUEST MENU ── */}
      {tab === "menu" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title={t("settings.service.title")} desc={t("settings.service.desc")}>
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

          <Card title={t("settings.quick.title")} desc={t("settings.quick.desc")}>
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

          <Card title={t("settings.menuDisplay.title")}>
            <div>
              <label style={labelStyle}>{t("settings.field.currency")}</label>
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
              <p style={metaStyle}>{t("settings.currency.hint")}</p>
            </div>

            <Row title={t("settings.sound.title")} desc={t("settings.sound.desc")}>
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
                  {t("settings.sound.test")}
                </button>
                <Switch on={soundEnabled} onToggle={toggleSound} label={soundEnabled ? t("settings.sound.disable") : t("settings.sound.enable")} />
              </div>
            </Row>
          </Card>

          <Card title={t("settings.shortcuts.title")}>
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
                <IconDish width={15} height={15} /> {t("settings.shortcuts.kitchen")}
              </a>
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)", alignSelf: "center" }}>
                {t("settings.shortcuts.tablesHint")}
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* ── PAYMENTS ── */}
      {tab === "payments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card
            title={t("settings.payments.title")}
            desc={t("settings.payments.desc")}
          >
            <Row
              title={t("settings.payments.accept")}
              desc={
                paymentsAvailable
                  ? acceptsPayments
                    ? t("settings.payments.on")
                    : t("settings.payments.off")
                  : t("settings.payments.unavailable")
              }
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                  color: paymentsAvailable && acceptsPayments ? "var(--success)" : "var(--text-muted)",
                }}>
                  {paymentsAvailable && acceptsPayments ? t("settings.payments.statusOn") : t("settings.payments.statusOff")}
                </span>
                <Switch
                  on={paymentsAvailable && acceptsPayments}
                  onToggle={() => { if (paymentsAvailable) togglePayments(); }}
                  label={acceptsPayments ? t("settings.payments.disable") : t("settings.payments.enable")}
                />
              </div>
            </Row>
          </Card>

          <Card title={t("settings.how.title")} desc={t("settings.how.desc")}>
            <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
              {([
                "settings.how.step1",
                "settings.how.step2",
                "settings.how.step3",
                "settings.how.step4",
              ] as const).map((key, i) => (
                <li key={i} style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", lineHeight: 1.5 }}>{t(key)}</li>
              ))}
            </ol>
            <p style={{ ...metaStyle, marginTop: 0 }}>
              {t("settings.how.footnote")}
            </p>
          </Card>

          <Card title={t("settings.fees.title")} desc={t("settings.fees.desc")}>
            <p style={{ ...metaStyle, marginTop: 0 }}>
              {t("settings.fees.body")}
            </p>
          </Card>

          {!paymentsAvailable && (
            <p style={{ ...metaStyle, marginTop: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <IconBolt width={14} height={14} /> {t("settings.fees.providerHint")}
            </p>
          )}
        </div>
      )}

      {/* ── DANGER ── */}
      {tab === "danger" && (
        <Card title={t("settings.danger.title")} desc={t("settings.danger.desc", { name: restaurant.name })}>
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
                <IconAlert width={15} height={15} /> {t("settings.danger.delete")}
              </button>
              <p style={metaStyle}>
                {t("settings.danger.warning")}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#dc2626" }}>
                <IconAlert width={16} height={16} />
                <span style={{ fontWeight: 700, fontSize: "var(--fs-md)" }}>{t("settings.danger.cannotUndo")}</span>
              </div>
              <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                {t("settings.danger.confirmBefore")}<strong style={{ color: "var(--text)" }}>{restaurant.name}</strong>{t("settings.danger.confirmAfter")}
              </p>
              <label style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "#dc2626" }}>
                {t("settings.danger.typeBefore")}<strong>{restaurant.name}</strong>{t("settings.danger.typeAfter")}
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
                  {deleting ? t("settings.danger.deleting") : t("settings.danger.confirmButton")}
                </button>
                <button
                  type="button"
                  onClick={() => { setDeleteConfirm(false); setDeleteInput(""); setDeleteError(""); }}
                  style={{ padding: "9px 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)", fontSize: "var(--fs-sm)", cursor: "pointer" }}
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
