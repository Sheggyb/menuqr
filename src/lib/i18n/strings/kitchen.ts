import type { Entry } from "..";

// Kitchen Display kiosk — the full-screen board kitchen staff work from.
export const kitchen = {
  "kitchen.title": { en: "Kitchen", sv: "Kök" },
  "kitchen.meta.title": { en: "Kitchen Display", sv: "Köksdisplay" },
  "kitchen.error.title": { en: "Failed to load kitchen", sv: "Kunde inte ladda köket" },

  // Column headers + empty states
  "kitchen.column.new": { en: "New", sv: "Ny" },
  "kitchen.column.cooking": { en: "Cooking", sv: "Tillagas" },
  "kitchen.empty.new": { en: "No new orders", sv: "Inga nya beställningar" },
  "kitchen.empty.cooking": { en: "Nothing on the pass", sv: "Inget på passet" },

  // Filter chips
  "kitchen.filter.food": { en: "Food", sv: "Mat" },
  "kitchen.filter.refills": { en: "Refills", sv: "Påfyllning" },

  // Ticket actions (label + tooltip/aria-label)
  "kitchen.btn.start": { en: "Start", sv: "Starta" },
  "kitchen.btn.startAria": { en: "Start preparing", sv: "Börja tillaga" },
  "kitchen.btn.doneAria": { en: "Mark done", sv: "Markera klar" },
  "kitchen.btn.backAria": { en: "Move back to New", sv: "Flytta tillbaka till Ny" },

  // Ticket lines — removals shout because they are the riskiest part of a ticket
  "kitchen.line.no": { en: "NO {item}", sv: "UTAN {item}" },
  "kitchen.line.extra": { en: "EXTRA {item}", sv: "EXTRA {item}" },
  "kitchen.table.unknown": { en: "Unknown", sv: "Okänd" },

  // Header controls
  "kitchen.sound.on": { en: "Sound on", sv: "Ljud på" },
  "kitchen.sound.off": { en: "Sound off", sv: "Ljud av" },

  // Connection warnings — an empty board and a broken board must not look alike
  "kitchen.warn.offline": { en: "Can't reach the server — these tickets may be out of date. Retrying every 12s.", sv: "Kan inte nå servern — biljetterna kan vara inaktuella. Försöker igen var 12:e sekund." },
  "kitchen.warn.realtime": { en: "Live updates interrupted — refreshing every 12s, no sound on new orders.", sv: "Live-uppdateringarna avbröts — uppdaterar var 12:e sekund, inget ljud vid nya beställningar." },

  // Stats bar + live-freshness indicator
  "kitchen.stats.waiting": { en: "Waiting", sv: "Väntar" },
  "kitchen.live.live": { en: "Live", sv: "Live" },
  "kitchen.live.polling": { en: "Polling", sv: "Polling" },
  "kitchen.live.updatedAgo": { en: "updated {n}s ago", sv: "uppdaterad för {n}s sedan" },
  "kitchen.live.offlineAgo": { en: "Offline · last update {n}s ago", sv: "Offline · senast uppdaterad för {n}s sedan" },
  "kitchen.live.offlineUnknown": { en: "Offline · last update unknown", sv: "Offline · senaste uppdatering okänd" },
  "kitchen.shortcuts": { en: "P = start · D = done", sv: "P = starta · D = klar" },

  "kitchen.error.update": { en: "Could not update the order — try again", sv: "Kunde inte uppdatera beställningen — försök igen" },
} as const satisfies Record<string, Entry>;
