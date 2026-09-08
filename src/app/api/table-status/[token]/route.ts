import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { tooManyRequests } from "@/lib/validate";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || token.length > 100) {
    return NextResponse.json({ is_active: false });
  }

  // Keyed on TOKEN + ip, not ip alone. A restaurant's WiFi presents one
  // x-forwarded-for for every guest in the building, so an ip-only key made all
  // of them share a single 60/min budget — four phones polling this endpoint was
  // enough to start returning 429, and the guest menu read that as "closed".
  // Per-table keying also stops one busy table from starving the others.
  if (!rateLimit(`table-status:${token}:${clientIp(req)}`, 120, 60_000)) {
    return tooManyRequests();
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("restaurant_tables")
    .select("is_active")
    .eq("token", token)
    .single();
  return NextResponse.json({ is_active: data?.is_active ?? false });
}
