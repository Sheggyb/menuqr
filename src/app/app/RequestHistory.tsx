"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant, TableRequest } from "@/lib/types";
import { TYPE_LABEL } from "@/lib/constants";
import { SkeletonList } from "@/components/Skeleton";
import { IconHistory, IconBell, IconReceipt, IconGlass, IconDish, IconInbox, IconSearch } from "@/components/icons";

interface Props { restaurant: Restaurant }

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  done:    { bg: "#dcfce7", color: "#16a34a", label: "Done" },
  pending: { bg: "#fef3c7", color: "#d97706", label: "Pending" },
  seen:    { bg: "#dbeafe", color: "#2563eb", label: "In Progress" },
};

const TYPE_ICON: Record<string, typeof IconBell> = {
  waiter: IconBell,
  bill: IconReceipt,
  refill: IconGlass,
  item_request: IconDish,
};

const FILTER_CHIPS: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "item_request", label: "Orders" },
  { id: "waiter", label: "Waiter" },
  { id: "bill", label: "Bill" },
  { id: "refill", label: "Refill" },
];

// TYPE_LABEL values are "<emoji> Name" — take just the name (no emojis in dashboard UI)
function typeName(type: string): string {
  const label = TYPE_LABEL[type];
  return label ? label.split(" ").slice(1).join(" ") : type;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return new Date(iso).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
}

function dateHeader(iso: string): string {
  const d = new Date(iso);
  const day = new Date(d); day.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - day.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en", { month: "short", day: "numeric" });
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

  // Group page items under date headers
  const groups: { header: string; items: TableRequest[] }[] = [];
  for (const r of pageItems) {
    const h = dateHeader(r.created_at);
    const last = groups[groups.length - 1];
    if (last && last.header === h) last.items.push(r);
    else groups.push({ header: h, items: [r] });
  }

  // Reset to page 0 on filter change
  useEffect(() => { setPage(0); }, [search, typeFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontWeight: 800, fontSize: 18, margin: 0, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
          <IconHistory width={18} height={18} /> Request History
        </h2>
        <button onClick={load} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" }}>Refresh</button>
      </div>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex" }}>
          <IconSearch width={14} height={14} />
        </span>
        <input
          type="text"
          placeholder="Search table, item, note..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px 8px 30px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, outline: "none" }}
        />
      </div>

      {/* Type filter chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {FILTER_CHIPS.map(c => {
          const active = typeFilter === c.id;
          return (
            <button key={c.id} onClick={() => setTypeFilter(c.id)}
              style={{ padding: "5px 14px", borderRadius: 99, border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`, background: active ? "var(--accent)" : "var(--surface)", color: active ? "white" : "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {c.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <SkeletonList count={5} />
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
          <div style={{ marginBottom: 8 }}><IconInbox width={32} height={32} /></div>
          <p style={{ fontWeight: 500 }}>No requests found</p>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>{filtered.length} request{filtered.length !== 1 ? "s" : ""}</p>

          <style>{`
            .feed-entry { display: flex; align-items: flex-start; gap: 12px; }
            .feed-meta { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
            @media (max-width: 640px) {
              .feed-entry { flex-wrap: wrap; }
              .feed-main { flex: 1 1 auto; min-width: 0; }
              .feed-meta { flex-basis: 100%; justify-content: flex-end; padding-left: 44px; }
            }
          `}</style>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {groups.map(g => (
              <div key={g.header}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", margin: "0 2px 8px" }}>{g.header}</div>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
                  {g.items.map((r, i) => {
                    const tableName = ((r.table as { name: string } | undefined)?.name ?? "—");
                    const badge = STATUS_BADGE[r.status] ?? STATUS_BADGE.done;
                    const Icon = TYPE_ICON[r.type] ?? IconBell;
                    return (
                      <div key={r.id} className="feed-entry" style={{ padding: "12px 16px", borderBottom: i < g.items.length - 1 ? "1px solid var(--border)" : "none" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", flexShrink: 0 }}>
                          <Icon width={16} height={16} />
                        </div>
                        <div className="feed-main" style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 13 }}>
                            {tableName} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>· {r.item_name || typeName(r.type)}</span>
                          </div>
                          {r.note && <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.note}</div>}
                        </div>
                        <div className="feed-meta">
                          <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{relativeTime(r.created_at)}</span>
                          <span style={{ background: badge.bg, color: badge.color, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, whiteSpace: "nowrap" }}>{badge.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, alignItems: "center" }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)", cursor: page === 0 ? "default" : "pointer", opacity: page === 0 ? 0.4 : 1 }}>Prev</button>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Page {page + 1} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)", cursor: page >= totalPages - 1 ? "default" : "pointer", opacity: page >= totalPages - 1 ? 0.4 : 1 }}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
