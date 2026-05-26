"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant, TableRow } from "@/lib/types";

interface Props { restaurant: Restaurant }

export default function TableManager({ restaurant }: Props) {
  const supabase = createClient();
  const [tables, setTables] = useState<TableRow[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState<TableRow | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [lastRequests, setLastRequests] = useState<Record<string, string>>({});

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

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pendingByTable, setPendingByTable] = useState<Record<string, number>>({});

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

  async function toggleTable(table: TableRow) {
    await supabase.from("restaurant_tables").update({ is_active: !table.is_active }).eq("id", table.id);
    setTables(tables.map(t => t.id === table.id ? { ...t, is_active: !t.is_active } : t));
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

  if (loading) return <p style={{ color: "var(--text-muted)" }}>Loading tables...</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontWeight: 700, fontSize: 20 }}>🪑 Table Manager</h2>
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
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", background: "#f9fafb", borderRadius: 14, border: "2px dashed var(--border)" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🪑</div>
          <p style={{ fontWeight: 600, fontSize: 15, color: "#374151", marginBottom: 4 }}>No tables yet</p>
          <p style={{ fontSize: 13 }}>Add a table above to generate a QR code for guests.</p>
        </div>
      ) : (
        <>
          {/* STATUS GRID */}
          <div className="card" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
              <h3 style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>Table Status</h3>
              <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--text-muted)", flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />Open</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#E85D2F", display: "inline-block" }} />Needs attention</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#9ca3af", display: "inline-block" }} />Closed</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8 }}>
              {tables.map(table => {
                const pending = pendingByTable[table.id] ?? 0;
                const bgColor = !table.is_active ? "#f3f4f6" : pending > 0 ? "#fff7ed" : "#f0fdf4";
                const borderColor = !table.is_active ? "#e5e7eb" : pending > 0 ? "#E85D2F" : "#22c55e";
                const textColor = !table.is_active ? "#9ca3af" : pending > 0 ? "#E85D2F" : "#166534";
                return (
                  <div
                    key={table.id}
                    style={{ background: bgColor, border: `2px solid ${borderColor}`, borderRadius: 10, padding: "10px 8px", textAlign: "center", cursor: "pointer", transition: "transform 0.1s" }}
                    title={`${table.name} — ${!table.is_active ? "Closed" : pending > 0 ? `${pending} pending` : "Open"} (click to toggle)`}
                    onClick={() => toggleTable(table)}
                  >
                    <div style={{ fontSize: 18, marginBottom: 2 }}>🪑</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: textColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{table.name}</div>
                    {pending > 0 && <div style={{ fontSize: 10, fontWeight: 800, color: "#E85D2F", marginTop: 2 }}>{pending} !</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* TABLE LIST */}
          <div style={{ display: "grid", gap: 12 }}>
            {tables.map(table => (
              <div key={table.id} className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px", flexWrap: "wrap" }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{table.name}</span>
                  {pendingByTable[table.id] > 0 && (
                    <span style={{ marginLeft: 8, fontSize: 12, padding: "2px 8px", borderRadius: 99, background: "#E85D2F", color: "white", fontWeight: 700, animation: "pulse 1.5s ease-in-out infinite" }}>
                      {pendingByTable[table.id]} waiting
                    </span>
                  )}
                  <span style={{ marginLeft: 8, fontSize: 12, padding: "2px 8px", borderRadius: 99, background: table.is_active ? "#dcfce7" : "#fee2e2", color: table.is_active ? "#166534" : "#991b1b", fontWeight: 600 }}>
                    {table.is_active ? "Open" : "Closed"}
                  </span>
                  {lastRequests[table.id] && (
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                      Last request: {new Date(lastRequests[table.id]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => showQR(table)} style={{ fontSize: 13, padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontWeight: 600 }}>📱 QR Code</button>
                  <button onClick={() => copyLink(table)} style={{ fontSize: 13, padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)", background: copiedId === table.id ? "#dcfce7" : "var(--surface)", cursor: "pointer", fontWeight: 600, color: copiedId === table.id ? "#166534" : "var(--text)" }}>
                    {copiedId === table.id ? "✅ Copied!" : "🔗 Copy link"}
                  </button>
                  <button onClick={() => toggleTable(table)} style={{ fontSize: 13, padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer" }}>
                    {table.is_active ? "Close" : "Open"}
                  </button>
                  <button onClick={() => deleteTable(table.id)} style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
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
              <div style={{ width: 220, height: 220, margin: "0 auto 16px", background: "#f3f4f6", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>Loading...</div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button className="btn-primary" onClick={() => downloadQR(qrModal)}>⬇️ Download PNG</button>
              <button className="btn-secondary" onClick={() => setQrModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
