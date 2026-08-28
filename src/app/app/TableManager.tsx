"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant, TableRow } from "@/lib/types";
import ContextMenu, { type ContextMenuAction } from "@/components/ContextMenu";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmDialog";
import { Skeleton, SkeletonList } from "@/components/Skeleton";
import { IconTable, IconQr, IconCopy, IconDownload, IconCheck, IconUsers } from "@/components/icons";

interface Props { restaurant: Restaurant }

function relativeWait(createdAt: string, now: number): string {
  const secs = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 1000));
  if (secs < 60) return `waiting ${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `waiting ${mins}m`;
  return `waiting ${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function TableManager({ restaurant }: Props) {
  const supabase = createClient();
  const toast = useToast();
  const confirm = useConfirm();
  const [tables, setTables] = useState<TableRow[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState<TableRow | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [lastRequests, setLastRequests] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [modalCopied, setModalCopied] = useState(false);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [pendingByTable, setPendingByTable] = useState<Record<string, number>>({});
  const [pendingSessions, setPendingSessions] = useState<Array<{ id: string; session_id: string; table: { name: string }; created_at: string }>>([]);
  const [now, setNow] = useState(() => Date.now());

  // Single shared interval driving all "waiting Xm" timers
  useEffect(() => {
    if (pendingSessions.length === 0) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [pendingSessions.length]);

  // Context menu
  interface CtxMenu { x: number; y: number; items: ContextMenuAction[] }
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);

  const openCtxMenu = useCallback((e: React.MouseEvent, items: ContextMenuAction[]) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, items });
  }, []);

  useEffect(() => {
    supabase.from("restaurant_tables").select("*").eq("restaurant_id", restaurant.id)
      .then(({ data, error }) => {
        if (error) toast.error("Could not load tables");
        setTables((data ?? []).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })));
        setLoading(false);
      });
  }, [restaurant.id]);

  // Last-request times per table — only needs to run once tables are loaded;
  // keyed on tablesLoaded so add/delete/toggle mutations don't refire it (audit 4)
  const tablesLoaded = tables.length > 0;
  useEffect(() => {
    if (!tablesLoaded) return;
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
  }, [restaurant.id, tablesLoaded]);

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
        if (!res.ok) return;
        const data = await res.json();
        setPendingSessions(data.sessions ?? []);
      } catch { /* network hiccup — the fallback refresh will catch up */ }
    };
    fetchSessions();
    // Realtime: react instantly to new / updated guest sessions
    const channel = supabase.channel(`table-sessions:${restaurant.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "table_sessions", filter: `restaurant_id=eq.${restaurant.id}` }, fetchSessions)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "table_sessions", filter: `restaurant_id=eq.${restaurant.id}` }, fetchSessions)
      .subscribe();
    // Slow fallback refresh in case a realtime event is missed
    const interval = setInterval(fetchSessions, 30000);
    return () => { supabase.removeChannel(channel); clearInterval(interval); };
  }, [restaurant.id]);

  async function approveSession(session_id: string) {
    try {
      const res = await fetch("/api/session/check", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id, action: "approve" }),
      });
      if (!res.ok) { toast.error("Could not approve the guest"); return; }
      setPendingSessions(prev => prev.filter(s => s.session_id !== session_id));
    } catch {
      toast.error("Could not approve the guest");
    }
  }

  async function declineSession(session_id: string) {
    try {
      const res = await fetch("/api/session/check", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id, action: "decline" }),
      });
      if (!res.ok) { toast.error("Could not decline the guest"); return; }
      setPendingSessions(prev => prev.filter(s => s.session_id !== session_id));
    } catch {
      toast.error("Could not decline the guest");
    }
  }

  function copyLink(table: TableRow) {
    const url = `${window.location.origin}/menu/${table.token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(table.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  function copyModalLink(table: TableRow) {
    const url = `${window.location.origin}/menu/${table.token}`;
    navigator.clipboard.writeText(url).then(() => {
      setModalCopied(true);
      setTimeout(() => setModalCopied(false), 2000);
    });
  }

  async function addTable() {
    if (!newName.trim()) return;
    const token = crypto.randomUUID();
    const { data, error } = await supabase.from("restaurant_tables")
      .insert({ restaurant_id: restaurant.id, name: newName.trim(), token, is_active: true })
      .select().single();
    if (error) { toast.error("Could not add the table"); return; }
    if (data) {
      // Re-apply the same sort as load so a new table lands in the right spot
      setTables(t => [...t, data as TableRow].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })));
      setNewName("");
    }
  }

  function startRename(table: TableRow) {
    setRenaming({ id: table.id, name: table.name });
  }

  async function saveRename() {
    if (!renaming) return;
    const name = renaming.name.trim();
    if (!name) { toast.error("Table name can't be empty"); return; }
    const { error } = await supabase.from("restaurant_tables").update({ name }).eq("id", renaming.id);
    if (error) { toast.error("Could not rename the table"); return; }
    setTables(t => t.map(x => x.id === renaming.id ? { ...x, name } : x)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })));
    setRenaming(null);
    toast.success("Table renamed");
  }

  /** Issue a fresh token — for a QR sheet that leaked or went missing. */
  async function regenerateToken(table: TableRow) {
    const ok = await confirm({
      title: `New QR code for "${table.name}"?`,
      message: "The current printed QR code stops working immediately and you'll need to print a new one. Orders and history are kept.",
      confirmLabel: "Yes, generate a new code",
      danger: true,
    });
    if (!ok) return;
    const token = crypto.randomUUID();
    const { error } = await supabase.from("restaurant_tables").update({ token }).eq("id", table.id);
    if (error) { toast.error("Could not generate a new QR code"); return; }
    // Any guest holding a session on the old code must request access again
    try {
      await fetch("/api/session/close-table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table_id: table.id }),
      });
    } catch { /* token is already rotated; session cleanup is best-effort */ }
    setTables(t => t.map(x => x.id === table.id ? { ...x, token } : x));
    toast.success("New QR code generated — print it again");
  }

  async function deleteTable(table: TableRow) {
    const ok = await confirm({
      title: `Delete "${table.name}"?`,
      message: "Its QR code will stop working. This cannot be undone.",
      confirmLabel: "Yes, delete",
      danger: true,
    });
    if (!ok) return;
    const { error } = await supabase.from("restaurant_tables").delete().eq("id", table.id);
    if (error) { toast.error("Could not delete the table"); return; }
    toast.success("Table deleted");
    setTables(t => t.filter(x => x.id !== table.id));
  }

  async function toggleAll() {
    const anyActive = tables.some(t => t.is_active);
    const newState = !anyActive;
    const { error } = await supabase.from("restaurant_tables").update({ is_active: newState }).eq("restaurant_id", restaurant.id);
    if (error) { toast.error("Could not update the tables"); return; }
    // Closing all tables must also close their guest sessions — otherwise
    // guests jump straight back in with no re-approval once tables reopen
    if (!newState) {
      await Promise.allSettled(tables.map(t =>
        fetch("/api/session/close-table", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table_id: t.id }),
        })
      ));
    }
    setTables(tables.map(t => ({ ...t, is_active: newState })));
  }

  async function openTable(table: TableRow) {
    const { error } = await supabase.from("restaurant_tables").update({ is_active: true }).eq("id", table.id);
    if (error) { toast.error("Could not open the table"); return; }
    setTables(tables.map(t => t.id === table.id ? { ...t, is_active: true } : t));
  }

  async function closeTable(table: TableRow) {
    const { error } = await supabase.from("restaurant_tables").update({ is_active: false }).eq("id", table.id);
    if (error) { toast.error("Could not close the table"); return; }
    try {
      await fetch("/api/session/close-table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table_id: table.id }),
      });
    } catch { /* table is closed either way; session cleanup is best-effort */ }
    setTables(tables.map(t => t.id === table.id ? { ...t, is_active: false } : t));
  }

  async function clearAndCloseTable(table: TableRow) {
    try {
      const res = await fetch("/api/table/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table_id: table.id, restaurant_id: restaurant.id }),
      });
      if (!res.ok) { toast.error("Could not clear the table"); return; }
      setPendingByTable(prev => ({ ...prev, [table.id]: 0 }));
    } catch {
      toast.error("Could not clear the table");
    }
  }

  async function showQR(table: TableRow) {
    setQrDataUrl("");
    setModalCopied(false);
    setQrModal(table);
    const url = `${window.location.origin}/menu/${table.token}`;
    const QRCode = (await import("qrcode")).default;
    const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 });
    setQrDataUrl(dataUrl);
  }

  function downloadQR(table: TableRow) {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `table-${table.name}.png`;
    link.click();
  }

  function buildTableCtxMenu(table: TableRow): ContextMenuAction[] {
    const pending = pendingByTable[table.id] ?? 0;
    const items: ContextMenuAction[] = [];
    if (table.is_active) {
      items.push({
        label: pending > 0 ? `Clear all orders (${pending} pending marked done, guests signed out)` : "Clear all orders (guests signed out)",
        action: () => clearAndCloseTable(table),
      });
      items.push({
        label: "Close table",
        action: () => closeTable(table),
      });
    } else {
      items.push({
        label: "Open table",
        action: () => openTable(table),
      });
    }
    items.push({
      label: "Show QR code",
      action: () => showQR(table),
    });
    items.push({
      label: "Copy link",
      action: () => copyLink(table),
    });
    items.push({ separator: true });
    items.push({
      label: "Rename table",
      action: () => startRename(table),
    });
    items.push({
      label: "Generate new QR code",
      action: () => regenerateToken(table),
    });
    items.push({ separator: true });
    items.push({
      label: "Delete table",
      danger: true,
      action: () => deleteTable(table),
    });
    return items;
  }

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }} aria-busy="true">
      <Skeleton height={28} width="40%" borderRadius={8} />
      <SkeletonList count={4} />
    </div>
  );

  const ringStyle = (color: string, pulse = false): React.CSSProperties => ({
    width: 12, height: 12, borderRadius: "50%",
    border: `2px solid ${color}`,
    background: "transparent",
    display: "inline-block",
    animation: pulse ? "ringPulse 1.4s ease-in-out infinite" : undefined,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`
        @keyframes ringPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.35); }
          50% { box-shadow: 0 0 0 5px rgba(220,38,38,0); }
        }
      `}</style>

      {/* Pending guest approvals — notification bar */}
      {pendingSessions.length > 0 && (
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderLeft: "3px solid var(--accent)",
          borderRadius: "var(--radius-md)",
          padding: "12px 16px",
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          <div style={{ fontWeight: 700, fontSize: "var(--fs-sm)", color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
            <IconUsers width={16} height={16} style={{ color: "var(--accent)" }} />
            {pendingSessions.length} guest{pendingSessions.length !== 1 ? "s" : ""} waiting
          </div>
          {pendingSessions.map(s => (
            <div key={s.session_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "6px 0", borderTop: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
                <span style={{ fontWeight: 600, fontSize: "var(--fs-sm)", color: "var(--text)" }}>{s.table?.name ?? "Unknown table"}</span>
                <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{relativeWait(s.created_at, now)}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => approveSession(s.session_id)}
                  style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "6px 16px", fontSize: "var(--fs-sm)", fontWeight: 600, cursor: "pointer" }}
                >Approve</button>
                <button
                  onClick={() => declineSession(s.session_id)}
                  aria-label="Decline guest access request"
                  style={{ background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "6px 14px", fontSize: "var(--fs-sm)", fontWeight: 500, cursor: "pointer" }}
                >Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontWeight: 700, fontSize: "var(--fs-lg)", display: "flex", alignItems: "center", gap: 10, margin: 0 }}>
          <IconTable width={20} height={20} style={{ color: "var(--text-muted)" }} />
          Tables
        </h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {tables.length > 0 && (
            <button onClick={toggleAll} style={{ fontSize: "var(--fs-sm)", padding: "6px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", cursor: "pointer", fontWeight: 600 }}>
              {tables.some(t => t.is_active) ? "Close all" : "Open all"}
            </button>
          )}
          <Link href="/app/print-qr" style={{ fontSize: "var(--fs-sm)", padding: "6px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <IconQr width={14} height={14} />
            Print all QR codes
          </Link>
        </div>
      </div>

      {/* Add-table — lightweight inline form */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Add a table, e.g. Table 1, Bar Seat A…"
          onKeyDown={e => e.key === "Enter" && addTable()}
          style={{ flex: 1 }}
        />
        <button className="btn-primary" onClick={addTable} style={{ whiteSpace: "nowrap" }}>Add</button>
      </div>

      {tables.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 16px", color: "var(--text-muted)" }}>
          <IconTable width={32} height={32} style={{ color: "var(--text-muted)", opacity: 0.6, marginBottom: 10 }} />
          <p style={{ fontWeight: 600, fontSize: "var(--fs-md)", color: "var(--text)", marginBottom: 4 }}>No tables yet</p>
          <p style={{ fontSize: "var(--fs-sm)", margin: 0 }}>Add a table above to generate a QR code for guests.</p>
        </div>
      ) : (
        <>
          {/* STATUS GRID — read-only */}
          <div className="card" style={{ padding: "18px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <h3 style={{ fontWeight: 700, fontSize: "var(--fs-sm)", margin: 0 }}>Table Status</h3>
              <div style={{ display: "flex", gap: 14, fontSize: "var(--fs-xs)", color: "var(--text-muted)", flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={ringStyle("#22c55e")} />Idle</span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={ringStyle("#f59e0b")} />Has requests</span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={ringStyle("#dc2626")} />Urgent (3+)</span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={ringStyle("#9ca3af")} />Closed</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 10 }}>
              {tables.map(table => {
                const pending = pendingByTable[table.id] ?? 0;
                const isUrgent = pending >= 3;
                const hasPending = pending > 0 && !isUrgent;
                const ringColor = !table.is_active ? "#9ca3af" : isUrgent ? "#dc2626" : hasPending ? "#f59e0b" : "#22c55e";
                return (
                  <div
                    key={table.id}
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-lg)",
                      padding: "14px 10px",
                      textAlign: "center",
                    }}
                    title={`${table.name} — ${!table.is_active ? "Closed" : pending > 0 ? `${pending} pending` : "Open"}`}
                  >
                    <span style={{ ...ringStyle(ringColor, isUrgent), marginBottom: 8 }} />
                    <div style={{ color: !table.is_active ? "var(--text-muted)" : "var(--text)", marginBottom: 4 }}>
                      <IconTable width={18} height={18} style={{ opacity: table.is_active ? 0.8 : 0.4 }} />
                    </div>
                    <div style={{ fontSize: "var(--fs-xs)", fontWeight: 600, color: !table.is_active ? "var(--text-muted)" : "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{table.name}</div>
                    {pending > 0 && <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: isUrgent ? "#dc2626" : "#f59e0b", marginTop: 3 }}>{pending} pending</div>}
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
                  cursor: "default",
                  transition: "border-color 0.1s",
                }}
              >
                <div>
                  {renaming?.id === table.id ? (
                    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                      <input
                        autoFocus
                        value={renaming.name}
                        onChange={e => setRenaming({ id: table.id, name: e.target.value })}
                        onKeyDown={e => { if (e.key === "Enter") saveRename(); if (e.key === "Escape") setRenaming(null); }}
                        style={{ width: 160, padding: "5px 9px", fontSize: "var(--fs-sm)", fontWeight: 700, borderRadius: "var(--radius-sm)" }}
                      />
                      <button onClick={saveRename} style={{ padding: "5px 11px", borderRadius: "var(--radius-sm)", border: "none", background: "var(--accent)", color: "#fff", fontSize: "var(--fs-xs)", fontWeight: 700, cursor: "pointer" }}>Save</button>
                      <button onClick={() => setRenaming(null)} style={{ padding: "5px 9px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)", fontSize: "var(--fs-xs)", cursor: "pointer" }}>Cancel</button>
                    </span>
                  ) : (
                    <span
                      onDoubleClick={() => startRename(table)}
                      title="Double-click to rename"
                      style={{ fontWeight: 700, cursor: "text" }}
                    >{table.name}</span>
                  )}
                  {pendingByTable[table.id] > 0 && (
                    <span style={{ marginLeft: 8, fontSize: "var(--fs-xs)", padding: "2px 8px", borderRadius: "var(--radius-pill)", border: "1px solid var(--accent)", color: "var(--accent)", fontWeight: 700 }}>
                      {pendingByTable[table.id]} waiting
                    </span>
                  )}
                  <span style={{ marginLeft: 8, fontSize: "var(--fs-xs)", padding: "2px 8px", borderRadius: "var(--radius-pill)", border: `1px solid ${table.is_active ? "#22c55e55" : "var(--border)"}`, color: table.is_active ? "#22c55e" : "var(--text-muted)", fontWeight: 600 }}>
                    {table.is_active ? "Open" : "Closed"}
                  </span>
                  {lastRequests[table.id] && (
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)", marginTop: 3 }}>
                      Last request: {new Date(lastRequests[table.id]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                </div>
                {/* Quick actions */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    onClick={() => copyLink(table)}
                    aria-label={copiedId === table.id ? "Link copied" : `Copy menu link for ${table.name}`}
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", color: copiedId === table.id ? "#22c55e" : "var(--text-muted)" }}
                    title={copiedId === table.id ? "Copied" : "Copy link"}
                  >
                    {copiedId === table.id ? <IconCheck width={14} height={14} /> : <IconCopy width={14} height={14} />}
                  </button>
                  <button
                    onClick={() => showQR(table)}
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", color: "var(--text-muted)" }}
                    title="Show QR code"
                    aria-label={`Show QR code for ${table.name}`}
                  >
                    <IconQr width={14} height={14} />
                  </button>
                  {/* more actions — tap on mobile, right-click also works on desktop */}
                  <button
                    onClick={(e) => { e.stopPropagation(); openCtxMenu(e, buildTableCtxMenu(table)); }}
                    style={{ fontSize: "var(--fs-md)", padding: "5px 9px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", color: "var(--text-muted)", fontWeight: 700, lineHeight: 1 }}
                    title="More options"
                    aria-label={`More options for ${table.name}`}
                  >⋮</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* QR MODAL */}
      {qrModal && (
        <div onClick={() => setQrModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ width: "100%", maxWidth: 380, textAlign: "center", padding: "24px 24px 20px" }}>
            <h3 style={{ fontWeight: 700, fontSize: "var(--fs-lg)", margin: "0 0 16px" }}>{qrModal.name}</h3>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={`QR code for ${qrModal.name}`} style={{ width: 260, height: 260, margin: "0 auto 16px", display: "block", borderRadius: "var(--radius-md)" }} />
            ) : (
              <div style={{ width: 260, height: 260, margin: "0 auto 16px", background: "var(--surface-2)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>Generating…</div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 18 }}>
              <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "var(--fs-xs)", color: "var(--text-muted)", wordBreak: "break-all", textAlign: "left" }}>
                {typeof window !== "undefined" && `${window.location.origin}/menu/${qrModal.token}`}
              </span>
              <button
                onClick={() => copyModalLink(qrModal)}
                aria-label={modalCopied ? "Link copied" : "Copy link"}
                title={modalCopied ? "Copied" : "Copy link"}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "5px 8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", color: modalCopied ? "#22c55e" : "var(--text-muted)", flexShrink: 0 }}
              >
                {modalCopied ? <IconCheck width={14} height={14} /> : <IconCopy width={14} height={14} />}
              </button>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button
                className="btn-secondary"
                onClick={() => downloadQR(qrModal)}
                disabled={!qrDataUrl}
                style={{ opacity: qrDataUrl ? 1 : 0.5, cursor: qrDataUrl ? "pointer" : "default", display: "inline-flex", alignItems: "center", gap: 7 }}
              >
                <IconDownload width={15} height={15} />
                {qrDataUrl ? "Download PNG" : "Generating…"}
              </button>
              <button className="btn-primary" onClick={() => setQrModal(null)}>Done</button>
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
