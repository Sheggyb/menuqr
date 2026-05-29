import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Secure order submission — validates session_id before inserting
export async function POST(req: Request) {
  const body = await req.json();
  const { session_id, restaurant_id, table_id, type, item_id, item_name, note } = body;

  if (!session_id || !restaurant_id || !table_id || !type) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Validate session is active for this table
  const { data: session } = await supabase
    .from("table_sessions")
    .select("status, table_id")
    .eq("session_id", session_id)
    .eq("table_id", table_id)
    .single();

  if (!session || session.status !== "active") {
    return NextResponse.json({ error: "session_invalid" }, { status: 403 });
  }

  // Validate table is still open
  const { data: table } = await supabase
    .from("restaurant_tables")
    .select("is_active")
    .eq("id", table_id)
    .single();

  if (!table?.is_active) {
    return NextResponse.json({ error: "table_closed" }, { status: 403 });
  }

  const { data: inserted, error } = await supabase.from("table_requests").insert({
    restaurant_id,
    table_id,
    type,
    item_id: item_id ?? null,
    item_name: item_name ?? null,
    note: note ?? null,
    status: "pending",
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: inserted.id });
}
