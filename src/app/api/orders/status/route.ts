import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Guest polls this to get current status of their orders
// GET /api/orders/status?ids=uuid1,uuid2,...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ids = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
  if (ids.length === 0) return NextResponse.json({ statuses: {} });

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("table_requests")
    .select("id, status")
    .in("id", ids);

  const statuses: Record<string, string> = {};
  for (const row of data ?? []) statuses[row.id] = row.status;
  return NextResponse.json({ statuses });
}
