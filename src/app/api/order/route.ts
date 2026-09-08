import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import {
  parseJson,
  badRequest,
  forbidden,
  tooManyRequests,
  isUuid,
  isRequestType,
  cleanText,
} from "@/lib/validate";
import { rateLimit, clientIp } from "@/lib/ratelimit";

/**
 * Guest order submission.
 *
 * This route is the PRICING AUTHORITY. It previously accepted `item_name` and
 * `total_price` straight from the browser and filed them verbatim — the guest
 * decided what their own meal cost. Harmless while nothing charges money;
 * fatal the moment Stripe does. Now the client sends only ids, and the server
 * looks up every dish and every chosen option, scoped to the restaurant it
 * derives from the table, and computes the price itself.
 *
 * `item_name` is still written (the boards, Request History search and
 * lib/order-lines.ts all consume it) — but by the server, from the rows.
 */

interface IncomingItem {
  item_id: string;
  quantity: number;
  choice_ids: string[];
  removed_choice_ids: string[];
  extra_choice_ids: string[];
  note: string | null;
}

interface ChoiceRow {
  id: string;
  option_id: string;
  label: string;
  price_delta: number | null;
  is_available: boolean | null;
}

interface OptionRow {
  id: string;
  item_id: string;
  name: string;
  type: "choice" | "ingredients" | "allergens";
  is_required: boolean;
  choices: ChoiceRow[];
}

const MAX_ITEMS = 50;
const MAX_QTY = 99;

/**
 * A rejection the GUEST can act on, as opposed to one that means tampering.
 *
 * The realistic case is a stale cart: a dish is 86'd, or a topping sells out,
 * or staff edit the menu while the guest is still deciding. Before this route
 * validated anything those orders simply went through; now they are correctly
 * refused, so the guest has to be told *which dish* and *why* — otherwise they
 * get a generic failure and retry forever with a cart that can never succeed.
 */
function conflict(error: string, detail: string) {
  return NextResponse.json({ error, detail }, { status: 409 });
}

/** Narrow an unknown array of ids to uuid strings, capped so one request cannot be huge. */
function uuidList(value: unknown, cap = 40): string[] | null {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > cap) return null;
  const out: string[] = [];
  for (const v of value) {
    if (!isUuid(v)) return null;
    out.push(v);
  }
  return out;
}

function parseItems(value: unknown): IncomingItem[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_ITEMS) return null;
  const out: IncomingItem[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Record<string, unknown>;
    if (!isUuid(r.item_id)) return null;
    const qty = typeof r.quantity === "number" ? Math.floor(r.quantity) : NaN;
    if (!Number.isFinite(qty) || qty < 1 || qty > MAX_QTY) return null;
    const choice_ids = uuidList(r.choice_ids);
    const removed_choice_ids = uuidList(r.removed_choice_ids);
    const extra_choice_ids = uuidList(r.extra_choice_ids);
    if (!choice_ids || !removed_choice_ids || !extra_choice_ids) return null;
    out.push({
      item_id: r.item_id,
      quantity: qty,
      choice_ids,
      removed_choice_ids,
      extra_choice_ids,
      note: cleanText(r.note, 300),
    });
  }
  return out;
}

/**
 * Build the display string the boards parse (see lib/order-lines.ts):
 *   x2 Kebab Brödet [Fläsk, − lök, + ost | no mayo please]
 * Options in SQUARE brackets because dish names legitimately contain
 * parentheses; the note after a "|" so it stays attached to its own item.
 */
