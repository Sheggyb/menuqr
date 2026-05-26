"use client";
import type { Restaurant, MenuCategory, TableRow } from "@/lib/types";

interface Props {
  restaurant: Restaurant;
  categories: MenuCategory[];
  tables: TableRow[];
  onDismiss: () => void;
}

export default function OnboardingChecklist({ restaurant, categories, tables, onDismiss }: Props) {
  const hasItems = categories.length > 0;
  const hasTables = tables.length > 0;
  const hasPrinted = hasTables; // proxy: if tables exist, assume they can print

  const allDone = hasItems && hasTables;
  if (allDone) return null;

  const steps = [
    { label: "Add menu items", done: hasItems, hint: "Go to the Menu tab" },
    { label: "Add tables", done: hasTables, hint: "Go to the Tables tab" },
    { label: "Print QR codes", done: hasPrinted, hint: "Use Print all QR codes in Tables" },
  ];

  return (
    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, color: "#92400e" }}>🚀 Getting started with {restaurant.name}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {steps.map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{s.done ? "✅" : "⬜"}</span>
                <span style={{ fontSize: 14, fontWeight: s.done ? 400 : 600, color: s.done ? "#6b7280" : "#1f2937", textDecoration: s.done ? "line-through" : "none" }}>{s.label}</span>
                {!s.done && <span style={{ fontSize: 12, color: "#9ca3af" }}>— {s.hint}</span>}
              </div>
            ))}
          </div>
        </div>
        <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18, lineHeight: 1, flexShrink: 0, marginLeft: 8 }} title="Dismiss">×</button>
      </div>
    </div>
  );
}
