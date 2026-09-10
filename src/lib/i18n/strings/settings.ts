import type { Entry } from "..";

// Settings panel — the tabbed restaurant settings surface
// (General / Guest menu / Payments / Danger zone).
export const settings = {
  "settings.title": { en: "Settings", sv: "Inställningar" },
  "settings.subtitle": { en: "{name} · changes save automatically", sv: "{name} · ändringar sparas automatiskt" },
  "settings.tabs.aria": { en: "Settings sections", sv: "Avsnitt i inställningarna" },

  // ── Tabs ──────────────────────────────────────────────────────────────
  "settings.tab.general": { en: "General", sv: "Allmänt" },
  "settings.tab.menu": { en: "Guest menu", sv: "Gästmeny" },
  "settings.tab.payments": { en: "Payments", sv: "Betalningar" },
  "settings.tab.danger": { en: "Danger zone", sv: "Riskzon" },

  // ── Identity ──────────────────────────────────────────────────────────
  "settings.identity.title": { en: "Identity", sv: "Identitet" },
  "settings.identity.desc": { en: "How your restaurant appears to guests and staff.", sv: "Så här visas din restaurang för gäster och personal." },
  "settings.field.name": { en: "Restaurant name", sv: "Restaurangnamn" },
  "settings.field.logoUrl": { en: "Logo URL", sv: "Logotyp-URL" },
  "settings.logo.alt": { en: "Logo preview", sv: "Logotypförhandsvisning" },
  "settings.logo.error": { en: "Couldn't load that image — check the URL", sv: "Kunde inte ladda bilden — kontrollera adressen" },
  "settings.logo.hint": { en: "Shown in the guest menu header and the dashboard header.", sv: "Visas i gästmenyns sidhuvud och i dashboardens sidhuvud." },

  // ── Brand colour ──────────────────────────────────────────────────────
  "settings.brand.title": { en: "Brand colour", sv: "Färg" },
  "settings.brand.desc": { en: "Used across the guest menu, buttons and highlights.", sv: "Används i gästmenyn, på knappar och i markeringar." },
  "settings.brand.usePreset": { en: "Use {color}", sv: "Använd {color}" },

  // ── Save controls ─────────────────────────────────────────────────────
  "settings.btn.saveNow": { en: "Save now", sv: "Spara ändringar" },
  "settings.autosave.hint": { en: "Changes also save when you click away.", sv: "Ändringarna sparas även när du klickar utanför." },

  // ── Service style ─────────────────────────────────────────────────────
  "settings.service.title": { en: "Service style", sv: "Servering" },
  "settings.service.desc": { en: "Controls which features your guests see.", sv: "Styr vilka funktioner dina gäster ser." },
  "settings.venue.table.label": { en: "Table service", sv: "Servering" },
  "settings.venue.table.desc": { en: "Sit-down — guests order at the table", sv: "Servering vid bordet — gästerna beställer vid bordet" },
  "settings.venue.cafe.label": { en: "Café / counter", sv: "Kafé" },
  "settings.venue.cafe.desc": { en: "Order at counter, notified when ready", sv: "Beställ i disken, aviseras när det är klart" },
  "settings.venue.takeaway.label": { en: "Takeaway / pickup", sv: "Take away" },
  "settings.venue.takeaway.desc": { en: "Order ahead, kitchen notifies", sv: "Beställ i förväg, köket aviserar" },

  // ── Quick actions ─────────────────────────────────────────────────────
  "settings.quick.title": { en: "Quick actions", sv: "Snabbval" },
  "settings.quick.desc": { en: "Buttons guests can tap at the table.", sv: "Knappar som gästerna kan trycka på vid bordet." },
  "settings.action.waiter.label": { en: "Call waiter", sv: "Kalla på personal" },
  "settings.action.waiter.desc": { en: "Guest can call a staff member to the table", sv: "Gästen kan kalla på personal till bordet" },
  "settings.action.bill.label": { en: "Request bill", sv: "Be om notan" },
  "settings.action.bill.desc": { en: "Guest can request the bill at the table", sv: "Gästen kan be om notan vid bordet" },
  "settings.action.refill.label": { en: "Refill drinks", sv: "Påfyllning" },
  "settings.action.refill.desc": { en: "Guest can request a drink refill", sv: "Gästen kan be om påfyllning av dryck" },

  // ── Menu display ──────────────────────────────────────────────────────
  "settings.menuDisplay.title": { en: "Menu display", sv: "Menyvisning" },
  "settings.field.currency": { en: "Currency", sv: "Valuta" },
  "settings.currency.hint": { en: "Prices are formatted for this currency's locale — 89,50 kr or $89.50.", sv: "Priserna formateras enligt valutans språk — 89,50 kr eller $89.50." },

  // ── Sound alerts ──────────────────────────────────────────────────────
  "settings.sound.title": { en: "Sound alerts", sv: "Ljudaviseringar" },
  "settings.sound.desc": { en: "Play a ping when a new order arrives. Stored per browser.", sv: "Spela en ping när en ny beställning kommer in. Sparas per webbläsare." },
  "settings.sound.test": { en: "Test", sv: "Testa" },
  "settings.sound.disable": { en: "Disable sound", sv: "Stäng av ljud" },
  "settings.sound.enable": { en: "Enable sound", sv: "Slå på ljud" },

  // ── Shortcuts ─────────────────────────────────────────────────────────
  "settings.shortcuts.title": { en: "Shortcuts", sv: "Genvägar" },
  "settings.shortcuts.kitchen": { en: "Open kitchen screen", sv: "Öppna köksskärm" },
  "settings.shortcuts.tablesHint": { en: "Tables and QR codes live in the Tables tab.", sv: "Bord och QR-koder finns i fliken Bord." },

  // ── Payments ──────────────────────────────────────────────────────────
  "settings.payments.title": { en: "Payments at the table", sv: "Betalning vid bordet" },
  "settings.payments.desc": { en: "Guests pay by card from their phone before the order is sent.", sv: "Gästerna betalar med kort i mobilen innan beställningen skickas." },
  "settings.payments.accept": { en: "Accept card payments", sv: "Ta emot kortbetalning" },
  "settings.payments.on": { en: "On — orders only reach the kitchen once the payment has gone through.", sv: "På — beställningar når köket först när betalningen har gått igenom." },
  "settings.payments.off": { en: "Off — guests order as usual and pay you however you already take payment.", sv: "Av — gästerna beställer som vanligt och betalar på det sätt ni redan tar betalt." },
  "settings.payments.unavailable": { en: "Unavailable — no payment provider is configured on this deployment yet.", sv: "Inte tillgängligt — ingen betalningsleverantör är konfigurerad för den här driftsättningen ännu." },
  "settings.payments.statusOn": { en: "On", sv: "På" },
  "settings.payments.statusOff": { en: "Off", sv: "Av" },
  "settings.payments.disable": { en: "Disable payments", sv: "Stäng av betalningar" },
  "settings.payments.enable": { en: "Enable payments", sv: "Slå på betalningar" },

  // ── How it works ──────────────────────────────────────────────────────
  "settings.how.title": { en: "How it works", sv: "Så fungerar det" },
  "settings.how.desc": { en: "The pre-pay gate keeps unpaid food off the pass.", sv: "Förbetalningen håller obetald mat borta från passet." },
  "settings.how.step1": { en: "Guest fills their cart and taps Pay & order.", sv: "Gästen fyller sin korg och trycker på Betala och beställ." },
  "settings.how.step2": { en: "The server prices the order from your menu — never from the phone.", sv: "Servern prisar beställningen utifrån din meny — aldrig från mobilen." },
  "settings.how.step3": { en: "The guest pays on the card page (test mode uses 4242 4242 4242 4242).", sv: "Gästen betalar på kortsidan (testläget använder 4242 4242 4242 4242)." },
  "settings.how.step4": { en: "Only after the payment confirms does the ticket appear on Live Orders and the kitchen screen.", sv: "Först när betalningen är bekräftad dyker biljetten upp i Live-ordrar och på köksskärmen." },
  "settings.how.footnote": { en: "Abandoned checkouts are removed automatically — they never reach the kitchen and never count in your stats.", sv: "Övergivna kassor tas bort automatiskt — de når aldrig köket och räknas aldrig i din statistik." },

  // ── Fees ──────────────────────────────────────────────────────────────
  "settings.fees.title": { en: "Fees", sv: "Avgifter" },
  "settings.fees.desc": { en: "You keep the order value; MenuQR charges a small fee per paid order.", sv: "Du behåller ordervärdet; MenuQR tar en liten avgift per betald beställning." },
  "settings.fees.body": { en: "No monthly subscription. Card processing fees are set by the payment provider on top of the per-order fee.", sv: "Ingen månadsavgift. Kortavgifterna sätts av betalningsleverantören utöver avgiften per beställning." },
  "settings.fees.providerHint": { en: "Payments will appear here as soon as the provider keys are added.", sv: "Betalningar visas här så snart leverantörens nycklar har lagts till." },

  // ── Danger zone ───────────────────────────────────────────────────────
  "settings.danger.title": { en: "Delete restaurant", sv: "Ta bort restaurang" },
  "settings.danger.desc": { en: "Permanently removes {name} and all of its data.", sv: "Tar bort {name} och all dess data permanent." },
  "settings.danger.delete": { en: "Delete this restaurant", sv: "Ta bort restaurang" },
  "settings.danger.warning": { en: "Removes tables, menu, orders and history. This cannot be undone.", sv: "Tar bort bord, meny, beställningar och historik. Detta kan inte ångras." },
  "settings.danger.cannotUndo": { en: "This cannot be undone", sv: "Detta kan inte ångras" },
  "settings.danger.confirmBefore": { en: "Deleting ", sv: "Om du tar bort " },
  "settings.danger.confirmAfter": { en: " also removes every table, menu item and past order.", sv: " försvinner även alla bord, menyobjekt och tidigare beställningar." },
  "settings.danger.typeBefore": { en: "Type ", sv: "Skriv " },
  "settings.danger.typeAfter": { en: " to confirm:", sv: " för att bekräfta:" },
  "settings.danger.confirmButton": { en: "Yes, delete everything", sv: "Ja, ta bort allt" },
  "settings.danger.deleting": { en: "Deleting...", sv: "Tar bort..." },

  // ── Errors + toasts ───────────────────────────────────────────────────
  "settings.error.nameEmpty": { en: "Restaurant name can't be empty", sv: "Restaurangnamnet får inte vara tomt" },
  "settings.error.accent": { en: "Enter a valid hex color, e.g. #E85D2F", sv: "Ange en giltig hexfärg, t.ex. #E85D2F" },
  "settings.error.accentToast": { en: "Invalid accent color — not saved", sv: "Ogiltig accentfärg — sparades inte" },
  "settings.error.logoToast": { en: "Logo URL must start with http:// or https:// — not saved", sv: "Logotyp-URL måste börja med http:// eller https:// — sparades inte" },
  "settings.error.save": { en: "Could not save changes", sv: "Kunde inte spara ändringarna" },
  "settings.error.deleteMismatch": { en: "Restaurant name does not match.", sv: "Restaurangnamnet stämmer inte." },
} as const satisfies Record<string, Entry>;
