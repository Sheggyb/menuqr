     1|"use client";
     2|import { useState } from "react";
     3|import { createClient } from "@/lib/supabase/client";
     4|import type { Restaurant } from "@/lib/types";
     5|
     6|interface Props { restaurant: Restaurant }
     7|
     8|export default function SettingsPanel({ restaurant }: Props) {
     9|  const supabase = createClient();
    10|  const [name, setName] = useState(restaurant.name);
    11|  const [accent, setAccent] = useState(restaurant.accent_color || "#E85D2F");
    12|  const [loading, setLoading] = useState(false);
    13|  const [saved, setSaved] = useState(false);
    14|  const [error, setError] = useState("");
    15|  const [deleteConfirm, setDeleteConfirm] = useState(false);
    16|  const [deleteInput, setDeleteInput] = useState("");
    17|  const [deleting, setDeleting] = useState(false);
    18|  const [deleteError, setDeleteError] = useState("");
    19|
    20|  async function handleSave(e: React.FormEvent) {
    21|    e.preventDefault();
    22|    setLoading(true);
    23|    setError("");
    24|    const { error: err } = await supabase
    25|      .from("restaurants")
    26|      .update({ name: name.trim(), accent_color: accent })
    27|      .eq("id", restaurant.id);
    28|    setLoading(false);
    29|    if (err) { setError(err.message); } else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    30|  }
    31|
    32|  async function handleDelete() {
    33|    if (deleteInput !== restaurant.name) {
    34|      setDeleteError("Restaurant name does not match.");
    35|      return;
    36|    }
    37|    setDeleting(true);
    38|    setDeleteError("");
    39|    // Delete related data first
    40|    await supabase.from("table_requests").delete().eq("restaurant_id", restaurant.id);
    41|    await supabase.from("menu_items").delete().eq("restaurant_id", restaurant.id);
    42|    await supabase.from("menu_categories").delete().eq("restaurant_id", restaurant.id);
    43|    await supabase.from("restaurant_tables").delete().eq("restaurant_id", restaurant.id);
    44|    const { error: err } = await supabase.from("restaurants").delete().eq("id", restaurant.id);
    45|    if (err) {
    46|      setDeleteError(err.message);
    47|      setDeleting(false);
    48|    } else {
    49|      window.location.href = "/app";
    50|    }
    51|  }
    52|
    53|  return (
    54|    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
    55|      <h2 style={{ fontWeight: 700, fontSize: 20 }}>⚙️ Settings</h2>
    56|      <div className="card" style={{ maxWidth: 520 }}>
    57|        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    58|          <div>
    59|            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Restaurant name</label>
    60|            <input value={name} onChange={e => setName(e.target.value)} required />
    61|          </div>
    62|          <div>
    63|            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Accent color</label>
    64|            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
    65|              <input type="color" value={accent} onChange={e => setAccent(e.target.value)}
    66|                style={{ width: 48, height: 40, border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", padding: 2 }} />
    67|              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{accent}</span>
    68|              <div style={{ width: 32, height: 32, borderRadius: 8, background: accent, border: "1px solid var(--border)" }} />
    69|            </div>
    70|            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>This color is used on guest menus as the brand color.</p>
    71|          </div>
    72|          {error && <p style={{ color: "#dc2626", fontSize: 13 }}>{error}</p>}
    73|          {saved && <p style={{ color: "#16a34a", fontSize: 13, fontWeight: 600 }}>✅ Settings saved!</p>}
    74|          <button type="submit" className="btn-primary" disabled={loading} style={{ maxWidth: 160 }}>
    75|            {loading ? "Saving..." : "Save settings"}
    76|          </button>
    77|        </form>
    78|      </div>
    79|
    80|      {/* Danger Zone */}
    81|      <div style={{ maxWidth: 520, border: "2px solid #fecaca", borderRadius: 14, overflow: "hidden" }}>
    82|        <div style={{ background: "var(--card-bill-bg)", padding: "14px 20px", borderBottom: "1px solid #fecaca", display: "flex", alignItems: "center", gap: 8 }}>
    83|          <span style={{ fontSize: 16 }}>⚠️</span>
    84|          <span style={{ fontWeight: 700, fontSize: 15, color: "#dc2626" }}>Danger Zone</span>
    85|        </div>
    86|        <div style={{ padding: "16px 20px" }}>
    87|          <p style={{ fontSize: 14, color: "var(--text)", marginBottom: 14 }}>
    88|            Permanently delete <strong>{restaurant.name}</strong> and all its data — tables, menu, requests. This action cannot be undone.
    89|          </p>
    90|          {!deleteConfirm ? (
    91|            <button
    92|              onClick={() => setDeleteConfirm(true)}
    93|              style={{ padding: "9px 18px", borderRadius: 8, border: "2px solid #dc2626", background: "var(--surface)", color: "#dc2626", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
    94|            >
    95|              Delete restaurant…
    96|            </button>
    97|          ) : (
    98|            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    99|              <label style={{ fontSize: 13, fontWeight: 600, color: "#dc2626" }}>
   100|                Type <strong>{restaurant.name}</strong> to confirm:
   101|              </label>
   102|              <input
   103|                value={deleteInput}
   104|                onChange={e => setDeleteInput(e.target.value)}
   105|                placeholder={restaurant.name}
   106|                style={{ padding: "8px 12px", borderRadius: 8, border: "2px solid #fecaca", fontSize: 14 }}
   107|              />
   108|              {deleteError && <p style={{ color: "#dc2626", fontSize: 13 }}>{deleteError}</p>}
   109|              <div style={{ display: "flex", gap: 8 }}>
   110|                <button
   111|                  onClick={handleDelete}
   112|                  disabled={deleting}
   113|                  style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#dc2626", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: deleting ? 0.7 : 1 }}
   114|                >
   115|                  {deleting ? "Deleting..." : "Yes, delete everything"}
   116|                </button>
   117|                <button
   118|                  onClick={() => { setDeleteConfirm(false); setDeleteInput(""); setDeleteError(""); }}
   119|                  style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)", fontSize: 14, cursor: "pointer" }}
   120|                >
   121|                  Cancel
   122|                </button>
   123|              </div>
   124|            </div>
   125|          )}
   126|        </div>
   127|      </div>
   128|    </div>
   129|  );
   130|}
   131|