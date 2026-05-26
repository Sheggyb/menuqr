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

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  done:    { bg: "#dcfce7", color: "#16a34a", label: "Done" },
  pending: { bg: "#fef3c7", color: "#d97706", label: "Pending" },
  seen:    { bg: "#dbeafe", color: "#2563eb", label: "In Progress" },
};

function fmt(d: string) {
  return new Date(d).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function RequestHistory({ restaurant }: Props) {
  const supabase = createClient();
  const [requests, setRequests] = useState<TableRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("table_requests")
      .select("*, table:restaurant_tables(name)")
      .eq("restaurant_id", restaurant.id)
      .order("created_at", { ascending: false })
      .limit(500);
    setRequests((data as TableRequest[]) ?? []);
    setLoading(false);
  }, [restaurant.id]);

  useEffect(() => { load(); }, [load]);

  const filtered = requests.filter(r => {
    const tableName = ((r.table as { name: string } | undefined)?.name ?? "").toLowerCase();
    const matchSearch = !search || tableName.includes(search.toLowerCase()) || (r.item_name ?? "").toLowerCase().includes(search.toLowerCase()) || (r.note ?? "").toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || r.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  // Reset to page 0 on filter change
  useEffect(() => { setPage(0); }, [search, typeFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontWeight: 800, fontSize: 18, margin: 0, color: "var(--text)" }}>📋 Request History</h2>
        <button onClick={load} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" }}>↻ Refresh</button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="🔍 Search table, item, note..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: "1 1 200px", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, outline: "none" }}
        />
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, cursor: "pointer" }}
        >
          <option value="all">All types</option>
          {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>Loading history...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
          <p style={{ fontWeight: 500 }}>No requests found</p>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>{filtered.length} request{filtered.length !== 1 ? "s" : ""}</p>

          {/* Table */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 140px 80px", gap: 0, padding: "10px 16px", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
              <span>Item / Type</span>
              <span>Table</span>
              <span>Note</span>
              <span>Time</span>
              <span>Status</span>
            </div>
            {pageItems.map((r, i) => {
              const tableName = ((r.table as { name: string } | undefined)?.name ?? "—");
              const badge = STATUS_BADGE[r.status] ?? STATUS_BADGE.done;
              return (
                <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 140px 80px", gap: 0, padding: "12px 16px", borderBottom: i < pageItems.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center", fontSize: 13 }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 13 }}>{r.item_name || TYPE_LABEL[r.type] || r.type}</div>
                    {r.item_name && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{TYPE_LABEL[r.type]}</div>}
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{tableName}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.note || "—"}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: 11 }}>{fmt(r.created_at)}</div>
                  <div>
                    <span style={{ background: badge.bg, color: badge.color, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99 }}>{badge.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, alignItems: "center" }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)", cursor: page === 0 ? "default" : "pointer", opacity: page === 0 ? 0.4 : 1 }}>← Prev</button>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Page {page + 1} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)", cursor: page >= totalPages - 1 ? "default" : "pointer", opacity: page >= totalPages - 1 ? 0.4 : 1 }}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
