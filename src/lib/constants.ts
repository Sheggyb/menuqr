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
