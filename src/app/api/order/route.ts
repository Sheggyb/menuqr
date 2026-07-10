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

  const item_name = cleanText(body.item_name, 200);
  const note = cleanText(body.note, 500);

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
    .select("is_active")
    .eq("id", table_id)
    .single();

  if (!table?.is_active) return forbidden("table_closed");

  const { data: inserted, error } = await supabase
    .from("table_requests")
    .insert({
      restaurant_id,
      table_id,
      type,
      item_id: item_id ?? null,
      item_name,
      note,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: inserted.id });
}
