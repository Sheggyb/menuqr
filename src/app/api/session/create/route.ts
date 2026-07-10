import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { parseJson, badRequest, forbidden, tooManyRequests } from "@/lib/validate";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const body = await parseJson(req);
  if (!body) return badRequest("invalid body");

  const { table_token } = body;
  if (typeof table_token !== "string" || !table_token || table_token.length > 100) {
    return badRequest("missing table_token");
  }

  // A real guest scans once; anything faster is abuse.
  if (!rateLimit(`session-create:${table_token}:${clientIp(req)}`, 5, 60_000)) {
    return tooManyRequests();
  }

  const supabase = createAdminClient();

  const { data: table } = await supabase
    .from("restaurant_tables")
    .select("id, restaurant_id, is_active")
    .eq("token", table_token)
    .single();

  if (!table) return NextResponse.json({ error: "table not found" }, { status: 404 });
  if (!table.is_active) return forbidden("table_closed");

  // Always create a pending session — staff approves each person individually
  const session_id = randomUUID();
  const { error } = await supabase.from("table_sessions").insert({
    table_id: table.id,
    restaurant_id: table.restaurant_id,
    session_id,
    status: "pending",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session_id, status: "pending" });
}
