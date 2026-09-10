import type { Entry } from "..";

/**
 * Guest menu surface — the QR-code ordering page a restaurant's customer opens
 * on their phone. NONE of the restaurant's own data (name, dish names,
 * descriptions, notes) appears here: only the app's own chrome.
 */
export const guest = {
  "guest.menu": { en: "Menu", sv: "Meny" },

  // ── Header ────────────────────────────────────────────────────────────
  "guest.header.logoAlt": { en: "{name} logo", sv: "{name} logotyp" },

  // ── Session gate (request access / waiting for staff) ─────────────────
  "guest.gate.welcome": {
    en: "Welcome. Tap below to request access to the menu.",
    sv: "Välkommen. Tryck nedan för att begära åtkomst till menyn.",
  },
  "guest.gate.declinedMsg": {
    en: "Your session was declined. Tap below to request again.",
    sv: "Din session avslogs. Tryck nedan för att begära igen.",
  },
  "guest.gate.requestAccess": { en: "Request Menu Access", sv: "Begär menyåtkomst" },
  "guest.gate.requestAgain": { en: "Request Again", sv: "Begär igen" },
  "guest.gate.waitingTitle": { en: "Waiting for staff", sv: "Väntar på personal" },
  "guest.gate.waitingBody": {
    en: "A staff member will approve your access in a moment. Please wait.",
    sv: "En i personalen godkänner din åtkomst inom kort. Vänta kvar.",
  },

  // ── Table closed ──────────────────────────────────────────────────────
  "guest.closed.title": { en: "We're closed", sv: "Vi har stängt" },
  "guest.closed.body": {
    en: "This table is currently not taking orders. Please ask a staff member for assistance.",
    sv: "Detta bord tar för närvarande inte emot beställningar. Fråga en i personalen om hjälp.",
  },

  // ── Order-ready popup ─────────────────────────────────────────────────
  "guest.ready.titleOne": { en: "Your order is ready", sv: "Din beställning är klar" },
  "guest.ready.titleMany": { en: "Orders are ready", sv: "Beställningarna är klara" },
  "guest.ready.isReadySuffix": { en: "is ready to collect.", sv: "är klar att hämta." },
  "guest.ready.and": { en: "and", sv: "och" },
  "guest.ready.areReadySuffix": { en: "are ready.", sv: "är klara." },
  "guest.ready.gotIt": { en: "Got it", sv: "Uppfattat" },

  // ── Quick actions ─────────────────────────────────────────────────────
  "guest.quick.title": { en: "Quick actions", sv: "Snabbval" },
  "guest.quick.waiter": { en: "Call Waiter", sv: "Kalla på personal" },
  "guest.quick.bill": { en: "Request Bill", sv: "Be om notan" },
  "guest.quick.refill": { en: "Refill Drinks", sv: "Påfyllning" },
  "guest.quick.waiterDone": { en: "Waiter notified", sv: "Personal tillkallad" },
  "guest.quick.billDone": { en: "Bill requested", sv: "Nota begärd" },
  "guest.quick.refillDone": { en: "Refill requested", sv: "Påfyllning begärd" },

  // ── Search ────────────────────────────────────────────────────────────
  "guest.search.placeholder": { en: "Search the menu…", sv: "Sök i menyn…" },
  "guest.search.label": { en: "Search the menu", sv: "Sök i menyn" },
  "guest.search.none": { en: "Nothing matches “{query}”", sv: "Inget matchar “{query}”" },
  "guest.search.oneMatch": { en: "{count} match for “{query}”", sv: "{count} träff för “{query}”" },
  "guest.search.matches": { en: "{count} matches for “{query}”", sv: "{count} träffar för “{query}”" },

  // ── Allergen filter ───────────────────────────────────────────────────
  "guest.allergen.filterOpen": { en: "Any allergies?", sv: "Några allergier?" },
  "guest.allergen.filterSummary": {
    en: "Showing {shown} of {total} dishes",
    sv: "Visar {shown} av {total} rätter",
  },
  "guest.allergen.hint": {
    en: "Tap what you can't eat — we'll show you the rest.",
    sv: "Tryck på det du inte kan äta — vi visar resten.",
  },
  "guest.allergen.warn": {
    en: "Always tell your server about allergies.",
    sv: "Berätta alltid om allergier för din servitör.",
  },
  "guest.allergen.showAll": { en: "Show everything again", sv: "Visa allt igen" },

  // The 14 allergens of EU 1169/2011 Annex II, keyed by the ids in
  // lib/constants (EU_ALLERGENS). The constant only carries English labels, so
  // the guest-facing names live here — the guest must be able to read their own
  // allergen in their own language.
  "guest.allergen.gluten": { en: "Cereals containing gluten", sv: "Spannmål som innehåller gluten" },
  "guest.allergen.crustaceans": { en: "Crustaceans", sv: "Kräftdjur" },
  "guest.allergen.eggs": { en: "Eggs", sv: "Ägg" },
  "guest.allergen.fish": { en: "Fish", sv: "Fisk" },
  "guest.allergen.peanuts": { en: "Peanuts", sv: "Jordnötter" },
  "guest.allergen.soybeans": { en: "Soybeans", sv: "Sojabönor" },
  "guest.allergen.milk": { en: "Milk", sv: "Mjölk" },
  "guest.allergen.nuts": { en: "Tree nuts", sv: "Nötter" },
  "guest.allergen.celery": { en: "Celery", sv: "Selleri" },
  "guest.allergen.mustard": { en: "Mustard", sv: "Senap" },
  "guest.allergen.sesame": { en: "Sesame", sv: "Sesamfrön" },
  "guest.allergen.sulphites": { en: "Sulphur dioxide / sulphites", sv: "Svaveldioxid och sulfiter" },
  "guest.allergen.lupin": { en: "Lupin", sv: "Lupin" },
  "guest.allergen.molluscs": { en: "Molluscs", sv: "Blötdjur" },

  // ── Menu listing ──────────────────────────────────────────────────────
  "guest.categories.label": { en: "Menu categories", sv: "Menykategorier" },
  "guest.items.label": { en: "Menu items", sv: "Menyrätter" },
  "guest.items.empty": { en: "No items in this category.", sv: "Inga rätter i denna kategori." },
  "guest.item.add": { en: "Add", sv: "Lägg till" },
  "guest.item.addAria": { en: "Add {name} to order", sv: "Lägg till {name} i beställningen" },
  "guest.empty.title": { en: "Menu coming soon", sv: "Menyn kommer snart" },
  "guest.empty.body": {
    en: "The restaurant is still setting up their menu. Please ask your server.",
    sv: "Restaurangen ställer fortfarande i ordning sin meny. Fråga din servitör.",
  },

  // ── Cart / "Your Order" sheet ─────────────────────────────────────────
  "guest.cart.view": { en: "View Order", sv: "Visa beställning" },
  "guest.cart.title": { en: "Your Order", sv: "Din beställning" },
  "guest.cart.closeAria": { en: "Close order", sv: "Stäng beställningen" },
  "guest.cart.removeAria": {
    en: "Remove {name} from order",
    sv: "Ta bort {name} från beställningen",
  },
  "guest.cart.total": { en: "Total", sv: "Totalt" },
  "guest.cart.sending": { en: "Sending...", sv: "Skickar..." },
  "guest.cart.payAndOrder": { en: "Pay & order · {total}", sv: "Betala och beställ · {total}" },
  "guest.cart.sendOrderOne": { en: "Send Order (1 item)", sv: "Skicka beställning (1 vara)" },
  "guest.cart.sendOrder": { en: "Send Order ({count} items)", sv: "Skicka beställning ({count} varor)" },

  // ── Add-to-order sheet ────────────────────────────────────────────────
  "guest.sheet.qty": { en: "Qty:", sv: "Antal:" },
  "guest.sheet.decrease": { en: "Decrease quantity", sv: "Minska antalet" },
  "guest.sheet.increase": { en: "Increase quantity", sv: "Öka antalet" },
  "guest.sheet.contains": { en: "Contains", sv: "Innehåller" },
  "guest.sheet.required": { en: "Required", sv: "Krävs" },
  "guest.sheet.ingredientHint": {
    en: "— tap to remove, tap again for extra",
    sv: "— tryck för att ta bort, tryck igen för extra",
  },
  "guest.sheet.notePlaceholder": {
    en: "Special request? (e.g. no onions)",
    sv: "Särskilda önskemål? (t.ex. utan lök)",
  },
  "guest.sheet.add": { en: "Add to order", sv: "Lägg till i beställningen" },
  "guest.ingredient.included": { en: "included", sv: "ingår" },
  "guest.ingredient.removed": { en: "removed", sv: "borttagen" },
  "guest.ingredient.extra": { en: "extra", sv: "extra" },

  // ── My Bill panel ─────────────────────────────────────────────────────
  "guest.bill.title": { en: "My Bill", sv: "Min nota" },
  "guest.bill.onTheWay": { en: "{count} on the way", sv: "{count} på väg" },
  "guest.bill.sectionOnTheWay": { en: "On the way", sv: "På väg" },
  "guest.bill.preparing": { en: "Preparing", sv: "Tillagas" },
  "guest.bill.pending": { en: "Pending", sv: "Väntar" },
  "guest.bill.delivered": { en: "Delivered", sv: "Levererad" },
  "guest.bill.myTotal": { en: "My Total", sv: "Min totalsumma" },

  // ── Misc chrome ───────────────────────────────────────────────────────
  "guest.backToTop": { en: "Back to top", sv: "Till toppen" },

  // ── Toasts ────────────────────────────────────────────────────────────
  "guest.toast.tableClosed": { en: "Table is closed", sv: "Bordet är stängt" },
  "guest.toast.tooMany": {
    en: "Too many requests — try again in a moment",
    sv: "För många förfrågningar — försök igen om en stund",
  },
  "guest.toast.unreachable": {
    en: "Could not reach the restaurant — please try again",
    sv: "Kunde inte nå restaurangen — försök igen",
  },
  "guest.toast.sessionNotApproved": { en: "Session not approved", sv: "Sessionen är inte godkänd" },
  "guest.toast.sessionExpired": {
    en: "Session expired, please request again",
    sv: "Sessionen har gått ut, begär igen",
  },
  "guest.toast.genericError": {
    en: "Something went wrong — please try again",
    sv: "Något gick fel — försök igen",
  },
  "guest.toast.orderSent": { en: "Order sent", sv: "Tack! Din beställning är skickad" },
  "guest.toast.paymentsNotConfigured": {
    en: "Payments are not set up on this menu yet — please ask staff",
    sv: "Betalningar är inte aktiverade på den här menyn än — fråga personalen",
  },
  "guest.toast.itemSoldOut": {
    en: "{name} just sold out — please remove it",
    sv: "{name} tog just slut — ta bort den",
  },
  "guest.toast.optionSoldOut": {
    en: "\"{name}\" just sold out — please edit your order",
    sv: "\"{name}\" tog just slut — ändra din beställning",
  },
  "guest.toast.chooseOption": { en: "Please choose: {name}", sv: "Välj: {name}" },
  "guest.toast.anItem": { en: "An item", sv: "En rätt" },
  "guest.toast.anOption": { en: "An option", sv: "Ett alternativ" },
  "guest.toast.aRequiredOption": { en: "a required option", sv: "ett obligatoriskt val" },
  "guest.toast.menuUpdated": {
    en: "The menu was updated — please reload and reorder",
    sv: "Menyn uppdaterades — ladda om sidan och beställ igen",
  },
  "guest.toast.added": { en: "Added to order", sv: "Tillagd i beställningen" },

  // ── Stripe return ─────────────────────────────────────────────────────
  "guest.pay.cancelled": {
    en: "Payment cancelled — nothing was ordered",
    sv: "Betalningen avbröts — inget beställdes",
  },
  "guest.pay.confirmed": {
    en: "Payment confirmed — the kitchen is on it",
    sv: "Betalningen bekräftad — köket tar hand om det",
  },
  "guest.pay.notCompleted": {
    en: "Payment not completed — order cancelled",
    sv: "Betalningen slutfördes inte — beställningen avbröts",
  },
} as const satisfies Record<string, Entry>;
