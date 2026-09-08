// Shared UI constants for the dashboard.

// Request types. The label is text only — the icon is chosen by the consumer
// from components/icons.tsx. Previously these were "<emoji> Name" strings and
// two files did `label.split(" ").slice(1)` to peel the emoji back off.
export const TYPE_LABEL: Record<string, string> = {
  waiter: "Waiter",
  bill: "Bill",
  refill: "Refill",
  item_request: "Order",
};


export const CURRENCIES: Record<string, string> = {
  SEK: "kr", USD: "$", EUR: "€", GBP: "£", NOK: "kr", DKK: "kr", CHF: "CHF", JPY: "¥", AUD: "$", CAD: "$",
};

export function currencySymbol(code: string): string {
  return CURRENCIES[code] ?? code;
}

/**
 * Locale used to render money for each supported currency.
 *
 * Derived from the RESTAURANT's currency, deliberately not from the guest's
 * browser. Two reasons:
 *
 *  1. The guest menu is server-rendered. A locale read from `navigator` differs
 *     between the server render and the client render, which is a React
 *     hydration mismatch. An explicit locale is deterministic on both.
 *  2. A price should read the same on the printed menu, the guest's phone and
 *     the staff board. A German tourist in Stockholm should see "89,50 kr",
 *     the same as everyone else in the room.
 *
 * EUR maps to de-DE: every eurozone country except Ireland and Malta uses a
 * decimal comma with the symbol trailing, so that is the majority form.
 */
const CURRENCY_LOCALE: Record<string, string> = {
  SEK: "sv-SE", NOK: "nb-NO", DKK: "da-DK", EUR: "de-DE", USD: "en-US",
  GBP: "en-GB", CHF: "de-CH", JPY: "ja-JP", AUD: "en-AU", CAD: "en-CA",
};

// Constructing an Intl.NumberFormat is not cheap and the guest menu formats a
// price per item on every render, so keep the formatters around.
const moneyFormatters = new Map<string, Intl.NumberFormat>();

/**
 * Format an amount as money in the restaurant's currency.
 *
 * Returns the complete string INCLUDING the symbol, because symbol placement is
 * part of the locale: "89,50 kr" but "$89.50". The old code hardcoded
 * `{amount} {symbol}`, which is right for SEK and wrong for every currency that
 * leads with its symbol.
 *
 * Whole amounts drop the decimals — "89 kr", the way menus are actually
 * written. Anything else shows exactly two. Letting Intl choose 0-2 digits
 * renders 89.5 as "89,5 kr", which is not a price.
 */
export function formatMoney(amount: number, code: string): string {
  const digits = Number.isInteger(amount) ? 0 : 2;
  const key = `${code}|${digits}`;
  let fmt = moneyFormatters.get(key);
  if (!fmt) {
    try {
      fmt = new Intl.NumberFormat(CURRENCY_LOCALE[code] ?? "en-US", {
        style: "currency",
        currency: code,
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
    } catch {
      // restaurants.currency is unconstrained text in the schema, and Intl
      // throws RangeError on a code it doesn't know. Never blank out a price.
      return `${amount.toFixed(digits)} ${currencySymbol(code)}`;
    }
    moneyFormatters.set(key, fmt);
  }
  return fmt.format(amount);
}

/**
 * Parse a price a human typed. Three outcomes, deliberately distinct:
 *   number    — a valid price
 *   null      — the field was left empty (clear the price)
 *   undefined — not a number; the caller must REJECT rather than store it
 *
 * That third case matters. `parseFloat("1o")` is NaN, and `JSON.stringify` turns
 * NaN into `null`, so a typo used to silently wipe an item's price instead of
 * failing — the option editor already guarded against this, the item fields did
 * not.
 *
 * Accepts the Swedish decimal comma: "89,50" is what a Swedish restaurant
 * actually types, and bare `parseFloat` reads it as 89 and drops the öre. Also
 * strips spaces, including the non-breaking and narrow no-break spaces used as
 * a thousands separator ("1 299").
 *
 * `allowNegative` is for option price deltas, where "− 5 kr" is legitimate.
 * Menu item prices are never negative.
 */
export function parsePrice(
  raw: string,
  { allowNegative = false }: { allowNegative?: boolean } = {}
): number | null | undefined {
  // JS \s already covers U+00A0 and U+202F, so "1 299" is handled in all three
  // space characters without putting invisible literals in the source.
  // U+2212 is the minus the option editor itself renders ("− 5 kr"), so a value
  // copied out of the UI and pasted back has to parse.
  const s = raw.replace(/\s/g, "").replace("−", "-").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return undefined;
  if (!allowNegative && n < 0) return undefined;
  // numeric(10,2) in the schema — round here so what's stored is what's shown
  return Math.round(n * 100) / 100;
}

// The 14 allergens in Annex II of EU Regulation 1169/2011. Restaurants must make
// this information available at the point the guest chooses, so it is a fixed
// list rather than free text: consistent across restaurants, and translatable.
export const EU_ALLERGENS: { id: string; label: string }[] = [
  { id: "gluten", label: "Cereals containing gluten" },
  { id: "crustaceans", label: "Crustaceans" },
  { id: "eggs", label: "Eggs" },
  { id: "fish", label: "Fish" },
  { id: "peanuts", label: "Peanuts" },
  { id: "soybeans", label: "Soybeans" },
  { id: "milk", label: "Milk" },
  { id: "nuts", label: "Tree nuts" },
  { id: "celery", label: "Celery" },
  { id: "mustard", label: "Mustard" },
  { id: "sesame", label: "Sesame" },
  { id: "sulphites", label: "Sulphur dioxide / sulphites" },
  { id: "lupin", label: "Lupin" },
  { id: "molluscs", label: "Molluscs" },
];

export const ALLERGEN_LABEL: Record<string, string> = Object.fromEntries(
  EU_ALLERGENS.map(a => [a.id, a.label])
);

/** Allergen groups store the allergen id in `label`; fall back to the raw value. */
export function allergenLabel(value: string): string {
  return ALLERGEN_LABEL[value] ?? value;
}

// MenuQR's default brand orange. Also the fallback when a restaurant has no
// accent_color yet, and the seed value on restaurant creation. Kept here so the
// hex lives in one place instead of four (globals.css --accent mirrors it for
// CSS; static metadata like themeColor and the OG image can't read a CSS var).
export const DEFAULT_ACCENT = "#E85D2F";
