"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant, TableRequest } from "@/lib/types";
import { SkeletonList } from "@/components/Skeleton";

interface Props { restaurant: Restaurant }

const TYPE_LABEL: Record<string, string> = {
  waiter: "🙋 Waiter",
  bill: "💳 Bill",
  refill: "🔄 Refill",
  item_request: "🍽️ Order",
};

const TYPE_COLOR: Record<string, { bg: string; border: string; badge: string }> = {
  waiter:       { bg: "var(--card-waiter-bg)", border: "var(--card-waiter-border)", badge: "#f59e0b" },
  bill:         { bg: "var(--card-bill-bg)", border: "var(--card-bill-border)", badge: "#f43f5e" },
  refill:       { bg: "var(--card-refill-bg)", border: "var(--card-refill-border)", badge: "#3b82f6" },
  item_request: { bg: "var(--card-order-bg)", border: "var(--card-order-border)", badge: "#22c55e" },
};

function timeAgo(dateStr: string): { text: string; isLate: boolean } {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  const isLate = diff >= 300; // 5 minutes
  let text: string;
  if (diff < 60) text = `${diff}s ago`;
  else if (diff < 3600) text = `${Math.floor(diff / 60)}m ago`;
  else text = `${Math.floor(diff / 3600)}h ago`;
  return { text, isLate };
}

function TableIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="3" rx="1"/>
      <line x1="6" y1="9" x2="6" y2="18"/>
      <line x1="18" y1="9" x2="18" y2="18"/>
    </svg>
  );
}

interface CardProps {
  req: TableRequest;
  onPickUp?: () => void;
  onDone?: () => void;
  onUndo?: () => void;
}

function RequestCard({ req, onPickUp, onDone, onUndo }: CardProps) {
  const colors = TYPE_COLOR[req.type] ?? { bg: "var(--surface)", border: "var(--border)", badge: "#6b7280" };
  const tableName = (req.table as { name: string } | undefined)?.name ?? "Unknown";
  const { text: timeText, isLate } = timeAgo(req.created_at);
  return (
    <div style={{
      background: isLate ? "var(--card-late-bg)" : colors.bg,
      border: `1px solid ${isLate ? "var(--card-late-border)" : colors.border}`,
      borderRadius: 12,
      padding: "14px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      animation: "slideIn 0.2s ease-out",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: colors.badge, color: "white",
            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
            alignSelf: "flex-start",
          }}>
            {TYPE_LABEL[req.type] ?? req.type}
          </span>
          {req.item_name && (
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{req.item_name}</span>
          )}
          {req.note && (
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>📝 {req.note}</span>
          )}
        </div>
        <span style={{ fontSize: 11, color: isLate ? "#dc2626" : "#9ca3af", whiteSpace: "nowrap", fontWeight: isLate ? 700 : 400 }}>
          {isLate ? "⏱ " : ""}{timeText}
        </span>
      </div>

      {/* Table */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-muted)", fontSize: 12 }}>
        <TableIcon />
        <span style={{ fontWeight: 600 }}>{tableName}</span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6 }}>
        {onPickUp && (
          <button onClick={onPickUp} style={{
            flex: 1, padding: "7px 0", borderRadius: 8, border: "none",
            background: "#3b82f6", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>
            Pick up →
          </button>
        )}
        {onDone && (
          <button onClick={onDone} style={{
            flex: 1, padding: "7px 0", borderRadius: 8, border: "none",
            background: "#22c55e", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>
            ✓ Done
          </button>
        )}
        {onUndo && (
          <button onClick={onUndo} style={{
            padding: "7px 10px", borderRadius: 8,
            border: "1px solid var(--border)", background: "var(--surface)",
            color: "var(--text-muted)", fontSize: 12, cursor: "pointer",
          }}>
            ↩
          </button>
        )}
      </div>
    </div>
  );
}

interface ColumnProps {
  title: string;
  count: number;
  color: string;
  dotColor: string;
  children: React.ReactNode;
}

function Column({ title, count, color, dotColor, children }: ColumnProps) {
  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: "var(--bg)",
      borderRadius: 14,
      border: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Column header */}
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, display: "inline-block" }} />
        <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</span>
        <span style={{
          marginLeft: "auto",
          background: color,
          color: "white",
          fontSize: 11, fontWeight: 700,
          padding: "1px 7px", borderRadius: 99,
        }}>{count}</span>
      </div>
      {/* Cards */}
      <div style={{
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        overflowY: "auto",
        flex: 1,
        minHeight: 120,
      }}>
        {children}
      </div>
    </div>
  );
}

