import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { parseJson, badRequest, unauthorized, isUuid } from "@/lib/validate";
import { requireTableOwner } from "@/lib/auth-helpers";

// Staff clears all orders for a table (marks pending/seen as done), table stays open
export async function POST(req: Request) {
  const body = await parseJson(req);
  if (!body) return badRequest("invalid body");

  const { table_id } = body;
  if (!isUuid(table_id)) return badRequest("missing table_id");

  const owner = await requireTableOwner(table_id);
  if (!owner) return unauthorized();

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("table_requests")
    .update({ status: "done" })
    .eq("table_id", table_id)
    .eq("restaurant_id", owner.restaurantId)
    .in("status", ["pending", "seen"]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also close all sessions so new guests must request access again (table stays open)
  const { error: sessionError } = await supabase
    .from("table_sessions")
    .update({ status: "closed" })
    .eq("table_id", table_id)
    .in("status", ["pending", "active"]);
  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
