     1|"use client";
     2|import { useState, useEffect } from "react";
     3|import Link from "next/link";
     4|import { createClient } from "@/lib/supabase/client";
     5|import type { Restaurant, TableRow } from "@/lib/types";
     6|
     7|interface Props { restaurant: Restaurant }
     8|
     9|export default function TableManager({ restaurant }: Props) {
    10|  const supabase = createClient();
    11|  const [tables, setTables] = useState<TableRow[]>([]);
    12|  const [newName, setNewName] = useState("");
    13|  const [loading, setLoading] = useState(true);
    14|  const [qrModal, setQrModal] = useState<TableRow | null>(null);
    15|  const [qrDataUrl, setQrDataUrl] = useState<string>("");
    16|  const [lastRequests, setLastRequests] = useState<Record<string, string>>({});
    17|
    18|  useEffect(() => {
    19|    supabase.from("restaurant_tables").select("*").eq("restaurant_id", restaurant.id).order("name")
    20|      .then(({ data }) => { setTables(data ?? []); setLoading(false); });
    21|  }, [restaurant.id]);
    22|
    23|  useEffect(() => {
    24|    if (tables.length === 0) return;
    25|    supabase.from("table_requests")
    26|      .select("table_id, created_at")
    27|      .eq("restaurant_id", restaurant.id)
    28|      .order("created_at", { ascending: false })
    29|      .limit(200)
    30|      .then(({ data }) => {
    31|        if (!data) return;
    32|        const map: Record<string, string> = {};
    33|        for (const r of data) {
    34|          if (!map[r.table_id]) map[r.table_id] = r.created_at;
    35|        }
    36|        setLastRequests(map);
    37|      });
    38|  }, [tables, restaurant.id]);
    39|
    40|  const [copiedId, setCopiedId] = useState<string | null>(null);
    41|  const [pendingByTable, setPendingByTable] = useState<Record<string, number>>({});
    42|
    43|  useEffect(() => {
    44|    if (tables.length === 0) return;
    45|    const fetchPending = () =>
    46|      supabase.from("table_requests").select("table_id").eq("restaurant_id", restaurant.id).eq("status", "pending").then(({ data }) => {
    47|        if (!data) return;
    48|        const counts: Record<string, number> = {};
    49|        for (const r of data) counts[r.table_id] = (counts[r.table_id] ?? 0) + 1;
    50|        setPendingByTable(counts);
    51|      });
    52|    fetchPending();
    53|    const channel = supabase.channel("tablemanager-pending")
    54|      .on("postgres_changes", { event: "*", schema: "public", table: "table_requests", filter: `restaurant_id=eq.${restaurant.id}` }, fetchPending)
    55|      .subscribe();
    56|    return () => { supabase.removeChannel(channel); };
    57|  }, [tables.length, restaurant.id]);
    58|
    59|  function copyLink(table: TableRow) {
    60|    const url = `${window.location.origin}/menu/${table.token}`;
    61|    navigator.clipboard.writeText(url).then(() => {
    62|      setCopiedId(table.id);
    63|      setTimeout(() => setCopiedId(null), 2000);
    64|    });
    65|  }
    66|
    67|  async function addTable() {
    68|    if (!newName.trim()) return;
    69|    const token = crypto.randomUUID();
    70|    const { data } = await supabase.from("restaurant_tables")
    71|      .insert({ restaurant_id: restaurant.id, name: newName.trim(), token, is_active: true })
    72|      .select().single();
    73|    if (data) { setTables(t => [...t, data as TableRow]); setNewName(""); }
    74|  }
    75|
    76|  async function deleteTable(id: string) {
    77|    await supabase.from("restaurant_tables").delete().eq("id", id);
    78|    setTables(t => t.filter(x => x.id !== id));
    79|  }
    80|
    81|  async function toggleAll() {
    82|    const anyActive = tables.some(t => t.is_active);
    83|    const newState = !anyActive;
    84|    await supabase.from("restaurant_tables").update({ is_active: newState }).eq("restaurant_id", restaurant.id);
    85|    setTables(tables.map(t => ({ ...t, is_active: newState })));
    86|  }
    87|
    88|  async function toggleTable(table: TableRow) {
    89|    await supabase.from("restaurant_tables").update({ is_active: !table.is_active }).eq("id", table.id);
    90|    setTables(tables.map(t => t.id === table.id ? { ...t, is_active: !t.is_active } : t));
    91|  }
    92|
    93|  async function showQR(table: TableRow) {
    94|    setQrModal(table);
    95|    const url = `${window.location.origin}/menu/${table.token}`;
    96|    const QRCode = (await import("qrcode")).default;
    97|    const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 });
    98|    setQrDataUrl(dataUrl);
    99|  }
   100|
   101|  function downloadQR(table: TableRow) {
   102|    const link = document.createElement("a");
   103|    link.href = qrDataUrl;
   104|    link.download = `table-${table.name}.png`;
   105|    link.click();
   106|  }
   107|
   108|  if (loading) return <p style={{ color: "var(--text-muted)" }}>Loading tables...</p>;
   109|
   110|  return (
   111|    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
   112|      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
   113|
   114|      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
   115|        <h2 style={{ fontWeight: 700, fontSize: 20 }}>🍽️ Table Manager</h2>
   116|        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
   117|          {tables.length > 0 && (
   118|            <button onClick={toggleAll} style={{ fontSize: 13, padding: "6px 14px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", cursor: "pointer", fontWeight: 600 }}>
   119|              {tables.some(t => t.is_active) ? "🔒 Close all" : "🔓 Open all"}
   120|            </button>
   121|          )}
   122|          <Link href="/app/print-qr" style={{ fontSize: 13, padding: "6px 14px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", textDecoration: "none", fontWeight: 600 }}>🖨️ Print all QR codes</Link>
   123|        </div>
   124|      </div>
   125|
   126|      <div className="card">
   127|        <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>Add a table</h3>
   128|        <div style={{ display: "flex", gap: 8 }}>
   129|          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder='e.g. Table 1, Bar Seat A, Terrace 3...' onKeyDown={e => e.key === "Enter" && addTable()} />
   130|          <button className="btn-primary" onClick={addTable} style={{ whiteSpace: "nowrap" }}>+ Add</button>
   131|        </div>
   132|      </div>
   133|
   134|      {tables.length === 0 ? (
   135|        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", background: "var(--surface)", borderRadius: 14, border: "2px dashed var(--border)" }}>
   136|          <div style={{ fontSize: 40, marginBottom: 8 }}>🍽️</div>
   137|          <p style={{ fontWeight: 600, fontSize: 15, color: "var(--text)", marginBottom: 4 }}>No tables yet</p>
   138|          <p style={{ fontSize: 13 }}>Add a table above to generate a QR code for guests.</p>
   139|        </div>
   140|      ) : (
   141|        <>
   142|          {/* STATUS GRID */}
   143|          <div className="card" style={{ padding: "16px 20px" }}>
   144|            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
   145|              <h3 style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>Table Status</h3>
   146|              <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--text-muted)", flexWrap: "wrap" }}>
   147|              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />Idle</span>
   148|                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />Has requests</span>
   149|                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#dc2626", display: "inline-block" }} />Urgent (3+)</span>
   150|                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--text-muted)", display: "inline-block" }} />Closed</span>
   151|              </div>
   152|            </div>
   153|            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8 }}>
   154|              {tables.map(table => {
   155|                const pending = pendingByTable[table.id] ?? 0;
   156|                const isUrgent = pending >= 3;
   157|                const hasPending = pending > 0 && !isUrgent;
   158|                const bgColor = !table.is_active ? "var(--item-available-bg)" : isUrgent ? "var(--card-late-bg)" : hasPending ? "var(--card-waiter-bg)" : "var(--card-order-bg)";
   159|                const borderColor = !table.is_active ? "var(--border)" : isUrgent ? "#dc2626" : hasPending ? "#f59e0b" : "#22c55e";
   160|                const dotColor = !table.is_active ? "var(--text-muted)" : isUrgent ? "#dc2626" : hasPending ? "#f59e0b" : "#22c55e";
   161|                const textColor = !table.is_active ? "var(--text-muted)" : isUrgent ? "#dc2626" : hasPending ? "#92400e" : "#166534";
   162|                return (
   163|                  <div
   164|                    key={table.id}
   165|                    style={{ background: bgColor, border: `2px solid ${borderColor}`, borderRadius: 10, padding: "10px 8px", textAlign: "center", cursor: "pointer", transition: "transform 0.1s" }}
   166|                    title={`${table.name} — ${!table.is_active ? "Closed" : pending > 0 ? `${pending} pending` : "Open"} (click to toggle)`}
   167|                    onClick={() => toggleTable(table)}
   168|                  >
   169|                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, display: "inline-block", marginBottom: 4 }} />
   170|                    <div style={{ fontSize: 18, marginBottom: 2 }}>🍽️</div>
   171|                    <div style={{ fontSize: 11, fontWeight: 700, color: textColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{table.name}</div>
   172|                    {pending > 0 && <div style={{ fontSize: 10, fontWeight: 800, color: "#E85D2F", marginTop: 2 }}>{pending} !</div>}
   173|                  </div>
   174|                );
   175|              })}
   176|            </div>
   177|          </div>
   178|
   179|          {/* TABLE LIST */}
   180|          <div style={{ display: "grid", gap: 12 }}>
   181|            {tables.map(table => (
   182|              <div key={table.id} className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px", flexWrap: "wrap" }}>
   183|                <div>
   184|                  <span style={{ fontWeight: 700 }}>{table.name}</span>
   185|                  {pendingByTable[table.id] > 0 && (
   186|                    <span style={{ marginLeft: 8, fontSize: 12, padding: "2px 8px", borderRadius: 99, background: "#E85D2F", color: "white", fontWeight: 700, animation: "pulse 1.5s ease-in-out infinite" }}>
   187|                      {pendingByTable[table.id]} waiting
   188|                    </span>
   189|                  )}
   190|                  <span style={{ marginLeft: 8, fontSize: 12, padding: "2px 8px", borderRadius: 99, background: table.is_active ? "#dcfce7" : "#fee2e2", color: table.is_active ? "#166534" : "#991b1b", fontWeight: 600 }}>
   191|                    {table.is_active ? "Open" : "Closed"}
   192|                  </span>
   193|                  {lastRequests[table.id] && (
   194|                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
   195|                      Last request: {new Date(lastRequests[table.id]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
   196|                    </div>
   197|                  )}
   198|                </div>
   199|                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
   200|                  <button onClick={() => showQR(table)} style={{ fontSize: 13, padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontWeight: 600 }}>📱 QR Code</button>
   201|                  <button onClick={() => copyLink(table)} style={{ fontSize: 13, padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)", background: copiedId === table.id ? "#dcfce7" : "var(--surface)", cursor: "pointer", fontWeight: 600, color: copiedId === table.id ? "#166534" : "var(--text)" }}>
   202|                    {copiedId === table.id ? "✅ Copied!" : "🔗 Copy link"}
   203|                  </button>
   204|                  <button onClick={() => toggleTable(table)} style={{ fontSize: 13, padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer" }}>
   205|                    {table.is_active ? "Close" : "Open"}
   206|                  </button>
   207|                  <button onClick={() => deleteTable(table.id)} style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
   208|                </div>
   209|              </div>
   210|            ))}
   211|          </div>
   212|        </>
   213|      )}
   214|
   215|      {/* QR MODAL */}
   216|      {qrModal && (
   217|        <div onClick={() => setQrModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
   218|          <div onClick={e => e.stopPropagation()} className="card" style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>
   219|            <h3 style={{ fontWeight: 700, marginBottom: 4 }}>QR Code — {qrModal.name}</h3>
   220|            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16, wordBreak: "break-all" }}>
   221|              {typeof window !== "undefined" && `${window.location.origin}/menu/${qrModal.token}`}
   222|            </p>
   223|            {qrDataUrl ? (
   224|              <img src={qrDataUrl} alt="QR" style={{ width: 220, height: 220, margin: "0 auto 16px", display: "block", borderRadius: 8 }} />
   225|            ) : (
   226|              <div style={{ width: 220, height: 220, margin: "0 auto 16px", background: "var(--bg)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>Loading...</div>
   227|            )}
   228|            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
   229|              <button className="btn-primary" onClick={() => downloadQR(qrModal)}>⬇️ Download PNG</button>
   230|              <button className="btn-secondary" onClick={() => setQrModal(null)}>Close</button>
   231|            </div>
   232|          </div>
   233|        </div>
   234|      )}
   235|    </div>
   236|  );
   237|}
   238|