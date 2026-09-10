import type { Entry } from "..";

// Placeholder — the Settings panel surface fills this in.
export const settings = {
  "settings.title": { en: "Settings", sv: "Inställningar" },
} as const satisfies Record<string, Entry>;
