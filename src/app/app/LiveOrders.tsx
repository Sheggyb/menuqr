     1|"use client";
     2|import { useState, useEffect, useCallback } from "react";
     3|import { createClient } from "@/lib/supabase/client";
     4|import type { Restaurant, TableRequest } from "@/lib/types";
     5|import { SkeletonList } from "@/components/Skeleton";
     6|
     7|interface Props { restaurant: Restaurant }
     8|
     9|const TYPE_LABEL: Record<string, string> = {
    10|  waiter: "🙋 Waiter",
    11|  bill: "💳 Bill",
    12|  refill: "🔄 Refill",
    13|  item_request: "🍽️ Order",
    14|};
    15|
    16|const TYPE_COLOR: Record<string, { bg: string; border: string; badge: string }> = {
    17|  waiter:       { bg: "#fffbeb", border: "var(--card-waiter-border)", badge: "#f59e0b" },
    18|  bill:         { bg: "#fff1f2", border: "var(--card-bill-border)", badge: "#f43f5e" },
    19|  refill:       { bg: "#eff6ff", border: "var(--card-refill-border)", badge: "#3b82f6" },
    20|  item_request: { bg: "#f0fdf4", border: "var(--card-order-border)", badge: "#22c55e" },
    21|};
    22|
    23|function timeAgo(dateStr: string): { text: string; isLate: boolean } {
    24|  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    25|  const isLate = diff >= 300; // 5 minutes
    26|  let text: string;
    27|  if (diff < 60) text = `${diff}s ago`;
    28|  else if (diff < 3600) text = `${Math.floor(diff / 60)}m ago`;
    29|  else text = `${Math.floor(diff / 3600)}h ago`;
    30|  return { text, isLate };
    31|}
    32|
    33|function TableIcon() {
    34|  return (
    35|    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    36|      <rect x="3" y="6" width="18" height="3" rx="1"/>
    37|      <line x1="6" y1="9" x2="6" y2="18"/>
    38|      <line x1="18" y1="9" x2="18" y2="18"/>
    39|    </svg>
    40|  );
    41|}
    42|
    43|interface CardProps {
    44|  req: TableRequest;
    45|  onPickUp?: () => void;
    46|  onDone?: () => void;
    47|  onUndo?: () => void;
    48|}
    49|
    50|function RequestCard({ req, onPickUp, onDone, onUndo }: CardProps) {
    51|  const colors = TYPE_COLOR[req.type] ?? { bg: "var(--surface)", border: "var(--border)", badge: "#6b7280" };
    52|  const tableName = (req.table as { name: string } | undefined)?.name ?? "Unknown";
    53|  const { text: timeText, isLate } = timeAgo(req.created_at);
    54|  return (
    55|    <div style={{
    56|      background: isLate ? "var(--card-late-bg)" : colors.bg,
    57|      border: `1px solid ${isLate ? "var(--card-late-border)" : colors.border}`,
    58|      borderRadius: 12,
    59|      padding: "14px 16px",
    60|      display: "flex",
    61|      flexDirection: "column",
    62|      gap: 10,
    63|      animation: "slideIn 0.2s ease-out",
    64|    }}>
    65|      {/* Header */}
    66|      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
    67|        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    68|          <span style={{
    69|            display: "inline-flex", alignItems: "center", gap: 4,
    70|            background: colors.badge, color: "white",
    71|            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
    72|            alignSelf: "flex-start",
    73|          }}>
    74|            {TYPE_LABEL[req.type] ?? req.type}
    75|          </span>
    76|          {req.item_name && (
    77|            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{req.item_name}</span>
    78|          )}
    79|          {req.note && (
    80|            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>📝 {req.note}</span>
    81|          )}
    82|        </div>
    83|        <span style={{ fontSize: 11, color: isLate ? "#dc2626" : "#9ca3af", whiteSpace: "nowrap", fontWeight: isLate ? 700 : 400 }}>
    84|          {isLate ? "⏱ " : ""}{timeText}
    85|        </span>
    86|      </div>
    87|
    88|      {/* Table */}
    89|      <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-muted)", fontSize: 12 }}>
    90|        <TableIcon />
    91|        <span style={{ fontWeight: 600 }}>{tableName}</span>
    92|      </div>
    93|
    94|      {/* Actions */}
    95|      <div style={{ display: "flex", gap: 6 }}>
    96|        {onPickUp && (
    97|          <button onClick={onPickUp} style={{
    98|            flex: 1, padding: "7px 0", borderRadius: 8, border: "none",
    99|            background: "#3b82f6", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer",
   100|          }}>
   101|            Pick up →
   102|          </button>
   103|        )}
   104|        {onDone && (
   105|          <button onClick={onDone} style={{
   106|            flex: 1, padding: "7px 0", borderRadius: 8, border: "none",
   107|            background: "#22c55e", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer",
   108|          }}>
   109|            ✓ Done
   110|          </button>
   111|        )}
   112|        {onUndo && (
   113|          <button onClick={onUndo} style={{
   114|            padding: "7px 10px", borderRadius: 8,
   115|            border: "1px solid var(--border)", background: "var(--surface)",
   116|            color: "var(--text-muted)", fontSize: 12, cursor: "pointer",
   117|          }}>
   118|            ↩
   119|          </button>
   120|        )}
   121|      </div>
   122|    </div>
   123|  );
   124|}
   125|
   126|interface ColumnProps {
   127|  title: string;
   128|  count: number;
   129|  color: string;
   130|  dotColor: string;
   131|  children: React.ReactNode;
   132|}
   133|
   134|function Column({ title, count, color, dotColor, children }: ColumnProps) {
   135|  return (
   136|    <div style={{
   137|      flex: 1, minWidth: 0,
   138|      background: "var(--bg)",
   139|      borderRadius: 14,
   140|      border: "1px solid var(--border)",
   141|      display: "flex",
   142|      flexDirection: "column",
   143|      overflow: "hidden",
   144|    }}>
   145|      {/* Column header */}
   146|      <div style={{
   147|        padding: "12px 16px",
   148|        borderBottom: "1px solid var(--border)",
   149|        background: "var(--surface)",
   150|        display: "flex",
   151|        alignItems: "center",
   152|        gap: 8,
   153|      }}>
   154|        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, display: "inline-block" }} />
   155|        <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</span>
   156|        <span style={{
   157|          marginLeft: "auto",
   158|          background: color,
   159|          color: "white",
   160|          fontSize: 11, fontWeight: 700,
   161|          padding: "1px 7px", borderRadius: 99,
   162|        }}>{count}</span>
   163|      </div>
   164|      {/* Cards */}
   165|      <div style={{
   166|        padding: 12,
   167|        display: "flex",
   168|        flexDirection: "column",
   169|        gap: 10,
   170|        overflowY: "auto",
   171|        flex: 1,
   172|        minHeight: 120,
   173|      }}>
   174|        {children}
   175|      </div>
   176|    </div>
   177|  );
   178|}
   179|
   180|const ALL_TYPES = ["waiter", "bill", "refill", "item_request"] as const;
   181|
   182|export default function LiveOrders({ restaurant }: Props) {
   183|  const supabase = createClient();
   184|  const [requests, setRequests] = useState<TableRequest[]>([]);
   185|  const [loading, setLoading] = useState(true);
   186|  const [soundEnabled, setSoundEnabled] = useState(() => {
   187|    if (typeof window === "undefined") return true;
   188|    return localStorage.getItem("menuqr_sound") !== "off";
   189|  });
   190|  const [searchTable, setSearchTable] = useState("");
   191|  const [filterType, setFilterType] = useState<string>("all");
   192|
   193|  const load = useCallback(async () => {
   194|    const { data } = await supabase
   195|      .from("table_requests")
   196|      .select("*, table:restaurant_tables(name)")
   197|      .eq("restaurant_id", restaurant.id)
   198|      .neq("status", "done")
   199|      .order("created_at", { ascending: true })
   200|      .limit(100);
   201|    setRequests((data as TableRequest[]) ?? []);
   202|    setLoading(false);
   203|  }, [restaurant.id]);
   204|
   205|  function playPing() {
   206|    if (!soundEnabled) return;
   207|    try {
   208|      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
   209|      const osc = ctx.createOscillator();
   210|      const gain = ctx.createGain();
   211|      osc.connect(gain); gain.connect(ctx.destination);
   212|      osc.type = "sine"; osc.frequency.setValueAtTime(880, ctx.currentTime);
   213|      gain.gain.setValueAtTime(0.3, ctx.currentTime);
   214|      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
   215|      osc.start(); osc.stop(ctx.currentTime + 0.4);
   216|    } catch { /* audio not available */ }
   217|  }
   218|
   219|  useEffect(() => {
   220|    load();
   221|    const channel = supabase.channel(`requests:${restaurant.id}`)
   222|      .on("postgres_changes", {
   223|        event: "*", schema: "public", table: "table_requests",
   224|        filter: `restaurant_id=eq.${restaurant.id}`,
   225|      }, (payload) => {
   226|        if (payload.eventType === "INSERT") playPing();
   227|        load();
   228|      })
   229|      .subscribe();
   230|    return () => { supabase.removeChannel(channel); };
   231|  }, [restaurant.id, load, soundEnabled]);
   232|
   233|  async function move(id: string, status: TableRequest["status"]) {
   234|    if (status === "done") {
   235|      await supabase.from("table_requests").update({ status }).eq("id", id);
   236|      setRequests(r => r.filter(x => x.id !== id));
   237|    } else {
   238|      await supabase.from("table_requests").update({ status }).eq("id", id);
   239|      setRequests(r => r.map(x => x.id === id ? { ...x, status } : x));
   240|    }
   241|  }
   242|
   243|  async function markAllDone() {
   244|    const ids = pending.map(r => r.id);
   245|    await Promise.all(ids.map(id => supabase.from("table_requests").update({ status: "done" }).eq("id", id)));
   246|    setRequests(r => r.filter(x => !ids.includes(x.id)));
   247|  }
   248|
   249|  function applyFilters(list: TableRequest[]) {
   250|    return list.filter(r => {
   251|      const tableName = ((r.table as { name: string } | undefined)?.name ?? "").toLowerCase();
   252|      const matchTable = !searchTable || tableName.includes(searchTable.toLowerCase());
   253|      const matchType = filterType === "all" || r.type === filterType;
   254|      return matchTable && matchType;
   255|    });
   256|  }
   257|
   258|  const pending = applyFilters(requests.filter(r => r.status === "pending"));
   259|  const seen = applyFilters(requests.filter(r => r.status === "seen"));
   260|
   261|  const pendingCount = requests.filter(r => r.status === "pending").length;
   262|
   263|  // Keyboard shortcuts: P = pick up first pending, D = mark first in-progress done
   264|  useEffect(() => {
   265|    function handleKey(e: KeyboardEvent) {
   266|      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
   267|      if (e.key === "p" || e.key === "P") {
   268|        const first = requests.find(r => r.status === "pending");
   269|        if (first) move(first.id, "seen");
   270|      } else if (e.key === "d" || e.key === "D") {
   271|        const first = requests.find(r => r.status === "seen");
   272|        if (first) move(first.id, "done");
   273|      }
   274|    }
   275|    window.addEventListener("keydown", handleKey);
   276|    return () => window.removeEventListener("keydown", handleKey);
   277|  // eslint-disable-next-line react-hooks/exhaustive-deps
   278|  }, [requests]);
   279|
   280|  // Estimated wait time: assume ~3 min per pending request
   281|  const estWaitMin = pendingCount * 3;
   282|
   283|  useEffect(() => {
   284|    document.title = pendingCount > 0 ? `(${pendingCount}) Live Orders — MenuQR` : "Live Orders — MenuQR";
   285|    return () => { document.title = "MenuQR — Digital Menu & Table Ordering"; };
   286|  }, [pendingCount]);
   287|
   288|  // Today stats (fetch separately including done)
   289|  const [todayStats, setTodayStats] = useState({ total: 0, done: 0 });
   290|  useEffect(() => {
   291|    const start = new Date(); start.setHours(0, 0, 0, 0);
   292|    supabase.from("table_requests")
   293|      .select("status")
   294|      .eq("restaurant_id", restaurant.id)
   295|      .gte("created_at", start.toISOString())
   296|      .then(({ data }) => {
   297|        setTodayStats({
   298|          total: data?.length ?? 0,
   299|          done: data?.filter(r => r.status === "done").length ?? 0,
   300|        });
   301|      });
   302|  }, [requests.length, restaurant.id]);
   303|
   304|  if (loading) return (
   305|    <div>
   306|      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
   307|        {[1,2,3].map(i => <div key={i} className="card" style={{ padding: "14px 16px", textAlign: "center" }}><div style={{ height: 32, background: "var(--border)", borderRadius: 8, marginBottom: 8 }} /><div style={{ height: 12, background: "var(--bg)", borderRadius: 6, width: "60%", margin: "0 auto" }} /></div>)}
   308|      </div>
   309|      <div style={{ display: "flex", gap: 12 }}>
   310|        <div style={{ flex: 1 }}><SkeletonList count={3} /></div>
   311|        <div style={{ flex: 1 }}><SkeletonList count={2} /></div>
   312|      </div>
   313|    </div>
   314|  );
   315|
   316|  return (
   317|    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
   318|      <style>{`
   319|        @keyframes slideIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
   320|      `}</style>
   321|
   322|      {/* Stats */}
   323|      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
   324|        {[
   325|          { label: "Today total", value: todayStats.total, color: "#6366f1" },
   326|          { label: "Completed", value: todayStats.done, color: "#22c55e" },
   327|          { label: "Waiting now", value: pendingCount, color: "#E85D2F", extra: estWaitMin > 0 ? `~${estWaitMin} min wait` : undefined },
   328|        ].map(s => (
   329|          <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
   330|            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
   331|            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
   332|            {"extra" in s && s.extra && <div style={{ fontSize: 10, color: s.color, marginTop: 2, fontWeight: 600 }}>{s.extra}</div>}
   333|          </div>
   334|        ))}
   335|      </div>
   336|
   337|      {/* Search + Filter + Sound toolbar */}
   338|      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
   339|        <input
   340|          type="text"
   341|          placeholder="🔍 Filter by table..."
   342|          value={searchTable}
   343|          onChange={e => setSearchTable(e.target.value)}
   344|          style={{ flex: "1 1 140px", padding: "7px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, outline: "none" }}
   345|        />
   346|        <select
   347|          value={filterType}
   348|          onChange={e => setFilterType(e.target.value)}
   349|          style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, cursor: "pointer" }}
   350|        >
   351|          <option value="all">All types</option>
   352|          {ALL_TYPES.map(t => (
   353|            <option key={t} value={t}>{TYPE_LABEL[t]}</option>
   354|          ))}
   355|        </select>
   356|        <button
   357|          onClick={() => { const next = !soundEnabled; setSoundEnabled(next); localStorage.setItem("menuqr_sound", next ? "on" : "off"); }}
   358|          title={soundEnabled ? "Sound on — click to mute" : "Sound off — click to enable"}
   359|          style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid var(--border)", background: soundEnabled ? "var(--card-order-bg)" : "var(--surface)", color: soundEnabled ? "#16a34a" : "#9ca3af", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
   360|        >
   361|          {soundEnabled ? "🔔 Sound on" : "🔕 Muted"}
   362|        </button>
   363|        {pendingCount > 0 && (
   364|          <button
   365|            onClick={markAllDone}
   366|            style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: "#22c55e", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
   367|          >
   368|            ✅ Mark all done
   369|          </button>
   370|        )}
   371|      </div>
   372|
   373|      {/* Keyboard shortcuts hint */}
   374|      <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", gap: 12 }}>
   375|        <span><kbd style={{ background: "var(--border)", borderRadius: 4, padding: "1px 5px", fontFamily: "monospace" }}>P</kbd> Pick up first new</span>
   376|        <span><kbd style={{ background: "var(--border)", borderRadius: 4, padding: "1px 5px", fontFamily: "monospace" }}>D</kbd> Mark first in-progress done</span>
   377|      </div>
   378|
   379|      {/* Kanban */}
   380|      <style>{`
   381|        .kanban-board { display: flex; gap: 12; align-items: flex-start; }
   382|        @media (max-width: 600px) { .kanban-board { flex-direction: column !important; } }
   383|      `}</style>
   384|      <div className="kanban-board" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
   385|        {/* NEW */}
   386|        <Column title="New" count={pending.length} color="#E85D2F" dotColor="#E85D2F">
   387|          {pending.length === 0 ? (
   388|            <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-muted)", fontSize: 13 }}>
   389|              <div style={{ fontSize: 32, marginBottom: 6 }}>✅</div>
   390|              {searchTable || filterType !== "all" ? "No matching requests" : "All clear!"}
   391|            </div>
   392|          ) : pending.map(req => (
   393|            <RequestCard
   394|              key={req.id}
   395|              req={req}
   396|              onPickUp={() => move(req.id, "seen")}
   397|            />
   398|          ))}
   399|        </Column>
   400|
   401|        {/* IN PROGRESS */}
   402|        <Column title="In Progress" count={seen.length} color="#3b82f6" dotColor="#3b82f6">
   403|          {seen.length === 0 ? (
   404|            <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-muted)", fontSize: 13 }}>
   405|              <div style={{ fontSize: 32, marginBottom: 6 }}>👋</div>
   406|              {searchTable || filterType !== "all" ? "No matching requests" : "Nothing picked up"}
   407|            </div>
   408|          ) : seen.map(req => (
   409|            <RequestCard
   410|              key={req.id}
   411|              req={req}
   412|              onDone={() => move(req.id, "done")}
   413|              onUndo={() => move(req.id, "pending")}
   414|            />
   415|          ))}
   416|        </Column>
   417|      </div>
   418|    </div>
   419|  );
   420|}
   421|