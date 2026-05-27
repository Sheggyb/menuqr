     1|"use client";
     2|import type { Restaurant, MenuCategory, TableRow } from "@/lib/types";
     3|
     4|interface Props {
     5|  restaurant: Restaurant;
     6|  categories: MenuCategory[];
     7|  tables: TableRow[];
     8|  onDismiss: () => void;
     9|}
    10|
    11|export default function OnboardingChecklist({ restaurant, categories, tables, onDismiss }: Props) {
    12|  const hasItems = categories.length > 0;
    13|  const hasTables = tables.length > 0;
    14|  const hasPrinted = hasTables; // proxy: if tables exist, assume they can print
    15|
    16|  const steps = [
    17|    { label: "Add menu items", done: hasItems, hint: "Go to the Menu tab" },
    18|    { label: "Add tables", done: hasTables, hint: "Go to the Tables tab" },
    19|    { label: "Print QR codes", done: hasPrinted, hint: "Use Print all QR codes in Tables" },
    20|  ];
    21|
    22|  const completedCount = steps.filter(s => s.done).length;
    23|  const total = steps.length;
    24|  const pct = Math.round((completedCount / total) * 100);
    25|  const allDone = completedCount === total;
    26|
    27|  if (allDone) return null;
    28|
    29|  return (
    30|    <div style={{
    31|      background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
    32|      border: "1px solid #fde68a",
    33|      borderRadius: 14,
    34|      padding: "18px 20px",
    35|      marginBottom: 16,
    36|      boxShadow: "0 2px 8px rgba(245,158,11,0.08)",
    37|    }}>
    38|      <style>{`
    39|        @keyframes checkPop {
    40|          0% { transform: scale(0.5); opacity: 0; }
    41|          70% { transform: scale(1.2); }
    42|          100% { transform: scale(1); opacity: 1; }
    43|        }
    44|        .check-done { animation: checkPop 0.35s ease-out both; }
    45|        @keyframes progressFill {
    46|          from { width: 0%; }
    47|          to { width: ${pct}%; }
    48|        }
    49|      `}</style>
    50|
    51|      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
    52|        <div style={{ flex: 1 }}>
    53|          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
    54|            <h3 style={{ fontWeight: 700, fontSize: 15, color: "#92400e", margin: 0 }}>
    55|              🚀 Getting started with {restaurant.name}
    56|            </h3>
    57|            <span style={{ fontSize: 12, fontWeight: 700, color: "#b45309" }}>{completedCount}/{total}</span>
    58|          </div>
    59|
    60|          {/* Progress bar */}
    61|          <div style={{ height: 6, background: "#fde68a", borderRadius: 99, marginBottom: 14, overflow: "hidden" }}>
    62|            <div style={{
    63|              height: "100%",
    64|              width: `${pct}%`,
    65|              background: "linear-gradient(90deg, #f59e0b, #d97706)",
    66|              borderRadius: 99,
    67|              transition: "width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
    68|            }} />
    69|          </div>
    70|
    71|          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    72|            {steps.map((s, i) => (
    73|              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
    74|                <span
    75|                  className={s.done ? "check-done" : undefined}
    76|                  style={{
    77|                    width: 22, height: 22,
    78|                    borderRadius: "50%",
    79|                    border: s.done ? "none" : "2px solid #fbbf24",
    80|                    background: s.done ? "#22c55e" : "white",
    81|                    display: "inline-flex", alignItems: "center", justifyContent: "center",
    82|                    flexShrink: 0,
    83|                    fontSize: 12,
    84|                    color: "white",
    85|                    fontWeight: 800,
    86|                    transition: "background 0.3s",
    87|                  }}
    88|                >
    89|                  {s.done ? "✓" : <span style={{ color: "#fbbf24", fontSize: 10, fontWeight: 700 }}>{i + 1}</span>}
    90|                </span>
    91|                <span style={{
    92|                  fontSize: 14,
    93|                  fontWeight: s.done ? 400 : 600,
    94|                  color: s.done ? "#9ca3af" : "#1f2937",
    95|                  textDecoration: s.done ? "line-through" : "none",
    96|                }}>
    97|                  {s.label}
    98|                </span>
    99|                {!s.done && (
   100|                  <span style={{ fontSize: 12, color: "#b45309", opacity: 0.75 }}>— {s.hint}</span>
   101|                )}
   102|              </div>
   103|            ))}
   104|          </div>
   105|        </div>
   106|        <button
   107|          onClick={onDismiss}
   108|          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 18, lineHeight: 1, flexShrink: 0, marginLeft: 12, padding: "0 4px" }}
   109|          title="Dismiss"
   110|        >
   111|          ×
   112|        </button>
   113|      </div>
   114|    </div>
   115|  );
   116|}
   117|