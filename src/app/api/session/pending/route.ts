import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Returns all pending sessions for a restaurant (for staff dashboard)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const restaurant_id = searchParams.get("restaurant_id");
  if (!restaurant_id) return NextResponse.json({ error: "missing restaurant_id" }, { status: 400 });

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("table_sessions")
    .select("*, table:restaurant_tables(name)")
    .eq("restaurant_id", restaurant_id)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return NextResponse.json({ sessions: data ?? [] });
}
