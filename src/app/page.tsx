import Link from "next/link";
import {
  IconBolt, IconFork, IconUsers, IconChart, IconMoonStars, IconCurrency,
  IconCheck, IconAlert, IconQr, IconPhone, IconPrinter,
} from "@/components/icons";
import { getT } from "@/lib/i18n/server";
import type { TKey } from "@/lib/i18n";
import LangSwitcher from "@/components/LangSwitcher";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const features: { Icon: IconType; title: TKey; text: TKey }[] = [
  {
    Icon: IconAlert, title: "landing.features.allergens.title",
    text: "landing.features.allergens.text",
  },
  {
    Icon: IconBolt, title: "landing.features.orders.title",
    text: "landing.features.orders.text",
  },
  {
    Icon: IconFork, title: "landing.features.builder.title",
    text: "landing.features.builder.text",
  },
  {
    Icon: IconUsers, title: "landing.features.approve.title",
    text: "landing.features.approve.text",
  },
  {
    Icon: IconChart, title: "landing.features.stats.title",
    text: "landing.features.stats.text",
  },
  {
    Icon: IconCurrency, title: "landing.features.currency.title",
    text: "landing.features.currency.text",
  },
  {
    Icon: IconMoonStars, title: "landing.features.theme.title",
    text: "landing.features.theme.text",
  },
  {
    Icon: IconQr, title: "landing.features.qr.title",
    text: "landing.features.qr.text",
  },
];

const steps: { step: string; Icon: IconType; title: TKey; text: TKey }[] = [
  { step: "1", Icon: IconFork, title: "landing.how.step1.title", text: "landing.how.step1.text" },
  { step: "2", Icon: IconPrinter, title: "landing.how.step2.title", text: "landing.how.step2.text" },
  { step: "3", Icon: IconPhone, title: "landing.how.step3.title", text: "landing.how.step3.text" },
];

const faqs: { q: TKey; a: TKey }[] = [
  { q: "landing.faq.q1", a: "landing.faq.a1" },
  { q: "landing.faq.q2", a: "landing.faq.a2" },
  { q: "landing.faq.q3", a: "landing.faq.a3" },
  { q: "landing.faq.q4", a: "landing.faq.a4" },
  { q: "landing.faq.q5", a: "landing.faq.a5" },
  { q: "landing.faq.q6", a: "landing.faq.a6" },
  { q: "landing.faq.q7", a: "landing.faq.a7" },
  { q: "landing.faq.q8", a: "landing.faq.a8" },
];

const heroBullets: TKey[] = ["landing.hero.bullet1", "landing.hero.bullet2", "landing.hero.bullet3"];
const allergenBullets: TKey[] = [
  "landing.allergens.bullet1", "landing.allergens.bullet2",
  "landing.allergens.bullet3", "landing.allergens.bullet4",
];
const annexTwo: TKey[] = [
  "landing.allergens.list1", "landing.allergens.list2", "landing.allergens.list3", "landing.allergens.list4",
  "landing.allergens.list5", "landing.allergens.list6", "landing.allergens.list7", "landing.allergens.list8",
  "landing.allergens.list9", "landing.allergens.list10", "landing.allergens.list11", "landing.allergens.list12",
  "landing.allergens.list13", "landing.allergens.list14",
];
/** Demo dishes in the hero phone — illustrative, not customer data. */
const mockDishes: [TKey, string, TKey[]][] = [
  ["landing.mock.dish1", "129 kr", ["landing.mock.allergenMilk"]],
  ["landing.mock.dish2", "145 kr", ["landing.mock.allergenGluten", "landing.mock.allergenMilk"]],
  ["landing.mock.dish3", "139 kr", ["landing.mock.allergenGluten", "landing.mock.allergenSesame"]],
];
const planItems: TKey[] = [
  "landing.pricing.item1", "landing.pricing.item2", "landing.pricing.item3", "landing.pricing.item4",
  "landing.pricing.item5", "landing.pricing.item6", "landing.pricing.item7", "landing.pricing.item8",
];
const roadmapItems: TKey[] = [
  "landing.pricing.roadmap1", "landing.pricing.roadmap2", "landing.pricing.roadmap3",
  "landing.pricing.roadmap4", "landing.pricing.roadmap5", "landing.pricing.roadmap6",
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--accent)",
      textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10,
    }}>{children}</div>
  );
}

