import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { badRequest, unauthorized, isUuid } from "@/lib/validate";
import { requireRestaurantOwner } from "@/lib/auth-helpers";

// Returns all pending sessions for a restaurant (staff dashboard only)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const restaurant_id = searchParams.get("restaurant_id");
  if (!isUuid(restaurant_id)) return badRequest("missing restaurant_id");

  const owner = await requireRestaurantOwner(restaurant_id);
  if (!owner) return unauthorized();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("table_sessions")
    .select("*, table:restaurant_tables(name)")
    .eq("restaurant_id", restaurant_id)
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ sessions: data ?? [] });
}
