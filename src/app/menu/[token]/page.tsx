import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import GuestMenuClient from "./GuestMenuClient";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function GuestMenuPage({ params }: Props) {
  const { token } = await params;
  const supabase = await createClient();

  // Look up table
  const { data: table } = await supabase
    .from("restaurant_tables")
    .select("*, restaurant:restaurants(*)")
    .eq("token", token)
    .single();

  if (!table) return notFound();

  // Load menu
  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase.from("menu_categories").select("*").eq("restaurant_id", table.restaurant_id).order("sort_order"),
    supabase.from("menu_items").select("*").eq("restaurant_id", table.restaurant_id).eq("is_available", true).order("sort_order"),
  ]);

  return (
    <GuestMenuClient
      table={table}
      restaurant={table.restaurant}
      categories={categories ?? []}
      items={items ?? []}
    />
  );
}
