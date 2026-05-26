"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { TableRow } from "@/lib/types";

interface Props {
  tables: TableRow[];
  restaurantName: string;
}

export default function PrintQRClient({ tables, restaurantName }: Props) {
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
          <Link href="/app" style={{ color: "#E85D2F", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>← Back to Dashboard</Link>
          <h1 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>🖨️ Print QR Codes — {restaurantName}</h1>
        </div>
        <button
          onClick={() => window.print()}
          style={{ padding: "10px 24px", borderRadius: 8, background: "#E85D2F", color: "white", border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
        >
          🖨️ Print
        </button>
      </div>

      {tables.length === 0 ? (
        <p style={{ color: "#888", textAlign: "center", marginTop: 80 }}>No tables found. Add tables in the dashboard first.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 24 }}>
          {tables.map(table => (
            <div key={table.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, textAlign: "center", background: "white", pageBreakInside: "avoid" }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>{table.name}</div>
              {qrMap[table.id] ? (
                <img src={qrMap[table.id]} alt={`QR for ${table.name}`} style={{ width: 160, height: 160, margin: "0 auto", display: "block", borderRadius: 6 }} />
              ) : (
                <div style={{ width: 160, height: 160, margin: "0 auto", background: "#f3f4f6", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 13 }}>Generating…</div>
              )}
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>{restaurantName}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
