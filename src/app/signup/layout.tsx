import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create your MenuQR account — QR code menus and live table orders in minutes.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
