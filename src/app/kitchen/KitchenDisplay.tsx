"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant, TableRequest } from "@/lib/types";
import { TYPE_LABEL } from "@/lib/constants";
import { IconBell, IconCheck, IconClock, IconDish, IconGlass, IconHistory, IconInbox, IconReceipt, IconTable } from "@/components/icons";
import type { SVGProps } from "react";

interface Props {
  restaurant: Restaurant;
}

function IconArrowRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
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
};

const LATE_ACCENT = "#f59e0b";

type Filter = "food" | "drinks" | "all";

const FILTER_TYPES: Record<Filter, string[]> = {
  food: ["item_request"],
  drinks: ["refill"],
  all: ["item_request", "refill", "waiter", "bill"],
};

const FILTER_LABEL: Record<Filter, string> = {
  food: "Food",
  drinks: "Drinks",
  all: "All",
};

function timeAgo(dateStr: string): { text: string; isLate: boolean } {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  const isLate = diff >= 300; // 5 minutes
  let text: string;
  if (diff < 60) text = `${diff} sec`;
  else if (diff < 3600) text = `${Math.floor(diff / 60)} min`;
  else text = `${Math.floor(diff / 3600)} hr`;
  return { text, isLate };
}

function bigBtn(variant: "outline" | "filled", color: string): React.CSSProperties {
  return {
    height: 32, borderRadius: 8, padding: "0 12px",
    display: "inline-flex", alignItems: "center", gap: 6,
    cursor: "pointer", flexShrink: 0,
    background: variant === "filled" ? color : "transparent",
    color: variant === "filled" ? "white" : color,
    border: variant === "filled" ? "none" : `1.5px solid ${color}`,
    fontSize: 13, fontWeight: 700,
  };
}

interface CardProps {
  req: TableRequest;
  leaving?: boolean;
  onPickUp?: () => void;
  onDone?: () => void;
  onUndo?: () => void;
}

function KitchenCard({ req, leaving, onPickUp, onDone, onUndo }: CardProps) {
  const accent = TYPE_ACCENT[req.type] ?? "#6b7280";
  const tableName = (req.table as { name: string } | undefined)?.name ?? "Unknown";
  const { text: timeText, isLate } = timeAgo(req.created_at);
  const leftAccent = isLate ? LATE_ACCENT : accent;
  const itemLines = (req.item_name ?? "").split("\n").filter(l => l.trim().length > 0);

  return (
    <div
      className={leaving ? "kd-card kd-leaving" : "kd-card"}
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderLeft: `4px solid ${leftAccent}`,
        borderRadius: 12,
        padding: "10px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        animation: "kd-slideIn 0.18s ease-out",
        transition: "transform 0.15s ease, opacity 0.15s ease",
      }}
    >
      {/* Top row: type badge | table | time */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{
          display: "inline-flex", alignItems: "center",
          background: "transparent", color: accent,
          border: `1.5px solid ${accent}`,
          fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 99,
          textTransform: "uppercase", letterSpacing: "0.03em",
        }}>
          {TYPE_LABEL[req.type] ?? req.type}
        </span>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "var(--bg)", color: "var(--text)",
          fontSize: 13, fontWeight: 700, padding: "2px 10px", borderRadius: 99,
        }}>
          <IconTable width={12} height={12} style={{ color: "var(--text-muted)" }} />
          {tableName}
        </span>
        <span style={{
          marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 13, fontWeight: isLate ? 700 : 500,
          color: isLate ? "#d97706" : "var(--text-muted)",
          whiteSpace: "nowrap",
        }}>
          {isLate && <IconClock width={12} height={12} />}
          {timeText}
        </span>
      </div>

      {/* Items */}
      {itemLines.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {itemLines.map((line, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
              <span aria-hidden="true" style={{ color: accent, fontWeight: 800, fontSize: 15 }}>&bull;</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", lineHeight: 1.35, whiteSpace: "pre-line" }}>{line}</span>
            </div>
          ))}
        </div>
      )}

      {req.note && (
        <div style={{ fontSize: 13, color: "var(--text-muted)", display: "inline-flex", alignItems: "flex-start", gap: 7, lineHeight: 1.5 }}>
          <IconReceipt width={14} height={14} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{req.note}</span>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
        {onPickUp && (
          <button onClick={onPickUp} aria-label="Start preparing" title="Start preparing" style={bigBtn("outline", "#3b82f6")}>
            <IconArrowRight width={15} height={15} /> Start
          </button>
        )}
        {onDone && (
          <button onClick={onDone} aria-label="Mark done" title="Done" style={bigBtn("filled", "#22c55e")}>
            <IconCheck width={16} height={16} strokeWidth={2.5} /> Done
          </button>
        )}
        {onUndo && (
          <button onClick={onUndo} aria-label="Move back to New" title="Move back to New" style={bigBtn("outline", "var(--text-muted)")}>
            <IconHistory width={15} height={15} /> Back
          </button>
        )}
      </div>
    </div>
  );
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
    <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{ color: "var(--text-muted)", display: "inline-flex" }}>{icon}</span>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--text)" }}>{title}</h2>
        <span style={{
          background: "var(--surface-2)", color: "var(--text)",
          fontSize: 13, fontWeight: 700,
          padding: "1px 10px", borderRadius: 99, minWidth: 22, textAlign: "center",
        }}>{count}</span>
      </div>
      {/* Permanent board frame — the empty-state box is always present, orders render inside it */}
      <div className="kd-panel">
        {isEmpty ? (
          <div className="kd-empty">
            <IconInbox width={26} height={26} />
            <span>{emptyText}</span>
          </div>
        ) : (
          <div className="kd-grid">{children}</div>
        )}
      </div>
    </section>
  );
}

