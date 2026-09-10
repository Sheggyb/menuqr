import type { Entry } from "..";

// Dashboard surface — the AppShell navigation shell and the Live Orders board.
// Keys are namespaced `dash.*`; shared words (Save/Cancel/All/Today/Done/…)
// live in strings/common.ts and are reused rather than duplicated here.
export const dashboard = {
  // ── Navigation tabs (desktop labels + mobile short labels) ────────────
  "dash.tab.orders": { en: "Live Orders", sv: "Live-ordrar" },
  "dash.tab.menu": { en: "Menu", sv: "Meny" },
  "dash.tab.tables": { en: "Tables", sv: "Bord" },
  "dash.tab.stats": { en: "Stats", sv: "Statistik" },
  "dash.tab.history": { en: "History", sv: "Historik" },
  "dash.tab.settings": { en: "Settings", sv: "Inställningar" },
  "dash.tab.orders.short": { en: "Orders", sv: "Ordrar" },
  "dash.tab.menu.short": { en: "Menu", sv: "Meny" },
  "dash.tab.tables.short": { en: "Tables", sv: "Bord" },
  "dash.tab.stats.short": { en: "Stats", sv: "Statistik" },
  "dash.tab.history.short": { en: "History", sv: "Historik" },
  "dash.tab.settings.short": { en: "Settings", sv: "Inställningar" },

  // ── Header controls ──────────────────────────────────────────────────
  "dash.header.kitchen": { en: "Kitchen", sv: "Kök" },
  "dash.header.kitchenTitle": { en: "Open kitchen display in a new tab", sv: "Öppna köksskärmen i en ny flik" },
  "dash.header.theme.light": { en: "Switch to light mode", sv: "Byt till ljust läge" },
  "dash.header.theme.dark": { en: "Switch to dark mode", sv: "Byt till mörkt läge" },
  "dash.header.signOut": { en: "Sign out", sv: "Logga ut" },

  // ── Landmark labels ──────────────────────────────────────────────────
  "dash.nav.main": { en: "Main navigation", sv: "Huvudnavigering" },
  "dash.nav.mobile": { en: "Mobile navigation", sv: "Mobilnavigering" },

  // ── Panel error boundaries ───────────────────────────────────────────
  "dash.error.orders": { en: "Failed to load orders", sv: "Kunde inte ladda beställningarna" },
  "dash.error.menu": { en: "Failed to load menu", sv: "Kunde inte ladda menyn" },
  "dash.error.tables": { en: "Failed to load tables", sv: "Kunde inte ladda borden" },
  "dash.error.analytics": { en: "Failed to load analytics", sv: "Kunde inte ladda statistiken" },
  "dash.error.history": { en: "Failed to load history", sv: "Kunde inte ladda historiken" },
  "dash.error.settings": { en: "Failed to load settings", sv: "Kunde inte ladda inställningarna" },

  // ── Live Orders — request types (card badge + filter) ────────────────
  "dash.type.waiter": { en: "Waiter", sv: "Kypare" },
  "dash.type.bill": { en: "Bill", sv: "Nota" },
  "dash.type.refill": { en: "Refill", sv: "Påfyllning" },
  "dash.type.order": { en: "Order", sv: "Beställning" },
  "dash.filter.orders": { en: "Orders", sv: "Beställningar" },

  // ── Live Orders — card content ───────────────────────────────────────
  "dash.table.unknown": { en: "Unknown", sv: "Okänt" },
  "dash.item.no": { en: "NO {item}", sv: "UTAN {item}" },
  "dash.item.extra": { en: "EXTRA {item}", sv: "EXTRA {item}" },
  "dash.time.seconds": { en: "{count} sec", sv: "{count} sek" },
  "dash.time.minutes": { en: "{count} min", sv: "{count} min" },
  "dash.time.hours": { en: "{count} hr", sv: "{count} tim" },
  "dash.action.pickUp": { en: "Pick up", sv: "Ta upp" },
  "dash.action.pickUpAria": { en: "Pick up — move to In Progress", sv: "Ta upp — flytta till Tillagas" },
  "dash.action.markDone": { en: "Mark done", sv: "Markera klar" },
  "dash.action.undo": { en: "Move back to New", sv: "Flytta tillbaka till Ny" },
  "dash.action.undoAria": { en: "Undo — move back to New", sv: "Ångra — flytta tillbaka till Ny" },
  "dash.action.markAllDone": { en: "Mark all done", sv: "Markera alla klara" },

  // ── Live Orders — toolbar + stats ────────────────────────────────────
  "dash.searchTable": { en: "Search table...", sv: "Sök bord..." },
  "dash.sound.on": { en: "Sound on", sv: "Ljud på" },
  "dash.sound.off": { en: "Sound off", sv: "Ljud av" },
  "dash.stats.waiting": { en: "Waiting", sv: "Väntar" },

  // ── Live Orders — board sections + empty states ──────────────────────
  "dash.section.new": { en: "New", sv: "Ny" },
  "dash.section.inProgress": { en: "In Progress", sv: "Tillagas" },
  "dash.empty.noMatch": { en: "No matching requests", sv: "Inga matchande beställningar" },
  "dash.empty.noNew": { en: "No new orders", sv: "Inga nya beställningar" },
  "dash.empty.nothingInProgress": { en: "Nothing in progress", sv: "Inget pågår" },

  // ── Live Orders — toasts + confirm ───────────────────────────────────
  "dash.toast.updateFailed": { en: "Could not update the request", sv: "Kunde inte uppdatera beställningen" },
  "dash.toast.markAllPartial": { en: "Some requests could not be updated", sv: "Vissa beställningar kunde inte uppdateras" },
  "dash.toast.markAllDone": { en: "All requests marked done", sv: "Alla beställningar markerade som klara" },
  "dash.confirm.markAllTitle": { en: "Mark all done?", sv: "Markera alla som klara?" },
  "dash.confirm.markAllFiltered": { en: "Mark the {count} shown requests as done? Requests hidden by the current filter are not affected.", sv: "Markera de {count} visade beställningarna som klara? Beställningar som filtret döljer påverkas inte." },
  "dash.confirm.markAllFilteredOne": { en: "Mark the {count} shown request as done? Requests hidden by the current filter are not affected.", sv: "Markera den {count} visade beställningen som klar? Beställningar som filtret döljer påverkas inte." },
  "dash.confirm.markAll": { en: "Mark all {count} as done?", sv: "Markera alla {count} som klara?" },

  // ── Live Orders — tab title + connection warnings ────────────────────
  "dash.title.orders": { en: "Live Orders — MenuQR", sv: "Live-ordrar — MenuQR" },
  "dash.title.ordersCount": { en: "({count}) Live Orders — MenuQR", sv: "({count}) Live-ordrar — MenuQR" },
  "dash.title.default": { en: "MenuQR — Digital Menu & Table Ordering", sv: "MenuQR — Digital meny & bordsbeställning" },
  "dash.conn.stale": { en: "Can't reach the server — showing the last orders received ({seconds}s ago). Retrying every 12s.", sv: "Kan inte nå servern — visar de senaste beställningarna ({seconds} sek sedan). Försöker igen var 12:e sekund." },
  "dash.conn.staleNoTime": { en: "Can't reach the server — showing the last orders received. Retrying every 12s.", sv: "Kan inte nå servern — visar de senaste beställningarna. Försöker igen var 12:e sekund." },
  "dash.conn.realtimeLost": { en: "Live updates interrupted — still refreshing every 12s, but new orders won't play a sound.", sv: "Liveuppdateringar avbrutna — uppdaterar fortfarande var 12:e sekund, men nya beställningar spelar inget ljud." },
} as const satisfies Record<string, Entry>;
