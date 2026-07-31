import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import KitchenDisplay from "./KitchenDisplay";

export const metadata: Metadata = {
  title: "Kitchen Display",
  robots: { index: false, follow: false },
};

export default async function KitchenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!restaurant) redirect("/app");

  return <KitchenDisplay restaurant={restaurant} />;
}