export default async function LandingPage() {
  const { t } = await getT();

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-body)" }}>
      <style>{`
        * { box-sizing: border-box; }

        /* Marketing type runs larger than the dashboard scale, which tops out at
           28px because it was built for dense UI. clamp() rather than new tokens:
           these headings have to shrink on a phone, which a fixed token cannot. */
        .lp-h1 { font-size: clamp(34px, 6vw, 54px); line-height: 1.06; letter-spacing: -1.4px; font-weight: 900; }
        .lp-h2 { font-size: clamp(26px, 4vw, 36px); line-height: 1.15; letter-spacing: -0.8px; font-weight: 800; }
        .lp-lead { font-size: clamp(16px, 2vw, 19px); line-height: 1.6; }

        .lp-section { padding: 88px 32px; }
        .lp-inner { max-width: 1060px; margin: 0 auto; }
        .lp-narrow { max-width: 760px; margin: 0 auto; }

        .btn-hero { display: inline-block; padding: 15px 34px; border-radius: var(--radius-lg); background: var(--accent); color: white; text-decoration: none; font-weight: 700; font-size: 17px; letter-spacing: -0.2px; transition: transform 0.12s ease, box-shadow 0.12s ease; }
        .btn-hero:hover { transform: translateY(-2px); box-shadow: 0 10px 28px color-mix(in srgb, var(--accent) 38%, transparent); }
        .btn-ghost { display: inline-block; padding: 15px 26px; border-radius: var(--radius-lg); border: 1px solid var(--border); background: var(--surface); color: var(--text); text-decoration: none; font-weight: 600; font-size: 16px; transition: border-color 0.12s ease, transform 0.12s ease; }
        .btn-ghost:hover { border-color: var(--accent); transform: translateY(-2px); }
        .btn-hero:focus-visible, .btn-ghost:focus-visible, .nav-link:focus-visible, .footer-link:focus-visible { outline: 3px solid color-mix(in srgb, var(--accent) 42%, transparent); outline-offset: 3px; }

        .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 26px 24px; transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease; }
        .card:hover { box-shadow: var(--shadow-float); transform: translateY(-3px); border-color: color-mix(in srgb, var(--accent) 30%, var(--border)); }
        /* Cards sitting on a tinted section need the opposite ground to stay distinct */
        .card-on-surface { background: var(--bg); }

        .icon-tile { width: 42px; height: 42px; border-radius: var(--radius-lg); background: var(--accent-soft); color: var(--accent); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }

        .grid-auto { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }

        .faq-item { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 18px 22px; transition: border-color 0.15s ease; }
        .faq-item[open] { border-color: color-mix(in srgb, var(--accent) 35%, var(--border)); }
        .faq-item summary { cursor: pointer; font-weight: 650; font-size: var(--fs-md); color: var(--text); list-style: none; display: flex; justify-content: space-between; align-items: center; gap: 14px; }
        .faq-item summary::-webkit-details-marker { display: none; }
        .faq-item summary::after { content: "+"; font-size: 22px; line-height: 1; color: var(--accent); flex-shrink: 0; font-weight: 400; }
        .faq-item[open] summary::after { content: "\\2212"; }

        .nav-link { color: var(--text-muted); text-decoration: none; font-size: var(--fs-sm); font-weight: 600; }
        .nav-link:hover { color: var(--text); }
        .footer-link { color: var(--text-muted); text-decoration: none; font-size: var(--fs-sm); }
        .footer-link:hover { color: var(--accent); }

        /* Soft accent bloom behind the device so it isn't floating on flat paper */
        .hero-glow { position: relative; }
        .hero-glow::before {
          content: ""; position: absolute; inset: -12% -8% -6%;
          background: radial-gradient(60% 55% at 50% 42%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%);
          filter: blur(8px); pointer-events: none; z-index: 0;
        }
        .hero-glow > * { position: relative; z-index: 1; }

        /* The staff-side card overlapping the phone. Hidden on narrow screens,
           where it would land on top of the menu it is meant to sit beside. */
        .order-pop { position: absolute; right: -26px; bottom: 44px; width: 216px; background: var(--surface); border: 1px solid var(--border); border-left: 3px solid var(--success); border-radius: var(--radius-lg); padding: 12px 14px; box-shadow: var(--shadow-float); }
        @media (max-width: 900px) { .order-pop { display: none; } }
        @media (max-width: 720px) {
          .lp-section { padding: 64px 20px; }
          .nav-links { display: none !important; }
        }
      `}</style>

      {/* ─── NAV ─────────────────────────────────────────── */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 32px", background: "color-mix(in srgb, var(--surface) 88%, transparent)",
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 100,
      }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: "var(--fs-xl)", color: "var(--accent)", letterSpacing: "-0.5px", textDecoration: "none" }}>MenuQR</Link>

        {/* In-page nav. This is a long page and the header previously offered no
            way down it except scrolling. */}
        <div className="nav-links" style={{ display: "flex", gap: 26, alignItems: "center" }}>
          <a href="#how" className="nav-link">{t("landing.nav.how")}</a>
          <a href="#allergens" className="nav-link">{t("landing.nav.allergens")}</a>
          <a href="#features" className="nav-link">{t("landing.nav.features")}</a>
          <a href="#pricing" className="nav-link">{t("landing.nav.pricing")}</a>
          <a href="#faq" className="nav-link">{t("landing.nav.faq")}</a>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <LangSwitcher compact />
          <Link href="/login" style={{ padding: "9px 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", color: "var(--text)", textDecoration: "none", fontWeight: 600, fontSize: "var(--fs-sm)" }}>{t("landing.nav.login")}</Link>
          <Link href="/signup" style={{ padding: "9px 18px", borderRadius: "var(--radius-md)", background: "var(--accent)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: "var(--fs-sm)" }}>{t("landing.nav.getStarted")}</Link>
        </div>
      </nav>

      {/* ─── HERO ────────────────────────────────────────── */}
      <section style={{ padding: "84px 32px 92px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", display: "flex", gap: 64, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
          <div style={{ flex: "1 1 400px", maxWidth: 560 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 22,
              background: "var(--accent-soft)", border: "1px solid var(--accent-border)",
              color: "var(--accent)", borderRadius: "var(--radius-pill)",
              padding: "5px 14px", fontSize: "var(--fs-xs)", fontWeight: 700,
            }}>
              <IconAlert width={13} height={13} /> {t("landing.hero.badge")}
            </div>

            <h1 className="lp-h1" style={{ marginTop: 0, marginBottom: 20, color: "var(--text)" }}>
              {t("landing.hero.titleBefore")}<span style={{ color: "var(--accent)" }}>{t("landing.hero.titleAccent")}</span>{t("landing.hero.titleAfter")}
            </h1>

            <p className="lp-lead" style={{ color: "var(--text-muted)", margin: "0 0 34px", maxWidth: 500 }}>
              {t("landing.hero.lead")}
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/signup" className="btn-hero">{t("landing.hero.ctaPrimary")}</Link>
              <Link href="#how" className="btn-ghost">{t("landing.hero.ctaSecondary")}</Link>
            </div>

            <div style={{ marginTop: 20, display: "flex", gap: 18, flexWrap: "wrap", fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
              {heroBullets.map(k => (
                <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <IconCheck width={14} height={14} style={{ color: "var(--success)" }} /> {t(k)}
                </span>
              ))}
            </div>
          </div>

          {/* The device — guest side, with the staff side overlapping it. The
              product is both halves and the page only ever showed one. */}
          <div className="hero-glow" style={{ flex: "0 0 auto", position: "relative" }}>
            <div aria-hidden="true" style={{ width: 268, borderRadius: 38, border: "1px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-float)", padding: 12 }}>
              <div style={{ borderRadius: 28, overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg)" }}>
                <div style={{ background: "var(--accent)", padding: "18px 16px 14px" }}>
                  <div style={{ color: "white", fontWeight: 800, fontSize: "var(--fs-md)" }}>Café Solsken</div>
                  <div style={{ color: "rgba(255,255,255,0.82)", fontSize: "var(--fs-xs)", marginTop: 2 }}>{t("landing.mock.tableMenu")}</div>
                </div>

                <div style={{ display: "flex", gap: 6, padding: "10px 12px 6px" }}>
                  <span style={{ background: "var(--accent)", color: "white", borderRadius: "var(--radius-pill)", fontSize: "var(--fs-xs)", fontWeight: 700, padding: "4px 10px" }}>{t("landing.mock.mains")}</span>
                  <span style={{ background: "var(--surface-2)", color: "var(--text-muted)", borderRadius: "var(--radius-pill)", fontSize: "var(--fs-xs)", fontWeight: 600, padding: "4px 10px" }}>{t("landing.mock.drinks")}</span>
                  <span style={{ background: "var(--surface-2)", color: "var(--text-muted)", borderRadius: "var(--radius-pill)", fontSize: "var(--fs-xs)", fontWeight: 600, padding: "4px 10px" }}>{t("landing.mock.desserts")}</span>
                </div>

                {mockDishes.map(([nameKey, price, tagKeys]) => (
                  <div key={nameKey} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, margin: "8px 12px 0", padding: "10px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--text)" }}>{t(nameKey)}</div>
                      <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                        {tagKeys.map(tk => (
                          <span key={tk} style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--warning)", background: "var(--warning-soft)", border: "1px solid var(--warning-border)", borderRadius: "var(--radius-sm)", padding: "1px 5px" }}>{t(tk)}</span>
                        ))}
                      </div>
                      <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--accent)", marginTop: 5 }}>{price}</div>
                    </div>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--accent)", color: "white", fontSize: "var(--fs-sm)", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>+</div>
                  </div>
                ))}

                <div style={{ padding: "14px 12px 16px" }}>
                  <div style={{ background: "var(--accent)", color: "white", textAlign: "center", borderRadius: "var(--radius-pill)", padding: "9px 0", fontSize: "var(--fs-xs)", fontWeight: 700 }}>{t("landing.mock.viewOrder")}</div>
                </div>
              </div>
            </div>

            <div aria-hidden="true" className="order-pop">
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--success)", flexShrink: 0 }} />
                <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--success)" }}>{t("landing.mock.newOrder")}</span>
                <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>{t("landing.mock.table")}</span>
              </div>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--text)", fontWeight: 700, lineHeight: 1.5 }}>
                {t("landing.mock.orderLine")}
              </div>
              <div style={{ marginTop: 5, display: "inline-block", fontSize: 9, fontWeight: 800, letterSpacing: "0.04em", color: "var(--danger)", background: "var(--danger-soft)", borderRadius: "var(--radius-sm)", padding: "2px 6px" }}>
                {t("landing.mock.noOnion")}
              </div>
              <div style={{ marginTop: 9, fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--text)" }}>258 kr</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────── */}
      <section id="how" className="lp-section" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="lp-inner">
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <Eyebrow>{t("landing.how.eyebrow")}</Eyebrow>
            <h2 className="lp-h2" style={{ margin: "0 0 10px", color: "var(--text)" }}>{t("landing.how.title")}</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-md)", margin: 0 }}>{t("landing.how.sub")}</p>
          </div>
          <div className="grid-auto">
            {steps.map(({ step, Icon, title, text }) => (
              <div key={title} className="card card-on-surface">
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div className="icon-tile" style={{ marginBottom: 0, width: 38, height: 38 }}><Icon width={19} height={19} /></div>
                  <span style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.1em" }}>{t("landing.how.step", { n: step })}</span>
                </div>
                <h3 style={{ fontWeight: 700, margin: "0 0 7px", fontSize: "var(--fs-lg)", color: "var(--text)" }}>{t(title)}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-md)", lineHeight: 1.6, margin: 0 }}>{t(text)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ALLERGENS ───────────────────────────────────── */}
      <section id="allergens" className="lp-section">
        <div className="lp-inner" style={{ display: "flex", gap: 52, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 380px" }}>
            <Eyebrow>{t("landing.allergens.eyebrow")}</Eyebrow>
            <h2 className="lp-h2" style={{ margin: "0 0 16px", color: "var(--text)" }}>{t("landing.allergens.title")}</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-md)", lineHeight: 1.7, margin: "0 0 18px" }}>
              {t("landing.allergens.p1")}
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-md)", lineHeight: 1.7, margin: "0 0 22px" }}>
              {t("landing.allergens.p2")}
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 26px", display: "flex", flexDirection: "column", gap: 11 }}>
              {allergenBullets.map(k => (
                <li key={k} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: "var(--fs-md)", color: "var(--text)", lineHeight: 1.55 }}>
                  <IconCheck width={16} height={16} style={{ color: "var(--success)", flexShrink: 0, marginTop: 3 }} /> {t(k)}
                </li>
              ))}
            </ul>
            <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", margin: 0, fontStyle: "italic" }}>
              {t("landing.allergens.disclaimer")}
            </p>
          </div>

          <div aria-hidden="true" style={{ flex: "1 1 300px", maxWidth: 400 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: 24, boxShadow: "var(--shadow-card)" }}>
              <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--text-muted)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.09em" }}>
                {t("landing.allergens.cardHead")}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {annexTwo.map(k => (
                  <span key={k} style={{
                    fontSize: "var(--fs-xs)", fontWeight: 600, padding: "6px 12px",
                    borderRadius: "var(--radius-pill)", background: "var(--surface-2)",
                    border: "1px solid var(--border)", color: "var(--text)",
                  }}>{t(k)}</span>
                ))}
              </div>
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 9 }}>
                <IconAlert width={16} height={16} style={{ color: "var(--warning)", flexShrink: 0 }} />
                <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", lineHeight: 1.5 }}>
                  {t("landing.allergens.requiredByLaw")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────────── */}
      <section id="features" className="lp-section" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="lp-inner">
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <Eyebrow>{t("landing.features.eyebrow")}</Eyebrow>
            <h2 className="lp-h2" style={{ margin: 0, color: "var(--text)" }}>{t("landing.features.title")}</h2>
          </div>
          <div className="grid-auto">
            {features.map(({ Icon, title, text }) => (
              <div key={title} className="card card-on-surface">
                <div className="icon-tile"><Icon width={21} height={21} /></div>
                <h3 style={{ fontWeight: 700, margin: "0 0 7px", fontSize: "var(--fs-md)", color: "var(--text)" }}>{t(title)}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)", lineHeight: 1.6, margin: 0 }}>{t(text)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─────────────────────────────────────── */}
      <section id="pricing" className="lp-section">
        <div className="lp-narrow">
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <Eyebrow>{t("landing.pricing.eyebrow")}</Eyebrow>
            <h2 className="lp-h2" style={{ margin: "0 0 10px", color: "var(--text)" }}>{t("landing.pricing.title")}</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-md)", margin: 0 }}>{t("landing.pricing.sub")}</p>
          </div>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center", alignItems: "flex-start" }}>
            <div style={{ flex: "1 1 300px", position: "relative", background: "var(--surface)", border: "2px solid var(--accent)", borderRadius: "var(--radius-xl)", padding: "30px 26px", boxShadow: "0 8px 34px color-mix(in srgb, var(--accent) 15%, transparent)" }}>
              <div style={{ position: "absolute", top: -12, left: 26, background: "var(--accent)", color: "white", fontSize: "var(--fs-xs)", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", padding: "4px 12px", borderRadius: "var(--radius-pill)" }}>
                {t("landing.pricing.availableNow")}
              </div>
              <div style={{ fontWeight: 800, fontSize: "var(--fs-lg)", color: "var(--text)", marginBottom: 6 }}>{t("landing.pricing.planName")}</div>
              <div style={{ fontSize: 38, fontWeight: 900, color: "var(--accent)", lineHeight: 1.1 }}>{t("landing.pricing.planPrice")}</div>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", marginBottom: 22 }}>{t("landing.pricing.planNote")}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 26px", display: "flex", flexDirection: "column", gap: 11 }}>
                {planItems.map((k) => (
                  <li key={k} style={{ fontSize: "var(--fs-md)", color: "var(--text)", display: "flex", gap: 9, alignItems: "flex-start", lineHeight: 1.5 }}>
                    <IconCheck width={16} height={16} style={{ color: "var(--success)", flexShrink: 0, marginTop: 3 }} /> {t(k)}
                  </li>
                ))}
              </ul>
              <Link href="/signup" style={{ display: "block", textAlign: "center", padding: "13px", borderRadius: "var(--radius-md)", background: "var(--accent)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: "var(--fs-md)" }}>{t("landing.pricing.cta")}</Link>
            </div>

            <div style={{ flex: "1 1 280px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: "30px 26px" }}>
              <div style={{ fontWeight: 800, fontSize: "var(--fs-lg)", color: "var(--text)", marginBottom: 6 }}>{t("landing.pricing.roadmapName")}</div>
              <div style={{ fontSize: "var(--fs-xl)", fontWeight: 900, color: "var(--text)", lineHeight: 1.1 }}>{t("landing.pricing.roadmapPrice")}</div>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", marginBottom: 22 }}>{t("landing.pricing.roadmapNote")}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 11 }}>
                {roadmapItems.map((k) => (
                  <li key={k} style={{ fontSize: "var(--fs-md)", color: "var(--text-muted)", display: "flex", gap: 9, alignItems: "flex-start", lineHeight: 1.5 }}>
                    <span aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>•</span> {t(k)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────── */}
      <section id="faq" className="lp-section" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="lp-narrow">
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <Eyebrow>{t("landing.faq.eyebrow")}</Eyebrow>
            <h2 className="lp-h2" style={{ margin: 0, color: "var(--text)" }}>{t("landing.faq.title")}</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {faqs.map((f) => (
              <details key={f.q} className="faq-item">
                <summary>{t(f.q)}</summary>
                <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-md)", lineHeight: 1.65, margin: "14px 0 0" }}>{t(f.a)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────── */}
      <section style={{ background: "var(--accent)", padding: "84px 32px", textAlign: "center" }}>
        <h2 className="lp-h2" style={{ color: "white", marginTop: 0, marginBottom: 14 }}>{t("landing.cta.title")}</h2>
        <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "var(--fs-lg)", margin: "0 auto 34px", maxWidth: 460, lineHeight: 1.6 }}>
          {t("landing.cta.text")}
        </p>
        <Link href="/signup" style={{ display: "inline-block", padding: "17px 44px", borderRadius: "var(--radius-lg)", background: "white", color: "var(--accent)", textDecoration: "none", fontWeight: 800, fontSize: 18, boxShadow: "0 8px 30px rgba(0,0,0,0.18)" }}>
          {t("landing.cta.button")}
        </Link>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--border)", background: "var(--surface)", padding: "56px 32px 32px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 36 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: "var(--fs-lg)", color: "var(--accent)", marginBottom: 10 }}>MenuQR</div>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)", lineHeight: 1.65, margin: 0, maxWidth: 240 }}>
              {t("landing.footer.tagline")}
            </p>
          </div>
          {([
            { id: "product", head: "landing.footer.product", links: [["landing.nav.how", "/#how"], ["landing.nav.allergens", "/#allergens"], ["landing.nav.features", "/#features"], ["landing.nav.pricing", "/#pricing"], ["landing.nav.faq", "/#faq"]] },
            { id: "account", head: "landing.footer.account", links: [["landing.nav.login", "/login"], ["landing.footer.signup", "/signup"]] },
            { id: "legal", head: "landing.footer.legal", links: [["landing.footer.privacy", "/privacy"], ["landing.footer.terms", "/terms"]] },
          ] as { id: string; head: TKey; links: [TKey, string][] }[]).map(({ id, head, links }) => (
            <div key={id}>
              <div style={{ fontWeight: 700, fontSize: "var(--fs-sm)", color: "var(--text)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t(head)}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {links.map(([label, href]) => (
                  <Link key={label} href={href} className="footer-link">{t(label)}</Link>
                ))}
                {id === "legal" && <a href="mailto:hello@menuqr.app" className="footer-link">hello@menuqr.app</a>}
              </div>
            </div>
          ))}
        </div>
        <p style={{ maxWidth: 1060, margin: "36px auto 0", paddingTop: 20, borderTop: "1px solid var(--border)", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
          {t("landing.footer.copyright", { year: new Date().getFullYear() })}
        </p>
      </footer>
    </main>
  );
}
