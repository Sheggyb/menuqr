"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant, TableRequest } from "@/lib/types";
import { SkeletonList } from "@/components/Skeleton";
import { TYPE_LABEL, currencySymbol } from "@/lib/constants";
import { parseOrderLines } from "@/lib/order-lines";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmDialog";
import { IconBell, IconCheck, IconInbox, IconReceipt, IconHistory, IconTable, IconCheckCircle, IconClock } from "@/components/icons";
import type { SVGProps } from "react";

interface Props { restaurant: Restaurant }

function IconArrowRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// Left-border accent per request type (no fill tint)
const TYPE_ACCENT: Record<string, string> = {
  waiter: "#f59e0b",
  bill: "#dc2626",
  refill: "#3b82f6",
  item_request: "#22c55e",
  food: "#22c55e",
};

const LATE_ACCENT = "#f59e0b";

function timeAgo(dateStr: string): { text: string; isLate: boolean } {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  const isLate = diff >= 300; // 5 minutes
  let text: string;
  if (diff < 60) text = `${diff} sec`;
  else if (diff < 3600) text = `${Math.floor(diff / 60)} min`;
  else text = `${Math.floor(diff / 3600)} hr`;
  return { text, isLate };
}

interface CardProps {
  req: TableRequest;
  leaving?: boolean;
  currencySym: string;
  onPickUp?: () => void;
  onDone?: () => void;
  onUndo?: () => void;
}

function RequestCard({ req, leaving, currencySym, onPickUp, onDone, onUndo }: CardProps) {
  const accent = TYPE_ACCENT[req.type] ?? "#6b7280";
  const tableName = (req.table as { name: string } | undefined)?.name ?? "Unknown";
  const { text: timeText, isLate } = timeAgo(req.created_at);
  const leftAccent = isLate ? LATE_ACCENT : accent;
  const itemLines = parseOrderLines(req.item_name);

  return (
    <div
      className={leaving ? "lo-card lo-card-leaving" : "lo-card"}
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderLeft: `4px solid ${leftAccent}`,
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        animation: "lo-slideIn 0.2s ease-out",
        transition: "transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      {/* Meta row — type | table ······ time, one organized line */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flexWrap: "nowrap" }}>
        <span style={{
          display: "inline-flex", alignItems: "center",
          background: "transparent", color: accent,
          border: `1px solid ${accent}`,
          fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 99,
          textTransform: "uppercase", letterSpacing: "0.03em",
          flexShrink: 0,
        }}>
          {TYPE_LABEL[req.type] ?? req.type}
        </span>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: "var(--bg)", color: "var(--text-muted)",
          fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 99,
          minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 1,
        }}>
          <IconTable width={12} height={12} style={{ flexShrink: 0 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tableName}</span>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: isLate ? "#d97706" : "var(--text-muted)", fontWeight: isLate ? 600 : 400, whiteSpace: "nowrap", flexShrink: 0, marginLeft: "auto" }}>
          {isLate && <IconClock width={12} height={12} />}
          {timeText}
        </span>
        {req.total_price != null && req.total_price > 0 && (
          <span style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", flexShrink: 0 }}>
            {Number.isInteger(req.total_price) ? req.total_price : req.total_price.toFixed(2)} {currencySym}
          </span>
        )}
      </div>

      {/* Item details — quantity, dish, then modifiers. Removals are the
          highest-risk part of a ticket, so they get their own colour. */}
      {itemLines.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
          {itemLines.map((line, i) => (
            <li key={i} style={{ display: "flex", gap: 9, alignItems: "baseline" }}>
              <span style={{
                flexShrink: 0, minWidth: 24, textAlign: "right",
                fontSize: 14, fontWeight: 700, color: "var(--text-muted)",
                fontVariantNumeric: "tabular-nums",
              }}>{line.qty && line.qty > 1 ? `${line.qty}×` : "1×"}</span>
              <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", lineHeight: 1.35 }}>
                  {line.name}
                  {line.choices.length > 0 && (
                    <span style={{ fontWeight: 500, color: "var(--text-muted)" }}> · {line.choices.join(" · ")}</span>
                  )}
                </span>
                {(line.removed.length > 0 || line.extra.length > 0) && (
                  <span style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {line.removed.map((r, j) => (
                      <span key={`r${j}`} style={{ fontSize: 11.5, fontWeight: 700, padding: "1px 7px", borderRadius: 5, background: "color-mix(in srgb, #dc2626 14%, transparent)", color: "#dc2626", whiteSpace: "nowrap" }}>
                        NO {r}
                      </span>
                    ))}
                    {line.extra.map((x, j) => (
                      <span key={`x${j}`} style={{ fontSize: 11.5, fontWeight: 700, padding: "1px 7px", borderRadius: 5, background: "color-mix(in srgb, #16a34a 14%, transparent)", color: "#16a34a", whiteSpace: "nowrap" }}>
                        EXTRA {x}
                      </span>
                    ))}
                  </span>
                )}
                {line.note && (
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", lineHeight: 1.4 }}>{line.note}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {req.note && (
        <span style={{ fontSize: 13, color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 5, lineHeight: 1.5 }}>
          <IconReceipt width={13} height={13} style={{ flexShrink: 0 }} /> {req.note}
        </span>
      )}

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 2 }}>
        {onPickUp && (
          <button onClick={onPickUp} aria-label="Pick up — move to In Progress" title="Pick up" style={circleBtn("outline", "#3b82f6")}>
            <IconArrowRight width={16} height={16} />
          </button>
        )}
        {onDone && (
          <button onClick={onDone} aria-label="Mark done" title="Done" style={circleBtn("filled", "#22c55e")}>
            <IconCheck width={16} height={16} strokeWidth={2.5} />
          </button>
        )}
        {onUndo && (
          <button onClick={onUndo} aria-label="Undo — move back to New" title="Move back to New" style={circleBtn("outline", "var(--text-muted)")}>
            <IconHistory width={15} height={15} />
          </button>
        )}
      </div>
    </div>
  );
}

