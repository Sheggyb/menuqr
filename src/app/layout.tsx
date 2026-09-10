import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { I18nProvider } from "@/lib/i18n/client";
import { getLocale, getT } from "@/lib/i18n/server";

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

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getT();
  const title = t("meta.title");
  const description = t("meta.description");
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: "%s · MenuQR",
    },
    description,
    openGraph: {
      siteName: "MenuQR",
      type: "website",
      locale: locale === "sv" ? "sv_SE" : "en_US",
      title,
      description: t("meta.ogDescription"),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: t("meta.twitterDescription"),
    },
    icons: {
      icon: "/favicon.svg",
    },
    manifest: "/manifest.json",
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#E85D2F",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Locale comes from the cookie (set by LangSwitcher) with the browser's
  // Accept-Language as the fallback, so the server renders the right language
  // on first paint — no English flash before the client takes over.
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <head>
        {/* Blocking theme script — stamps the saved/system theme class before
            first paint so dark-mode users never see a light flash (audit 2.4),
            and so the public pages can open light regardless of the OS setting.
            Mirrors ThemeProvider's apply() logic: an explicit choice always wins;
            with no choice, public pages open light and the app opens system. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem("menuqr_theme");var p=location.pathname;var pub=!(p.indexOf("/app")===0||p.indexOf("/kitchen")===0||p.indexOf("/menu")===0);var t=s||(pub?"light":"system");var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.add(d?"dark":"light");}catch(e){document.documentElement.classList.add("light");}})();`,
          }}
        />
      </head>
      <body className={inter.className}>
        <I18nProvider initialLocale={locale}>
          <ThemeProvider>{children}</ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
