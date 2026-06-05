"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant, TableRow } from "@/lib/types";
import ContextMenu, { type ContextMenuAction } from "@/components/ContextMenu";

interface Props { restaurant: Restaurant }

export default function TableManager({ restaurant }: Props) {
  const supabase = createClient();
  const [tables, setTables] = useState<TableRow[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState<TableRow | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [lastRequests, setLastRequests] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pendingByTable, setPendingByTable] = useState<Record<string, number>>({});
  const [pendingSessions, setPendingSessions] = useState<Array<{ id: string; session_id: string; table: { name: string }; created_at: string }>>([]);

  // Context menu
  interface CtxMenu { x: number; y: number; items: ContextMenuAction[] }
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);

  const openCtxMenu = useCallback((e: React.MouseEvent, items: ContextMenuAction[]) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, items });
  }, []);

  useEffect(() => {
    supabase.from("restaurant_tables").select("*").eq("restaurant_id", restaurant.id).order("name")
      .then(({ data }) => { setTables(data ?? []); setLoading(false); });
  }, [restaurant.id]);

  useEffect(() => {
    if (tables.length === 0) return;
    supabase.from("table_requests")
      .select("table_id, created_at")
      .eq("restaurant_id", restaurant.id)
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, string> = {};
        for (const r of data) {
          if (!map[r.table_id]) map[r.table_id] = r.created_at;
        }
        setLastRequests(map);
      });
  }, [tables, restaurant.id]);

  useEffect(() => {
    if (tables.length === 0) return;
    const fetchPending = () =>
      supabase.from("table_requests").select("table_id").eq("restaurant_id", restaurant.id).eq("status", "pending").then(({ data }) => {
        if (!data) return;
        const counts: Record<string, number> = {};
        for (const r of data) counts[r.table_id] = (counts[r.table_id] ?? 0) + 1;
        setPendingByTable(counts);
      });
    fetchPending();
    const channel = supabase.channel("tablemanager-pending")
      .on("postgres_changes", { event: "*", schema: "public", table: "table_requests", filter: `restaurant_id=eq.${restaurant.id}` }, fetchPending)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tables.length, restaurant.id]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch(`/api/session/pending?restaurant_id=${restaurant.id}`);
        const data = await res.json();
        setPendingSessions(data.sessions ?? []);
      } catch {}
    };
    fetchSessions();
    const interval = setInterval(fetchSessions, 4000);
    return () => clearInterval(interval);
  }, [restaurant.id]);

  async function approveSession(session_id: string) {
    await fetch("/api/session/check", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id, action: "approve" }),
    });
    setPendingSessions(prev => prev.filter(s => s.session_id !== session_id));
  }

  async function declineSession(session_id: string) {
    await fetch("/api/session/check", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id, action: "decline" }),
    });
    setPendingSessions(prev => prev.filter(s => s.session_id !== session_id));
  }

  function copyLink(table: TableRow) {
    const url = `${window.location.origin}/menu/${table.token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(table.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  async function addTable() {
    if (!newName.trim()) return;
    const token = crypto.randomUUID();
    const { data } = await supabase.from("restaurant_tables")
      .insert({ restaurant_id: restaurant.id, name: newName.trim(), token, is_active: true })
      .select().single();
    if (data) { setTables(t => [...t, data as TableRow]); setNewName(""); }
  }

  async function deleteTable(id: string) {
    await supabase.from("restaurant_tables").delete().eq("id", id);
    setTables(t => t.filter(x => x.id !== id));
  }

  async function toggleAll() {
    const anyActive = tables.some(t => t.is_active);
    const newState = !anyActive;
    await supabase.from("restaurant_tables").update({ is_active: newState }).eq("restaurant_id", restaurant.id);
    setTables(tables.map(t => ({ ...t, is_active: newState })));
  }

  async function openTable(table: TableRow) {
    await supabase.from("restaurant_tables").update({ is_active: true }).eq("id", table.id);
    setTables(tables.map(t => t.id === table.id ? { ...t, is_active: true } : t));
  }

  async function closeTable(table: TableRow) {
    await supabase.from("restaurant_tables").update({ is_active: false }).eq("id", table.id);
    await fetch("/api/session/close-table", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table_id: table.id }),
    });
    setTables(tables.map(t => t.id === table.id ? { ...t, is_active: false } : t));
  }

  async function clearAndCloseTable(table: TableRow) {
    await fetch("/api/table/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table_id: table.id, restaurant_id: restaurant.id }),
    });
    setPendingByTable(prev => ({ ...prev, [table.id]: 0 }));
  }

  async function showQR(table: TableRow) {
    setQrModal(table);
    const url = `${window.location.origin}/menu/${table.token}`;
    const QRCode = (await import("qrcode")).default;
    const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 });
    setQrDataUrl(dataUrl);
  }

  function downloadQR(table: TableRow) {
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `table-${table.name}.png`;
    link.click();
  }

  function buildTableCtxMenu(table: TableRow): ContextMenuAction[] {
    const items: ContextMenuAction[] = [];
    if (table.is_active) {
      items.push({
        label: "Clear orders",
        icon: "🧹",
        action: () => clearAndCloseTable(table),
      });
      items.push({
        label: "Close table",
        icon: "🔒",
        action: () => closeTable(table),
      });
    } else {
      items.push({
        label: "Open table",
        icon: "🔓",
        action: () => openTable(table),
      });
    }
    items.push({ separator: true } as unknown as ContextMenuAction);
    items.push({
      label: "Show QR code",
      icon: "📱",
      action: () => showQR(table),
    });
    items.push({
      label: "Copy link",
      icon: "🔗",
      action: () => copyLink(table),
    });
    items.push({ separator: true } as unknown as ContextMenuAction);
    items.push({
      label: "Delete table",
      icon: "🗑️",
      danger: true,
      action: () => deleteTable(table.id),
    });
    return items;
  }

  if (loading) return <p style={{ color: "var(--text-muted)" }}>Loading tables...</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      {/* Pending guest approvals */}
      {pendingSessions.length > 0 && (
        <div style={{ background: "var(--surface)", border: "1px solid #f59e0b55", borderRadius: 14, padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#f59e0b", display: "flex", alignItems: "center", gap: 8 }}>
            🔔 Guest Access Requests ({pendingSessions.length})
          </div>
          {pendingSessions.map(s => (
            <div key={s.session_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "var(--surface2)", borderRadius: 10, padding: "10px 14px" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>🪑 {s.table?.name ?? "Unknown table"}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  Wants to access the menu · {new Date(s.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => approveSession(s.session_id)} style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>✅ Approve</button>
                <button onClick={() => declineSession(s.session_id)} style={{ background: "var(--surface)", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 12px", fontSize: 13, cursor: "pointer" }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontWeight: 700, fontSize: 20 }}>🍽️ Table Manager</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {tables.length > 0 && (
            <button onClick={toggleAll} style={{ fontSize: 13, padding: "6px 14px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", cursor: "pointer", fontWeight: 600 }}>
              {tables.some(t => t.is_active) ? "🔒 Close all" : "🔓 Open all"}
            </button>
          )}
          <Link href="/app/print-qr" style={{ fontSize: 13, padding: "6px 14px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", textDecoration: "none", fontWeight: 600 }}>🖨️ Print all QR codes</Link>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>Add a table</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder='e.g. Table 1, Bar Seat A, Terrace 3...' onKeyDown={e => e.key === "Enter" && addTable()} />
          <button className="btn-primary" onClick={addTable} style={{ whiteSpace: "nowrap" }}>+ Add</button>
        </div>
      </div>

      {tables.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", background: "var(--item-available-bg)", borderRadius: 14, border: "2px dashed var(--border)" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🍽️</div>
          <p style={{ fontWeight: 600, fontSize: 15, color: "var(--text)", marginBottom: 4 }}>No tables yet</p>
          <p style={{ fontSize: 13 }}>Add a table above to generate a QR code for guests.</p>
        </div>
      ) : (
        <>
          {/* STATUS GRID — read-only */}
          <div className="card" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
              <h3 style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>Table Status</h3>
              <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--text-muted)", flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />Idle</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />Has requests</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#dc2626", display: "inline-block" }} />Urgent (3+)</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#9ca3af", display: "inline-block" }} />Closed</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8 }}>
              {tables.map(table => {
                const pending = pendingByTable[table.id] ?? 0;
                const isUrgent = pending >= 3;
                const hasPending = pending > 0 && !isUrgent;
                const bgColor = !table.is_active ? "var(--item-available-bg)" : isUrgent ? "var(--card-late-bg)" : hasPending ? "var(--card-waiter-bg)" : "var(--card-order-bg)";
                const borderColor = !table.is_active ? "var(--border)" : isUrgent ? "#dc2626" : hasPending ? "#f59e0b" : "#22c55e";
                const dotColor = !table.is_active ? "var(--text-muted)" : isUrgent ? "#dc2626" : hasPending ? "#f59e0b" : "#22c55e";
                const textColor = !table.is_active ? "var(--text-muted)" : isUrgent ? "#dc2626" : hasPending ? "#f59e0b" : "#22c55e";
                return (
                  <div
                    key={table.id}
                    style={{ background: bgColor, border: `2px solid ${borderColor}`, borderRadius: 10, padding: "10px 8px", textAlign: "center", transition: "transform 0.1s" }}
                    title={`${table.name} — ${!table.is_active ? "Closed" : pending > 0 ? `${pending} pending` : "Open"}`}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, display: "inline-block", marginBottom: 4 }} />
                    <div style={{ fontSize: 18, marginBottom: 2 }}>🍽️</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: textColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{table.name}</div>
                    {pending > 0 && <div style={{ fontSize: 10, fontWeight: 800, color: "#E85D2F", marginTop: 2 }}>{pending} !</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* TABLE LIST — right-click for actions */}
          <div style={{ display: "grid", gap: 8 }}>
            {tables.map(table => (
              <div
                key={table.id}
                className="card"
                onContextMenu={(e) => openCtxMenu(e, buildTableCtxMenu(table))}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 12, padding: "12px 16px", flexWrap: "wrap",
                  cursor: "context-menu",
                  transition: "border-color 0.1s",
                }}
              >
                <div>
                  <span style={{ fontWeight: 700 }}>{table.name}</span>
                  {pendingByTable[table.id] > 0 && (
                    <span style={{ marginLeft: 8, fontSize: 12, padding: "2px 8px", borderRadius: 99, background: "#E85D2F", color: "white", fontWeight: 700, animation: "pulse 1.5s ease-in-out infinite" }}>
                      {pendingByTable[table.id]} waiting
                    </span>
                  )}
                  <span style={{ marginLeft: 8, fontSize: 12, padding: "2px 8px", borderRadius: 99, background: table.is_active ? "var(--card-order-bg)" : "var(--card-bill-bg)", color: table.is_active ? "#22c55e" : "#f43f5e", fontWeight: 600 }}>
                    {table.is_active ? "Open" : "Closed"}
                  </span>
                  {lastRequests[table.id] && (
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                      Last request: {new Date(lastRequests[table.id]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                </div>
                {/* Quick actions — always visible */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    onClick={() => copyLink(table)}
                    style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, border: "1px solid var(--border)", background: copiedId === table.id ? "#dcfce7" : "var(--surface)", cursor: "pointer", fontWeight: 600, color: copiedId === table.id ? "#166534" : "var(--text-muted)" }}
                  >
                    {copiedId === table.id ? "✅" : "🔗"}
                  </button>
                  <button
                    onClick={() => showQR(table)}
                    style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", color: "var(--text-muted)" }}
                    title="Show QR code"
                  >📱</button>
                  {/* Hint */}
                  <span
                    style={{ fontSize: 11, color: "var(--text-muted)", opacity: 0.4, userSelect: "none" }}
                    title="Right-click for more options"
                  >⋯</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* QR MODAL */}
      {qrModal && (
        <div onClick={() => setQrModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>
            <h3 style={{ fontWeight: 700, marginBottom: 4 }}>QR Code — {qrModal.name}</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16, wordBreak: "break-all" }}>
              {typeof window !== "undefined" && `${window.location.origin}/menu/${qrModal.token}`}
            </p>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR" style={{ width: 220, height: 220, margin: "0 auto 16px", display: "block", borderRadius: 8 }} />
            ) : (
              <div style={{ width: 220, height: 220, margin: "0 auto 16px", background: "var(--item-available-bg)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>Loading...</div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button className="btn-primary" onClick={() => downloadQR(qrModal)}>⬇️ Download PNG</button>
              <button className="btn-secondary" onClick={() => setQrModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={ctxMenu.items}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
}
