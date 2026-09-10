"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant, TableRequest } from "@/lib/types";
import { TYPE_LABEL, formatMoney } from "@/lib/constants";
import { IconChart } from "@/components/icons";
import { useI18n, useT } from "@/lib/i18n/client";
import type { Locale, TKey } from "@/lib/i18n";

interface Props { restaurant: Restaurant }

type TFn = (key: TKey, vars?: Record<string, string | number>) => string;

const TYPE_KEY: Record<string, TKey> = {
  waiter: "tables.type.waiter",
  bill: "tables.type.bill",
  refill: "tables.type.refill",
  item_request: "tables.type.item_request",
};

function typeName(type: string, t: TFn): string {
  const key = TYPE_KEY[type];
  return key ? t(key) : TYPE_LABEL[type] ?? type;
}

function dateLocale(locale: Locale): string {
  return locale === "sv" ? "sv-SE" : "en";
}

function Delta({ today, yesterday }: { today: number; yesterday: number }) {
  const t = useT();
  let text: string;
  let color: string;
  if (today === yesterday) {
    text = t("analytics.flat");
    color = "var(--text-muted)";
  } else if (yesterday === 0) {
    text = t("analytics.plusYesterday", { count: today });
    color = "var(--success)";
  } else {
    const pct = Math.round(((today - yesterday) / yesterday) * 100);
    const up = pct > 0;
    text = t("analytics.pctYesterday", { arrow: up ? "↑" : "↓", pct: Math.abs(pct) });
    color = up ? "var(--success)" : "var(--danger)";
  }
  return <div style={{ fontSize: "var(--fs-xs)", fontWeight: 600, color }}>{text}</div>;
}

