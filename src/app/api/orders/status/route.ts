import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { isUuid, tooManyRequests } from "@/lib/validate";
import { rateLimit, clientIp } from "@/lib/ratelimit";

// Guest polls this to get current status of their orders
// GET /api/orders/status?ids=uuid1,uuid2,...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ids = (searchParams.get("ids")?.split(",").filter(Boolean) ?? [])
    .filter(isUuid)
    .slice(0, 50);
  if (ids.length === 0) return NextResponse.json({ statuses: {} });

  if (!rateLimit(`orders-status:${clientIp(req)}`, 60, 60_000)) {
    return tooManyRequests();
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("table_requests")
    .select("id, status")
    .in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const statuses: Record<string, string> = {};
  for (const row of data ?? []) statuses[row.id] = row.status;
  return NextResponse.json({ statuses });
}
