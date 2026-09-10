"use client";
import { useI18n, LOCALES } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n";

/** Swedish flag — blue field, yellow cross. */
function FlagSE({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.625} viewBox="0 0 16 10" aria-hidden="true" style={{ display: "block", borderRadius: 2 }}>
      <rect width="16" height="10" fill="#006AA7" />
      <rect x="5" width="2" height="10" fill="#FECC02" />
      <rect y="4" width="16" height="2" fill="#FECC02" />
    </svg>
  );
}

/** Union Jack — the English/GB flag. */
function FlagGB({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.625} viewBox="0 0 60 30" aria-hidden="true" style={{ display: "block", borderRadius: 2 }}>
      <clipPath id="mq-uj">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <rect width="60" height="30" fill="#00247d" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#mq-uj)" stroke="#cf142b" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#cf142b" strokeWidth="6" />
    </svg>
  );
}

function Flag({ code, size }: { code: Locale; size?: number }) {
  return code === "sv" ? <FlagSE size={size} /> : <FlagGB size={size} />;
}

/**
 * Language switcher — flag buttons for Swedish and English.
 * Writes the locale cookie so server-rendered pages re-render in the chosen
 * language (see lib/i18n/client.tsx).
 */
export default function LangSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t("common.language")}
      style={{ display: "inline-flex", gap: 4, alignItems: "center", padding: 3, border: "1px solid var(--border)", borderRadius: "var(--radius-pill)", background: "var(--surface)" }}
    >
      {LOCALES.map((l) => {
        const active = l.code === locale;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => setLocale(l.code)}
            aria-pressed={active}
            aria-label={l.code === "sv" ? t("common.switchToSwedish") : t("common.switchToEnglish")}
            title={l.label}
            style={{
              display: "inline-flex", alignItems: "center", gap: compact ? 0 : 7,
              padding: compact ? "4px 6px" : "5px 10px",
              border: "none", cursor: "pointer",
              borderRadius: "var(--radius-pill)",
              background: active ? "var(--accent-soft)" : "transparent",
              color: active ? "var(--accent)" : "var(--text-muted)",
              fontFamily: "inherit", fontSize: "var(--fs-xs)",
              fontWeight: 700, letterSpacing: "0.02em",
              outline: active ? "1px solid var(--accent-border)" : "none",
              lineHeight: 1,
            }}
          >
            <Flag code={l.code} size={compact ? 17 : 19} />
            {!compact && l.short}
          </button>
        );
      })}
    </div>
  );
}
