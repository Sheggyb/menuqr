import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";

const inter = Inter({ subsets: ["latin"] });

// metadataBase resolves every relative OG/canonical URL. If NEXT_PUBLIC_SITE_URL
// is not set in the Vercel project, this used to fall straight through to
// localhost — so a shared link's preview image pointed at the visitor's own
// machine and rendered nothing. VERCEL_PROJECT_PRODUCTION_URL is the stable
// production domain (not the per-deployment one), so production is correct even
// if the explicit variable is missing.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MenuQR — QR code menus & live table orders",
    template: "%s · MenuQR",
  },
  description:
    "Give every table a QR code. Guests scan, browse your menu with EU allergen labelling, and order with a tap — orders arrive live on your dashboard and kitchen screen. Free to start.",
  openGraph: {
    siteName: "MenuQR",
    type: "website",
    locale: "en_US",
    title: "MenuQR — QR code menus & live table orders",
    description:
      "Give every table a QR code. Guests scan, browse your allergen-labelled menu, and order with a tap — orders arrive live on your dashboard.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MenuQR — QR code menus & live table orders",
    description:
      "QR menus with EU allergen labelling and live table ordering. Guests scan, browse and order with a tap.",
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
      <head>
        {/* Blocking theme script — stamps the saved/system theme class before
            first paint so dark-mode users never see a light flash (audit 2.4).
            Mirrors ThemeProvider's apply() logic. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("menuqr_theme")||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.add(d?"dark":"light");}catch(e){document.documentElement.classList.add("light");}})();`,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
