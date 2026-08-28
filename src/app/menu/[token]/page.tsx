import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import GuestMenuClient from "./GuestMenuClient";

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const supabase = createAdminClient();
  const { data: table } = await supabase
    .from("restaurant_tables")
    .select("restaurant:restaurants(name)")
    .eq("token", token)
    .single();
  const restaurant = table?.restaurant as { name?: string } | null;
  return {
    title: restaurant?.name ? `${restaurant.name} – Menu` : "Menu",
    robots: { index: false },
  };
}

export default async function GuestMenuPage({ params }: Props) {
  const { token } = await params;
  const supabase = createAdminClient();

  // Look up table
  const { data: table } = await supabase
    .from("restaurant_tables")
    .select("*, restaurant:restaurants(*)")
    .eq("token", token)
    .single();

  if (!table) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-body)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
      <div aria-hidden="true" style={{ color: "var(--text-muted)", marginBottom: 24 }}>
        <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.5-4.5" />
        </svg>
      </div>
      <h1 style={{ fontWeight: 700, fontSize: "var(--fs-xl)", marginBottom: 8, color: "var(--text)", fontFamily: "var(--font-display)" }}>Table not found</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-md)", maxWidth: 320, lineHeight: 1.6 }}>
        This QR code doesn&apos;t match any active table. Please ask a staff member for help or scan the QR code again.
      </p>
      <div style={{ marginTop: 24, padding: "10px 20px", borderRadius: "var(--radius-md)", background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: "var(--fs-sm)", fontWeight: 500 }}>
        If you think this is a mistake, please contact the restaurant.
      </div>
    </div>
  );

  // Load menu
  const [{ data: categories }, { data: items }, { data: optionRows }] = await Promise.all([
    supabase.from("menu_categories").select("*").eq("restaurant_id", table.restaurant_id).order("sort_order"),
    supabase.from("menu_items").select("*").eq("restaurant_id", table.restaurant_id).eq("is_available", true).order("sort_order"),
    supabase.from("menu_item_options").select("*, choices:menu_item_option_choices(*)").eq("restaurant_id", table.restaurant_id).order("sort_order"),
  ]);
  const options = (optionRows ?? []).map(o => ({
    ...o,
    choices: [...(o.choices ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  }));

  return (
    <GuestMenuClient
      table={table}
      restaurant={table.restaurant}
      categories={categories ?? []}
      items={items ?? []}
      options={options}
    />
  );
}
