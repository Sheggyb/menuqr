import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your MenuQR account to manage your menu and live orders.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
