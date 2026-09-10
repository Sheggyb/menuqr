import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("auth.meta.signupTitle"),
    description: t("auth.meta.signupDescription"),
  };
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