function flattenNote(t: string | null): string {
  return (t ?? "").replace(/[[\]|\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

function buildLine(name: string, qty: number, labels: string[], note: string | null): string {
  const opts = labels.join(", ");
  const n = flattenNote(note);
  const payload = n ? `${opts} | ${n}` : opts;
  return `x${qty} ${name}${payload ? ` [${payload}]` : ""}`;
}

export async function POST(req: Request) {
  const body = await parseJson(req);
  if (!body) return badRequest("invalid body");

  const { session_id, table_id, type } = body;
  if (!isUuid(session_id) || !isUuid(table_id)) return badRequest("missing params");
  if (!isRequestType(type)) return badRequest("invalid type");

  // restaurant_id is deliberately NOT read from the body — it is derived from
  // the table below. Older clients may still send it; it is ignored.

  if (!rateLimit(`order:${session_id}:${clientIp(req)}`, 20, 60_000)) {
    return tooManyRequests();
  }

  const supabase = createAdminClient();

  // Session must be active for THIS table
  const { data: session } = await supabase
    .from("table_sessions")
    .select("status, table_id")
    .eq("session_id", session_id)
    .eq("table_id", table_id)
    .single();

  if (!session || session.status !== "active") return forbidden("session_invalid");

  // Table must still be open
  const { data: table } = await supabase
    .from("restaurant_tables")
    .select("is_active, restaurant_id")
    .eq("id", table_id)
    .single();

  if (!table?.is_active) return forbidden("table_closed");

  // Derive the restaurant server-side — never trust a client-supplied one.
  const restaurantId = table.restaurant_id as string;

  // ── Quick actions (waiter / bill / refill) ────────────────────────────
  if (type !== "item_request") {
    const { data: existing } = await supabase
      .from("table_requests")
      .select("id")
      .eq("table_id", table_id)
      .eq("type", type)
      .in("status", ["pending", "seen"])
      .limit(1);
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "duplicate_request", type }, { status: 409 });
    }

    const { data: inserted, error } = await supabase
      .from("table_requests")
      .insert({
        restaurant_id: restaurantId,
        table_id,
        type,
        item_id: null,
        item_name: null,
        note: cleanText(body.note, 500),
        total_price: null,
        status: "pending",
        payment_status: "not_required",
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: inserted.id });
  }

  // ── Item order ────────────────────────────────────────────────────────
  const items = parseItems(body.items);
  if (!items) return badRequest("invalid items");

  // Load the referenced dishes, scoped to THIS restaurant. An id from another
  // restaurant simply will not come back, so it fails the coverage check below.
  const itemIds = [...new Set(items.map(i => i.item_id))];
  const { data: menuRows, error: menuErr } = await supabase
    .from("menu_items")
    .select("id, name, price, is_available")
    .eq("restaurant_id", restaurantId)
    .in("id", itemIds);
  if (menuErr) return NextResponse.json({ error: menuErr.message }, { status: 500 });

  const menuById = new Map((menuRows ?? []).map(m => [m.id as string, m]));
  for (const id of itemIds) {
    const m = menuById.get(id);
    // No name to report — an id that resolves to nothing was never on this menu.
    if (!m) return badRequest("invalid item_id");
    if (!m.is_available) return conflict("item_unavailable", m.name as string);
  }

  // Load option groups + choices for those dishes, also restaurant-scoped
  const { data: optionRows, error: optErr } = await supabase
    .from("menu_item_options")
    .select("id, item_id, name, type, is_required, choices:menu_item_option_choices(id, option_id, label, price_delta, is_available)")
    .eq("restaurant_id", restaurantId)
    .in("item_id", itemIds);
  if (optErr) return NextResponse.json({ error: optErr.message }, { status: 500 });

  const groups = (optionRows ?? []) as unknown as OptionRow[];
  const groupsByItem = new Map<string, OptionRow[]>();
  const choiceById = new Map<string, ChoiceRow>();
  for (const g of groups) {
    const list = groupsByItem.get(g.item_id) ?? [];
    list.push(g);
    groupsByItem.set(g.item_id, list);
    for (const c of g.choices ?? []) choiceById.set(c.id, c);
  }

  const lines: string[] = [];
  const noteParts: string[] = [];
  const rows: Record<string, unknown>[] = [];
  let total = 0;

  for (let idx = 0; idx < items.length; idx++) {
    const it = items[idx];
    const menu = menuById.get(it.item_id)!;
    const itemGroups = groupsByItem.get(it.item_id) ?? [];
    const groupIds = new Set(itemGroups.map(g => g.id));

    // Every submitted choice must belong to THIS dish and be available.
    const allSubmitted = [...it.choice_ids, ...it.removed_choice_ids, ...it.extra_choice_ids];
    for (const cid of allSubmitted) {
      const c = choiceById.get(cid);
      if (!c || !groupIds.has(c.option_id)) return badRequest("invalid choice_id");
      if (c.is_available === false) return conflict("choice_unavailable", c.label);
    }

    // Required choice groups must be answered. This existed only in the browser
    // (GuestMenuClient) and the server could not enforce it before, because it
    // never received the ids.
    for (const g of itemGroups) {
      if (g.type !== "choice" || !g.is_required) continue;
      const available = (g.choices ?? []).filter(c => c.is_available !== false);
      if (available.length === 0) continue; // all sold out — cannot be answered
      const answered = it.choice_ids.filter(cid => choiceById.get(cid)?.option_id === g.id);
      if (answered.length !== 1) return conflict("missing_choice", g.name);
    }

    // Price: dish + chosen deltas. Extras carry their own delta too, which is 0
    // today (the editor hides the price field for ingredient groups) but means
    // charging for "extra cheese" later needs no change here.
    const base = typeof menu.price === "number" ? menu.price : 0;
    const deltaFrom = (ids: string[]) =>
      ids.reduce((s, cid) => s + (choiceById.get(cid)?.price_delta ?? 0), 0);
    const unit = Math.round((base + deltaFrom(it.choice_ids) + deltaFrom(it.extra_choice_ids)) * 100) / 100;
    total += Math.round(unit * it.quantity * 100) / 100;

    // Labels, in the order the boards expect: choices, removals, extras
    const labelOf = (cid: string) => choiceById.get(cid)?.label ?? "";
    const labels = [
      ...it.choice_ids.map(labelOf),
      ...it.removed_choice_ids.map(cid => `− ${labelOf(cid)}`),
      ...it.extra_choice_ids.map(cid => `+ ${labelOf(cid)}`),
    ].filter(l => l.trim().length > 0 && l.trim() !== "−" && l.trim() !== "+");

    lines.push(buildLine(menu.name as string, it.quantity, labels, it.note));
    if (flattenNote(it.note)) noteParts.push(`${menu.name}: ${flattenNote(it.note)}`);

    rows.push({
      restaurant_id: restaurantId,
      item_id: it.item_id,
      name_snapshot: menu.name,
      quantity: it.quantity,
      unit_price: unit,
      selected_options: {
        choices: it.choice_ids.map(cid => ({ id: cid, label: labelOf(cid), price_delta: choiceById.get(cid)?.price_delta ?? 0 })),
        removed: it.removed_choice_ids.map(cid => ({ id: cid, label: labelOf(cid) })),
        extra: it.extra_choice_ids.map(cid => ({ id: cid, label: labelOf(cid), price_delta: choiceById.get(cid)?.price_delta ?? 0 })),
      },
      note: flattenNote(it.note) || null,
      sort_order: idx,
    });
  }

  total = Math.round(total * 100) / 100;

  const { data: inserted, error } = await supabase
    .from("table_requests")
    .insert({
      restaurant_id: restaurantId,
      table_id,
      type,
      // Single-dish orders keep a usable item_id; a mixed cart has no single dish.
      item_id: itemIds.length === 1 ? itemIds[0] : null,
      item_name: lines.join("\n"),
      note: noteParts.length > 0 ? noteParts.join("; ").slice(0, 500) : null,
      total_price: total,
      status: "pending",
      // Stripe seam: becomes 'awaiting' when a venue requires payment first, and
      // a webhook flips it to 'paid'. Both boards filter 'awaiting' out, so an
      // unpaid ticket can never reach the kitchen.
      payment_status: "not_required",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: itemsErr } = await supabase
    .from("order_items")
    .insert(rows.map(r => ({ ...r, request_id: inserted.id })));

  if (itemsErr) {
    // No transactions from the JS client, so undo the header rather than leave
    // an order with no contents on the board.
    await supabase.from("table_requests").delete().eq("id", inserted.id);
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: inserted.id, total_price: total });
}
