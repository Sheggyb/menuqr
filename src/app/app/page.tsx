import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppShell from "./AppShell";

export default async function AppPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  return <AppShell user={user} restaurant={restaurant} />;
}
