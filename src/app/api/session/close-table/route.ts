import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Called by staff when a table is closed — invalidates all sessions
export async function POST(req: Request) {
  const { table_id } = await req.json();
  if (!table_id) return NextResponse.json({ error: "missing table_id" }, { status: 400 });

  const supabase = createAdminClient();
  await supabase
    .from("table_sessions")
    .update({ status: "closed" })
    .eq("table_id", table_id)
    .in("status", ["active", "pending"]);

  return NextResponse.json({ ok: true });
}
