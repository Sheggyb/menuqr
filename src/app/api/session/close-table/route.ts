import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { parseJson, badRequest, unauthorized, isUuid } from "@/lib/validate";
import { requireTableOwner } from "@/lib/auth-helpers";

// Called by staff when a table is closed — invalidates all sessions
export async function POST(req: Request) {
  const body = await parseJson(req);
  if (!body) return badRequest("invalid body");

  const { table_id } = body;
  if (!isUuid(table_id)) return badRequest("missing table_id");

  const owner = await requireTableOwner(table_id);
  if (!owner) return unauthorized();

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("table_sessions")
    .update({ status: "closed" })
    .eq("table_id", table_id)
    .in("status", ["active", "pending"]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
