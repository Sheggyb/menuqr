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

  if (!table) return (
    <div style={{ minHeight: "100vh", background: "#FAFAF8", fontFamily: "Inter, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
      <h1 style={{ fontWeight: 800, fontSize: 24, marginBottom: 8, color: "#111827" }}>Table not found</h1>
      <p style={{ color: "#6b7280", fontSize: 15, maxWidth: 320, lineHeight: 1.6 }}>
        This QR code doesn&apos;t match any active table. Please ask a staff member for help or scan the QR code again.
      </p>
      <div style={{ marginTop: 24, padding: "10px 20px", borderRadius: 10, background: "#fef3c7", border: "1px solid #fde047", color: "#92400e", fontSize: 13, fontWeight: 600 }}>
        ⚠️ If you think this is a mistake, please contact the restaurant.
      </div>
    </div>
  );

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
