import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import Stripe from "stripe";
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

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT CHECKOUT (Stripe, pre-pay gate)
//
// Flow: guest cart (ids only) -> this route validates + prices EVERYTHING
// server-side (same rules as /api/order), inserts the order as
// payment_status='awaiting' (boards hide it), creates a Stripe Checkout
// Session for the exact computed total, and returns the hosted payment URL.
// Stripe's success redirect carries ?session_id; /api/payments/status verifies
// the session with Stripe (never the client) and flips the row to 'paid' —
// only then does the ticket reach the kitchen.
//
// NOTE: pricing/validation intentionally mirrors /api/order's item_request
// path. Keep the two in sync when menu rules change (required groups, choice
// availability, delta math). A shared helper is the eventual fix.
// ─────────────────────────────────────────────────────────────────────────────

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

function conflict(error: string, detail: string) {
  return NextResponse.json({ error, detail }, { status: 409 });
}

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

function flattenNote(t: string | null): string {
  return (t ?? "").replace(/[[\]|\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

function buildLine(name: string, qty: number, labels: string[], note: string | null): string {
  const opts = labels.join(", ");
  const n = flattenNote(note);
  const payload = n ? `${opts} | ${n}` : opts;
  return `x${qty} ${name}${payload ? ` [${payload}]` : ""}`;
}

// Stripe minor units. Most currencies are 2dp; JPY and a few others are 0dp.
const ZERO_DECIMAL = new Set(["JPY", "BIF", "CLP", "DJF", "GNF", "ISK", "KMF", "KRW", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"]);

export async function POST(req: Request) {
  const body = await parseJson(req);
  if (!body) return badRequest("invalid body");

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret || !secret.startsWith("sk_")) {
    return NextResponse.json({ error: "payments_not_configured" }, { status: 501 });
  }
  const stripe = new Stripe(secret);

  const { session_id, table_id } = body;
  if (!isUuid(session_id) || !isUuid(table_id)) return badRequest("missing params");

  if (!rateLimit(`paycheckout:${session_id}:${clientIp(req)}`, 20, 60_000)) {
    return tooManyRequests();
  }

  const items = parseItems(body.items);
  if (!items) return badRequest("invalid items");

  const supabase = createAdminClient();

  // Session must be active for THIS table, table open, derive restaurant
  const { data: session } = await supabase
    .from("table_sessions")
    .select("status, table_id")
    .eq("session_id", session_id)
    .eq("table_id", table_id)
    .single();
  if (!session || session.status !== "active") return forbidden("session_invalid");

  const { data: table } = await supabase
    .from("restaurant_tables")
    .select("is_active, restaurant_id, token")
    .eq("id", table_id)
    .single();
  if (!table?.is_active) return forbidden("table_closed");
  const restaurantId = table.restaurant_id as string;
  const token = table.token as string;

  // Dishes scoped to this restaurant
  const itemIds = [...new Set(items.map(i => i.item_id))];
  const { data: menuRows } = await supabase
    .from("menu_items")
    .select("id, name, price, is_available")
    .eq("restaurant_id", restaurantId)
    .in("id", itemIds);
  const menuById = new Map((menuRows ?? []).map(m => [m.id as string, m]));
  for (const id of itemIds) {
    const m = menuById.get(id);
    if (!m) return badRequest("invalid item_id");
    if (!m.is_available) return conflict("item_unavailable", m.name as string);
  }

  // Option groups + choices for those dishes, restaurant-scoped
  const { data: optionRows } = await supabase
    .from("menu_item_options")
    .select("id, item_id, name, type, is_required, choices:menu_item_option_choices(id, option_id, label, price_delta, is_available)")
    .eq("restaurant_id", restaurantId)
    .in("item_id", itemIds);

  const groups = (optionRows ?? []) as unknown as OptionRow[];
  const groupsByItem = new Map<string, OptionRow[]>();
  const choiceById = new Map<string, ChoiceRow>();
  for (const g of groups) {
    const list = groupsByItem.get(g.item_id) ?? [];
    list.push(g);
    groupsByItem.set(g.item_id, list);
    for (const c of g.choices ?? []) choiceById.set(c.id, c);
  }

  // Restaurant currency for the Stripe amount
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("currency")
    .eq("id", restaurantId)
    .single();
  const currency = (restaurant?.currency as string) ?? "SEK";

  const lines: string[] = [];
  const noteParts: string[] = [];
  const rows: Record<string, unknown>[] = [];
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  let total = 0;

  for (let idx = 0; idx < items.length; idx++) {
    const it = items[idx];
    const menu = menuById.get(it.item_id)!;
    const itemGroups = groupsByItem.get(it.item_id) ?? [];
    const groupIds = new Set(itemGroups.map(g => g.id));

    // Every submitted choice must belong to THIS dish and be available
    const allSubmitted = [...it.choice_ids, ...it.removed_choice_ids, ...it.extra_choice_ids];
    for (const cid of allSubmitted) {
      const c = choiceById.get(cid);
      if (!c || !groupIds.has(c.option_id)) return badRequest("invalid choice_id");
      if (c.is_available === false) return conflict("choice_unavailable", c.label);
    }

    // Required choice groups must be answered
    for (const g of itemGroups) {
      if (g.type !== "choice" || !g.is_required) continue;
      const available = (g.choices ?? []).filter(c => c.is_available !== false);
      if (available.length === 0) continue;
      const answered = it.choice_ids.filter(cid => choiceById.get(cid)?.option_id === g.id);
      if (answered.length !== 1) return conflict("missing_choice", g.name);
    }

    const base = typeof menu.price === "number" ? menu.price : 0;
    const deltaFrom = (ids: string[]) =>
      ids.reduce((s, cid) => s + (choiceById.get(cid)?.price_delta ?? 0), 0);
    const unit = Math.round((base + deltaFrom(it.choice_ids) + deltaFrom(it.extra_choice_ids)) * 100) / 100;
    total += Math.round(unit * it.quantity * 100) / 100;

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

    const minor = ZERO_DECIMAL.has(currency) ? Math.round(unit * it.quantity) : Math.round(unit * it.quantity * 100);
    lineItems.push({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: {
          name: `${it.quantity}× ${menu.name}`,
          description: labels.length > 0 ? labels.join(", ").slice(0, 400) : undefined,
        },
        unit_amount: minor,
      },
      quantity: 1,
    });
  }
  total = Math.round(total * 100) / 100;

  if (lineItems.length === 0 || total <= 0) return badRequest("nothing to charge");

  // Insert the order as AWAITING — hidden from every board until paid
  const { data: inserted, error } = await supabase
    .from("table_requests")
    .insert({
      restaurant_id: restaurantId,
      table_id,
      type: "item_request",
      item_id: itemIds.length === 1 ? itemIds[0] : null,
      item_name: lines.join("\n"),
      note: noteParts.length > 0 ? noteParts.join("; ").slice(0, 500) : null,
      total_price: total,
      status: "pending",
      payment_status: "awaiting",
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: itemsErr } = await supabase
    .from("order_items")
    .insert(rows.map(r => ({ ...r, request_id: inserted.id })));
  if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 });

  const origin = new URL(req.url).origin;
  const base = `${origin}/menu/${token}`;

  // Create the hosted Checkout Session. success_url carries the Stripe session
  // id so the return poll can verify payment BEFORE the kitchen sees anything.
  let checkout;
  try {
    checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${base}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}?checkout=cancelled`,
      metadata: { request_id: inserted.id, table_id },
      // Swedish test friendly; also the only local payment method Stripe offers in SE
      payment_method_types: ["card"],
    });
  } catch (e) {
    // Clean up the awaiting order — no session was ever created
    await supabase.from("table_requests").delete().eq("id", inserted.id);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: checkout.url, request_id: inserted.id, total_price: total });
}
