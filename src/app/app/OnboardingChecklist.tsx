"use client";
import { useEffect, useState } from "react";
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
  // Set by the print-QR page when the user actually prints (key: menuqr_printed_qr)
  const [hasPrinted, setHasPrinted] = useState(false);
  useEffect(() => {
    try { setHasPrinted(localStorage.getItem("menuqr_printed_qr") === "1"); } catch { /* ignore */ }
  }, []);

  const steps = [
    { label: "Add menu items", done: hasItems, hint: "Go to the Menu tab" },
    { label: "Add tables", done: hasTables, hint: "Go to the Tables tab" },
    { label: "Print QR codes", done: hasPrinted, hint: "Use Print all QR codes in Tables" },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const total = steps.length;
  const pct = Math.round((completedCount / total) * 100);
  const allDone = completedCount === total;

  if (allDone) return null;

  return (
    <div style={{
      background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
      border: "1px solid #fde68a",
      borderRadius: 14,
      padding: "18px 20px",
      marginBottom: 16,
      boxShadow: "0 2px 8px rgba(245,158,11,0.08)",
    }}>
      <style>{`
        @keyframes checkPop {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        .check-done { animation: checkPop 0.35s ease-out both; }
        @keyframes progressFill {
          from { width: 0%; }
          to { width: ${pct}%; }
        }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: "#92400e", margin: 0 }}>
              🚀 Getting started with {restaurant.name}
            </h3>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#b45309" }}>{completedCount}/{total}</span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 6, background: "#fde68a", borderRadius: 99, marginBottom: 14, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${pct}%`,
              background: "linear-gradient(90deg, #f59e0b, #d97706)",
              borderRadius: 99,
              transition: "width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {steps.map((s, i) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  className={s.done ? "check-done" : undefined}
                  style={{
                    width: 22, height: 22,
                    borderRadius: "50%",
                    border: s.done ? "none" : "2px solid #fbbf24",
                    background: s.done ? "#22c55e" : "white",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                    fontSize: 12,
                    color: "white",
                    fontWeight: 800,
                    transition: "background 0.3s",
                  }}
                >
                  {s.done ? "✓" : <span style={{ color: "#fbbf24", fontSize: 10, fontWeight: 700 }}>{i + 1}</span>}
                </span>
                <span style={{
                  fontSize: 14,
                  fontWeight: s.done ? 400 : 600,
                  color: s.done ? "#9ca3af" : "#1f2937",
                  textDecoration: s.done ? "line-through" : "none",
                }}>
                  {s.label}
                </span>
                {!s.done && (
                  <span style={{ fontSize: 12, color: "#b45309", opacity: 0.75 }}>— {s.hint}</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={onDismiss}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 18, lineHeight: 1, flexShrink: 0, marginLeft: 12, padding: "0 4px" }}
          title="Dismiss"
          aria-label="Dismiss checklist"
        >
          ×
        </button>
      </div>
    </div>
  );
}
