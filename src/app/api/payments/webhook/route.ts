import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import Stripe from "stripe";

// Stripe webhook — production robustness for the pre-pay gate.
//
// The return-poll (/api/payments/status) covers the happy path, but a guest
// who pays and closes the tab never polls. This endpoint is called by Stripe
// the moment checkout.session.completed fires, so the order flips to paid and
// reaches the kitchen even if the guest never comes back.
//
// Setup (dashboard): Developers -> Webhooks -> add endpoint
//   https://menuqr-delta.vercel.app/api/payments/webhook
//   events: checkout.session.completed (+ checkout.session.expired to clean up
//   abandoned awaiting orders)
// then put the signing secret in STRIPE_WEBHOOK_SECRET (Vercel env).
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "webhook not configured" }, { status: 501 });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const requestId = session.metadata?.request_id;
    if (requestId && session.payment_status === "paid") {
      await supabase
        .from("table_requests")
        .update({ payment_status: "paid" })
        .eq("id", requestId)
        .eq("payment_status", "awaiting");
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const requestId = session.metadata?.request_id;
    if (requestId) {
      await supabase
        .from("table_requests")
        .delete()
        .eq("id", requestId)
        .eq("payment_status", "awaiting");
    }
  }

  return NextResponse.json({ received: true });
}
