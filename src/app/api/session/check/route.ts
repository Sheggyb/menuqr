import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import {
  parseJson,
  badRequest,
  unauthorized,
  tooManyRequests,
  isUuid,
} from "@/lib/validate";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { requireSessionOwner } from "@/lib/auth-helpers";

// Guest polls their own session status (they hold the session_id)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session_id = searchParams.get("session_id");
  if (!isUuid(session_id)) return badRequest("missing session_id");

  if (!rateLimit(`session-check:${session_id}:${clientIp(req)}`, 60, 60_000)) {
    return tooManyRequests();
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("table_sessions")
    .select("status")
    .eq("session_id", session_id)
    .single();

  if (!data) return NextResponse.json({ status: "not_found" });
  return NextResponse.json({ status: data.status });
}

// Staff approves/declines a session — requires restaurant ownership
export async function PATCH(req: Request) {
  const body = await parseJson(req);
  if (!body) return badRequest("invalid body");

  const { session_id, action } = body;
  if (!isUuid(session_id)) return badRequest("missing session_id");
  if (action !== "approve" && action !== "decline") {
    return badRequest("invalid action");
  }

  const owner = await requireSessionOwner(session_id);
  if (!owner) return unauthorized();

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("table_sessions")
    .update({ status: action === "approve" ? "active" : "closed" })
    .eq("session_id", session_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
