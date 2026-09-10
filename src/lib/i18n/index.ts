// i18n core — locale type, string table merge, and the translate helper.
//
// Design notes:
// - One flat key namespace (`landing.hero.title`) so any component can look up
//   a string without knowing which module it lives in.
// - Every key carries BOTH languages in the same object (`{ en, sv }`) so a
//   translation can never silently be missing for one locale.
// - Adding a key to a surface file types it automatically; a typo in a
//   component fails `npm run typecheck` instead of rendering the raw key.
import { common } from "./strings/common";
import { landing } from "./strings/landing";
import { auth } from "./strings/auth";
import { dashboard } from "./strings/dashboard";
import { menuBuilder } from "./strings/menuBuilder";
import { tables } from "./strings/tables";
import { settings } from "./strings/settings";
import { kitchen } from "./strings/kitchen";
import { guest } from "./strings/guest";

export type Locale = "sv" | "en";

export interface Entry {
  en: string;
  sv: string;
}

/** Cookie + localStorage key holding the chosen locale. */
export const LOCALE_COOKIE = "menuqr_lang";

/** Fallback when nothing is stored — English, matching the original UI. */
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALES: { code: Locale; label: string; short: string }[] = [
  { code: "sv", label: "Svenska", short: "SV" },
  { code: "en", label: "English", short: "EN" },
];

const strings = {
  ...common,
  ...landing,
  ...auth,
  ...dashboard,
  ...menuBuilder,
  ...tables,
  ...settings,
  ...kitchen,
  ...guest,
} satisfies Record<string, Entry>;

export type TKey = keyof typeof strings;

export function isLocale(value: unknown): value is Locale {
  return value === "sv" || value === "en";
}

/**
 * Resolve a key for a locale, interpolating `{name}` placeholders.
 * Falls back to the English string (and then the key itself) so a missing
 * translation degrades to readable text instead of `undefined`.
 */
export function translate(
  locale: Locale,
  key: TKey,
  vars?: Record<string, string | number>,
): string {
  const entry = strings[key] as Entry | undefined;
  let out = entry?.[locale] || entry?.en || String(key);
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.split(`{${k}}`).join(String(v));
    }
  }
  return out;
}
