import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import Stripe from "stripe";

// Return-poll after a Stripe Checkout redirect (?checkout=success&session_id=…).
// The session id comes from the URL Stripe redirected to, but we NEVER trust it
// alone — we ask Stripe for the session's real payment status, then flip (or
// clean up) the order accordingly.
//
// paid      -> flip awaiting -> paid: the ticket now appears on the boards
// not paid  -> delete the awaiting order: an abandoned checkout is not an order
export async function GET(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret || !secret.startsWith("sk_")) {
    return NextResponse.json({ error: "payments_not_configured" }, { status: 501 });
  }
  const stripe = new Stripe(secret);

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");
  if (!sessionId || !sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "missing session_id" }, { status: 400 });
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json({ error: "invalid session" }, { status: 400 });
  }

  const requestId = session.metadata?.request_id;
  if (!requestId) return NextResponse.json({ paid: false });

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("table_requests")
    .select("id, payment_status")
    .eq("id", requestId)
    .single();

  if (!row || row.payment_status !== "awaiting") {
    // Already handled (webhook beat us to it) or gone — nothing to do
    return NextResponse.json({ paid: session.payment_status === "paid" });
  }

  if (session.payment_status === "paid") {
    const { error } = await supabase
      .from("table_requests")
      .update({ payment_status: "paid" })
      .eq("id", requestId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ paid: true });
  }

  // Not paid — abandoned or failed. Delete the awaiting order (order_items
  // cascade with it) so it can never reach the kitchen and never clutters stats.
  await supabase.from("table_requests").delete().eq("id", requestId);
  return NextResponse.json({ paid: false });
}
