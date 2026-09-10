import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE, LOCALE_COOKIE, translate, isLocale,
  type Locale, type TKey,
} from ".";

/** First language tag from an Accept-Language header, e.g. "sv-SE,sv;q=0.9" → "sv". */
function fromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  const first = header.split(",")[0]?.trim().toLowerCase() ?? "";
  if (first.startsWith("sv")) return "sv";
  if (first.startsWith("en")) return "en";
  return null;
}

/**
 * The active locale on the server: explicit cookie first, then the browser's
 * Accept-Language, then English.
 */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;
  const headerStore = await headers();
  return fromAcceptLanguage(headerStore.get("accept-language")) ?? DEFAULT_LOCALE;
}

/** Server-component translator: `const { locale, t } = await getT();` */
export async function getT(): Promise<{
  locale: Locale;
  t: (key: TKey, vars?: Record<string, string | number>) => string;
}> {
  const locale = await getLocale();
  return { locale, t: (key, vars) => translate(locale, key, vars) };
}
