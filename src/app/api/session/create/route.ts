import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

// Guest calls this when they scan QR — creates a pending session
export async function POST(req: Request) {
  const { table_token } = await req.json();
  if (!table_token) return NextResponse.json({ error: "missing table_token" }, { status: 400 });

  const supabase = createAdminClient();

  // Get table
  const { data: table } = await supabase
    .from("restaurant_tables")
    .select("id, restaurant_id, is_active")
    .eq("token", table_token)
    .single();

  if (!table) return NextResponse.json({ error: "table not found" }, { status: 404 });
  if (!table.is_active) return NextResponse.json({ error: "table_closed" }, { status: 403 });

  // Create pending session — multiple guests can request, staff picks who to approve
  const session_id = randomUUID();
  const { error } = await supabase.from("table_sessions").insert({
    table_id: table.id,
    restaurant_id: table.restaurant_id,
    session_id,
    status: "pending",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ session_id });
}
