import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MenuQR — QR code menus & live table orders",
    template: "%s · MenuQR",
  },
  description:
    "Give every table a QR code. Guests scan, browse your menu, and order with a tap — orders arrive live on your dashboard. Free to start.",
  openGraph: {
    siteName: "MenuQR",
    type: "website",
    locale: "en_US",
    title: "MenuQR — QR code menus & live table orders",
    description:
      "Give every table a QR code. Guests scan, browse your menu, and order with a tap — orders arrive live on your dashboard.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MenuQR — QR code menus & live table orders",
    description:
      "Give every table a QR code. Guests scan, browse your menu, and order with a tap.",
  },
  icons: {
    icon: "/favicon.svg",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#E85D2F",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
