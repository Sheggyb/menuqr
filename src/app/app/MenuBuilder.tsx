"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant, MenuCategory, MenuItem } from "@/lib/types";
import ContextMenu, { type ContextMenuAction } from "@/components/ContextMenu";

interface Props { restaurant: Restaurant }

const CATEGORY_EMOJIS = ["🍽️","🍕","🍔","🌮","🍣","🍜","🥗","🍰","🍩","🧁","☕","🥤","🍺","🍷","🥂","🍵","🥩","🍗","🥞","🥙","🌯","🥘","🍲","🥚","🧆","🦐","🦞","🦑","🧀","🥐","🥖","🥨","🧇","🍟","🌭","🥪"];

interface InlineEdit {
  itemId: string;
  field: "name" | "description" | "price";
}

interface QuickAdd {
  name: string;
  price: string;
}

export default function MenuBuilder({ restaurant }: Props) {
  const supabase = createClient();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Inline editing state
  const [edit, setEdit] = useState<InlineEdit | null>(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // Quick-add per category
  const [quickAdds, setQuickAdds] = useState<Record<string, QuickAdd>>({});
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Confirmation state — kept for categories only (header delete button)
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<string | null>(null);

  // Context menu
  interface CtxMenu { x: number; y: number; items: ContextMenuAction[] }
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);

  const openCtxMenu = useCallback((e: React.MouseEvent, items: ContextMenuAction[]) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, items });
  }, []);

  // Currency (persisted per restaurant)
  const [currency, setCurrency] = useState(() => {
    try { return localStorage.getItem(`menuqr_currency_${restaurant.id}`) || "SEK"; } catch { return "SEK"; }
  });

  const CURRENCIES: Record<string, string> = {
    SEK: "kr", USD: "$", EUR: "€", GBP: "£", NOK: "kr", DKK: "kr", CHF: "CHF", JPY: "¥", AUD: "$", CAD: "$",
  };
  const currencySymbol = CURRENCIES[currency] ?? currency;

  // Add category
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("🍽️");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Edit category inline
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatIcon, setEditCatIcon] = useState("🍽️");
  const [showEditEmojiPicker, setShowEditEmojiPicker] = useState(false);
  const editCatInputRef = useRef<HTMLInputElement>(null);

  function startEditCat(cat: MenuCategory) {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditCatIcon(cat.icon ?? "🍽️");
    setShowEditEmojiPicker(false);
  }

  async function saveEditCat() {
    if (!editingCatId || !editCatName.trim()) { setEditingCatId(null); return; }
    await supabase.from("menu_categories")
      .update({ name: editCatName.trim(), icon: editCatIcon })
      .eq("id", editingCatId);
    setCategories(prev => prev.map(c =>
      c.id === editingCatId ? { ...c, name: editCatName.trim(), icon: editCatIcon } : c
    ));
    setEditingCatId(null);
    setShowEditEmojiPicker(false);
  }

  function cancelEditCat() {
    setEditingCatId(null);
    setShowEditEmojiPicker(false);
  }

  useEffect(() => {
    if (editingCatId && editCatInputRef.current) {
      editCatInputRef.current.focus();
      editCatInputRef.current.select();
    }
  }, [editingCatId]);

  // Drag state — use ref to avoid re-renders during drag
  const dragItemRef = useRef<string | null>(null);
  const dragCatRef = useRef<string | null>(null);

  // Load data
  useEffect(() => {
    async function load() {
      const [{ data: cats }, { data: its }] = await Promise.all([
        supabase.from("menu_categories").select("*").eq("restaurant_id", restaurant.id).order("sort_order"),
        supabase.from("menu_items").select("*").eq("restaurant_id", restaurant.id).order("sort_order"),
      ]);
      const loadedCats = (cats ?? []) as MenuCategory[];
      const loadedItems = (its ?? []) as MenuItem[];
      setCategories(loadedCats);
      setAllItems(loadedItems);
      setItems(loadedItems);
      if (loadedCats.length > 0 && !selectedCatId) setSelectedCatId(loadedCats[0].id);
      setLoading(false);
    }
    load();
  }, [restaurant.id]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (edit && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [edit]);

  // Filter items by selected category + search
  const filteredItems = items
    .filter(item => {
      const matchCat = selectedCatId ? item.category_id === selectedCatId : true;
      const matchSearch = !searchQuery
        || item.name.toLowerCase().includes(searchQuery.toLowerCase())
        || (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      return matchCat && matchSearch;
    })
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  // When searching, show items from all categories
  const displayItems = searchQuery
    ? allItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      )
    : filteredItems;

  // Aggregate item count per category
  const catItemCounts: Record<string, number> = {};
  for (const item of allItems) {
    catItemCounts[item.category_id] = (catItemCounts[item.category_id] ?? 0) + 1;
  }

  // ─── CATEGORY CRUD ────────────────────────────────────

  async function deleteCategory(id: string) {
    await supabase.from("menu_categories").delete().eq("id", id);
    setCategories(c => c.filter(x => x.id !== id));
    setAllItems(i => i.filter(x => x.category_id !== id));
    setItems(i => i.filter(x => x.category_id !== id));
    if (selectedCatId === id) {
      const remaining = categories.filter(x => x.id !== id);
      setSelectedCatId(remaining[0]?.id ?? "");
    }
  }

  async function addCategory() {
    if (!newCatName.trim()) return;
    const { data } = await supabase.from("menu_categories")
      .insert({ restaurant_id: restaurant.id, name: newCatName.trim(), icon: newCatIcon, sort_order: categories.length })
      .select().single();
    if (data) {
      const cat = data as MenuCategory;
      setCategories(c => [...c, cat]);
      setSelectedCatId(cat.id);
      setNewCatName("");
      setNewCatIcon("🍽️");
      setShowEmojiPicker(false);
      setAddingCategory(false);
    }
  }

  async function quickAddItem(catId: string) {
    const q = quickAdds[catId];
    if (!q?.name.trim()) return;
    const { data } = await supabase.from("menu_items")
      .insert({
        restaurant_id: restaurant.id,
        category_id: catId,
        name: q.name.trim(),
        price: q.price ? parseFloat(q.price) : null,
        is_available: true,
        sort_order: allItems.filter(i => i.category_id === catId).length,
      })
      .select().single();
    if (data) {
      const item = data as MenuItem;
      setAllItems(i => [...i, item]);
      setItems(i => [...i, item]);
      setQuickAdds(prev => ({ ...prev, [catId]: { name: "", price: "" } }));
      setShowQuickAdd(false);
    }
  }

  async function duplicateItem(item: MenuItem) {
    const { data } = await supabase.from("menu_items")
      .insert({
        restaurant_id: restaurant.id,
        category_id: item.category_id,
        name: item.name + " (copy)",
        description: item.description ?? null,
        price: item.price ?? null,
        is_available: item.is_available,
        sort_order: allItems.filter(i => i.category_id === item.category_id).length,
      })
      .select().single();
    if (data) {
      const newItem = data as MenuItem;
      setAllItems(i => [...i, newItem]);
      setItems(i => [...i, newItem]);
    }
  }

  async function toggleItem(item: MenuItem) {
    await supabase.from("menu_items").update({ is_available: !item.is_available }).eq("id", item.id);
    const updater = (i: MenuItem[]) => i.map(x => x.id === item.id ? { ...x, is_available: !x.is_available } : x);
    setAllItems(updater);
    setItems(updater);
  }

  async function deleteItem(id: string) {
    await supabase.from("menu_items").delete().eq("id", id);
    setAllItems(i => i.filter(x => x.id !== id));
    setItems(i => i.filter(x => x.id !== id));
  }

  // ─── INLINE EDIT ──────────────────────────────────────

  function startEdit(itemId: string, field: InlineEdit["field"], currentValue: string) {
    setEdit({ itemId, field });
    setEditValue(currentValue);
  }

  async function saveEdit() {
    if (!edit) return;
    const value = edit.field === "price" ? editValue : editValue.trim();
    const update: Record<string, unknown> = {};
    if (edit.field === "price") {
      update.price = value ? parseFloat(value) : null;
    } else {
      update[edit.field] = value || null;
    }
    await supabase.from("menu_items").update(update).eq("id", edit.itemId);
    const updater = (i: MenuItem[]) => i.map(x => x.id === edit.itemId ? { ...x, ...update } as MenuItem : x);
    setAllItems(updater);
    setItems(updater);
    setEdit(null);
  }

  function cancelEdit() {
    setEdit(null);
    setEditValue("");
  }

  // ─── DRAG & DROP (items) ──────────────────────────────

  function handleItemDragStart(e: React.DragEvent, itemId: string) {
    dragItemRef.current = itemId;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemId);
  }

  function handleItemDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  async function handleItemDrop(e: React.DragEvent, targetItemId: string) {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = dragItemRef.current;
    dragItemRef.current = null;
    if (!draggedId || draggedId === targetItemId) return;
    const sourceItem = allItems.find(i => i.id === draggedId);
    if (!sourceItem) return;

    // Work from the already-sorted category slice
    const catItems = allItems
      .filter(i => i.category_id === sourceItem.category_id)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    const sourceIdx = catItems.findIndex(i => i.id === draggedId);
    const targetIdx = catItems.findIndex(i => i.id === targetItemId);
    if (sourceIdx < 0 || targetIdx < 0 || sourceIdx === targetIdx) return;

    // Splice using indices from the SAME original array (no re-lookup after splice)
    const reordered = [...catItems];
    const [moved] = reordered.splice(sourceIdx, 1);
    reordered.splice(targetIdx, 0, moved);

    // Stamp new sort_order values into allItems
    const updated = allItems.map(item => {
      const newIdx = reordered.findIndex(r => r.id === item.id);
      return newIdx >= 0 ? { ...item, sort_order: newIdx } : item;
    });

    setAllItems(updated);
    setItems(updated);

    await Promise.all(reordered.map((item, i) =>
      supabase.from("menu_items").update({ sort_order: i }).eq("id", item.id)
    ));
  }

  function handleDragEnd() {
    dragItemRef.current = null;
    dragCatRef.current = null;
  }

  // ─── RENDER ───────────────────────────────────────────

  if (loading) return <p style={{ color: "var(--text-muted)", padding: 24 }}>Loading menu...</p>;

  const activeCat = categories.find(c => c.id === selectedCatId);
  const hasSearchResults = searchQuery && displayItems.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, height: "100%" }}>
      <style>{`
        .menu-builder-layout { display: flex; gap: 0; flex: 1; min-height: 400px; }
        .menu-sidebar { width: 200px; flex-shrink: 0; border-right: 1px solid var(--border); display: flex; flex-direction: column; gap: 2px; padding-right: 12px; }
        .menu-sidebar-label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 8px 8px; }
        .menu-main { flex: 1; padding-left: 24px; display: flex; flex-direction: column; gap: 0; }
        @media (max-width: 700px) {
          .menu-builder-layout { flex-direction: column; }
          .menu-sidebar { width: 100%; border-right: none; border-bottom: 1px solid var(--border); flex-direction: row; overflow-x: auto; padding: 0 0 12px; gap: 4px; flex-shrink: 0; }
          .menu-sidebar button { white-space: nowrap; flex-shrink: 0; width: auto; font-size: 12px; padding: 6px 10px; }
          .menu-sidebar-label { display: none; }
          .menu-main { padding-left: 0; padding-top: 16px; }
        }
      `}</style>
      {/* SEARCH BAR */}
      <div style={{ padding: "0 0 20px" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ padding: "9px 14px 9px 38px", width: "100%" }}
            />
          </div>
          {!addingCategory && (
            <>
              <select
                value={currency}
                onChange={e => { setCurrency(e.target.value); localStorage.setItem(`menuqr_currency_${restaurant.id}`, e.target.value); }}
                style={{ padding: "7px 8px", fontSize: 12, fontWeight: 600, width: "auto", cursor: "pointer", borderRadius: 8 }}
                title="Currency for prices"
              >
                {Object.entries(CURRENCIES).map(([code, sym]) => (
                  <option key={code} value={code}>{sym} {code}</option>
                ))}
              </select>
              <button
                onClick={() => setAddingCategory(true)}
                style={{ padding: "9px 16px", borderRadius: 8, background: "var(--accent)", color: "white", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" }}
              >
                + Category
              </button>
            </>
          )}
        </div>
      </div>

      {/* ADD CATEGORY FORM */}
      {addingCategory && (
        <div className="card" style={{ marginBottom: 16, padding: "16px 20px" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(p => !p)}
                style={{ fontSize: 22, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", lineHeight: 1 }}
              >
                {newCatIcon}
              </button>
              {showEmojiPicker && (
                <div style={{
                  position: "absolute", top: "110%", left: 0, zIndex: 20,
                  background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
                  padding: 10, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)", width: 240,
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
              autoFocus
              style={{ flex: 1, minWidth: 120 }}
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="Category name…"
              onKeyDown={e => { if (e.key === "Enter") addCategory(); if (e.key === "Escape") { setAddingCategory(false); setNewCatName(""); } }}
            />
            <button className="btn-primary" onClick={addCategory} style={{ whiteSpace: "nowrap", fontSize: 13, padding: "8px 16px" }}>Add</button>
            <button
              onClick={() => { setAddingCategory(false); setNewCatName(""); }}
              style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", color: "var(--text-muted)", fontSize: 13 }}
            >Cancel</button>
          </div>
        </div>
      )}

      {/* SIDEBAR + CONTENT LAYOUT */}
      {categories.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 16px", color: "var(--text-muted)", background: "var(--surface)", borderRadius: 14, border: "2px dashed var(--border)" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🍽️</div>
          <p style={{ fontWeight: 600, fontSize: 15, color: "var(--text)", marginBottom: 4 }}>Your menu is empty</p>
          <p style={{ fontSize: 13 }}>Click <strong>+ Category</strong> above to get started</p>
        </div>
      ) : (
        <div className="menu-builder-layout">
          {/* SIDEBAR */}
          <div className="menu-sidebar">
            <div className="menu-sidebar-label">
              Categories
            </div>
            {categories.map((cat, idx) => {
              const active = cat.id === selectedCatId && !searchQuery;
              const count = catItemCounts[cat.id] ?? 0;
              const isEditingThis = editingCatId === cat.id;
              return (
                <div key={cat.id} style={{ position: "relative" }}>
                  {isEditingThis ? (
                    // ── Inline editor ──
                    <div style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "4px 6px", borderRadius: 8,
                      background: "var(--surface2, #1a1a20)",
                      border: "1px solid var(--accent)",
                    }}>
                      {/* Emoji button */}
                      <button
                        type="button"
                        onClick={() => setShowEditEmojiPicker(p => !p)}
                        style={{ fontSize: 16, padding: "2px 4px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", lineHeight: 1, flexShrink: 0 }}
                      >
                        {editCatIcon}
                      </button>
                      {showEditEmojiPicker && (
                        <div style={{
                          position: "absolute", top: "100%", left: 0, zIndex: 30,
                          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
                          padding: 8, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3,
                          boxShadow: "0 4px 20px rgba(0,0,0,0.25)", width: 220,
                        }}>
                          {CATEGORY_EMOJIS.map(e => (
                            <button key={e} type="button"
                              onClick={() => { setEditCatIcon(e); setShowEditEmojiPicker(false); }}
                              style={{ fontSize: 18, background: editCatIcon === e ? "var(--card-waiter-bg)" : "none", border: "none", borderRadius: 6, cursor: "pointer", padding: 3, lineHeight: 1 }}>
                              {e}
                            </button>
                          ))}
                        </div>
                      )}
                      <input
                        ref={editCatInputRef}
                        value={editCatName}
                        onChange={e => setEditCatName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") saveEditCat(); if (e.key === "Escape") cancelEditCat(); }}
                        style={{ flex: 1, fontSize: 12, padding: "3px 6px", minWidth: 0 }}
                      />
                      <button
                        onClick={saveEditCat}
                        style={{ fontSize: 11, padding: "2px 6px", borderRadius: 5, background: "var(--accent)", color: "white", border: "none", cursor: "pointer", fontWeight: 700, flexShrink: 0 }}
                      >✓</button>
                      <button
                        onClick={cancelEditCat}
                        style={{ fontSize: 11, padding: "2px 5px", borderRadius: 5, background: "none", color: "var(--text-muted)", border: "1px solid var(--border)", cursor: "pointer", flexShrink: 0 }}
                      >✕</button>
                    </div>
                  ) : (
                    // ── Normal button ──
                    <button
                      onClick={() => { setSelectedCatId(cat.id); setSearchQuery(""); }}
                      draggable
                      onDragStart={(e) => { dragCatRef.current = cat.id; e.dataTransfer.setData("text/cat", cat.id); }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={async (e) => {
                        e.preventDefault();
                        const draggedCatId = dragCatRef.current;
                        dragCatRef.current = null;
                        if (!draggedCatId || draggedCatId === cat.id) return;
                        const sourceIdx = categories.findIndex(c => c.id === draggedCatId);
                        const targetIdx = idx;
                        if (sourceIdx < 0 || sourceIdx === targetIdx) return;
                        const reordered = [...categories];
                        const [moved] = reordered.splice(sourceIdx, 1);
                        reordered.splice(targetIdx, 0, moved);
                        setCategories(reordered);
                        await Promise.all(reordered.map((c, i) =>
                          supabase.from("menu_categories").update({ sort_order: i }).eq("id", c.id)
                        ));
                      }}
                      onContextMenu={(e) => openCtxMenu(e, [
                        {
                          label: "Edit name & icon",
                          icon: "✏️",
                          action: () => startEditCat(cat),
                        },
                        { separator: true } as unknown as ContextMenuAction,
                        {
                          label: "Delete category",
                          icon: "🗑️",
                          danger: true,
                          action: () => setConfirmDeleteCat(cat.id),
                        },
                      ])}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "none",
                        background: active ? "var(--accent)" : "transparent",
                        color: active ? "white" : "var(--text)",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: active ? 700 : 500,
                        textAlign: "left",
                        width: "100%",
                        transition: "background 0.1s, color 0.1s",
                      }}
                    >
                      <span style={{ fontSize: 14, flexShrink: 0 }}>{cat.icon}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{cat.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, opacity: active ? 0.8 : 0.5, flexShrink: 0 }}>{count}</span>
                    </button>
                  )}
                </div>
              );
            })}
            <button
              onClick={() => setAddingCategory(true)}
              style={{
                marginTop: 4, padding: "8px 10px", borderRadius: 8,
                border: "1px dashed var(--border)", background: "none",
                cursor: "pointer", color: "var(--text-muted)", fontSize: 12,
                fontWeight: 500, textAlign: "left", width: "100%",
              }}
            >
              + Add category
            </button>
          </div>

          {/* MAIN CONTENT */}
          <div className="menu-main">
            {/* Category header */}
            {searchQuery ? (
              <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>
                  🔍 &quot;{searchQuery}&quot;
                </h3>
                <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                  {displayItems.length} result{displayItems.length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => setSearchQuery("")}
                  style={{ marginLeft: "auto", padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", color: "var(--text-muted)", fontSize: 12 }}
                >Clear</button>
              </div>
            ) : activeCat ? (
              <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontWeight: 700, fontSize: 18, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  {activeCat.icon} {activeCat.name}
                  <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: 13 }}>
                    ({filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""})
                  </span>
                </h3>
                <div style={{ display: "flex", gap: 6 }}>
                  {confirmDeleteCat === activeCat.id ? (
                    <>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", alignSelf: "center" }}>Delete category & all items?</span>
                      <button onClick={() => { deleteCategory(activeCat.id); setConfirmDeleteCat(null); }}
                        style={{ padding: "4px 12px", borderRadius: 6, border: "none", background: "#dc2626", color: "white", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Yes, delete</button>
                      <button onClick={() => setConfirmDeleteCat(null)}
                        style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", color: "var(--text-muted)", fontSize: 12 }}>Cancel</button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteCat(activeCat.id)}
                      style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid var(--card-bill-border)", background: "var(--card-bill-bg)", cursor: "pointer", color: "#dc2626", fontSize: 12, fontWeight: 600 }}
                    >Delete</button>
                  )}
                </div>
                <button
                  onClick={() => setShowQuickAdd(s => !s)}
                  style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid var(--accent)", background: showQuickAdd ? "var(--accent)" : "var(--surface)", color: showQuickAdd ? "white" : "var(--accent)", cursor: "pointer", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}
                >
                  {showQuickAdd ? "✕ Close" : "+ Add item"}
                </button>
              </div>
            ) : null}

            {/* Quick-add row (above items) */}
            {!searchQuery && selectedCatId && showQuickAdd && (
              <div style={{
                marginBottom: 12, padding: "10px 14px",
                background: "var(--surface)", border: "1px dashed var(--accent)", borderRadius: 10,
                display: "flex", gap: 8, alignItems: "center",
              }}>
                <span style={{ color: "var(--accent)", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>+</span>
                <input
                  autoFocus
                  placeholder="Item name"
                  value={quickAdds[selectedCatId]?.name ?? ""}
                  onChange={e => setQuickAdds(prev => ({ ...prev, [selectedCatId]: { ...prev[selectedCatId], name: e.target.value } }))}
                  onKeyDown={e => { if (e.key === "Enter") quickAddItem(selectedCatId); }}
                  style={{ flex: 1, padding: "6px 10px", fontSize: 13 }}
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={`Price (${currencySymbol})`}
                  value={quickAdds[selectedCatId]?.price ?? ""}
                  onChange={e => setQuickAdds(prev => ({ ...prev, [selectedCatId]: { ...prev[selectedCatId], price: e.target.value } }))}
                  onKeyDown={e => { if (e.key === "Enter") quickAddItem(selectedCatId); }}
                  style={{ width: 110, padding: "6px 10px", fontSize: 13 }}
                />
                <button
                  onClick={() => quickAddItem(selectedCatId)}
                  style={{ padding: "6px 16px", borderRadius: 7, background: "var(--accent)", color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}
                >Add</button>
              </div>
            )}

            {/* Items list */}
            {displayItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 16px", color: "var(--text-muted)", background: "var(--surface)", borderRadius: 14, border: "2px dashed var(--border)", flex: 1 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🍽️</div>
                <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 4 }}>
                  {searchQuery ? "No items match your search" : "No items in this category yet"}
                </p>
                <p style={{ fontSize: 13 }}>
                  {searchQuery ? "Try a different search term" : "Use the quick-add below to add items"}
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                {displayItems.map((item) => {
                  const isEditing = edit?.itemId === item.id;
                  const cat = categories.find(c => c.id === item.category_id);
                  return (
                    <div
                      key={item.id}
                      data-item-id={item.id}
                      draggable={!isEditing && !searchQuery}
                      onDragStart={(e) => handleItemDragStart(e, item.id)}
                      onDragOver={handleItemDragOver}
                      onDrop={(e) => handleItemDrop(e, item.id)}
                      onDragEnd={handleDragEnd}
                      onContextMenu={(e) => {
                        if (isEditing) return;
                        openCtxMenu(e, [
                          {
                            label: "Edit name",
                            icon: "✏️",
                            action: () => startEdit(item.id, "name", item.name),
                          },
                          {
                            label: "Edit description",
                            icon: "📝",
                            action: () => startEdit(item.id, "description", item.description ?? ""),
                          },
                          {
                            label: "Edit price",
                            icon: "💰",
                            action: () => startEdit(item.id, "price", item.price?.toString() ?? ""),
                          },
                          { separator: true } as { separator: true; label: string; action: () => void },
                          {
                            label: item.is_available ? "Mark as hidden" : "Mark as available",
                            icon: item.is_available ? "🙈" : "👁️",
                            action: () => toggleItem(item),
                          },
                          {
                            label: "Duplicate item",
                            icon: "⧉",
                            action: () => duplicateItem(item),
                          },
                          { separator: true } as { separator: true; label: string; action: () => void },
                          {
                            label: "Delete item",
                            icon: "🗑️",
                            danger: true,
                            action: () => deleteItem(item.id),
                          },
                        ]);
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 14px",
                        background: item.is_available ? "var(--surface)" : "var(--item-unavailable-bg)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                      }}
                    >
                      {/* Drag handle */}
                      <span
                        style={{ color: "var(--text-muted)", fontSize: 14, cursor: "grab", userSelect: "none", flexShrink: 0, lineHeight: 1 }}
                        title="Drag to reorder"
                      >⋮⋮</span>

                      {/* Item info with inline editing */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {isEditing && edit.field === "name" ? (
                          <input
                            ref={editInputRef}
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                            style={{ fontWeight: 600, fontSize: 14, padding: "4px 8px", width: "70%" }}
                          />
                        ) : (
                          <span
                            onClick={() => startEdit(item.id, "name", item.name)}
                            style={{ fontWeight: 600, fontSize: 14, cursor: "pointer", display: "block" }}
                            title="Click to edit name"
                          >
                            {item.name || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Untitled</span>}
                          </span>
                        )}
                        {isEditing && edit.field === "description" ? (
                          <input
                            ref={editInputRef}
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                            style={{ fontSize: 12, padding: "4px 8px", width: "100%", marginTop: 2 }}
                            placeholder="Description…"
                          />
                        ) : (
                          item.description && (
                            <span
                              onClick={() => startEdit(item.id, "description", item.description ?? "")}
                              style={{ color: "var(--text-muted)", fontSize: 12, display: "block", lineHeight: 1.4, cursor: "pointer" }}
                              title="Click to edit description"
                            >{item.description}</span>
                          )
                        )}
                        {!isEditing && !item.description && (
                          <span
                            onClick={() => startEdit(item.id, "description", "")}
                            style={{ color: "var(--text-muted)", fontSize: 11, cursor: "pointer", opacity: 0.5 }}
                            title="Click to add description"
                          >+ description</span>
                        )}
                      </div>

                      {/* Price */}
                      {isEditing && edit.field === "price" ? (
                        <input
                          ref={editInputRef}
                          type="number"
                          step="0.01"
                          min="0"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                          style={{ width: 80, padding: "4px 8px", fontSize: 14, fontWeight: 700, textAlign: "right", flexShrink: 0 }}
                        />
                      ) : (
                        <span
                          onClick={() => startEdit(item.id, "price", item.price?.toString() ?? "")}
                          style={{
                            fontWeight: 700, fontSize: 14, cursor: "pointer", flexShrink: 0,
                            color: item.price ? "var(--accent)" : "var(--text-muted)",
                            opacity: item.price ? 1 : 0.4,
                            minWidth: 50, textAlign: "right",
                          }}
                          title="Click to edit price"
                        >
                          {item.price ? `${item.price} ${currencySymbol}` : "—"}
                        </span>
                      )}

                      {/* Category badge (only when searching across categories) */}
                      {searchQuery && cat && (
                        <span style={{ fontSize: 11, background: "var(--surface-2)", color: "var(--text-muted)", padding: "2px 8px", borderRadius: 99, fontWeight: 600, flexShrink: 0 }}>
                          {cat.icon} {cat.name}
                        </span>
                      )}

                      {/* Actions — right-click the row for full menu */}
                      {!isEditing && (
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                          {/* Quick toggle stays visible — most common action */}
                          <button
                            onClick={() => toggleItem(item)}
                            style={{
                              fontSize: 11, padding: "3px 8px", borderRadius: 6,
                              border: "1px solid var(--border)",
                              background: item.is_available ? "var(--card-order-bg)" : "var(--card-bill-bg)",
                              color: item.is_available ? "#22c55e" : "#f43f5e",
                              cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap",
                            }}
                          >
                            {item.is_available ? "Live" : "Hidden"}
                          </button>
                          {/* Hint icon — shows right-click is available */}
                          <span
                            style={{ color: "var(--text-muted)", fontSize: 12, opacity: 0.35, userSelect: "none" }}
                            title="Right-click for more options"
                          >⋯</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={ctxMenu.items}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
}
