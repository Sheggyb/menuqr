import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Guest polls this to check if staff approved their session
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session_id = searchParams.get("session_id");
  if (!session_id) return NextResponse.json({ error: "missing session_id" }, { status: 400 });

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("table_sessions")
    .select("status")
    .eq("session_id", session_id)
    .single();

  if (!data) return NextResponse.json({ status: "not_found" });
  return NextResponse.json({ status: data.status });
}

// Staff calls this to approve or decline a session
export async function PATCH(req: Request) {
  const { session_id, action } = await req.json(); // action: "approve" | "decline"
  if (!session_id || !action) return NextResponse.json({ error: "missing params" }, { status: 400 });

  const supabase = createAdminClient();

  if (action === "approve") {
    // Close any other active sessions for this table first
    const { data: sess } = await supabase
      .from("table_sessions")
      .select("table_id")
      .eq("session_id", session_id)
      .single();

    if (sess) {
      await supabase
        .from("table_sessions")
        .update({ status: "closed" })
        .eq("table_id", sess.table_id)
        .eq("status", "active");
    }

    await supabase
      .from("table_sessions")
      .update({ status: "active" })
      .eq("session_id", session_id);

  } else if (action === "decline") {
    await supabase
      .from("table_sessions")
      .update({ status: "closed" })
      .eq("session_id", session_id);
  }

  return NextResponse.json({ ok: true });
}
