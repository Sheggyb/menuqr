import type { Entry } from "..";

/** Shared words used across more than one surface (buttons, table words, …). */
export const common = {
  "common.save": { en: "Save", sv: "Spara" },
  "common.saving": { en: "Saving…", sv: "Sparar…" },
  "common.saved": { en: "Saved", sv: "Sparat" },
  "common.cancel": { en: "Cancel", sv: "Avbryt" },
  "common.delete": { en: "Delete", sv: "Ta bort" },
  "common.remove": { en: "Remove", sv: "Ta bort" },
  "common.close": { en: "Close", sv: "Stäng" },
  "common.back": { en: "Back", sv: "Tillbaka" },
  "common.next": { en: "Next", sv: "Nästa" },
  "common.done": { en: "Done", sv: "Klar" },
  "common.search": { en: "Search", sv: "Sök" },
  "common.loading": { en: "Loading…", sv: "Laddar…" },
  "common.today": { en: "Today", sv: "Idag" },
  "common.all": { en: "All", sv: "Alla" },
  "common.yes": { en: "Yes", sv: "Ja" },
  "common.no": { en: "No", sv: "Nej" },
  "common.retry": { en: "Try again", sv: "Försök igen" },
  "common.copied": { en: "Copied", sv: "Kopierat" },
  "common.language": { en: "Language", sv: "Språk" },
  "common.switchToSwedish": { en: "Switch to Swedish", sv: "Byt till svenska" },
  "common.switchToEnglish": { en: "Switch to English", sv: "Byt till engelska" },

  // ── EU 1169/2011 Annex II allergens (shared by the guest menu and the
  //    Menu Builder picker — see lib/i18n/allergens.ts) ───────────────────
  "allergen.gluten": { en: "Cereals containing gluten", sv: "Spannmål som innehåller gluten" },
  "allergen.crustaceans": { en: "Crustaceans", sv: "Kräftdjur" },
  "allergen.eggs": { en: "Eggs", sv: "Ägg" },
  "allergen.fish": { en: "Fish", sv: "Fisk" },
  "allergen.peanuts": { en: "Peanuts", sv: "Jordnötter" },
  "allergen.soybeans": { en: "Soybeans", sv: "Soja" },
  "allergen.milk": { en: "Milk", sv: "Mjölk" },
  "allergen.nuts": { en: "Tree nuts", sv: "Nötter" },
  "allergen.celery": { en: "Celery", sv: "Selleri" },
  "allergen.mustard": { en: "Mustard", sv: "Senap" },
  "allergen.sesame": { en: "Sesame", sv: "Sesam" },
  "allergen.sulphites": { en: "Sulphur dioxide / sulphites", sv: "Svaveldioxid/sulfiter" },
  "allergen.lupin": { en: "Lupin", sv: "Lupin" },
  "allergen.molluscs": { en: "Molluscs", sv: "Blötdjur" },

  // ── Site-wide metadata (browser tab, search results, link previews) ─────
  "meta.title": { en: "MenuQR — QR code menus & live table orders", sv: "MenuQR — QR-menyer och live-beställningar vid bordet" },
  "meta.description": {
    en: "Give every table a QR code. Guests scan, browse your menu with EU allergen labelling, order and pay from the phone — orders arrive live on your dashboard and kitchen screen.",
    sv: "Ge varje bord en QR-kod. Gästerna skannar, bläddrar i menyn med EU-allergenmärkning, beställer och betalar från mobilen — beställningarna kommer live till din dashboard och köksskärm.",
  },
  "meta.ogDescription": {
    en: "Give every table a QR code. Guests scan, browse your allergen-labelled menu, and order with a tap — orders arrive live on your dashboard.",
    sv: "Ge varje bord en QR-kod. Gästerna skannar, bläddrar i din allergenmärkta meny och beställer med ett tryck — beställningarna kommer live till din dashboard.",
  },
  "meta.twitterDescription": {
    en: "QR menus with EU allergen labelling and live table ordering. Guests scan, browse and order with a tap.",
    sv: "QR-menyer med EU-allergenmärkning och live-beställning vid bordet. Gästerna skannar, bläddrar och beställer med ett tryck.",
  },
} as const satisfies Record<string, Entry>;
