"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant, MenuCategory, MenuItem } from "@/lib/types";

interface Props { restaurant: Restaurant }

const CATEGORY_EMOJIS = ["🍽️","🍕","🍔","🌮","🍣","🍜","🥗","🍰","🍩","🧁","☕","🥤","🍺","🍷","🥂","🍵","🥩","🍗","🥞","🥙","🌯","🥘","🍲","🥚","🧆","🦐","🦞","🦑","🧀","🥐","🥖","🥨","🧇","🍟","🌭","🥪"];

export default function MenuBuilder({ restaurant }: Props) {
  const supabase = createClient();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("🍽️");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [newItem, setNewItem] = useState({ category_id: "", name: "", description: "", price: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: cats }, { data: its }] = await Promise.all([
        supabase.from("menu_categories").select("*").eq("restaurant_id", restaurant.id).order("sort_order"),
        supabase.from("menu_items").select("*").eq("restaurant_id", restaurant.id).order("sort_order"),
      ]);
      setCategories(cats ?? []);
      setItems(its ?? []);
      setLoading(false);
    }
    load();
  }, [restaurant.id]);

  async function addCategory() {
    if (!newCatName.trim()) return;
    const { data } = await supabase.from("menu_categories")
      .insert({ restaurant_id: restaurant.id, name: newCatName.trim(), icon: newCatIcon, sort_order: categories.length })
      .select().single();
    if (data) { setCategories(c => [...c, data as MenuCategory]); setNewCatName(""); setNewCatIcon("🍽️"); setShowEmojiPicker(false); }
  }

  async function deleteCategory(id: string) {
    await supabase.from("menu_categories").delete().eq("id", id);
    setCategories(c => c.filter(x => x.id !== id));
    setItems(i => i.filter(x => x.category_id !== id));
  }

  async function addItem() {
    if (!newItem.name.trim() || !newItem.category_id) return;
    const { data } = await supabase.from("menu_items")
      .insert({
        restaurant_id: restaurant.id,
        category_id: newItem.category_id,
        name: newItem.name.trim(),
        description: newItem.description || null,
        price: newItem.price ? parseFloat(newItem.price) : null,
        is_available: true,
        sort_order: items.filter(i => i.category_id === newItem.category_id).length,
      })
      .select().single();
    if (data) { setItems(i => [...i, data as MenuItem]); setNewItem({ category_id: newItem.category_id, name: "", description: "", price: "" }); }
  }

  async function duplicateItem(item: MenuItem) {
    const { data } = await supabase.from("menu_items")
      .insert({
        restaurant_id: restaurant.id,
        category_id: item.category_id,
        name: item.name + " (copy)",
        description: item.description || null,
        price: item.price ?? null,
        is_available: item.is_available,
        sort_order: items.filter(i => i.category_id === item.category_id).length,
      })
      .select().single();
    if (data) setItems(i => [...i, data as MenuItem]);
  }

  async function toggleItem(item: MenuItem) {
    await supabase.from("menu_items").update({ is_available: !item.is_available }).eq("id", item.id);
    setItems(items.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i));
  }

  async function deleteItem(id: string) {
    await supabase.from("menu_items").delete().eq("id", id);
    setItems(i => i.filter(x => x.id !== id));
  }

  if (loading) return <p style={{ color: "var(--text-muted)" }}>Loading menu...</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h2 style={{ fontWeight: 700, fontSize: 20 }}>🍽️ Menu Builder</h2>

      {/* ADD CATEGORY */}
      <div className="card">
        <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>Add category</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(p => !p)}
              style={{ fontSize: 22, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", lineHeight: 1 }}
              title="Pick category icon"
            >
              {newCatIcon}
            </button>
            {showEmojiPicker && (
              <div style={{
                position: "absolute", top: "110%", left: 0, zIndex: 20,
                background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
                padding: 10, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4,
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)", width: 240,
              }}>
                {CATEGORY_EMOJIS.map(e => (
                  <button key={e} type="button" onClick={() => { setNewCatIcon(e); setShowEmojiPicker(false); }}
                    style={{ fontSize: 20, background: newCatIcon === e ? "var(--card-waiter-bg)" : "none", border: "none", borderRadius: 6, cursor: "pointer", padding: 4, lineHeight: 1 }}>
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            style={{ flex: 1, minWidth: 120 }}
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            placeholder="e.g. Drinks, Starters, Mains..."
            onKeyDown={e => e.key === "Enter" && addCategory()}
          />
          <button className="btn-primary" onClick={addCategory} style={{ whiteSpace: "nowrap" }}>+ Add</button>
        </div>
      </div>

      {/* ADD ITEM */}
      {categories.length > 0 && (
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>Add item</h3>
          <div style={{ display: "grid", gap: 10 }}>
            <select value={newItem.category_id} onChange={e => setNewItem(n => ({ ...n, category_id: e.target.value }))}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
            <input placeholder="Item name *" value={newItem.name} onChange={e => setNewItem(n => ({ ...n, name: e.target.value }))} />
            <input placeholder="Description (optional)" value={newItem.description} onChange={e => setNewItem(n => ({ ...n, description: e.target.value }))} />
            <input placeholder="Price e.g. 89.00 (optional)" value={newItem.price} onChange={e => setNewItem(n => ({ ...n, price: e.target.value }))} type="number" step="0.01" />
            <button className="btn-primary" onClick={addItem}>+ Add item</button>
          </div>
        </div>
      )}

      {/* CATEGORIES + ITEMS */}
      {categories.map(cat => (
        <div key={cat.id} className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontWeight: 700 }}>{cat.icon} {cat.name} <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: 13 }}>({items.filter(i => i.category_id === cat.id).length} items)</span></h3>
            <button onClick={() => deleteCategory(cat.id)} style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>Delete category</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.filter(i => i.category_id === cat.id).map(item => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: item.is_available ? "var(--item-available-bg)" : "var(--item-unavailable-bg)", borderRadius: 8, gap: 8, flexWrap: "wrap" }}>
                <span style={{ color: "var(--text-muted)", fontSize: 16, cursor: "grab", userSelect: "none", lineHeight: 1, flexShrink: 0 }} title="Drag to reorder">↕</span>
                <div style={{ flex: 1, minWidth: 100 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</span>
                  {item.price && <span style={{ marginLeft: 8, color: "var(--text-muted)", fontSize: 13 }}>{item.price} kr</span>}
                  {item.description && <p style={{ color: "var(--text-muted)", fontSize: 12, margin: "2px 0 0" }}>{item.description}</p>}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <button onClick={() => toggleItem(item)} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", background: item.is_available ? "var(--card-order-bg)" : "var(--card-bill-bg)", color: item.is_available ? "#22c55e" : "#f43f5e", cursor: "pointer", fontWeight: 600 }}>
                    {item.is_available ? "✅ Available" : "❌ Hidden"}
                  </button>
                  <button
                    onClick={() => duplicateItem(item)}
                    title="Duplicate item"
                    style={{ fontSize: 13, padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", color: "var(--text-muted)" }}
                  >
                    ⧉
                  </button>
                  <button onClick={() => deleteItem(item.id)} style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
                </div>
              </div>
            ))}
            {items.filter(i => i.category_id === cat.id).length === 0 && (
              <div style={{ textAlign: "center", padding: "24px 16px", color: "var(--text-muted)", background: "var(--item-available-bg)", borderRadius: 8 }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{cat.icon}</div>
                <p style={{ fontSize: 13, margin: 0 }}>No items in <strong>{cat.name}</strong> yet. Add one above!</p>
              </div>
            )}
          </div>
        </div>
      ))}

      {categories.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 16px", color: "var(--text-muted)", background: "var(--item-available-bg)", borderRadius: 14, border: "2px dashed var(--border)" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🍽️</div>
          <p style={{ fontWeight: 600, fontSize: 15, color: "var(--text)", marginBottom: 4 }}>Your menu is empty</p>
          <p style={{ fontSize: 13 }}>Start by adding a category above (e.g. "Drinks", "Mains")</p>
        </div>
      )}
    </div>
  );
}
