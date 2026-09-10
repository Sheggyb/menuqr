import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("auth.meta.loginTitle"),
    description: t("auth.meta.loginDescription"),
  };
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
