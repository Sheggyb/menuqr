     1|"use client";
     2|import { useState, useEffect } from "react";
     3|import { createClient } from "@/lib/supabase/client";
     4|import type { Restaurant, MenuCategory, MenuItem } from "@/lib/types";
     5|
     6|interface Props { restaurant: Restaurant }
     7|
     8|const CATEGORY_EMOJIS = ["🍽️","🍕","🍔","🌮","🍣","🍜","🥗","🍰","🍩","🧁","☕","🥤","🍺","🍷","🥂","🍵","🥩","🍗","🥞","🥙","🌯","🥘","🍲","🥚","🧆","🦐","🦞","🦑","🧀","🥐","🥖","🥨","🧇","🍟","🌭","🥪"];
     9|
    10|export default function MenuBuilder({ restaurant }: Props) {
    11|  const supabase = createClient();
    12|  const [categories, setCategories] = useState<MenuCategory[]>([]);
    13|  const [items, setItems] = useState<MenuItem[]>([]);
    14|  const [newCatName, setNewCatName] = useState("");
    15|  const [newCatIcon, setNewCatIcon] = useState("🍽️");
    16|  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    17|  const [newItem, setNewItem] = useState({ category_id: "", name: "", description: "", price: "" });
    18|  const [loading, setLoading] = useState(true);
    19|
    20|  useEffect(() => {
    21|    async function load() {
    22|      const [{ data: cats }, { data: its }] = await Promise.all([
    23|        supabase.from("menu_categories").select("*").eq("restaurant_id", restaurant.id).order("sort_order"),
    24|        supabase.from("menu_items").select("*").eq("restaurant_id", restaurant.id).order("sort_order"),
    25|      ]);
    26|      setCategories(cats ?? []);
    27|      setItems(its ?? []);
    28|      setLoading(false);
    29|    }
    30|    load();
    31|  }, [restaurant.id]);
    32|
    33|  async function addCategory() {
    34|    if (!newCatName.trim()) return;
    35|    const { data } = await supabase.from("menu_categories")
    36|      .insert({ restaurant_id: restaurant.id, name: newCatName.trim(), icon: newCatIcon, sort_order: categories.length })
    37|      .select().single();
    38|    if (data) { setCategories(c => [...c, data as MenuCategory]); setNewCatName(""); setNewCatIcon("🍽️"); setShowEmojiPicker(false); }
    39|  }
    40|
    41|  async function deleteCategory(id: string) {
    42|    await supabase.from("menu_categories").delete().eq("id", id);
    43|    setCategories(c => c.filter(x => x.id !== id));
    44|    setItems(i => i.filter(x => x.category_id !== id));
    45|  }
    46|
    47|  async function addItem() {
    48|    if (!newItem.name.trim() || !newItem.category_id) return;
    49|    const { data } = await supabase.from("menu_items")
    50|      .insert({
    51|        restaurant_id: restaurant.id,
    52|        category_id: newItem.category_id,
    53|        name: newItem.name.trim(),
    54|        description: newItem.description || null,
    55|        price: newItem.price ? parseFloat(newItem.price) : null,
    56|        is_available: true,
    57|        sort_order: items.filter(i => i.category_id === newItem.category_id).length,
    58|      })
    59|      .select().single();
    60|    if (data) { setItems(i => [...i, data as MenuItem]); setNewItem({ category_id: newItem.category_id, name: "", description: "", price: "" }); }
    61|  }
    62|
    63|  async function duplicateItem(item: MenuItem) {
    64|    const { data } = await supabase.from("menu_items")
    65|      .insert({
    66|        restaurant_id: restaurant.id,
    67|        category_id: item.category_id,
    68|        name: item.name + " (copy)",
    69|        description: item.description || null,
    70|        price: item.price ?? null,
    71|        is_available: item.is_available,
    72|        sort_order: items.filter(i => i.category_id === item.category_id).length,
    73|      })
    74|      .select().single();
    75|    if (data) setItems(i => [...i, data as MenuItem]);
    76|  }
    77|
    78|  async function toggleItem(item: MenuItem) {
    79|    await supabase.from("menu_items").update({ is_available: !item.is_available }).eq("id", item.id);
    80|    setItems(items.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i));
    81|  }
    82|
    83|  async function deleteItem(id: string) {
    84|    await supabase.from("menu_items").delete().eq("id", id);
    85|    setItems(i => i.filter(x => x.id !== id));
    86|  }
    87|
    88|  if (loading) return <p style={{ color: "var(--text-muted)" }}>Loading menu...</p>;
    89|
    90|  return (
    91|    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
    92|      <h2 style={{ fontWeight: 700, fontSize: 20 }}>🍽️ Menu Builder</h2>
    93|
    94|      {/* ADD CATEGORY */}
    95|      <div className="card">
    96|        <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>Add category</h3>
    97|        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
    98|          <div style={{ position: "relative" }}>
    99|            <button
   100|              type="button"
   101|              onClick={() => setShowEmojiPicker(p => !p)}
   102|              style={{ fontSize: 22, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", lineHeight: 1 }}
   103|              title="Pick category icon"
   104|            >
   105|              {newCatIcon}
   106|            </button>
   107|            {showEmojiPicker && (
   108|              <div style={{
   109|                position: "absolute", top: "110%", left: 0, zIndex: 20,
   110|                background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
   111|                padding: 10, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4,
   112|                boxShadow: "0 4px 20px rgba(0,0,0,0.12)", width: 240,
   113|              }}>
   114|                {CATEGORY_EMOJIS.map(e => (
   115|                  <button key={e} type="button" onClick={() => { setNewCatIcon(e); setShowEmojiPicker(false); }}
   116|                    style={{ fontSize: 20, background: newCatIcon === e ? "var(--card-waiter-bg)" : "none", border: "none", borderRadius: 6, cursor: "pointer", padding: 4, lineHeight: 1 }}>
   117|                    {e}
   118|                  </button>
   119|                ))}
   120|              </div>
   121|            )}
   122|          </div>
   123|          <input
   124|            style={{ flex: 1, minWidth: 120 }}
   125|            value={newCatName}
   126|            onChange={e => setNewCatName(e.target.value)}
   127|            placeholder="e.g. Drinks, Starters, Mains..."
   128|            onKeyDown={e => e.key === "Enter" && addCategory()}
   129|          />
   130|          <button className="btn-primary" onClick={addCategory} style={{ whiteSpace: "nowrap" }}>+ Add</button>
   131|        </div>
   132|      </div>
   133|
   134|      {/* ADD ITEM */}
   135|      {categories.length > 0 && (
   136|        <div className="card">
   137|          <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>Add item</h3>
   138|          <div style={{ display: "grid", gap: 10 }}>
   139|            <select value={newItem.category_id} onChange={e => setNewItem(n => ({ ...n, category_id: e.target.value }))}>
   140|              <option value="">Select category</option>
   141|              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
   142|            </select>
   143|            <input placeholder="Item name *" value={newItem.name} onChange={e => setNewItem(n => ({ ...n, name: e.target.value }))} />
   144|            <input placeholder="Description (optional)" value={newItem.description} onChange={e => setNewItem(n => ({ ...n, description: e.target.value }))} />
   145|            <input placeholder="Price e.g. 89.00 (optional)" value={newItem.price} onChange={e => setNewItem(n => ({ ...n, price: e.target.value }))} type="number" step="0.01" />
   146|            <button className="btn-primary" onClick={addItem}>+ Add item</button>
   147|          </div>
   148|        </div>
   149|      )}
   150|
   151|      {/* CATEGORIES + ITEMS */}
   152|      {categories.map(cat => (
   153|        <div key={cat.id} className="card">
   154|          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
   155|            <h3 style={{ fontWeight: 700 }}>{cat.icon} {cat.name} <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: 13 }}>({items.filter(i => i.category_id === cat.id).length} items)</span></h3>
   156|            <button onClick={() => deleteCategory(cat.id)} style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>Delete category</button>
   157|          </div>
   158|          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
   159|            {items.filter(i => i.category_id === cat.id).map(item => (
   160|              <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: item.is_available ? "var(--item-available-bg)" : "var(--item-unavailable-bg)", borderRadius: 8, gap: 8, flexWrap: "wrap" }}>
   161|                <span style={{ color: "var(--text-muted)", fontSize: 16, cursor: "grab", userSelect: "none", lineHeight: 1, flexShrink: 0 }} title="Drag to reorder">↕</span>
   162|                <div style={{ flex: 1, minWidth: 100 }}>
   163|                  <span style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</span>
   164|                  {item.price && <span style={{ marginLeft: 8, color: "var(--text-muted)", fontSize: 13 }}>{item.price} kr</span>}
   165|                  {item.description && <p style={{ color: "var(--text-muted)", fontSize: 12, margin: "2px 0 0" }}>{item.description}</p>}
   166|                </div>
   167|                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
   168|                  <button onClick={() => toggleItem(item)} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", background: item.is_available ? "#dcfce7" : "#fee2e2", cursor: "pointer", fontWeight: 600 }}>
   169|                    {item.is_available ? "✅ Available" : "❌ Hidden"}
   170|                  </button>
   171|                  <button
   172|                    onClick={() => duplicateItem(item)}
   173|                    title="Duplicate item"
   174|                    style={{ fontSize: 13, padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", color: "var(--text-muted)" }}
   175|                  >
   176|                    ⧉
   177|                  </button>
   178|                  <button onClick={() => deleteItem(item.id)} style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
   179|                </div>
   180|              </div>
   181|            ))}
   182|            {items.filter(i => i.category_id === cat.id).length === 0 && (
   183|              <div style={{ textAlign: "center", padding: "24px 16px", color: "var(--text-muted)", background: "var(--item-available-bg)", borderRadius: 8 }}>
   184|                <div style={{ fontSize: 28, marginBottom: 6 }}>{cat.icon}</div>
   185|                <p style={{ fontSize: 13, margin: 0 }}>No items in <strong>{cat.name}</strong> yet. Add one above!</p>
   186|              </div>
   187|            )}
   188|          </div>
   189|        </div>
   190|      ))}
   191|
   192|      {categories.length === 0 && (
   193|        <div style={{ textAlign: "center", padding: "48px 16px", color: "var(--text-muted)", background: "var(--surface)", borderRadius: 14, border: "2px dashed var(--border)" }}>
   194|          <div style={{ fontSize: 52, marginBottom: 12 }}>🍽️</div>
   195|          <p style={{ fontWeight: 600, fontSize: 15, color: "var(--text)", marginBottom: 4 }}>Your menu is empty</p>
   196|          <p style={{ fontSize: 13 }}>Start by adding a category above (e.g. "Drinks", "Mains")</p>
   197|        </div>
   198|      )}
   199|    </div>
   200|  );
   201|}
   202|