const ALL_TYPES = ["waiter", "bill", "refill", "item_request"] as const;

export default function LiveOrders({ restaurant }: Props) {
  const supabase = createClient();
  const [requests, setRequests] = useState<TableRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("menuqr_sound") !== "off";
  });
  const [searchTable, setSearchTable] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("table_requests")
      .select("*, table:restaurant_tables(name)")
      .eq("restaurant_id", restaurant.id)
      .neq("status", "done")
      .order("created_at", { ascending: true })
      .limit(100);
    setRequests((data as TableRequest[]) ?? []);
    setLoading(false);
  }, [restaurant.id]);

  function playPing() {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
    } catch { /* audio not available */ }
  }

  useEffect(() => {
    load();
    const channel = supabase.channel(`requests:${restaurant.id}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "table_requests",
        filter: `restaurant_id=eq.${restaurant.id}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") playPing();
        load();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurant.id, load, soundEnabled]);

  async function move(id: string, status: TableRequest["status"]) {
    if (status === "done") {
      await supabase.from("table_requests").update({ status }).eq("id", id);
      setRequests(r => r.filter(x => x.id !== id));
    } else {
      await supabase.from("table_requests").update({ status }).eq("id", id);
      setRequests(r => r.map(x => x.id === id ? { ...x, status } : x));
    }
  }

  async function markAllDone() {
    const ids = pending.map(r => r.id);
    await Promise.all(ids.map(id => supabase.from("table_requests").update({ status: "done" }).eq("id", id)));
    setRequests(r => r.filter(x => !ids.includes(x.id)));
  }

  function applyFilters(list: TableRequest[]) {
    return list.filter(r => {
      const tableName = ((r.table as { name: string } | undefined)?.name ?? "").toLowerCase();
      const matchTable = !searchTable || tableName.includes(searchTable.toLowerCase());
      const matchType = filterType === "all" || r.type === filterType;
      return matchTable && matchType;
    });
  }

  const pending = applyFilters(requests.filter(r => r.status === "pending"));
  const seen = applyFilters(requests.filter(r => r.status === "seen"));

  const pendingCount = requests.filter(r => r.status === "pending").length;

  // Keyboard shortcuts: P = pick up first pending, D = mark first in-progress done
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
      if (e.key === "p" || e.key === "P") {
        const first = requests.find(r => r.status === "pending");
        if (first) move(first.id, "seen");
      } else if (e.key === "d" || e.key === "D") {
        const first = requests.find(r => r.status === "seen");
        if (first) move(first.id, "done");
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests]);

  // Estimated wait time: assume ~3 min per pending request
  const estWaitMin = pendingCount * 3;

  useEffect(() => {
    document.title = pendingCount > 0 ? `(${pendingCount}) Live Orders — MenuQR` : "Live Orders — MenuQR";
    return () => { document.title = "MenuQR — Digital Menu & Table Ordering"; };
  }, [pendingCount]);

  // Today stats (fetch separately including done)
  const [todayStats, setTodayStats] = useState({ total: 0, done: 0 });
  useEffect(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    supabase.from("table_requests")
      .select("status")
      .eq("restaurant_id", restaurant.id)
      .gte("created_at", start.toISOString())
      .then(({ data }) => {
        setTodayStats({
          total: data?.length ?? 0,
          done: data?.filter(r => r.status === "done").length ?? 0,
        });
      });
  }, [requests.length, restaurant.id]);

  if (loading) return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
        {[1,2,3].map(i => <div key={i} className="card" style={{ padding: "14px 16px", textAlign: "center" }}><div style={{ height: 32, background: "var(--border)", borderRadius: 8, marginBottom: 8 }} /><div style={{ height: 12, background: "var(--bg)", borderRadius: 6, width: "60%", margin: "0 auto" }} /></div>)}
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><SkeletonList count={3} /></div>
        <div style={{ flex: 1 }}><SkeletonList count={2} /></div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {[
          { label: "Today total", value: todayStats.total, color: "var(--accent)" },
          { label: "Completed", value: todayStats.done, color: "#22c55e" },
          { label: "Waiting now", value: pendingCount, color: "#E85D2F", extra: estWaitMin > 0 ? `~${estWaitMin} min wait` : undefined },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderLeft: `3px solid ${s.color}`, borderRadius: 10, padding: "14px 18px", boxShadow: "var(--shadow-card)" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
            {"extra" in s && s.extra && <div style={{ fontSize: 10, color: s.color, marginTop: 2, fontWeight: 600 }}>{s.extra}</div>}
          </div>
        ))}
      </div>

      {/* Search + Filter + Sound toolbar */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="🔍 Filter by table..."
          value={searchTable}
          onChange={e => setSearchTable(e.target.value)}
          style={{ flex: "1 1 140px", padding: "7px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, outline: "none" }}
        />
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, cursor: "pointer" }}
        >
          <option value="all">All types</option>
          {ALL_TYPES.map(t => (
            <option key={t} value={t}>{TYPE_LABEL[t]}</option>
          ))}
        </select>
        <button
          onClick={() => { const next = !soundEnabled; setSoundEnabled(next); localStorage.setItem("menuqr_sound", next ? "on" : "off"); }}
          title={soundEnabled ? "Sound on — click to mute" : "Sound off — click to enable"}
          style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid var(--border)", background: soundEnabled ? "#f0fdf4" : "var(--surface)", color: soundEnabled ? "#16a34a" : "#9ca3af", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          {soundEnabled ? "🔔 Sound on" : "🔕 Muted"}
        </button>
        {pendingCount > 0 && (
          <button
            onClick={markAllDone}
            style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: "#22c55e", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            ✅ Mark all done
          </button>
        )}
      </div>

      {/* Keyboard shortcuts hint */}
      <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", gap: 12 }}>
        <span><kbd style={{ background: "var(--border)", borderRadius: 4, padding: "1px 5px", fontFamily: "monospace" }}>P</kbd> Pick up first new</span>
        <span><kbd style={{ background: "var(--border)", borderRadius: 4, padding: "1px 5px", fontFamily: "monospace" }}>D</kbd> Mark first in-progress done</span>
      </div>

      {/* Kanban */}
      <style>{`
        .kanban-board { display: flex; gap: 12px; align-items: flex-start; }
        @media (max-width: 600px) { .kanban-board { flex-direction: column !important; } }
      `}</style>
      <div className="kanban-board" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* NEW */}
        <Column title="New" count={pending.length} color="#E85D2F" dotColor="#E85D2F">
          {pending.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-muted)", fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>✅</div>
              {searchTable || filterType !== "all" ? "No matching requests" : "All clear!"}
            </div>
          ) : pending.map(req => (
            <RequestCard
              key={req.id}
              req={req}
              onPickUp={() => move(req.id, "seen")}
            />
          ))}
        </Column>

        {/* IN PROGRESS */}
        <Column title="In Progress" count={seen.length} color="#3b82f6" dotColor="#3b82f6">
          {seen.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-muted)", fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>👋</div>
              {searchTable || filterType !== "all" ? "No matching requests" : "Nothing picked up"}
            </div>
          ) : seen.map(req => (
            <RequestCard
              key={req.id}
              req={req}
              onDone={() => move(req.id, "done")}
              onUndo={() => move(req.id, "pending")}
            />
          ))}
        </Column>
      </div>
    </div>
  );
}
