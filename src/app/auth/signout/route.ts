import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const origin = process.env.NEXT_PUBLIC_APP_URL || "https://menuqr.vercel.app";
  return NextResponse.redirect(new URL("/", origin));
}
