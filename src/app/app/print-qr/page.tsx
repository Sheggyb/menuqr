import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PrintQRClient from "./PrintQRClient";

export default async function PrintQRPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!restaurant) redirect("/app");

  const { data: tables } = await supabase
    .from("restaurant_tables")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .order("name");

  return <PrintQRClient tables={tables ?? []} restaurantName={restaurant.name} />;
}
