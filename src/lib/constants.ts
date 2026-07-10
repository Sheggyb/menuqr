// Shared UI constants for the dashboard.

export const TYPE_LABEL: Record<string, string> = {
  waiter: "🙋 Waiter",
  bill: "💳 Bill",
  refill: "🔄 Refill",
  item_request: "🍽️ Order",
};

export const CURRENCIES: Record<string, string> = {
  SEK: "kr", USD: "$", EUR: "€", GBP: "£", NOK: "kr", DKK: "kr", CHF: "CHF", JPY: "¥", AUD: "$", CAD: "$",
};

export function currencySymbol(code: string): string {
  return CURRENCIES[code] ?? code;
}
