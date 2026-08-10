"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant, MenuCategory, MenuItem, MenuItemOption } from "@/lib/types";
import ContextMenu, { type ContextMenuAction } from "@/components/ContextMenu";
import { CURRENCIES } from "@/lib/constants";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmDialog";
import { Skeleton, SkeletonList } from "@/components/Skeleton";
import { IconSearch, IconDish, IconAlert, IconCopy } from "@/components/icons";

interface Props { restaurant: Restaurant }

const CATEGORY_EMOJIS = ["🍽️","🍕","🍔","🌮","🍣","🍜","🥗","🍰","🍩","🧁","☕","🥤","🍺","🍷","🥂","🍵","🥩","🍗","🥞","🥙","🌯","🥘","🍲","🥚","🧆","🦐","🦞","🦑","🧀","🥐","🥖","🥨","🧇","🍟","🌭","🥪"];

// Small local line icons for chrome (no emojis in UI). currentColor-based.
function IconGrip({ size = 16, ...p }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden {...p}>
      {[4, 8, 12].flatMap(y => [5, 11].map(x => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={1.35} />
      )))}
    </svg>
  );
}
function IconTrash({ size = 16, ...p }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

interface InlineEdit {
  itemId: string;
  field: "name" | "description" | "price";
}

// Draft shape for the item options editor (local, unsaved)
interface OptionDraft {
  id: string; // real id or "new-<n>" for unsaved rows
  name: string;
  isRequired: boolean;
  choices: { id: string; label: string; price: string }[];
}

let optionIdCounter = 0;

interface QuickAdd {
  name: string;
  price: string;
}

export default function MenuBuilder({ restaurant }: Props) {
  const supabase = createClient();
  const toast = useToast();
  const confirm = useConfirm();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [itemOptions, setItemOptions] = useState<MenuItemOption[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Item options editor state
  const [optionsEditor, setOptionsEditor] = useState<{ item: MenuItem } | null>(null);
  const [optionDrafts, setOptionDrafts] = useState<OptionDraft[]>([]);

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

  // Currency — source of truth is Settings (restaurant.currency, DB); display-only here
  const [currency] = useState(() => restaurant.currency || "SEK");
  const currencySymbol = CURRENCIES[currency] ?? currency;

  // Add category
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("🍽️");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPos, setEmojiPickerPos] = useState({ top: 0, left: 0 });

  // Edit category inline
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatIcon, setEditCatIcon] = useState("🍽️");
  const [showEditEmojiPicker, setShowEditEmojiPicker] = useState(false);
  const [editEmojiPickerPos, setEditEmojiPickerPos] = useState({ top: 0, left: 0 });
  const editCatInputRef = useRef<HTMLInputElement>(null);

  function startEditCat(cat: MenuCategory) {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditCatIcon(cat.icon ?? "🍽️");
    setShowEditEmojiPicker(false);
  }

  async function saveEditCat() {
    if (!editingCatId || !editCatName.trim()) { setEditingCatId(null); return; }
    const { error } = await supabase.from("menu_categories")
      .update({ name: editCatName.trim(), icon: editCatIcon })
      .eq("id", editingCatId);
    if (error) { toast.error("Could not save the category"); return; }
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
  // Visual drag feedback (elevation on the dragged card, insertion line on the target)
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  // Visual drag feedback for category reordering (thin accent line between rows)
  const [dragOverCatId, setDragOverCatId] = useState<string | null>(null);

  // Load data — defined at component level so drag handlers can reload on
  // failed reorder saves (audit 3.6). Deps are [restaurant.id] ONLY — seeding
  // selectedCatId must NOT be in here or every category click refetches all
  // categories + items.
  const load = useCallback(async () => {
    const [{ data: cats }, { data: its }, { data: optRows }] = await Promise.all([
      supabase.from("menu_categories").select("*").eq("restaurant_id", restaurant.id).order("sort_order"),
      supabase.from("menu_items").select("*").eq("restaurant_id", restaurant.id).order("sort_order"),
      supabase.from("menu_item_options").select("*, choices:menu_item_option_choices(*)").eq("restaurant_id", restaurant.id).order("sort_order"),
    ]);
    const loadedCats = (cats ?? []) as MenuCategory[];
    const loadedItems = (its ?? []) as MenuItem[];
    setCategories(loadedCats);
    setItems(loadedItems);
    setItemOptions((optRows ?? []).map(o => ({
      ...o,
      choices: [...(o.choices ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    })));
    setLoading(false);
  }, [restaurant.id]);

  useEffect(() => { load(); }, [load]);

  // Seed the initially selected category once categories arrive
  useEffect(() => {
    if (!selectedCatId && categories.length > 0) setSelectedCatId(categories[0].id);
  }, [selectedCatId, categories]);

  // ─── Item options editor ────────────────────────────────
  function openOptionsEditor(item: MenuItem) {
    const existing = itemOptions.filter(o => o.item_id === item.id);
    setOptionDrafts(existing.map(o => ({
      id: o.id,
      name: o.name,
      isRequired: o.is_required,
      choices: o.choices.map(c => ({ id: c.id, label: c.label, price: c.price_delta > 0 ? String(c.price_delta) : "" })),
    })));
    setOptionsEditor({ item });
  }

  function addOptionGroup() {
    setOptionDrafts(d => [...d, { id: `new-${++optionIdCounter}`, name: "", isRequired: true, choices: [] }]);
  }

  function patchGroup(idx: number, patch: Partial<OptionDraft>) {
    setOptionDrafts(d => d.map((g, i) => i === idx ? { ...g, ...patch } : g));
  }

  function addChoice(gIdx: number) {
    setOptionDrafts(d => d.map((g, i) => i === gIdx
      ? { ...g, choices: [...g.choices, { id: `new-${++optionIdCounter}`, label: "", price: "" }] }
      : g));
  }

  function patchChoice(gIdx: number, cIdx: number, patch: Partial<{ label: string; price: string }>) {
    setOptionDrafts(d => d.map((g, i) => i === gIdx
      ? { ...g, choices: g.choices.map((c, j) => j === cIdx ? { ...c, ...patch } : c) }
      : g));
  }

  function removeChoice(gIdx: number, cIdx: number) {
    setOptionDrafts(d => d.map((g, i) => i === gIdx ? { ...g, choices: g.choices.filter((_, j) => j !== cIdx) } : g));
  }

  function removeOptionGroup(idx: number) {
    setOptionDrafts(d => d.filter((_, i) => i !== idx));
  }

  async function saveOptions() {
    if (!optionsEditor) return;
    const itemId = optionsEditor.item.id;
    const groups = optionDrafts.filter(g => g.name.trim().length > 0);
    // 1) Upsert groups (include all NOT NULL columns — Postgres validates them
    //    on the proposed row before ON CONFLICT resolves)
    const groupRows: Record<string, unknown>[] = groups.map((g, i) => {
      const row: Record<string, unknown> = {
        restaurant_id: restaurant.id,
        item_id: itemId,
        name: g.name.trim(),
        is_required: g.isRequired,
        sort_order: i,
      };
      if (!g.id.startsWith("new-")) row.id = g.id;
      return row;
    });
    const { data: savedGroups, error: gErr } = await supabase
      .from("menu_item_options")
      .upsert(groupRows)
      .select("id, name");
    if (gErr) { toast.error("Could not save the options"); return; }
    const idByName = new Map<string, string>((savedGroups ?? []).map(r => [r.name, r.id]));
    const groupsWithIds = groups.map(g => ({ ...g, id: idByName.get(g.name) ?? g.id }));

    // 2) Upsert choices
    const choiceRows: Record<string, unknown>[] = [];
    groupsWithIds.forEach(g => {
      g.choices.filter(c => c.label.trim().length > 0).forEach((c, ci) => {
        const row: Record<string, unknown> = {
          restaurant_id: restaurant.id,
          option_id: g.id,
          label: c.label.trim(),
          price_delta: parseFloat(c.price) || 0,
          sort_order: ci,
        };
        if (!c.id.startsWith("new-")) row.id = c.id;
        choiceRows.push(row);
      });
    });
    if (choiceRows.length > 0) {
      const { error: cErr } = await supabase.from("menu_item_option_choices").upsert(choiceRows);
      if (cErr) { toast.error("Could not save the choices"); return; }
    }

    // 3) Delete removed groups (cascade removes their choices) + removed choices
    const existingGroups = itemOptions.filter(o => o.item_id === itemId);
    const keptGroupIds = new Set(groupsWithIds.map(g => g.id));
    const removedGroups = existingGroups.filter(o => !keptGroupIds.has(o.id));
    if (removedGroups.length > 0) {
      await supabase.from("menu_item_options").delete().in("id", removedGroups.map(g => g.id));
    }
    const keptChoiceIds = new Set(groupsWithIds.flatMap(g => g.choices).map(c => c.id));
    const removedChoices = existingGroups.flatMap(o => o.choices).filter(c => !keptChoiceIds.has(c.id));
    if (removedChoices.length > 0) {
      await supabase.from("menu_item_option_choices").delete().in("id", removedChoices.map(c => c.id));
    }

    setOptionsEditor(null);
    toast.success("Options saved");
    await load();
  }

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
    ? items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      )
    : filteredItems;

  // Aggregate item count per category
  const catItemCounts: Record<string, number> = {};
  for (const item of items) {
    catItemCounts[item.category_id] = (catItemCounts[item.category_id] ?? 0) + 1;
  }

  // ─── CATEGORY CRUD ────────────────────────────────────

  async function deleteCategory(id: string) {
    const { error } = await supabase.from("menu_categories").delete().eq("id", id);
    if (error) { toast.error("Could not delete the category"); return; }
    toast.success("Category deleted");
    setCategories(c => c.filter(x => x.id !== id));
    setItems(i => i.filter(x => x.category_id !== id));
    if (selectedCatId === id) {
      const remaining = categories.filter(x => x.id !== id);
      setSelectedCatId(remaining[0]?.id ?? "");
    }
  }

  async function addCategory() {
    if (!newCatName.trim()) return;
    const { data, error } = await supabase.from("menu_categories")
      .insert({ restaurant_id: restaurant.id, name: newCatName.trim(), icon: newCatIcon, sort_order: categories.length })
      .select().single();
    if (error) { toast.error("Could not add the category"); return; }
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
    const { data, error } = await supabase.from("menu_items")
      .insert({
        restaurant_id: restaurant.id,
        category_id: catId,
        name: q.name.trim(),
        price: q.price ? parseFloat(q.price) : null,
        is_available: true,
        sort_order: items.filter(i => i.category_id === catId).length,
      })
      .select().single();
    if (error) { toast.error("Could not add the item"); return; }
    if (data) {
      const item = data as MenuItem;
      setItems(i => [...i, item]);
      setQuickAdds(prev => ({ ...prev, [catId]: { name: "", price: "" } }));
      setShowQuickAdd(false);
    }
  }

  async function duplicateItem(item: MenuItem) {
    const { data, error } = await supabase.from("menu_items")
      .insert({
        restaurant_id: restaurant.id,
        category_id: item.category_id,
        name: item.name + " (copy)",
        description: item.description ?? null,
        price: item.price ?? null,
        is_available: item.is_available,
        sort_order: items.filter(i => i.category_id === item.category_id).length,
      })
      .select().single();
    if (error) { toast.error("Could not duplicate the item"); return; }
    if (data) {
      const newItem = data as MenuItem;
      setItems(i => [...i, newItem]);
    }
  }

  async function toggleItem(item: MenuItem) {
    const { error } = await supabase.from("menu_items").update({ is_available: !item.is_available }).eq("id", item.id);
    if (error) { toast.error("Could not update the item"); return; }
    const updater = (i: MenuItem[]) => i.map(x => x.id === item.id ? { ...x, is_available: !x.is_available } : x);
    setItems(updater);
  }

  async function deleteItem(item: MenuItem) {
    const ok = await confirm({
      title: `Delete "${item.name || "Untitled"}"?`,
      message: "This cannot be undone.",
      confirmLabel: "Yes, delete",
      danger: true,
    });
    if (!ok) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", item.id);
    if (error) { toast.error("Could not delete the item"); return; }
    toast.success("Item deleted");
    setItems(i => i.filter(x => x.id !== item.id));
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
    const { error } = await supabase.from("menu_items").update(update).eq("id", edit.itemId);
    if (error) { toast.error("Could not save changes"); setEdit(null); return; }
    const updater = (i: MenuItem[]) => i.map(x => x.id === edit.itemId ? { ...x, ...update } as MenuItem : x);
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
    setDraggingItemId(itemId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemId);
  }

  function handleItemDragOver(e: React.DragEvent, itemId?: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (itemId && itemId !== dragItemRef.current) {
      setDragOverItemId(prev => (prev === itemId ? prev : itemId));
    }
  }

  async function handleItemDrop(e: React.DragEvent, targetItemId: string) {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = dragItemRef.current;
    dragItemRef.current = null;
    setDraggingItemId(null);
    setDragOverItemId(null);
    if (!draggedId || draggedId === targetItemId) return;
    const sourceItem = items.find(i => i.id === draggedId);
    if (!sourceItem) return;

    // Work from the already-sorted category slice
    const catItems = items
      .filter(i => i.category_id === sourceItem.category_id)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    const sourceIdx = catItems.findIndex(i => i.id === draggedId);
    const targetIdx = catItems.findIndex(i => i.id === targetItemId);
    if (sourceIdx < 0 || targetIdx < 0 || sourceIdx === targetIdx) return;

    // Splice using indices from the SAME original array (no re-lookup after splice)
    const reordered = [...catItems];
    const [moved] = reordered.splice(sourceIdx, 1);
    reordered.splice(targetIdx, 0, moved);

    // Stamp new sort_order values into items
    const updated = items.map(item => {
      const newIdx = reordered.findIndex(r => r.id === item.id);
      return newIdx >= 0 ? { ...item, sort_order: newIdx } : item;
    });

    setItems(updated);

    // One batched upsert = atomic — a partial failure can't leave a mixed
    // order (audit 3.6). NOTE: PostgREST upsert = INSERT…ON CONFLICT DO UPDATE,
    // and Postgres enforces NOT NULL on the proposed row — so all NOT NULL
    // columns (restaurant_id, category_id, name) must be included.
    const { error } = await supabase
      .from("menu_items")
      .upsert(reordered.map((item, i) => ({
        id: item.id,
        restaurant_id: item.restaurant_id,
        category_id: item.category_id,
        name: item.name,
        sort_order: i,
      })));
    if (error) {
      toast.error("Could not save the new order");
      await load(); // reload from server — don't trust the local snapshot
    }
  }

  function handleDragEnd() {
    dragItemRef.current = null;
    dragCatRef.current = null;
    setDraggingItemId(null);
    setDragOverItemId(null);
  }

  // ─── RENDER ───────────────────────────────────────────

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }} aria-busy="true">
      <Skeleton height={38} borderRadius={8} />
      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ width: 200, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} height={32} borderRadius={8} />)}
        </div>
        <div style={{ flex: 1 }}><SkeletonList count={4} /></div>
      </div>
    </div>
  );

  const activeCat = categories.find(c => c.id === selectedCatId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, height: "100%" }}>
      <style>{`
        .menu-builder-layout { display: flex; gap: 0; flex: 1; min-height: 400px; }
        .menu-sidebar { width: 220px; flex-shrink: 0; border-right: 1px solid var(--border); display: flex; flex-direction: column; gap: 2px; padding-right: 16px; }
        .menu-sidebar-label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 14px 8px; }
        .menu-main { flex: 1; min-width: 0; padding-left: 32px; display: flex; flex-direction: column; gap: 0; }
        .menu-main-inner { width: 100%; display: flex; flex-direction: column; flex: 1; }
        @media (max-width: 700px) {
          .menu-builder-layout { flex-direction: column; }
          .menu-sidebar { width: 100%; border-right: none; border-bottom: 1px solid var(--border); flex-direction: row; overflow-x: auto; padding: 0 0 12px; gap: 6px; flex-shrink: 0; }
          .menu-cat-row { white-space: nowrap; flex-shrink: 0; width: auto !important; border-left: none !important; }
          .menu-sidebar-label, .menu-add-cat-btn { display: none; }
          .menu-main { padding-left: 0; padding-top: 16px; }
        }
        .mb-edit-input {
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--surface);
          color: var(--text);
          outline: none;
          transition: border-color 0.12s, box-shadow 0.12s;
        }
        .mb-edit-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent);
        }
        .mb-item-card { transition: box-shadow 0.14s, transform 0.12s, opacity 0.12s; }
        .mb-item-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.10); }
        .mb-icon-btn { display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--border); background: var(--surface); color: var(--text-muted); cursor: pointer; border-radius: 7px; padding: 6px; transition: color 0.12s, border-color 0.12s, background 0.12s; }
        .mb-icon-btn:hover { color: var(--text); border-color: var(--text-muted); }
        .mb-icon-btn.danger:hover { color: #f43f5e; border-color: #f43f5e; }
        .mb-text-link { background: none; border: none; cursor: pointer; font-size: 13px; font-weight: 600; padding: 2px 2px; }
        @keyframes mbSlideDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .mb-additem-row { animation: mbSlideDown 0.16s ease; }
      `}</style>

      {/* ADD CATEGORY FORM */}
      {addingCategory && (
        <div className="card" style={{ marginBottom: 16, padding: "16px 20px" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={(e) => {
                  const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                  setEmojiPickerPos({ top: rect.bottom + 4, left: rect.left });
                  setShowEmojiPicker(p => !p);
                }}
                style={{ fontSize: 22, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", lineHeight: 1 }}
              >
                {newCatIcon}
              </button>
              {/* emoji picker rendered as fixed portal below */}
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
          <div style={{ marginBottom: 12 }}><IconDish width={36} height={36} style={{ color: "var(--text-muted)", opacity: 0.7 }} /></div>
          <p style={{ fontWeight: 600, fontSize: 15, color: "var(--text)", marginBottom: 4 }}>Your menu is empty</p>
          <p style={{ fontSize: 13, marginBottom: 16 }}>Start by adding your first category</p>
          <button
            className="btn-primary"
            onClick={() => setAddingCategory(true)}
            style={{ whiteSpace: "nowrap", fontSize: 13, padding: "8px 18px" }}
          >+ Category</button>
        </div>
      ) : (
        <div className="menu-builder-layout">
          {/* SIDEBAR */}
          <div className="menu-sidebar">
            {!addingCategory && (
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                <button
                  onClick={() => setAddingCategory(true)}
                  style={{ padding: "5px 10px", borderRadius: 6, background: "var(--accent)", color: "white", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap", flexShrink: 0, height: 28 }}
                >+ Category</button>
              </div>
            )}
            <div className="menu-sidebar-label">
              Categories
            </div>
            {categories.map((cat, idx) => {
              const active = cat.id === selectedCatId && !searchQuery;
              const count = catItemCounts[cat.id] ?? 0;
              const isEditingThis = editingCatId === cat.id;
              return (
                <div
                  key={cat.id}
                  style={{
                    position: "relative",
                    borderTop: dragOverCatId === cat.id ? "2px solid var(--accent)" : "2px solid transparent",
                  }}
                >
                  {isEditingThis ? (
                    // ── Inline editor ──
                    <div style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "4px 6px", borderRadius: 8,
                      background: "var(--surface-2)",
                      border: "1px solid var(--accent)",
                    }}>
                      {/* Emoji button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                          setEditEmojiPickerPos({ top: rect.bottom + 4, left: rect.left });
                          setShowEditEmojiPicker(p => !p);
                        }}
                        style={{ fontSize: 16, padding: "2px 4px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", lineHeight: 1, flexShrink: 0 }}
                      >
                        {editCatIcon}
                       </button>
                       {/* edit emoji picker rendered as fixed portal below */}
                      <input
                        ref={editCatInputRef}
                        value={editCatName}
                        onChange={e => setEditCatName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") saveEditCat(); if (e.key === "Escape") cancelEditCat(); }}
                        className="mb-edit-input"
                        style={{ flex: 1, fontSize: 13, padding: "3px 6px", minWidth: 0 }}
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
                    // ── Category row (subtle active state, not a filled button) ──
                    <button
                      className="menu-cat-row"
                      onClick={() => { setSelectedCatId(cat.id); setSearchQuery(""); }}
                      draggable
                      onDragStart={(e) => { dragCatRef.current = cat.id; e.dataTransfer.setData("text/cat", cat.id); }}
                      onDragOver={(e) => { e.preventDefault(); if (dragCatRef.current && dragCatRef.current !== cat.id) setDragOverCatId(cat.id); }}
                      onDragLeave={() => setDragOverCatId(prev => (prev === cat.id ? null : prev))}
                      onDragEnd={() => setDragOverCatId(null)}
                      onDrop={async (e) => {
                        e.preventDefault();
                        setDragOverCatId(null);
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
                        // One batched upsert = atomic (audit 3.6). Include all
                        // NOT NULL columns — Postgres checks them on the
                        // proposed row before ON CONFLICT resolves.
                        const { error } = await supabase
                          .from("menu_categories")
                          .upsert(reordered.map((c, i) => ({
                            id: c.id,
                            restaurant_id: c.restaurant_id,
                            name: c.name,
                            sort_order: i,
                          })));
                        if (error) {
                          toast.error("Could not save the new order");
                          await load();
                        }
                      }}
                      onContextMenu={(e) => openCtxMenu(e, [
                        {
                          label: "Edit name & icon",
                          action: () => startEditCat(cat),
                        },
                        { separator: true },
                        {
                          label: "Delete category",
                          danger: true,
                          action: () => setConfirmDeleteCat(cat.id),
                        },
                      ])}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "10px 14px",
                        borderRadius: 8,
                        borderLeft: active ? "3px solid var(--accent)" : "3px solid transparent",
                        borderTop: "none", borderRight: "none", borderBottom: "none",
                        background: active ? "color-mix(in srgb, var(--accent) 5%, transparent)" : "transparent",
                        color: "var(--text)",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: active ? 600 : 500,
                        textAlign: "left",
                        width: "100%",
                        transition: "background 0.1s",
                      }}
                    >
                      <span style={{ fontSize: 15, flexShrink: 0 }}>{cat.icon}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{cat.name}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 600, flexShrink: 0,
                        color: "var(--text-muted)", background: "var(--surface-2)",
                        padding: "1px 8px", borderRadius: 99, minWidth: 18, textAlign: "center",
                      }}>{count}</span>
                    </button>
                  )}
                </div>
              );
            })}
            <button
              className="menu-add-cat-btn"
              onClick={() => setAddingCategory(true)}
              style={{
                marginTop: 6, padding: "10px 14px", borderRadius: 8,
                border: "1px dashed var(--border)", background: "none",
                cursor: "pointer", color: "var(--text-muted)", fontSize: 13,
                fontWeight: 500, textAlign: "left", width: "100%",
              }}
            >
              + Add category
            </button>
          </div>

          {/* MAIN CONTENT */}
          <div className="menu-main">
            <div className="menu-main-inner">
            {/* Search inside content column */}
            <div style={{ position: "relative", marginBottom: 14 }}>
              <IconSearch width={14} height={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ height: 34, padding: "0 10px 0 30px", width: "100%", fontSize: 13, borderRadius: 6, boxSizing: "border-box" }}
              />
            </div>
            {/* Category header */}
            {searchQuery ? (
              <div style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
                <h3 style={{ fontWeight: 700, fontSize: 18, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <IconSearch width={18} height={18} style={{ color: "var(--text-muted)" }} />
                  &quot;{searchQuery}&quot;
                </h3>
                <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                  {displayItems.length} result{displayItems.length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mb-text-link"
                  style={{ marginLeft: "auto", color: "var(--text-muted)" }}
                >Clear</button>
              </div>
            ) : activeCat ? (
              <div style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <h3
                  onContextMenu={(e) => openCtxMenu(e, [
                    { label: "Edit name & icon", action: () => startEditCat(activeCat) },
                    { separator: true },
                    { label: "Delete category", danger: true, action: () => setConfirmDeleteCat(activeCat.id) },
                  ])}
                  style={{ fontWeight: 700, fontSize: 18, margin: 0, flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10 }}
                >
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{activeCat.icon}</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeCat.name}</span>
                  <span style={{ fontWeight: 500, color: "var(--text-muted)", fontSize: 13, flexShrink: 0 }}>
                    {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
                  </span>
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                  <button
                    onClick={() => setConfirmDeleteCat(activeCat.id)}
                    className="mb-text-link"
                    style={{ color: "var(--text-muted)", fontWeight: 500 }}
                  >Delete category</button>
                  <button
                    onClick={() => setShowQuickAdd(s => !s)}
                    className="mb-text-link"
                    style={{ color: "var(--accent)" }}
                  >
                    {showQuickAdd ? "Cancel" : "+ Add item"}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Add-item row (slides in above items) */}
            {!searchQuery && selectedCatId && showQuickAdd && (
              <div className="mb-additem-row" style={{
                marginBottom: 12, padding: "0 6px 0 12px",
                height: 48, background: "var(--surface)",
                border: "1px solid var(--accent)", borderRadius: 10,
                display: "flex", gap: 8, alignItems: "center",
              }}>
                <input
                  autoFocus
                  placeholder="Item name"
                  value={quickAdds[selectedCatId]?.name ?? ""}
                  onChange={e => setQuickAdds(prev => ({ ...prev, [selectedCatId]: { ...prev[selectedCatId], name: e.target.value } }))}
                  onKeyDown={e => { if (e.key === "Enter") quickAddItem(selectedCatId); if (e.key === "Escape") setShowQuickAdd(false); }}
                  style={{ flex: 1, height: 34, padding: "0 10px", fontSize: 13, minWidth: 0 }}
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={`Price (${currencySymbol})`}
                  value={quickAdds[selectedCatId]?.price ?? ""}
                  onChange={e => setQuickAdds(prev => ({ ...prev, [selectedCatId]: { ...prev[selectedCatId], price: e.target.value } }))}
                  onKeyDown={e => { if (e.key === "Enter") quickAddItem(selectedCatId); if (e.key === "Escape") setShowQuickAdd(false); }}
                  style={{ width: 120, height: 34, padding: "0 10px", fontSize: 13 }}
                />
                <button
                  onClick={() => quickAddItem(selectedCatId)}
                  style={{ height: 34, padding: "0 16px", borderRadius: 7, background: "var(--accent)", color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}
                >Add</button>
                <button
                  onClick={() => setShowQuickAdd(false)}
                  className="mb-text-link"
                  style={{ color: "var(--text-muted)", padding: "0 6px" }}
                >Cancel</button>
              </div>
            )}

            {/* Items list */}
            {displayItems.length === 0 ? (
              searchQuery ? (
                <div style={{ textAlign: "center", padding: "56px 16px", color: "var(--text-muted)", flex: 1 }}>
                  <IconSearch width={24} height={24} style={{ color: "var(--text-muted)", opacity: 0.7, marginBottom: 10 }} />
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", margin: 0 }}>
                    No items match &quot;{searchQuery}&quot;
                  </p>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "56px 16px", color: "var(--text-muted)", flex: 1 }}>
                  <div style={{ fontSize: 24, marginBottom: 10, opacity: 0.8 }}>{activeCat?.icon}</div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-muted)", margin: "0 0 6px" }}>
                    No items yet
                  </p>
                  <button
                    onClick={() => setShowQuickAdd(true)}
                    className="mb-text-link"
                    style={{ color: "var(--accent)" }}
                  >Add your first item</button>
                </div>
              )
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                {displayItems.map((item) => {
                  const isEditing = edit?.itemId === item.id;
                  const cat = categories.find(c => c.id === item.category_id);
                  return (
                    <div
                      key={item.id}
                      data-item-id={item.id}
                      className="mb-item-card"
                      draggable={!isEditing && !searchQuery}
                      onDragStart={(e) => handleItemDragStart(e, item.id)}
                      onDragOver={(e) => handleItemDragOver(e, item.id)}
                      onDrop={(e) => handleItemDrop(e, item.id)}
                      onDragEnd={handleDragEnd}
                      onContextMenu={(e) => {
                        if (isEditing) return;
                        openCtxMenu(e, [
                          {
                            label: "Edit name",
                            action: () => startEdit(item.id, "name", item.name),
                          },
                          {
                            label: "Edit description",
                            action: () => startEdit(item.id, "description", item.description ?? ""),
                          },
                          {
                            label: "Edit price",
                            action: () => startEdit(item.id, "price", item.price?.toString() ?? ""),
                          },
                          { separator: true },
                          {
                            label: item.is_available ? "Mark as hidden" : "Mark as available",
                            action: () => toggleItem(item),
                          },
                          {
                            label: "Duplicate item",
                            action: () => duplicateItem(item),
                          },
                          {
                            label: "Options (choices)",
                            action: () => openOptionsEditor(item),
                          },
                          { separator: true },
                          {
                            label: "Delete item",
                            danger: true,
                            action: () => deleteItem(item),
                          },
                        ]);
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 14px",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        opacity: item.is_available ? 1 : 0.5,
                        boxShadow: draggingItemId === item.id
                          ? "0 8px 24px rgba(0,0,0,0.16)"
                          : dragOverItemId === item.id && draggingItemId
                            ? "0 -2px 0 0 var(--accent)"
                            : undefined,
                        transform: draggingItemId === item.id ? "scale(1.02)" : undefined,
                      }}
                    >
                      {/* Drag handle */}
                      <IconGrip
                        size={16}
                        style={{ color: "var(--text-muted)", cursor: "grab", flexShrink: 0, opacity: 0.7 }}
                        aria-label="Drag to reorder"
                      />

                      {/* Item info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {isEditing && edit.field === "name" ? (
                          <input
                            ref={editInputRef}
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                            className="mb-edit-input"
                            style={{ fontWeight: 600, fontSize: 15, padding: "2px 8px", width: "70%" }}
                          />
                        ) : (
                          <span style={{ fontWeight: 600, fontSize: 15, display: "block" }}>
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
                            className="mb-edit-input"
                            style={{ fontSize: 13, padding: "2px 8px", width: "100%", marginTop: 4 }}
                            placeholder="Description…"
                          />
                        ) : (
                          item.description && (
                            <span style={{ color: "var(--text-muted)", fontSize: 13, display: "block", lineHeight: 1.4, marginTop: 2 }}>
                              {item.description}
                            </span>
                          )
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
                          className="mb-edit-input"
                          style={{ width: 90, padding: "2px 8px", fontSize: 16, fontWeight: 700, textAlign: "right", flexShrink: 0 }}
                        />
                      ) : (
                        <span style={{
                          fontWeight: 700, fontSize: 16, flexShrink: 0,
                          color: item.price ? "var(--accent)" : "var(--text-muted)",
                          opacity: item.price ? 1 : 0.4,
                          minWidth: 54, textAlign: "right",
                        }}>
                          {item.price ? `${item.price} ${currencySymbol}` : "—"}
                        </span>
                      )}

                      {/* Category badge (only when searching across categories) */}
                      {searchQuery && cat && (
                        <span style={{ fontSize: 11, background: "var(--surface-2)", color: "var(--text-muted)", padding: "2px 8px", borderRadius: 99, fontWeight: 600, flexShrink: 0 }}>
                          {cat.icon} {cat.name}
                        </span>
                      )}

                      {/* Actions */}
                      {!isEditing && (
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                          {/* Availability pill */}
                          <button
                            onClick={() => toggleItem(item)}
                            title={item.is_available ? "Available — click to hide" : "Hidden — click to show"}
                            style={{
                              fontSize: 11, padding: "3px 10px", borderRadius: 99,
                              border: "none",
                              background: item.is_available
                                ? "color-mix(in srgb, #22c55e 15%, transparent)"
                                : "color-mix(in srgb, #f43f5e 15%, transparent)",
                              color: item.is_available ? "#22c55e" : "#f43f5e",
                              cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap",
                            }}
                          >
                            {item.is_available ? "On" : "Off"}
                          </button>
                          {/* Duplicate */}
                          <button
                            className="mb-icon-btn"
                            onClick={(e) => { e.stopPropagation(); duplicateItem(item); }}
                            title="Duplicate item"
                          ><IconCopy width={15} height={15} /></button>
                          {/* Delete */}
                          <button
                            className="mb-icon-btn danger"
                            onClick={(e) => { e.stopPropagation(); deleteItem(item); }}
                            title="Delete item"
                          ><IconTrash size={15} /></button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            </div>
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
      {/* Delete category confirm modal */}
      {confirmDeleteCat && (() => {
        const cat = categories.find(c => c.id === confirmDeleteCat);
        if (!cat) return null;
        const itemCount = catItemCounts[cat.id] ?? 0;
        return typeof document !== "undefined" ? createPortal(
          <>
            <style>{`@keyframes modalFadeIn { from { opacity:0; transform:scale(0.95) } to { opacity:1; transform:scale(1) } }`}</style>
            <div
              onClick={() => setConfirmDeleteCat(null)}
              style={{ position: "fixed", inset: 0, zIndex: 9990, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
            >
              <div
                onClick={e => e.stopPropagation()}
                style={{ background: "var(--surface)", borderRadius: 16, padding: "28px 24px", maxWidth: 360, width: "100%", boxShadow: "0 8px 40px rgba(0,0,0,0.4)", animation: "modalFadeIn 0.15s ease" }}
              >
                <div style={{ textAlign: "center", marginBottom: 12 }}><IconAlert width={32} height={32} style={{ color: "#dc2626" }} /></div>
                <h3 style={{ fontWeight: 800, fontSize: 18, textAlign: "center", margin: "0 0 8px", color: "var(--text)" }}>
                  Delete &ldquo;{cat.icon} {cat.name}&rdquo;?
                </h3>
                <p style={{ fontSize: 14, color: "var(--text-muted)", textAlign: "center", margin: "0 0 24px", lineHeight: 1.5 }}>
                  {itemCount > 0
                    ? `This will also delete all ${itemCount} item${itemCount !== 1 ? "s" : ""} in this category. This cannot be undone.`
                    : "This cannot be undone."}
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => setConfirmDeleteCat(null)}
                    style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontWeight: 600, fontSize: 14, color: "var(--text-muted)" }}
                  >Cancel</button>
                  <button
                    onClick={() => { deleteCategory(confirmDeleteCat); setConfirmDeleteCat(null); }}
                    style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: "#dc2626", color: "white", cursor: "pointer", fontWeight: 700, fontSize: 14 }}
                  >Yes, delete</button>
                </div>
              </div>
            </div>
          </>,
          document.body
        ) : null;
      })()}
      {/* Add-category emoji picker — fixed so sidebar overflow doesn't clip it */}
      {showEmojiPicker && typeof document !== "undefined" && createPortal(
        <>
          <div onClick={() => setShowEmojiPicker(false)} style={{ position: "fixed", inset: 0, zIndex: 98 }} />
          <div style={{
            position: "fixed", top: emojiPickerPos.top, left: emojiPickerPos.left, zIndex: 99,
            background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
            padding: 10, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4,
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)", width: 240,
          }}>
            {CATEGORY_EMOJIS.map(e => (
              <button key={e} type="button" onClick={() => { setNewCatIcon(e); setShowEmojiPicker(false); }}
                style={{ fontSize: 20, background: newCatIcon === e ? "var(--card-waiter-bg)" : "none", border: "none", borderRadius: 6, cursor: "pointer", padding: 4, lineHeight: 1 }}>
                {e}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
      {/* Edit-category emoji picker — fixed so sidebar overflow doesn't clip it */}
      {showEditEmojiPicker && typeof document !== "undefined" && createPortal(
        <>
          <div onClick={() => setShowEditEmojiPicker(false)} style={{ position: "fixed", inset: 0, zIndex: 98 }} />
          <div style={{
            position: "fixed", top: editEmojiPickerPos.top, left: editEmojiPickerPos.left, zIndex: 99,
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
        </>,
        document.body
      )}
      {/* Item options editor */}
      {optionsEditor && typeof document !== "undefined" && createPortal(
        <>
          <div onClick={() => setOptionsEditor(null)} style={{ position: "fixed", inset: 0, zIndex: 9990, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: 16, padding: "24px", maxWidth: 480, width: "100%", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.4)", animation: "modalFadeIn 0.15s ease" }}>
              <h3 style={{ fontWeight: 800, fontSize: 17, margin: "0 0 4px", color: "var(--text)" }}>Options — {optionsEditor.item.name}</h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 16px", lineHeight: 1.5 }}>
                Guests must pick one choice from each required group (e.g. meat choice on kebabs).
              </p>
              {optionDrafts.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 12px" }}>No options yet — add a group below.</p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>
                {optionDrafts.map((g, gi) => (
                  <div key={g.id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", background: "var(--surface-2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <input
                        value={g.name}
                        onChange={e => patchGroup(gi, { name: e.target.value })}
                        placeholder="Group name (e.g. Meat choice)"
                        style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, outline: "none" }}
                      />
                      <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        <input type="checkbox" checked={g.isRequired} onChange={e => patchGroup(gi, { isRequired: e.target.checked })} />
                        Required
                      </label>
                      <button onClick={() => removeOptionGroup(gi)} aria-label="Remove group" style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 16, padding: "2px 4px" }}>×</button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {g.choices.map((c, ci) => (
                        <div key={c.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <input
                            value={c.label}
                            onChange={e => patchChoice(gi, ci, { label: e.target.value })}
                            placeholder="Choice (e.g. Fläsk)"
                            style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, outline: "none" }}
                          />
                          <input
                            value={c.price}
                            onChange={e => patchChoice(gi, ci, { price: e.target.value })}
                            placeholder="+kr"
                            inputMode="decimal"
                            style={{ width: 64, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, outline: "none" }}
                          />
                          <button onClick={() => removeChoice(gi, ci)} aria-label="Remove choice" style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 15, padding: "2px 4px" }}>×</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => addChoice(gi)} style={{ alignSelf: "flex-start", padding: "5px 10px", borderRadius: 8, border: "1px dashed var(--border)", background: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer" }}>
                        + Add choice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addOptionGroup} style={{ width: "100%", padding: "9px", borderRadius: 10, border: "1px dashed var(--border)", background: "none", color: "var(--text-muted)", fontSize: 13, cursor: "pointer", marginBottom: 16 }}>
                + Add option group
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setOptionsEditor(null)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontWeight: 600, fontSize: 14, color: "var(--text-muted)" }}>Cancel</button>
                <button onClick={saveOptions} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "var(--accent)", color: "white", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>Save options</button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
