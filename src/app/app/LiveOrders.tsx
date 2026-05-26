"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant, TableRequest } from "@/lib/types";

interface Props { restaurant: Restaurant }

const REQUEST_LABELS: Record<string, string> = {
  waiter: "🙋 Waiter needed",
  bill: "💳 Bill please",
  refill: "🔄 Refill",
  item_request: "🍽️ Item request",
};

const REQUEST_COLORS: Record<string, string> = {
  waiter: "#fef9c3",
  bill: "#fee2e2",
  refill: "#dbeafe",
  item_request: "#dcfce7",
};

const REQUEST_BORDER: Record<string, string> = {
  waiter: "#fde047",
  bill: "#fca5a5",
  refill: "#93c5fd",
  item_request: "#86efac",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#fef3c7",
  seen: "#dbeafe",
  done: "#dcfce7",
};

const STATUS_TEXT: Record<string, string> = {
  pending: "🟡 Pending",
  seen: "🔵 Seen",
  done: "✅ Done",
};

export default function LiveOrders({ restaurant }: Props) {
  const supabase = createClient();
  const [requests, setRequests] = useState<TableRequest[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "seen" | "done">("pending");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("table_requests")
      .select("*, table:restaurant_tables(name)")
      .eq("restaurant_id", restaurant.id)
      .order("created_at", { ascending: false })
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
    // Realtime subscription
    const channel = supabase.channel(`requests:${restaurant.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "table_requests",
        filter: `restaurant_id=eq.${restaurant.id}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") playPing();
        load();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurant.id, load]);

  async function updateStatus(id: string, status: TableRequest["status"]) {
    await supabase.from("table_requests").update({ status }).eq("id", id);
    setRequests(reqs => reqs.map(r => r.id === id ? { ...r, status } : r));
  }

  async function clearDone() {
    await supabase.from("table_requests").delete().eq("restaurant_id", restaurant.id).eq("status", "done");
    setRequests(r => r.filter(x => x.status !== "done"));
  }

  async function markAllDone() {
    await supabase.from("table_requests").update({ status: "done" }).eq("restaurant_id", restaurant.id).eq("status", "pending");
    setRequests(reqs => reqs.map(r => r.status === "pending" ? { ...r, status: "done" as const } : r));
  }

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayRequests = requests.filter(r => new Date(r.created_at) >= todayStart);
  const todayTotal = todayRequests.length;
  const todayDone = todayRequests.filter(r => r.status === "done").length;
  const todayPending = todayRequests.filter(r => r.status === "pending").length;

  useEffect(() => {
    document.title = pendingCount > 0
      ? `(${pendingCount}) Live Orders — MenuQR`
      : "Live Orders — MenuQR";
    return () => { document.title = "MenuQR — Digital Menu & Table Ordering"; };
  }, [pendingCount]);

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ background: "#f3f4f6", borderRadius: 10, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, animation: "pulse 1.5s ease-in-out infinite" }}>
          <div style={{ flex: 1 }}>
            <div style={{ height: 16, background: "#e5e7eb", borderRadius: 6, width: "50%", marginBottom: 8 }} />
            <div style={{ height: 13, background: "#e5e7eb", borderRadius: 6, width: "30%" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
            <div style={{ height: 13, background: "#e5e7eb", borderRadius: 6, width: 60 }} />
            <div style={{ height: 28, background: "#e5e7eb", borderRadius: 6, width: 80 }} />
          </div>
        </div>
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* TODAY'S STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {[
          { label: "Total today", value: todayTotal, color: "#6366f1" },
          { label: "Done", value: todayDone, color: "#16a34a" },
          { label: "Pending", value: todayPending, color: "#E85D2F" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontWeight: 700, fontSize: 20 }}>
          ⚡ Live Orders {pendingCount > 0 && <span style={{ marginLeft: 8, background: "#E85D2F", color: "white", fontSize: 13, padding: "2px 8px", borderRadius: 99 }}>{pendingCount}</span>}
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          {pendingCount > 0 && <button className="btn-primary" onClick={markAllDone} style={{ fontSize: 13 }}>✅ Mark all done</button>}
          <button className="btn-secondary" onClick={clearDone} style={{ fontSize: 13 }}>🗑️ Clear done</button>
        </div>
      </div>

      {/* FILTER TABS */}
      <div style={{ display: "flex", gap: 4 }}>
        {(["all", "pending", "seen", "done"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid var(--border)", background: filter === f ? "var(--accent)" : "var(--surface)", color: filter === f ? "white" : "var(--text-muted)", cursor: "pointer", fontSize: 13, fontWeight: filter === f ? 700 : 400 }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
          {filter === "pending" ? (
            <>
              <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
              <p style={{ fontWeight: 600, fontSize: 16, color: "#16a34a" }}>All clear! No pending requests.</p>
            </>
          ) : (
            <>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🟢</div>
              <p>No {filter === "all" ? "" : filter} requests right now.</p>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(req => (
            <div key={req.id} style={{ background: STATUS_COLORS[req.status], border: "1px solid var(--border)", borderLeft: `4px solid ${REQUEST_BORDER[req.type] ?? "#e5e7eb"}`, borderRadius: 10, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{REQUEST_LABELS[req.type] ?? req.type}</span>
                  {req.item_name && <span style={{ fontSize: 13, color: "var(--text-muted)" }}>— {req.item_name}</span>}
                </div>
                <div style={{ fontSize: 13, color: "var(--text)" }}>
                  🪑 {(req.table as { name: string } | undefined)?.name ?? "Unknown table"}
                </div>
                {req.note && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>📝 {req.note}</div>}
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{new Date(req.created_at).toLocaleTimeString()}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{STATUS_TEXT[req.status]}</span>
                {req.status === "pending" && (
                  <button onClick={() => updateStatus(req.id, "seen")} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, border: "1px solid #93c5fd", background: "#eff6ff", cursor: "pointer", fontWeight: 600 }}>Mark seen</button>
                )}
                {(req.status === "pending" || req.status === "seen") && (
                  <button onClick={() => updateStatus(req.id, "done")} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, border: "1px solid #86efac", background: "#f0fdf4", cursor: "pointer", fontWeight: 600 }}>✅ Done</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
