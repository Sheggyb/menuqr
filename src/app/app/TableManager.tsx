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

  useEffect(() => {
    supabase.from("restaurant_tables").select("*").eq("restaurant_id", restaurant.id).order("name")
      .then(({ data }) => { setTables(data ?? []); setLoading(false); });
  }, [restaurant.id]);

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontWeight: 700, fontSize: 20 }}>🪑 Table Manager</h2>
        <Link href="/app/print-qr" style={{ fontSize: 13, padding: "6px 14px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", textDecoration: "none", fontWeight: 600 }}>🖨️ Print all QR codes</Link>
      </div>

      <div className="card">
        <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>Add a table</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder='e.g. Table 1, Bar Seat A, Terrace 3...' onKeyDown={e => e.key === "Enter" && addTable()} />
          <button className="btn-primary" onClick={addTable} style={{ whiteSpace: "nowrap" }}>+ Add</button>
        </div>
      </div>

      {tables.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🪑</div>
          <p>No tables yet. Add one above.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {tables.map(table => (
            <div key={table.id} className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px" }}>
              <div>
                <span style={{ fontWeight: 700 }}>{table.name}</span>
                <span style={{ marginLeft: 10, fontSize: 12, padding: "2px 8px", borderRadius: 99, background: table.is_active ? "#dcfce7" : "#fee2e2", color: table.is_active ? "#166534" : "#991b1b", fontWeight: 600 }}>
                  {table.is_active ? "Open" : "Closed"}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => showQR(table)} style={{ fontSize: 13, padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontWeight: 600 }}>📱 QR Code</button>
                <button onClick={() => toggleTable(table)} style={{ fontSize: 13, padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer" }}>
                  {table.is_active ? "Close" : "Open"}
                </button>
                <button onClick={() => deleteTable(table.id)} style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR MODAL */}
      {qrModal && (
        <div onClick={() => setQrModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
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
