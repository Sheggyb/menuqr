"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { TableRow } from "@/lib/types";

interface Props {
  tables: TableRow[];
  restaurantName: string;
  /* The restaurant's own brand colour — these sheets get printed and put on
     their tables, so they must not be MenuQR orange. */
  accentColor: string;
}

export default function PrintQRClient({ tables, restaurantName, accentColor }: Props) {
  const [qrMap, setQrMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function genAll() {
      const QRCode = (await import("qrcode")).default;
      const map: Record<string, string> = {};
      for (const table of tables) {
        const url = `${window.location.origin}/menu/${table.token}`;
        map[table.id] = await QRCode.toDataURL(url, { width: 200, margin: 2 });
      }
      setQrMap(map);
    }
    if (tables.length > 0) genAll();
  }, [tables]);

  return (
    <div style={{ padding: "24px 32px", fontFamily: "sans-serif" }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>

      {/* Header bar — hidden on print */}
      <div className="no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/app" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>← Back to Dashboard</Link>
          <h1 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>🖨️ Print QR Codes — {restaurantName}</h1>
        </div>
        <button
          onClick={() => {
            try { localStorage.setItem("menuqr_printed_qr", "1"); } catch { /* ignore */ }
            window.print();
          }}
          style={{ padding: "10px 24px", borderRadius: 8, background: "var(--accent)", color: "white", border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
        >
          🖨️ Print
        </button>
      </div>

      {tables.length === 0 ? (
        <p style={{ color: "#888", textAlign: "center", marginTop: 80 }}>No tables found. Add tables in the dashboard first.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 28 }}>
          {tables.map(table => (
            <div key={table.id} style={{ border: `3px solid ${accentColor}`, borderRadius: 16, padding: "20px 16px 16px", textAlign: "center", background: "white", pageBreakInside: "avoid", boxShadow: `0 4px 16px color-mix(in srgb, ${accentColor} 14%, transparent)` }}>
              <div style={{ fontWeight: 900, fontSize: 22, color: "#111827", marginBottom: 12, letterSpacing: "-0.5px" }}>{table.name}</div>
              {qrMap[table.id] ? (
                <img src={qrMap[table.id]} alt={`QR for ${table.name}`} style={{ width: 170, height: 170, margin: "0 auto", display: "block", borderRadius: 8, border: "1px solid #f0f0ef" }} />
              ) : (
                <div style={{ width: 170, height: 170, margin: "0 auto", background: "#f3f4f6", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 13 }}>Generating…</div>
              )}
              <div style={{ fontSize: 13, color: accentColor, marginTop: 12, fontWeight: 700 }}>{restaurantName}</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Scan to order 📱</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