function circleBtn(variant: "outline" | "filled", color: string): React.CSSProperties {
  return {
    width: 34, height: 34, borderRadius: "50%",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", flexShrink: 0,
    background: variant === "filled" ? color : "transparent",
    color: variant === "filled" ? "white" : color,
    border: variant === "filled" ? "none" : `1px solid ${color}`,
  };
}

interface SectionProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  emptyText: string;
  isEmpty: boolean;
  children: React.ReactNode;
}

function Section({ title, count, icon, emptyText, isEmpty, children }: SectionProps) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{ color: "var(--text-muted)", display: "inline-flex" }}>{icon}</span>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text)" }}>{title}</h2>
        <span style={{
          background: "var(--surface-2)", color: "var(--text-muted)",
          fontSize: 13, fontWeight: 600,
          padding: "1px 9px", borderRadius: 99, minWidth: 22, textAlign: "center",
        }}>{count}</span>
      </div>

      {/* Permanent board frame — the empty-state box is always present, orders render inside it */}
      <div className="lo-panel">
        {isEmpty ? (
          <div className="lo-empty">
            <IconInbox width={24} height={24} />
            <span>{emptyText}</span>
          </div>
        ) : (
          <div className="lo-grid">{children}</div>
        )}
      </div>
    </section>
  );
}

const ALL_TYPES = ["waiter", "bill", "refill", "item_request"] as const;

