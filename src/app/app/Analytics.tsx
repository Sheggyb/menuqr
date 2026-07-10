"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant, TableRequest } from "@/lib/types";
import { TYPE_LABEL } from "@/lib/constants";
import { IconChart } from "@/components/icons";

interface Props { restaurant: Restaurant }

// TYPE_LABEL values are "<emoji> Name" — take just the name (no emojis in dashboard UI)
function typeName(type: string): string {
  const label = TYPE_LABEL[type];
  return label ? label.split(" ").slice(1).join(" ") : type;
}

function Delta({ today, yesterday }: { today: number; yesterday: number }) {
  let text: string;
  let color: string;
  if (today === yesterday) {
    text = "— flat vs yesterday";
    color = "var(--text-muted)";
  } else if (yesterday === 0) {
    text = `↑ +${today} vs yesterday`;
    color = "#16a34a";
  } else {
    const pct = Math.round(((today - yesterday) / yesterday) * 100);
    const up = pct > 0;
    text = `${up ? "↑" : "↓"} ${Math.abs(pct)}% vs yesterday`;
    color = up ? "#16a34a" : "#dc2626";
  }
  return <div style={{ fontSize: 11, fontWeight: 600, color }}>{text}</div>;
}

function StatCard({ label, value, sub, color, delta }: { label: string; value: number | string; sub?: string; color: string; delta?: { today: number; yesterday: number } }) {
  return (
    <div style={{ position: "relative", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px 16px 23px", display: "flex", flexDirection: "column", gap: 4, boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: color }} />
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{sub}</div>}
      {delta && <Delta today={delta.today} yesterday={delta.yesterday} />}
    </div>
  );
}

interface DayBucket { date: string; label: string; total: number; done: number }

export default function Analytics({ restaurant }: Props) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<TableRequest[]>([]);
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    // Always fetch 30 days so switching the range needs no new API call
    const start = new Date();
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    setLoading(true);
    supabase
      .from("table_requests")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .gte("created_at", start.toISOString())
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setRequests((data as TableRequest[]) ?? []);
        setLoading(false);
      });
  }, [restaurant.id]);

  const days = range === "7d" ? 7 : 30;

  const header = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
      <h2 style={{ fontWeight: 800, fontSize: 18, margin: 0, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
        <IconChart width={18} height={18} /> Stats
      </h2>
      <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        {(["7d", "30d"] as const).map(r => (
          <button key={r} onClick={() => setRange(r)} style={{ padding: "6px 16px", border: "none", background: range === r ? "var(--accent)" : "var(--surface)", color: range === r ? "white" : "var(--text-muted)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            {r}
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12 }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ background: "var(--item-available-bg)", borderRadius: 12, height: 90, animation: "pulse 1.5s ease-in-out infinite" }} />
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );

  // Filter fetched (30d) data down to the selected range client-side
  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - (days - 1));
  rangeStart.setHours(0, 0, 0, 0);
  const inRange = requests.filter(r => new Date(r.created_at).getTime() >= rangeStart.getTime());

  if (inRange.length === 0) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {header}
      <div style={{ textAlign: "center", padding: "60px 32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 }}>
        <div style={{ color: "var(--text-muted)", marginBottom: 16 }}><IconChart width={48} height={48} /></div>
        <h3 style={{ fontWeight: 700, fontSize: 18, color: "var(--text)", marginBottom: 8 }}>No data yet</h3>
        <p style={{ color: "var(--text-muted)", fontSize: 14, maxWidth: 300, margin: "0 auto" }}>
          Analytics will appear here once guests start making requests. Share your QR codes to get started!
        </p>
      </div>
    </div>
  );

  // Summary stats
  const total = inRange.length;
  const done = inRange.filter(r => r.status === "done").length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
  const byType: Record<string, number> = {};
  for (const r of inRange) byType[r.type] = (byType[r.type] ?? 0) + 1;
  const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];

  // Daily buckets
  const buckets: DayBucket[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d); next.setDate(next.getDate() + 1);
    const dayReqs = inRange.filter(r => {
      const t = new Date(r.created_at).getTime();
      return t >= d.getTime() && t < next.getTime();
    });
    const label = i === 0 ? "Today" : i === 1 ? "Yesterday" : d.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
    buckets.push({ date: d.toISOString(), label, total: dayReqs.length, done: dayReqs.filter(r => r.status === "done").length });
  }

  const maxVal = Math.max(...buckets.map(b => b.total), 1);
  const todayBucket = buckets[buckets.length - 1];
  const yesterdayBucket = buckets[buckets.length - 2];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {header}

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
        <StatCard label="Total requests" value={total} sub={`Last ${days} days`} color="var(--accent)"
          delta={yesterdayBucket ? { today: todayBucket.total, yesterday: yesterdayBucket.total } : undefined} />
        <StatCard label="Completed" value={done} sub={`${completionRate}% done`} color="#22c55e"
          delta={yesterdayBucket ? { today: todayBucket.done, yesterday: yesterdayBucket.done } : undefined} />
        <StatCard label="Top request" value={topType ? typeName(topType[0]) : "—"} sub={topType ? `${topType[1]} times` : undefined} color="var(--accent)" />
      </div>

      {/* Daily bar chart */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 20px" }}>
        <h3 style={{ fontWeight: 700, fontSize: 14, margin: "0 0 16px", color: "var(--text)" }}>Daily requests</h3>
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "flex", gap: range === "30d" ? 4 : 6, alignItems: "flex-end", paddingBottom: 42, minWidth: range === "30d" ? 30 * 36 : 7 * 52, position: "relative" }}>
            {/* Horizontal grid lines behind bars (chart area is 90px tall above the labels) */}
            {[0.25, 0.5, 0.75, 1].map(f => (
              <div key={f} style={{ position: "absolute", left: 0, right: 0, bottom: 42 + f * 90, height: 1, background: "var(--border)", opacity: 0.5, pointerEvents: "none" }} />
            ))}
            {buckets.map((b, i) => {
              const d = new Date(b.date);
              const dayNum = d.getDate();
              const mon = d.toLocaleDateString("en", { month: "short" });
              const weekday = d.toLocaleDateString("en", { weekday: "short" });
              const labelTop = range === "7d" ? weekday : `${mon} ${dayNum}`;
              const labelBot = range === "7d" ? `${mon} ${dayNum}` : "";
              const isToday = i === buckets.length - 1;
              return (
                <div key={b.date}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(h => (h === i ? null : h))}
                  style={{ flex: 1, minWidth: range === "30d" ? 32 : 46, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
                  {hovered === i && (
                    <div style={{ position: "absolute", bottom: "100%", marginBottom: 6, left: "50%", transform: "translateX(-50%)", background: "var(--text)", color: "var(--bg)", fontSize: 11, fontWeight: 600, padding: "4px 8px", borderRadius: 6, whiteSpace: "nowrap", pointerEvents: "none", zIndex: 5, boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>
                      {d.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })} — {b.total} request{b.total !== 1 ? "s" : ""}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, marginBottom: 3 }}>{b.total > 0 ? b.total : ""}</div>
                  <div style={{ width: "100%", background: isToday ? "var(--accent)" : "var(--text-muted)", borderRadius: "4px 4px 0 0", height: Math.max(4, (b.total / maxVal) * 90), transition: "height 0.3s ease", opacity: b.total === 0 ? 0.15 : isToday ? 1 : hovered === i ? 0.65 : 0.4 }} />
                  <div style={{ position: "absolute", bottom: -38, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                    <span style={{ fontSize: range === "30d" ? 9 : 10, color: isToday ? "var(--accent)" : "var(--text-muted)", fontWeight: isToday ? 700 : 400, whiteSpace: "nowrap" }}>{labelTop}</span>
                    {labelBot && <span style={{ fontSize: 9, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{labelBot}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* By type breakdown */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 20px" }}>
        <h3 style={{ fontWeight: 700, fontSize: 14, margin: "0 0 14px", color: "var(--text)" }}>Requests by type</h3>
        {Object.keys(TYPE_LABEL).map(type => {
          const count = byType[type] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={type} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                <span>{typeName(type)}</span>
                <span style={{ color: "var(--text-muted)" }}>{count} ({pct}%)</span>
              </div>
              <div style={{ height: 6, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent)", borderRadius: 99, transition: "width 0.4s ease" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
