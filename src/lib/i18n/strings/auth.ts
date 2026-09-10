import type { Entry } from "..";

/** Login + signup pages (public, pre-login). */
export const auth = {
  // ── Login ──────────────────────────────────────────────────────────────
  "auth.login.subtitle": { en: "Welcome back! Log in to your account", sv: "Välkommen tillbaka! Logga in på ditt konto" },
  "auth.login.email": { en: "Email address", sv: "E-postadress" },
  "auth.login.password": { en: "Password", sv: "Lösenord" },
  "auth.login.rememberMe": { en: "Remember me", sv: "Kom ihåg mig" },
  "auth.login.submitting": { en: "Logging in…", sv: "Loggar in…" },
  "auth.login.submit": { en: "Log in →", sv: "Logga in →" },
  "auth.login.noAccount": { en: "No account yet?", sv: "Har du inget konto?" },

  // ── Signup ─────────────────────────────────────────────────────────────
  "auth.signup.subtitle": { en: "Create your account — takes a minute", sv: "Skapa ditt konto — tar en minut" },
  "auth.signup.fullName": { en: "Full name", sv: "Fullständigt namn" },
  "auth.signup.passwordHint": { en: "Min 6 characters", sv: "Minst 6 tecken" },
  "auth.signup.strengthWeak": { en: "Weak", sv: "Svagt" },
  "auth.signup.strengthFair": { en: "Fair", sv: "Okej" },
  "auth.signup.strengthGood": { en: "Good", sv: "Bra" },
  "auth.signup.strengthStrong": { en: "Strong", sv: "Starkt" },
  "auth.signup.submitting": { en: "Creating account…", sv: "Skapar konto…" },
  "auth.signup.submit": { en: "Create account →", sv: "Skapa konto →" },
  "auth.signup.agreeBefore": { en: "By creating an account you agree to our ", sv: "Genom att skapa ett konto godkänner du våra " },
  "auth.signup.agreeTerms": { en: "Terms", sv: "villkor" },
  "auth.signup.agreeAnd": { en: " and ", sv: " och vår " },
  "auth.signup.agreePrivacy": { en: "Privacy Policy", sv: "integritetspolicy" },
  "auth.signup.haveAccount": { en: "Already have an account?", sv: "Har du redan ett konto?" },
  "auth.signup.priceNote": { en: "No monthly fee • Pay only per paid order • Cancel anytime", sv: "Ingen månadsavgift • Betala bara per betald beställning • Avsluta när du vill" },

  // ── "Check your email" confirmation screen ──────────────────────────────
  "auth.confirm.title": { en: "Check your email", sv: "Kolla din e-post" },
  "auth.confirm.bodyBefore": { en: "We sent a confirmation link to ", sv: "Vi har skickat en bekräftelselänk till " },
  "auth.confirm.bodyAfter": { en: ". Click it to activate your account and get started.", sv: ". Klicka på den för att aktivera ditt konto och komma igång." },
  "auth.confirm.wrongAddress": { en: "Wrong address?", sv: "Fel adress?" },
  "auth.confirm.goBack": { en: "Go back", sv: "Tillbaka" },

  // ── Page metadata (browser tab / search results) ────────────────────────
  "auth.meta.loginTitle": { en: "Log in", sv: "Logga in" },
  "auth.meta.loginDescription": { en: "Log in to your MenuQR dashboard — QR code menus and live table orders.", sv: "Logga in på din MenuQR-dashboard — QR-menyer och live-beställningar vid bordet." },
  "auth.meta.signupTitle": { en: "Sign up", sv: "Skapa konto" },
  "auth.meta.signupDescription": { en: "Create your MenuQR account — QR code menus and live table orders in minutes.", sv: "Skapa ditt MenuQR-konto — QR-menyer och live-beställningar vid bordet på minuter." },
} as const satisfies Record<string, Entry>;