export default function LiveOrders({ restaurant }: Props) {
  const supabase = createClient();
  const toast = useToast();
  const confirm = useConfirm();
  const [requests, setRequests] = useState<TableRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("menuqr_sound") !== "off";
  });
  // Ref mirrors soundEnabled so the realtime channel never needs re-subscribing on toggle
  const soundRef = useRef(soundEnabled);
  useEffect(() => { soundRef.current = soundEnabled; }, [soundEnabled]);
  const [searchTable, setSearchTable] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [leavingIds, setLeavingIds] = useState<Set<string>>(new Set());

  // Single 30s tick so all relative timestamps stay fresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("table_requests")
      .select("*, table:restaurant_tables(name)")
      .eq("restaurant_id", restaurant.id)
      .neq("status", "done")
      .order("created_at", { ascending: true });
    setRequests((data as TableRequest[]) ?? []);
    setLoading(false);
  }, [restaurant.id]);

  function playPing() {
    if (!soundRef.current) return;
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
    const channel = supabase.channel(`requests:${restaurant.id}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "table_requests",
        filter: `restaurant_id=eq.${restaurant.id}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") playPing();
        load();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurant.id, load]);

  // Polling fallback — guarantees fresh orders even if the realtime socket stalls
  useEffect(() => {
    const t = setInterval(load, 12_000);
    return () => clearInterval(t);
  }, [load]);

  // Brief scale-down on the card before it moves columns / disappears
  function moveAnimated(id: string, status: TableRequest["status"]) {
    setLeavingIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      setLeavingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
      move(id, status);
    }, 150);
  }

  async function move(id: string, status: TableRequest["status"]) {
    const { error } = await supabase.from("table_requests").update({ status }).eq("id", id);
    if (error) {
      toast.error("Could not update the request");
      return;
    }
    if (status === "done") {
      setRequests(r => r.filter(x => x.id !== id));
    } else {
      setRequests(r => r.map(x => x.id === id ? { ...x, status } : x));
    }
  }

  async function markAllDone() {
    const ids = pending.map(r => r.id);
    const ok = await confirm({
      title: "Mark all done?",
      message: `Mark all ${ids.length} as done?`,
      confirmLabel: "Mark all done",
    });
    if (!ok) return;
    const results = await Promise.all(ids.map(id => supabase.from("table_requests").update({ status: "done" }).eq("id", id)));
    if (results.some(r => r.error)) {
      toast.error("Some requests could not be updated");
      load();
      return;
    }
    setRequests(r => r.filter(x => !ids.includes(x.id)));
    toast.success("All requests marked done");
  }

  function applyFilters(list: TableRequest[]) {
    return list.filter(r => {
      const tableName = ((r.table as { name: string } | undefined)?.name ?? "").toLowerCase();
      const matchTable = !searchTable || tableName.includes(searchTable.toLowerCase());
      const matchType = filterType === "all" || r.type === filterType;
      return matchTable && matchType;
    });
  }

  const pending = applyFilters(requests.filter(r => r.status === "pending"));
  const seen = applyFilters(requests.filter(r => r.status === "seen"));

  const pendingCount = requests.filter(r => r.status === "pending").length;

  // Keyboard shortcuts: P = pick up first pending, D = mark first in-progress done
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
      if (e.key === "p" || e.key === "P") {
        const first = requests.find(r => r.status === "pending");
        if (first) move(first.id, "seen");
      } else if (e.key === "d" || e.key === "D") {
        const first = requests.find(r => r.status === "seen");
        if (first) move(first.id, "done");
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests]);

  // Estimated wait time: assume ~3 min per pending request
  const estWaitMin = pendingCount * 3;

  useEffect(() => {
    document.title = pendingCount > 0 ? `(${pendingCount}) Live Orders — MenuQR` : "Live Orders — MenuQR";
    return () => { document.title = "MenuQR — Digital Menu & Table Ordering"; };
  }, [pendingCount]);

  // Today stats — exact COUNT queries (no 1000-row cap, audit 2.1)
  const [todayStats, setTodayStats] = useState({ total: 0, done: 0 });
  useEffect(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const iso = start.toISOString();
    (async () => {
      const [totalRes, doneRes] = await Promise.all([
        supabase.from("table_requests").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurant.id).gte("created_at", iso),
        supabase.from("table_requests").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurant.id).gte("created_at", iso).eq("status", "done"),
      ]);
      setTodayStats({ total: totalRes.count ?? 0, done: doneRes.count ?? 0 });
    })();
  }, [requests.length, restaurant.id]);

  if (loading) return (
    <div>
      <div style={{ height: 40, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, marginBottom: 16 }} />
      <div style={{ marginBottom: 24 }}><SkeletonList count={3} /></div>
      <SkeletonList count={2} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`
        @keyframes lo-slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .lo-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .lo-card-leaving { transform: scale(0.94); opacity: 0.4; }
        .lo-grid { display: grid; grid-template-columns: 1fr; gap: 16px; align-content: start; }
        .lo-panel { flex: 1; min-height: 0; overflow-y: auto; background: var(--surface); border: 1px dashed var(--border); border-radius: 12px; padding: 14px; }
        .lo-empty { min-height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10; color: var(--text-muted); font-size: 13px; }
        .lo-columns { display: flex; gap: 24px; align-items: stretch; }
        .lo-columns > section { flex: 1; min-width: 0; height: calc(100vh - 240px); }
        .lo-panel::-webkit-scrollbar { width: 8px; }
        .lo-panel::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
        @media (max-width: 640px) { .lo-columns { flex-direction: column; } .lo-columns > section { height: auto; } .lo-panel { overflow: visible; } }
      `}</style>

      {/* Toolbar — compact one-line filters + stats */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search table..."
          value={searchTable}
          onChange={e => setSearchTable(e.target.value)}
          style={{ width: 150, padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 12, outline: "none", flexShrink: 0 }}
        />
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{ width: 100, padding: "6px 8px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 12, cursor: "pointer", flexShrink: 0 }}
        >
          <option value="all">All</option>
          <option value="waiter">Waiter</option>
          <option value="bill">Bill</option>
          <option value="refill">Refill</option>
          <option value="item_request">Orders</option>
        </select>

        <button
          onClick={() => { const next = !soundEnabled; setSoundEnabled(next); localStorage.setItem("menuqr_sound", next ? "on" : "off"); }}
          title={soundEnabled ? "Sound on" : "Sound off"}
          style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontSize: 14, lineHeight: 1, flexShrink: 0, color: soundEnabled ? "var(--text)" : "var(--text-muted)" }}
        >{soundEnabled ? "🔔" : "🔕"}</button>

        <div style={{ flex: 1 }} />

        {/* Compact stats */}
        <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
          Today: <strong style={{ color: "var(--text)", fontWeight: 600 }}>{todayStats.total}</strong>
          {" · "}Done: <strong style={{ color: "var(--text)", fontWeight: 600 }}>{todayStats.done}</strong>
          {" · "}Waiting: <strong style={{ color: "#E85D2F", fontWeight: 700 }}>{pendingCount}</strong>
          {estWaitMin > 0 ? ` (~${estWaitMin}m)` : ""}
        </span>

        {pendingCount > 0 && (
          <button
            onClick={markAllDone}
            style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: "#22c55e", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
          >✓ Done ({pendingCount})</button>
        )}
      </div>

      {/* New + In Progress side-by-side */}
      <div className="lo-columns">
        {/* New */}
        <Section
          title="New"
          count={pending.length}
          icon={<IconBell width={18} height={18} />}
          emptyText={searchTable || filterType !== "all" ? "No matching requests" : "No new orders"}
          isEmpty={pending.length === 0}
        >
          {pending.map(req => (
            <RequestCard
              key={req.id}
              req={req}
              leaving={leavingIds.has(req.id)}
              currencySym={currencySymbol(restaurant.currency)}
              onPickUp={() => moveAnimated(req.id, "seen")}
            />
          ))}
        </Section>

        {/* In Progress */}
        <Section
          title="In Progress"
          count={seen.length}
          icon={<IconClock width={18} height={18} />}
          emptyText={searchTable || filterType !== "all" ? "No matching requests" : "Nothing in progress"}
          isEmpty={seen.length === 0}
        >
          {seen.map(req => (
            <RequestCard
              key={req.id}
              req={req}
              leaving={leavingIds.has(req.id)}
              currencySym={currencySymbol(restaurant.currency)}
              onDone={() => moveAnimated(req.id, "done")}
              onUndo={() => move(req.id, "pending")}
            />
          ))}
        </Section>
      </div>
    </div>
  );
}
