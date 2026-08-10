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

// Guest order submission — validates the approved session before inserting
export async function POST(req: Request) {
  const body = await parseJson(req);
  if (!body) return badRequest("invalid body");

  const { session_id, restaurant_id, table_id, type, item_id } = body;
  if (!isUuid(session_id) || !isUuid(restaurant_id) || !isUuid(table_id)) {
    return badRequest("missing params");
  }
  if (!isRequestType(type)) return badRequest("invalid type");
  if (item_id != null && !isUuid(item_id)) return badRequest("invalid item_id");

  if (!rateLimit(`order:${session_id}:${clientIp(req)}`, 20, 60_000)) {
    return tooManyRequests();
  }

  // Cap is generous: one cart = one row, one line per item, and choice/ingredient
  // selections ride inside item_name ("x3 Kebab Brödet (Fläsk, − lök, − tomat)").
  const item_name = cleanText(body.item_name, 1000);
  const note = cleanText(body.note, 500);
  if (type === "item_request" && !item_name) return badRequest("missing item_name");

  // Optional client-computed total (item_request only) — validated, never trusted blindly
  const rawTotal = body.total_price;
  const total_price = typeof rawTotal === "number" && Number.isFinite(rawTotal) && rawTotal >= 0 && rawTotal <= 1_000_000
    ? Math.round(rawTotal * 100) / 100
    : null;

  const supabase = createAdminClient();

  // Validate session is active for this table
  const { data: session } = await supabase
    .from("table_sessions")
    .select("status, table_id")
    .eq("session_id", session_id)
    .eq("table_id", table_id)
    .single();

  if (!session || session.status !== "active") {
    return forbidden("session_invalid");
  }

  // Validate table is still open
  const { data: table } = await supabase
    .from("restaurant_tables")
    .select("is_active, restaurant_id")
    .eq("id", table_id)
    .single();

  if (!table?.is_active) return forbidden("table_closed");

  // Derive the restaurant server-side from the table — never trust the
  // client-supplied restaurant_id (a guest could post to another restaurant).
  const restaurantId = table.restaurant_id;

  // Dedup quick actions: one open (pending/seen) request per type per table
  if (type === "waiter" || type === "bill" || type === "refill") {
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
  }

  const { data: inserted, error } = await supabase
    .from("table_requests")
    .insert({
      restaurant_id: restaurantId,
      table_id,
      type,
      item_id: item_id ?? null,
      item_name,
      note,
      total_price: type === "item_request" ? total_price : null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: inserted.id });
}
