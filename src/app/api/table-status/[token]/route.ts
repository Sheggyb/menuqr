import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("restaurant_tables")
    .select("is_active")
    .eq("token", token)
    .single();
  return NextResponse.json({ is_active: data?.is_active ?? false });
}
