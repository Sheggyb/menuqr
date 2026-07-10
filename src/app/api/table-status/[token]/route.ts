import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { tooManyRequests } from "@/lib/validate";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || token.length > 100) {
    return NextResponse.json({ is_active: false });
  }

  if (!rateLimit(`table-status:${clientIp(req)}`, 60, 60_000)) {
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