function StatCard({ label, value, sub, color, delta }: { label: string; value: number | string; sub?: string; color: string; delta?: { today: number; yesterday: number } }) {
  return (
    <div style={{ position: "relative", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "16px 20px 16px 23px", display: "flex", flexDirection: "column", gap: 4, boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: color }} />
      <div style={{ fontSize: "var(--fs-2xl)", fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text-muted)" }}>{label}</div>
      {sub && <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{sub}</div>}
      {delta && <Delta today={delta.today} yesterday={delta.yesterday} />}
    </div>
  );
}

interface DayBucket { date: string; label: string; total: number; done: number; revenue: number }

export default function Analytics({ restaurant }: Props) {
  const supabase = createClient();
  const { locale, t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<TableRequest[]>([]);
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    // Always fetch 30 days so switching the range needs no new API call
    const start = new Date();
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    setLoading(true);
    // Paginate past PostgREST's 1000-row cap so busy venues aren't silently
    // undercounted (audit 2.1)
    (async () => {
      const all: TableRequest[] = [];
      const PAGE = 1000;
      for (let i = 0; i < 20; i++) {
        const { data, error } = await supabase
          .from("table_requests")
          .select("*")
          .eq("restaurant_id", restaurant.id)
          .gte("created_at", start.toISOString())
          .order("created_at", { ascending: true })
          .range(i * PAGE, (i + 1) * PAGE - 1);
        if (error || !data) break;
        all.push(...(data as TableRequest[]));
        if (data.length < PAGE) break;
      }
      setRequests(all);
      setLoading(false);
    })();
  }, [restaurant.id]);

  const days = range === "7d" ? 7 : 30;

  const header = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
      <h2 style={{ fontWeight: 800, fontSize: "var(--fs-lg)", margin: 0, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
        <IconChart width={18} height={18} /> {t("analytics.title")}
      </h2>
      <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
        {(["7d", "30d"] as const).map(r => (
          <button key={r} onClick={() => setRange(r)} style={{ padding: "6px 16px", border: "none", background: range === r ? "var(--accent)" : "var(--surface)", color: range === r ? "white" : "var(--text-muted)", fontWeight: 600, fontSize: "var(--fs-sm)", cursor: "pointer" }}>
            {r}
          </button>
        ))}
      </div>
    </div>
  );

  // Header stays put while loading — it used to disappear, so the heading and
  // the 7d/30d toggle popped in and shifted the page once data arrived.
  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {header}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ background: "var(--surface-2)", borderRadius: "var(--radius-lg)", height: 96, animation: "pulse 1.5s ease-in-out infinite" }} />
        ))}
      </div>
      <div style={{ background: "var(--surface-2)", borderRadius: "var(--radius-lg)", height: 190, animation: "pulse 1.5s ease-in-out infinite" }} />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );

  // Filter fetched (30d) data down to the selected range client-side
  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - (days - 1));
  rangeStart.setHours(0, 0, 0, 0);
  const inRange = requests.filter(r => new Date(r.created_at).getTime() >= rangeStart.getTime());

  // Two different empty states. "No data yet" was shown even when the venue had
  // plenty of history but nothing in the selected window — telling an
  // established restaurant to "share your QR codes to get started" because it
  // was quiet this week.
  if (inRange.length === 0) {
    const hasOlder = requests.length > 0;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {header}
        <div style={{ textAlign: "center", padding: "60px 32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)" }}>
          <div style={{ color: "var(--text-muted)", marginBottom: 16 }}><IconChart width={48} height={48} /></div>
          <h3 style={{ fontWeight: 700, fontSize: "var(--fs-lg)", color: "var(--text)", marginBottom: 8 }}>
            {hasOlder ? t("analytics.emptyRange", { days }) : t("analytics.emptyTitle")}
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)", maxWidth: 320, margin: "0 auto" }}>
            {hasOlder
              ? t("analytics.emptyOlder")
              : t("analytics.emptyBody")}
          </p>
          {hasOlder && range === "7d" && (
            <button
              onClick={() => setRange("30d")}
              style={{ marginTop: 16, padding: "8px 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "var(--fs-sm)", fontWeight: 600, cursor: "pointer" }}
            >{t("analytics.show30")}</button>
          )}
        </div>
      </div>
    );
  }

  // Summary stats
  const total = inRange.length;
  const done = inRange.filter(r => r.status === "done").length;
  const inProgress = inRange.filter(r => r.status === "seen").length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
  const byType: Record<string, number> = {};
  for (const r of inRange) byType[r.type] = (byType[r.type] ?? 0) + 1;
  const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];

  // Revenue. total_price is stored per order but Stats ignored it entirely,
  // so the one number an owner cares about most was missing from the tab
  // built to show numbers. Only item_request rows carry a price.
  //
  // 'awaiting' means checkout was started and never completed. Counting those
  // as revenue would overstate takings by every abandoned cart, so they are
  // excluded here as well as on the boards. No-op until Stripe exists, but this
  // is the number that would be wrong, and wrong quietly.
  const money = (n: number) => formatMoney(n, restaurant.currency);
  const earned = inRange.filter(r => r.payment_status !== "awaiting");
  const revenue = earned.reduce((s, r) => s + (r.total_price ?? 0), 0);
  const paidOrders = earned.filter(r => (r.total_price ?? 0) > 0).length;
  const avgOrder = paidOrders > 0 ? revenue / paidOrders : 0;

  // Daily buckets
  const buckets: DayBucket[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d); next.setDate(next.getDate() + 1);
    const dayReqs = inRange.filter(r => {
      const ts = new Date(r.created_at).getTime();
      return ts >= d.getTime() && ts < next.getTime();
    });
    const label = i === 0 ? t("common.today") : i === 1 ? t("tables.yesterday") : d.toLocaleDateString(dateLocale(locale), { weekday: "short", month: "short", day: "numeric" });
    buckets.push({
      date: d.toISOString(),
      label,
      total: dayReqs.length,
      done: dayReqs.filter(r => r.status === "done").length,
      revenue: dayReqs.reduce((s, r) => s + (r.payment_status === "awaiting" ? 0 : r.total_price ?? 0), 0),
    });
  }

  const maxVal = Math.max(...buckets.map(b => b.total), 1);
  const todayBucket = buckets[buckets.length - 1];
  const yesterdayBucket = buckets[buckets.length - 2];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {header}

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
        <StatCard
          label={t("analytics.revenue")}
          value={money(revenue)}
          sub={paidOrders > 0
            ? (paidOrders === 1
              ? t("analytics.paidOrderOne", { avg: money(avgOrder) })
              : t("analytics.paidOrders", { count: paidOrders, avg: money(avgOrder) }))
            : t("analytics.noPricedOrders")}
          color="var(--accent)"
        />
        <StatCard label={t("analytics.totalRequests")} value={total} sub={t("analytics.lastDays", { days })} color="var(--accent)"
          delta={yesterdayBucket ? { today: todayBucket.total, yesterday: yesterdayBucket.total } : undefined} />
        <StatCard label={t("analytics.completed")} value={done}
          sub={inProgress > 0
            ? t("analytics.donePctProgress", { pct: completionRate, count: inProgress })
            : t("analytics.donePct", { pct: completionRate })} color="var(--success)"
          delta={yesterdayBucket ? { today: todayBucket.done, yesterday: yesterdayBucket.done } : undefined} />
        <StatCard label={t("analytics.topRequest")} value={topType ? typeName(topType[0], t) : "—"}
          sub={topType ? (topType[1] === 1 ? t("analytics.timesOne") : t("analytics.times", { count: topType[1] })) : undefined} color="var(--accent)" />
      </div>

      {/* Daily bar chart */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "16px 20px" }}>
        <h3 style={{ fontWeight: 700, fontSize: "var(--fs-sm)", margin: "0 0 16px", color: "var(--text)" }}>{t("analytics.daily")}</h3>
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "flex", gap: range === "30d" ? 4 : 6, alignItems: "flex-end", paddingBottom: 42, minWidth: range === "30d" ? 30 * 36 : 7 * 52, position: "relative" }}>
            {/* Horizontal grid lines behind bars (chart area is 90px tall above the labels) */}
            {[0.25, 0.5, 0.75, 1].map(f => (
              <div key={f} style={{ position: "absolute", left: 0, right: 0, bottom: 42 + f * 90, height: 1, background: "var(--border)", opacity: 0.5, pointerEvents: "none" }} />
            ))}
            {buckets.map((b, i) => {
              const d = new Date(b.date);
              const dayNum = d.getDate();
              const mon = d.toLocaleDateString(dateLocale(locale), { month: "short" });
              const weekday = d.toLocaleDateString(dateLocale(locale), { weekday: "short" });
              const labelTop = range === "7d" ? weekday : `${mon} ${dayNum}`;
              const labelBot = range === "7d" ? `${mon} ${dayNum}` : "";
              const isToday = i === buckets.length - 1;
              return (
                <div key={b.date}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(h => (h === i ? null : h))}
                  style={{ flex: 1, minWidth: range === "30d" ? 32 : 46, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
                  {hovered === i && (
                    <div style={{ position: "absolute", bottom: "100%", marginBottom: 6, left: "50%", transform: "translateX(-50%)", background: "var(--text)", color: "var(--bg)", fontSize: "var(--fs-xs)", fontWeight: 600, padding: "4px 8px", borderRadius: "var(--radius-sm)", whiteSpace: "nowrap", pointerEvents: "none", zIndex: 5, boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>
                      {b.total === 1
                        ? t("analytics.tipOne", { date: d.toLocaleDateString(dateLocale(locale), { weekday: "short", month: "short", day: "numeric" }) })
                        : t("analytics.tip", { date: d.toLocaleDateString(dateLocale(locale), { weekday: "short", month: "short", day: "numeric" }), count: b.total })}
                      {b.revenue > 0 ? ` · ${money(b.revenue)}` : ""}
                    </div>
                  )}
                  <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)", fontWeight: 700, marginBottom: 3 }}>{b.total > 0 ? b.total : ""}</div>
                  <div style={{ width: "100%", background: isToday ? "var(--accent)" : "var(--text-muted)", borderRadius: "4px 4px 0 0", height: Math.max(4, (b.total / maxVal) * 90), transition: "height 0.3s ease", opacity: b.total === 0 ? 0.15 : isToday ? 1 : hovered === i ? 0.65 : 0.4 }} />
                  <div style={{ position: "absolute", bottom: -38, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                    <span style={{ fontSize: range === "30d" ? 9 : 10, color: isToday ? "var(--accent)" : "var(--text-muted)", fontWeight: isToday ? 700 : 400, whiteSpace: "nowrap" }}>{labelTop}</span>
                    {labelBot && <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{labelBot}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* By type breakdown */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "16px 20px" }}>
        <h3 style={{ fontWeight: 700, fontSize: "var(--fs-sm)", margin: "0 0 14px", color: "var(--text)" }}>{t("analytics.byType")}</h3>
        {Object.keys(TYPE_LABEL).map(type => {
          const count = byType[type] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={type} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                <span>{typeName(type, t)}</span>
                <span style={{ color: "var(--text-muted)" }}>{count} ({pct}%)</span>
              </div>
              <div style={{ height: 6, background: "var(--border)", borderRadius: "var(--radius-pill)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent)", borderRadius: "var(--radius-pill)", transition: "width 0.4s ease" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
