import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Staff clears all orders for a table (marks pending/seen as done), table stays open
export async function POST(req: Request) {
  const { table_id, restaurant_id } = await req.json();
  if (!table_id || !restaurant_id) return NextResponse.json({ error: "missing params" }, { status: 400 });

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("table_requests")
    .update({ status: "done" })
    .eq("table_id", table_id)
    .eq("restaurant_id", restaurant_id)
    .in("status", ["pending", "seen"]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
