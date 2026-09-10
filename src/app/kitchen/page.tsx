import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import KitchenDisplay from "./KitchenDisplay";
import { ToastProvider } from "@/components/Toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("kitchen.meta.title"),
    robots: { index: false, follow: false },
  };
}

export default async function KitchenPage() {
  const supabase = await createClient();
  const { t } = await getT();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!restaurant) redirect("/app");

  // ToastProvider + ErrorBoundary so failed actions surface instead of
  // silently reloading (audit 3.4 — kitchen had neither)
  return (
    <ErrorBoundary fallbackTitle={t("kitchen.error.title")}>
      <ToastProvider>
        <KitchenDisplay restaurant={restaurant} />
      </ToastProvider>
    </ErrorBoundary>
  );
}