export default function KitchenDisplay({ restaurant }: Props) {
  const supabase = createClient();
  const [requests, setRequests] = useState<TableRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("menuqr_sound") !== "off";
  });
  // Ref mirrors soundEnabled so the realtime channel never needs re-subscribing on toggle
  const soundRef = useRef(soundEnabled);
  useEffect(() => { soundRef.current = soundEnabled; }, [soundEnabled]);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("food");
  const [leavingIds, setLeavingIds] = useState<Set<string>>(new Set());
  const [clock, setClock] = useState("");

  // Single 30s tick so all relative timestamps stay fresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  // Big live clock for the kitchen wall
  useEffect(() => {
    const fmt = () => setClock(new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    fmt();
    const t = setInterval(fmt, 1000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("table_requests")
      .select("*, table:restaurant_tables(name)")
      .eq("restaurant_id", restaurant.id)
      .neq("status", "done")
      .order("created_at", { ascending: true })
      .limit(100);
    setRequests((data as TableRequest[]) ?? []);
    setLoading(false);
    setLastUpdated(Date.now());
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
    const channel = supabase.channel(`kitchen:${restaurant.id}`)
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

  // Brief scale-down before the card moves columns / disappears
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
      load();
      return;
    }
    if (status === "done") {
      setRequests(r => r.filter(x => x.id !== id));
    } else {
      setRequests(r => r.map(x => x.id === id ? { ...x, status } : x));
    }
  }

  const filtered = requests.filter(r => FILTER_TYPES[filter].includes(r.type));
  const fresh = filtered.filter(r => r.status === "pending");
  const cooking = filtered.filter(r => r.status === "seen");
  const freshCount = requests.filter(r => r.status === "pending").length;

  // Keyboard shortcuts: P = start first new, D = mark first cooking done
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
      if (e.key === "p" || e.key === "P") {
        const first = fresh.find(r => r.status === "pending");
        if (first) move(first.id, "seen");
      } else if (e.key === "d" || e.key === "D") {
        const first = cooking.find(r => r.status === "seen");
        if (first) move(first.id, "done");
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fresh, cooking]);

  useEffect(() => {
    document.title = freshCount > 0 ? `(${freshCount}) Kitchen — MenuQR` : "Kitchen — MenuQR";
    return () => { document.title = "MenuQR — Digital Menu & Table Ordering"; };
  }, [freshCount]);

  // Today stats (fetch separately including done)
  const [todayStats, setTodayStats] = useState({ total: 0, done: 0 });
  useEffect(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    supabase.from("table_requests")
      .select("status")
      .eq("restaurant_id", restaurant.id)
      .gte("created_at", start.toISOString())
      .then(({ data }) => {
        setTodayStats({
          total: data?.length ?? 0,
          done: data?.filter(r => r.status === "done").length ?? 0,
        });
      });
  }, [requests.length, restaurant.id]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ height: 56, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }} />
      <div className="kd-grid">
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ height: 220, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14 }} />
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`
        @keyframes kd-slideIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .kd-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.10); }
        .kd-card-leaving { transform: scale(0.95); opacity: 0.4; }
        .kd-grid { display: grid; grid-template-columns: 1fr; gap: 14px; align-content: start; }
        .kd-panel { flex: 1; min-height: 0; overflow-y: auto; background: var(--surface); border: 1px dashed var(--border); border-radius: 12px; padding: 14px; }
        .kd-empty { min-height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10; color: var(--text-muted); font-size: 13.5px; }
        .kd-columns { display: flex; gap: 22px; align-items: stretch; }
        .kd-columns > section { flex: 1; min-width: 0; height: calc(100vh - 165px); }
        .kd-panel::-webkit-scrollbar { width: 8px; }
        .kd-panel::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
        @media (max-width: 900px) { .kd-columns { flex-direction: column; } .kd-columns > section { height: auto; } .kd-panel { overflow: visible; } }
      `}</style>

      {/* HEADER */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "var(--surface)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        padding: "14px 24px",
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <span style={{ fontWeight: 800, fontSize: 17, color: "var(--text)", letterSpacing: "-0.3px" }}>Kitchen</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{restaurant.name}</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 6, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 4 }}>
          {(["food", "drinks", "all"] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "5px 12px", borderRadius: 7, border: "none", cursor: "pointer",
                background: filter === f ? "var(--accent)" : "transparent",
                color: filter === f ? "white" : "var(--text-muted)",
                fontSize: 12, fontWeight: filter === f ? 700 : 500,
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              {f === "food" ? <IconDish width={13} height={13} /> : f === "drinks" ? <IconGlass width={13} height={13} /> : <IconBell width={13} height={13} />}
              {FILTER_LABEL[f]}
            </button>
          ))}
        </div>

        {/* Sound toggle */}
        <button
          onClick={() => { const next = !soundEnabled; setSoundEnabled(next); localStorage.setItem("menuqr_sound", next ? "on" : "off"); }}
          title={soundEnabled ? "Sound on" : "Sound off"}
          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", cursor: "pointer", fontSize: 15, lineHeight: 1, color: soundEnabled ? "var(--text)" : "var(--text-muted)" }}
        >{soundEnabled ? "🔔" : "🔕"}</button>

        {/* Live clock */}
        <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{clock}</span>
      </header>

      {/* STATS BAR */}
      <div style={{ padding: "14px 24px 0", display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Today: <strong style={{ color: "var(--text)", fontWeight: 700 }}>{todayStats.total}</strong>
        </span>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Done: <strong style={{ color: "#22c55e", fontWeight: 700 }}>{todayStats.done}</strong>
        </span>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Waiting: <strong style={{ color: "#E85D2F", fontWeight: 700 }}>{freshCount}</strong>
        </span>
        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block", flexShrink: 0 }} />
          Live · updated {lastUpdated ? `${Math.max(0, Math.round((Date.now() - lastUpdated) / 1000))}s ago` : "…"}
        </span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>P = start · D = done</span>
      </div>

      {/* COLUMNS */}
      <main style={{ padding: "20px 24px 40px" }}>
        <div className="kd-columns">
          <Section
            title="New"
            count={fresh.length}
            icon={<IconBell width={17} height={17} />}
            emptyText="No new orders"
            isEmpty={fresh.length === 0}
          >
            {fresh.map(req => (
              <KitchenCard
                key={req.id}
                req={req}
                leaving={leavingIds.has(req.id)}
                onPickUp={() => moveAnimated(req.id, "seen")}
              />
            ))}
          </Section>

          <Section
            title="Cooking"
            count={cooking.length}
            icon={<IconClock width={17} height={17} />}
            emptyText="Nothing on the pass"
            isEmpty={cooking.length === 0}
          >
            {cooking.map(req => (
              <KitchenCard
                key={req.id}
                req={req}
                leaving={leavingIds.has(req.id)}
                onDone={() => moveAnimated(req.id, "done")}
                onUndo={() => move(req.id, "pending")}
              />
            ))}
          </Section>
        </div>
      </main>
    </div>
  );
}
