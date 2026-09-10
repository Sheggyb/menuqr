"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, translate,
  type Locale, type TKey,
} from ".";
import { isLocale } from ".";

interface I18nValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => translate(DEFAULT_LOCALE, key),
});

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // The server renders from the cookie; if the cookie is absent but the browser
  // language is Swedish, adopt it on mount (hydration-safe: never read
  // localStorage/navigator in the initializer).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(LOCALE_COOKIE);
    if (stored && isLocale(stored)) {
      setLocaleState(stored);
      return;
    }
    if (document.cookie.includes(`${LOCALE_COOKIE}=`)) return;
    const nav = window.navigator.language || "";
    if (nav.toLowerCase().startsWith("sv")) setLocaleState("sv");
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(LOCALE_COOKIE, l);
      // 1 year, lax — read by the server on the next render
      document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    } catch { /* private mode — the in-memory locale still applies */ }
    // Server-rendered text (landing page) needs a re-render with the new cookie
    if (typeof window !== "undefined") window.location.reload();
  }, []);

  const t = useCallback(
    (key: TKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() { return useContext(I18nContext); }

/** Shorthand for components that only need the translator. */
export function useT() { return useContext(I18nContext).t; }

export { LOCALES };
