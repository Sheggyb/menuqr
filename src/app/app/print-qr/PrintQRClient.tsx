"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { TableRow } from "@/lib/types";
import { IconPrinter, IconPhone } from "@/components/icons";

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
          <Link href="/app" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600, fontSize: "var(--fs-sm)" }}>← Back to Dashboard</Link>
          <h1 style={{ fontWeight: 800, fontSize: "var(--fs-xl)", margin: 0, display: "inline-flex", alignItems: "center", gap: 9 }}><IconPrinter width={20} height={20} style={{ color: "var(--text-muted)" }} /> Print QR Codes — {restaurantName}</h1>
        </div>
        <button
          onClick={() => {
            try { localStorage.setItem("menuqr_printed_qr", "1"); } catch { /* ignore */ }
            window.print();
          }}
          style={{ padding: "10px 24px", borderRadius: "var(--radius-md)", background: "var(--accent)", color: "white", border: "none", fontWeight: 700, fontSize: "var(--fs-md)", cursor: "pointer" }}
        >
          <IconPrinter width={16} height={16} /> Print
        </button>
      </div>

      {tables.length === 0 ? (
        <p style={{ color: "#888", textAlign: "center", marginTop: 80 }}>No tables found. Add tables in the dashboard first.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 28 }}>
          {tables.map(table => (
            <div key={table.id} style={{ border: `3px solid ${accentColor}`, borderRadius: "var(--radius-xl)", padding: "20px 16px 16px", textAlign: "center", background: "white", pageBreakInside: "avoid", boxShadow: `0 4px 16px color-mix(in srgb, ${accentColor} 14%, transparent)` }}>
              <div style={{ fontWeight: 900, fontSize: "var(--fs-xl)", color: "#111827", marginBottom: 12, letterSpacing: "-0.5px" }}>{table.name}</div>
              {qrMap[table.id] ? (
                <img src={qrMap[table.id]} alt={`QR for ${table.name}`} style={{ width: 170, height: 170, margin: "0 auto", display: "block", borderRadius: "var(--radius-md)", border: "1px solid #f0f0ef" }} />
              ) : (
                <div style={{ width: 170, height: 170, margin: "0 auto", background: "#f3f4f6", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "var(--fs-sm)" }}>Generating…</div>
              )}
              <div style={{ fontSize: "var(--fs-sm)", color: accentColor, marginTop: 12, fontWeight: 700 }}>{restaurantName}</div>
              <div style={{ fontSize: "var(--fs-xs)", color: "#9ca3af", marginTop: 4, display: "inline-flex", alignItems: "center", gap: 5, justifyContent: "center" }}><IconPhone width={12} height={12} /> Scan to order</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
