     1|"use client";
     2|import { useState, useEffect } from "react";
     3|import { createClient } from "@/lib/supabase/client";
     4|import type { Restaurant, TableRequest } from "@/lib/types";
     5|
     6|interface Props { restaurant: Restaurant }
     7|
     8|const TYPE_LABEL: Record<string, string> = {
     9|  waiter: "🙋 Waiter",
    10|  bill: "💳 Bill",
    11|  refill: "🔄 Refill",
    12|  item_request: "🍽️ Order",
    13|};
    14|
    15|function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: string }) {
    16|  return (
    17|    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 4 }}>
    18|      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
    19|      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{label}</div>
    20|      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{sub}</div>}
    21|    </div>
    22|  );
    23|}
    24|
    25|interface DayBucket { date: string; label: string; total: number; done: number }
    26|
    27|export default function Analytics({ restaurant }: Props) {
    28|  const supabase = createClient();
    29|  const [loading, setLoading] = useState(true);
    30|  const [requests, setRequests] = useState<TableRequest[]>([]);
    31|  const [range, setRange] = useState<"7d" | "30d">("7d");
    32|
    33|  useEffect(() => {
    34|    const days = range === "7d" ? 7 : 30;
    35|    const start = new Date();
    36|    start.setDate(start.getDate() - days);
    37|    start.setHours(0, 0, 0, 0);
    38|    setLoading(true);
    39|    supabase
    40|      .from("table_requests")
    41|      .select("*")
    42|      .eq("restaurant_id", restaurant.id)
    43|      .gte("created_at", start.toISOString())
    44|      .order("created_at", { ascending: true })
    45|      .then(({ data }) => {
    46|        setRequests((data as TableRequest[]) ?? []);
    47|        setLoading(false);
    48|      });
    49|  }, [restaurant.id, range]);
    50|
    51|  if (loading) return (
    52|    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12 }}>
    53|      {[1,2,3,4].map(i => (
    54|        <div key={i} style={{ background: "var(--item-available-bg)", borderRadius: 12, height: 90, animation: "pulse 1.5s ease-in-out infinite" }} />
    55|      ))}
    56|      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    57|    </div>
    58|  );
    59|
    60|  if (!loading && requests.length === 0) return (
    61|    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    62|      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
    63|        <h2 style={{ fontWeight: 800, fontSize: 18, margin: 0, color: "var(--text)" }}>📊 Analytics</h2>
    64|        <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
    65|          {(["7d", "30d"] as const).map(r => (
    66|            <button key={r} onClick={() => setRange(r)} style={{ padding: "6px 16px", border: "none", background: range === r ? "var(--accent)" : "var(--surface)", color: range === r ? "white" : "var(--text-muted)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
    67|              {r === "7d" ? "7 days" : "30 days"}
    68|            </button>
    69|          ))}
    70|        </div>
    71|      </div>
    72|      <div style={{ textAlign: "center", padding: "60px 32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 }}>
    73|        <div style={{ fontSize: 64, marginBottom: 16 }}>📊</div>
    74|        <h3 style={{ fontWeight: 700, fontSize: 18, color: "var(--text)", marginBottom: 8 }}>No data yet</h3>
    75|        <p style={{ color: "var(--text-muted)", fontSize: 14, maxWidth: 300, margin: "0 auto" }}>
    76|          Analytics will appear here once guests start making requests. Share your QR codes to get started!
    77|        </p>
    78|      </div>
    79|    </div>
    80|  );
    81|
    82|  // Summary stats
    83|  const total = requests.length;
    84|  const done = requests.filter(r => r.status === "done").length;
    85|  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
    86|  const byType: Record<string, number> = {};
    87|  for (const r of requests) byType[r.type] = (byType[r.type] ?? 0) + 1;
    88|  const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];
    89|
    90|  // Daily buckets
    91|  const days = range === "7d" ? 7 : 30;
    92|  const buckets: DayBucket[] = [];
    93|  for (let i = days - 1; i >= 0; i--) {
    94|    const d = new Date();
    95|    d.setDate(d.getDate() - i);
    96|    d.setHours(0, 0, 0, 0);
    97|    const next = new Date(d); next.setDate(next.getDate() + 1);
    98|    const dayReqs = requests.filter(r => {
    99|      const t = new Date(r.created_at).getTime();
   100|      return t >= d.getTime() && t < next.getTime();
   101|    });
   102|    const label = i === 0 ? "Today" : i === 1 ? "Yesterday" : d.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
   103|    buckets.push({ date: d.toISOString(), label, total: dayReqs.length, done: dayReqs.filter(r => r.status === "done").length });
   104|  }
   105|
   106|  const maxVal = Math.max(...buckets.map(b => b.total), 1);
   107|
   108|  return (
   109|    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
   110|      {/* Range selector */}
   111|      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
   112|        <h2 style={{ fontWeight: 800, fontSize: 18, margin: 0, color: "var(--text)" }}>📊 Analytics</h2>
   113|        <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
   114|          {(["7d", "30d"] as const).map(r => (
   115|            <button key={r} onClick={() => setRange(r)} style={{ padding: "6px 16px", border: "none", background: range === r ? "var(--accent)" : "var(--surface)", color: range === r ? "white" : "var(--text-muted)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
   116|              {r === "7d" ? "7 days" : "30 days"}
   117|            </button>
   118|          ))}
   119|        </div>
   120|      </div>
   121|
   122|      {/* Summary cards */}
   123|      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12 }}>
   124|        <StatCard label="Total requests" value={total} sub={`Last ${days} days`} color="#6366f1" />
   125|        <StatCard label="Completed" value={done} sub={`${completionRate}% rate`} color="#22c55e" />
   126|        <StatCard label="Completion rate" value={`${completionRate}%`} color="#3b82f6" />
   127|        <StatCard label="Top request" value={topType ? TYPE_LABEL[topType[0]]?.split(" ")[1] ?? topType[0] : "—"} sub={topType ? `${topType[1]} times` : undefined} color="#E85D2F" />
   128|      </div>
   129|
   130|      {/* Daily bar chart */}
   131|      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 20px" }}>
   132|        <h3 style={{ fontWeight: 700, fontSize: 14, margin: "0 0 16px", color: "var(--text)" }}>Daily requests</h3>
   133|        <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 120, overflowX: "auto" }}>
   134|          {buckets.map(b => (
   135|            <div key={b.date} style={{ flex: 1, minWidth: range === "30d" ? 14 : 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
   136|              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}>{b.total > 0 ? b.total : ""}</div>
   137|              <div style={{ width: "100%", background: "var(--accent)", borderRadius: "4px 4px 0 0", height: Math.max(4, (b.total / maxVal) * 90), transition: "height 0.3s ease", opacity: b.total === 0 ? 0.2 : 1 }} />
   138|            </div>
   139|          ))}
   140|        </div>
   141|        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
   142|          {buckets.map((b, i) => (
   143|            <div key={b.date} style={{ flex: 1, minWidth: range === "30d" ? 14 : 24, textAlign: "center", fontSize: 9, color: "var(--text-muted)", overflow: "hidden" }}>
   144|              {range === "7d" ? b.label.split(",")[0] : (i % 5 === 0 ? new Date(b.date).getDate() : "")}
   145|            </div>
   146|          ))}
   147|        </div>
   148|      </div>
   149|
   150|      {/* By type breakdown */}
   151|      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 20px" }}>
   152|        <h3 style={{ fontWeight: 700, fontSize: 14, margin: "0 0 14px", color: "var(--text)" }}>Requests by type</h3>
   153|        {Object.keys(TYPE_LABEL).map(type => {
   154|          const count = byType[type] ?? 0;
   155|          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
   156|          return (
   157|            <div key={type} style={{ marginBottom: 12 }}>
   158|              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
   159|                <span>{TYPE_LABEL[type]}</span>
   160|                <span style={{ color: "var(--text-muted)" }}>{count} ({pct}%)</span>
   161|              </div>
   162|              <div style={{ height: 6, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
   163|                <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent)", borderRadius: 99, transition: "width 0.4s ease" }} />
   164|              </div>
   165|            </div>
   166|          );
   167|        })}
   168|      </div>
   169|    </div>
   170|  );
   171|}
   172|