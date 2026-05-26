"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant, TableRequest } from "@/lib/types";

interface Props { restaurant: Restaurant }

const TYPE_LABEL: Record<string, string> = {
  waiter: "🙋 Waiter",
  bill: "💳 Bill",
  refill: "🔄 Refill",
  item_request: "🍽️ Order",
};

const TYPE_COLOR: Record<string, { bg: string; border: string; badge: string }> = {
  waiter:       { bg: "#fffbeb", border: "#fde68a", badge: "#f59e0b" },
  bill:         { bg: "#fff1f2", border: "#fecdd3", badge: "#f43f5e" },
  refill:       { bg: "#eff6ff", border: "#bfdbfe", badge: "#3b82f6" },
  item_request: { bg: "#f0fdf4", border: "#bbf7d0", badge: "#22c55e" },
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
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
  const colors = TYPE_COLOR[req.type] ?? { bg: "#f9fafb", border: "#e5e7eb", badge: "#6b7280" };
  const tableName = (req.table as { name: string } | undefined)?.name ?? "Unknown";
  return (
    <div style={{
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: 12,
      padding: "14px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
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
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{req.item_name}</span>
          )}
          {req.note && (
            <span style={{ fontSize: 12, color: "#6b7280" }}>📝 {req.note}</span>
          )}
        </div>
        <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>{timeAgo(req.created_at)}</span>
      </div>

      {/* Table */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#6b7280", fontSize: 12 }}>
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
            border: "1px solid #e5e7eb", background: "white",
            color: "#6b7280", fontSize: 12, cursor: "pointer",
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

export default function LiveOrders({ restaurant }: Props) {
  const supabase = createClient();
  const [requests, setRequests] = useState<TableRequest[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, [restaurant.id, load]);

  async function move(id: string, status: TableRequest["status"]) {
    if (status === "done") {
      // Remove from view after done
      await supabase.from("table_requests").update({ status }).eq("id", id);
      setRequests(r => r.filter(x => x.id !== id));
    } else {
      await supabase.from("table_requests").update({ status }).eq("id", id);
      setRequests(r => r.map(x => x.id === id ? { ...x, status } : x));
    }
  }

  const pending = requests.filter(r => r.status === "pending");
  const seen = requests.filter(r => r.status === "seen");

  const pendingCount = pending.length;

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
    <div style={{ display: "flex", gap: 12 }}>
      {[1, 2].map(i => (
        <div key={i} style={{ flex: 1, background: "#f3f4f6", borderRadius: 14, padding: 16, minHeight: 200, animation: "pulse 1.5s ease-in-out infinite" }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {[
          { label: "Today total", value: todayStats.total, color: "#6366f1" },
          { label: "Completed", value: todayStats.done, color: "#22c55e" },
          { label: "Waiting now", value: pendingCount, color: "#E85D2F" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Kanban */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* NEW */}
        <Column title="New" count={pending.length} color="#E85D2F" dotColor="#E85D2F">
          {pending.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 16px", color: "#9ca3af", fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>✅</div>
              All clear!
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
            <div style={{ textAlign: "center", padding: "32px 16px", color: "#9ca3af", fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>👋</div>
              Nothing picked up
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
