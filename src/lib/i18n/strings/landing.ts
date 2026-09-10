import type { Entry } from "..";

/** Landing page (public marketing page). */
export const landing = {
  // ── Nav ────────────────────────────────────────────────────────────────
  "landing.nav.how": { en: "How it works", sv: "Så funkar det" },
  "landing.nav.allergens": { en: "Allergens", sv: "Allergener" },
  "landing.nav.features": { en: "Features", sv: "Funktioner" },
  "landing.nav.pricing": { en: "Pricing", sv: "Priser" },
  "landing.nav.faq": { en: "FAQ", sv: "Frågor" },
  "landing.nav.login": { en: "Log in", sv: "Logga in" },
  "landing.nav.getStarted": { en: "Get started", sv: "Kom igång" },

  // ── Hero ───────────────────────────────────────────────────────────────
  "landing.hero.badge": { en: "Allergen-ready for EU 1169/2011", sv: "Allergenredo enligt EU 1169/2011" },
  "landing.hero.titleBefore": { en: "Digital menus & ", sv: "Digitala menyer & " },
  "landing.hero.titleAccent": { en: "live table ordering", sv: "beställning vid bordet" },
  "landing.hero.titleAfter": { en: " for your restaurant", sv: " för din restaurang" },
  "landing.hero.lead": {
    en: "Guests scan a QR code at their table, browse your menu — allergens and all — and tap to order. No download, no login, no friction.",
    sv: "Gästerna skannar QR-koden vid bordet, bläddrar i menyn — allergener och allt — och beställer med ett tryck. Ingen app, inget konto, inget krångel.",
  },
  "landing.hero.ctaPrimary": { en: "Get started", sv: "Kom igång" },
  "landing.hero.ctaSecondary": { en: "See how it works", sv: "Se hur det funkar" },
  "landing.hero.bullet1": { en: "No app for guests", sv: "Ingen app för gästerna" },
  "landing.hero.bullet2": { en: "Order & pay from the phone", sv: "Beställ och betala från mobilen" },
  "landing.hero.bullet3": { en: "Set up in one evening", sv: "Igång samma kväll" },

  // Demo phone in the hero (illustrative content, not customer data)
  "landing.mock.tableMenu": { en: "Table 4 · Menu", sv: "Bord 4 · Meny" },
  "landing.mock.mains": { en: "Mains", sv: "Huvudrätter" },
  "landing.mock.drinks": { en: "Drinks", sv: "Drycker" },
  "landing.mock.desserts": { en: "Desserts", sv: "Efterrätter" },
  "landing.mock.dish1": { en: "Grilled halloumi bowl", sv: "Grillad halloumi-bowl" },
  "landing.mock.dish2": { en: "Pasta al limone", sv: "Pasta al limone" },
  "landing.mock.dish3": { en: "Smash burger & fries", sv: "Smashburgare med pommes" },
  "landing.mock.allergenMilk": { en: "Milk", sv: "Mjölk" },
  "landing.mock.allergenGluten": { en: "Gluten", sv: "Gluten" },
  "landing.mock.allergenSesame": { en: "Sesame", sv: "Sesam" },
  "landing.mock.viewOrder": { en: "View Order · 2 items", sv: "Visa beställning · 2 varor" },
  "landing.mock.newOrder": { en: "New order", sv: "Ny beställning" },
  "landing.mock.table": { en: "Table 4", sv: "Bord 4" },
  "landing.mock.orderLine": { en: "2× Grilled halloumi bowl", sv: "2× Grillad halloumi-bowl" },
  "landing.mock.noOnion": { en: "NO ONION", sv: "UTAN LÖK" },

  // ── How it works ───────────────────────────────────────────────────────
  "landing.how.eyebrow": { en: "Getting started", sv: "Kom igång" },
  "landing.how.title": { en: "Live in an evening", sv: "Igång samma kväll" },
  "landing.how.sub": { en: "No hardware. No integration. No setup call.", sv: "Ingen hårdvara. Ingen integration. Inget uppstartssamtal." },
  "landing.how.step": { en: "STEP {n}", sv: "STEG {n}" },
  "landing.how.step1.title": { en: "Build your menu", sv: "Bygg din meny" },
  "landing.how.step1.text": {
    en: "Add your restaurant, then your categories, dishes, prices and allergens. No setup call, no onboarding fee.",
    sv: "Lägg in din restaurang, sedan kategorier, rätter, priser och allergener. Inget uppstartssamtal, ingen startavgift.",
  },
  "landing.how.step2.title": { en: "Print your QR codes", sv: "Skriv ut dina QR-koder" },
  "landing.how.step2.text": {
    en: "Every table gets its own code. Print the sheet in one click and put them on the tables.",
    sv: "Varje bord får sin egen kod. Skriv ut arket med ett klick och sätt dem på borden.",
  },
  "landing.how.step3.title": { en: "Take orders live", sv: "Ta emot beställningar live" },
  "landing.how.step3.text": {
    en: "Guests scan, browse and order from their own phone. Orders land on your dashboard and kitchen screen in real time.",
    sv: "Gästerna skannar, bläddrar och beställer från sin egen mobil. Beställningarna landar på din dashboard och köksskärm i realtid.",
  },

  // ── Allergens ──────────────────────────────────────────────────────────
  "landing.allergens.eyebrow": { en: "The part nobody else does properly", sv: "Delen ingen annan gör ordentligt" },
  "landing.allergens.title": { en: "Allergens, handled", sv: "Allergener, ordentligt hanterade" },
  "landing.allergens.p1": {
    en: "Since 2014, EU Regulation 1169/2011 has required allergen information for non-prepacked food — restaurants, cafés, takeaways and food trucks included. It has to be available at the point the guest chooses.",
    sv: "Sedan 2014 kräver EU-förordning 1169/2011 allergeninformation för oförpackad mat — restauranger, kaféer, take away och food trucks inräknade. Informationen måste finnas där gästen väljer.",
  },
  "landing.allergens.p2": {
    en: "A paper menu can't do that well. MenuQR can: tag each dish from the fixed list of 14 Annex II allergens, and every guest sees them on the card before they order — or filters the menu down to what is safe for them.",
    sv: "En pappersmeny klarar inte det bra. MenuQR gör det: märk varje rätt från den fasta listan med 14 allergener i bilaga II, och varje gäst ser dem på kortet innan de beställer — eller filtrerar menyn till det som är säkert för dem.",
  },
  "landing.allergens.bullet1": { en: "A fixed picker, not free text — consistent across your whole menu", sv: "En fast väljare, inte fritext — konsekvent i hela menyn" },
  "landing.allergens.bullet2": { en: "Shown on the item card, not buried in a sub-page", sv: "Visas på rättens kort, inte gömd i en undersida" },
  "landing.allergens.bullet3": { en: "Guests filter the menu to hide anything with milk, gluten, nuts…", sv: "Gäster filtrerar menyn för att dölja allt med mjölk, gluten, nötter…" },
  "landing.allergens.bullet4": { en: "Ingredient-level control: a guest can remove the onion themselves", sv: "Kontroll på ingrediensnivå: gästen kan ta bort löken själv" },
  "landing.allergens.disclaimer": {
    en: "MenuQR gives you the tools to publish allergen information. Confirming that what you publish is correct stays with you.",
    sv: "MenuQR ger dig verktygen för att publicera allergeninformation. Att det du publicerar är korrekt är fortfarande ditt ansvar.",
  },
  "landing.allergens.cardHead": { en: "Annex II · the 14", sv: "Bilaga II · de 14" },
  "landing.allergens.requiredByLaw": { en: "Required by law since December 2014", sv: "Krav enligt lag sedan december 2014" },
  "landing.allergens.list1": { en: "Gluten", sv: "Gluten" },
  "landing.allergens.list2": { en: "Crustaceans", sv: "Kräftdjur" },
  "landing.allergens.list3": { en: "Eggs", sv: "Ägg" },
  "landing.allergens.list4": { en: "Fish", sv: "Fisk" },
  "landing.allergens.list5": { en: "Peanuts", sv: "Jordnötter" },
  "landing.allergens.list6": { en: "Soybeans", sv: "Soja" },
  "landing.allergens.list7": { en: "Milk", sv: "Mjölk" },
  "landing.allergens.list8": { en: "Tree nuts", sv: "Nötter" },
  "landing.allergens.list9": { en: "Celery", sv: "Selleri" },
  "landing.allergens.list10": { en: "Mustard", sv: "Senap" },
  "landing.allergens.list11": { en: "Sesame", sv: "Sesam" },
  "landing.allergens.list12": { en: "Sulphites", sv: "Sulfiter" },
  "landing.allergens.list13": { en: "Lupin", sv: "Lupin" },
  "landing.allergens.list14": { en: "Molluscs", sv: "Blötdjur" },

  // ── Features ───────────────────────────────────────────────────────────
  "landing.features.eyebrow": { en: "Features", sv: "Funktioner" },
  "landing.features.title": { en: "Everything you need, nothing you don't", sv: "Allt du behöver, inget du inte behöver" },
  "landing.features.allergens.title": { en: "EU allergen declarations", sv: "EU-allergener" },
  "landing.features.allergens.text": {
    en: "Tag the 14 Annex II allergens per dish from a fixed list. Guests see them while choosing, and can hide every dish containing one.",
    sv: "Märk varje rätt med de 14 allergenerna från bilaga II via en fast lista. Gästerna ser dem medan de väljer och kan dölja alla rätter som innehåller en allergen.",
  },
  "landing.features.orders.title": { en: "Live orders", sv: "Live-beställningar" },
  "landing.features.orders.text": {
    en: "Guest requests appear on your dashboard the moment they tap — no refresh, no delay, with a separate kitchen screen.",
    sv: "Gästernas beställningar dyker upp på din dashboard i samma stund de trycker — ingen uppdatering, ingen fördröjning, med en egen köksskärm.",
  },
  "landing.features.builder.title": { en: "Menu builder", sv: "Menyredigerare" },
  "landing.features.builder.text": {
    en: "Categories, items, prices, option groups and per-ingredient choices. Edit anything and guests see it instantly.",
    sv: "Kategorier, rätter, priser, valgrupper och ingrediensval. Ändra vad som helst och gästerna ser det direkt.",
  },
  "landing.features.approve.title": { en: "Approve who can order", sv: "Godkänn vem som får beställa" },
  "landing.features.approve.text": {
    en: "Guests request access when they scan. You approve each one, so only people actually at the table reach your kitchen.",
    sv: "Gästerna begär åtkomst när de skannar. Du godkänner var och en, så bara personer som faktiskt sitter vid bordet når ditt kök.",
  },
  "landing.features.stats.title": { en: "Analytics", sv: "Statistik" },
  "landing.features.stats.text": {
    en: "Revenue, daily trends, completion rates and request types — plus a searchable history of everything ordered.",
    sv: "Intäkter, dagliga trender, andel avslutade och typer av förfrågningar — plus en sökbar historik över allt som beställts.",
  },
  "landing.features.currency.title": { en: "Ten currencies", sv: "Tio valutor" },
  "landing.features.currency.text": {
    en: "Prices format the way your guests expect them — 89,50 kr in Sweden, 89,50 € in Berlin, $89.50 in New York.",
    sv: "Priser formateras som gästerna förväntar sig — 89,50 kr i Sverige, 89,50 € i Berlin, $89.50 i New York.",
  },
  "landing.features.theme.title": { en: "Light and dark", sv: "Ljust och mörkt" },
  "landing.features.theme.text": {
    en: "The dashboard, kitchen screen and guest menu all follow the device theme automatically.",
    sv: "Dashboard, köksskärm och gästmeny följer enhetens tema automatiskt.",
  },
  "landing.features.qr.title": { en: "QR codes per table", sv: "QR-koder per bord" },
  "landing.features.qr.text": {
    en: "Every table gets its own code, printable in one click. Rotate a code any time without losing that table's history.",
    sv: "Varje bord får sin egen kod, utskriftsklar med ett klick. Byt kod när som helst utan att förlora bordets historik.",
  },

  // ── Pricing ────────────────────────────────────────────────────────────
  "landing.pricing.eyebrow": { en: "Pricing", sv: "Priser" },
  "landing.pricing.title": { en: "Simple pricing", sv: "Enkel prissättning" },
  "landing.pricing.sub": { en: "No monthly fee. You pay a small fee per order your guests pay for.", sv: "Ingen månadsavgift. Du betalar en liten avgift per beställning dina gäster betalar för." },
  "landing.pricing.availableNow": { en: "Available now", sv: "Tillgängligt nu" },
  "landing.pricing.planName": { en: "Pay as you go", sv: "Betala när du använder" },
  "landing.pricing.planPrice": { en: "No monthly fee", sv: "Ingen månadsavgift" },
  "landing.pricing.planNote": { en: "you pay only when your guests pay", sv: "du betalar bara när dina gäster betalar" },
  "landing.pricing.item1": { en: "Your restaurant, your branding", sv: "Din restaurang, din profil" },
  "landing.pricing.item2": { en: "Unlimited tables & QR codes", sv: "Obegränsat med bord och QR-koder" },
  "landing.pricing.item3": { en: "Unlimited menu items", sv: "Obegränsat med rätter" },
  "landing.pricing.item4": { en: "EU allergen tagging & filtering", sv: "EU-allergenmärkning och filtrering" },
  "landing.pricing.item5": { en: "Live orders + kitchen screen", sv: "Live-beställningar + köksskärm" },
  "landing.pricing.item6": { en: "Card & Swish payments at the table", sv: "Kort- och Swishbetalning vid bordet" },
  "landing.pricing.item7": { en: "Revenue, stats & order history", sv: "Intäkter, statistik och orderhistorik" },
  "landing.pricing.item8": { en: "Light/dark and ten currencies", sv: "Ljust/mörkt och tio valutor" },
  "landing.pricing.cta": { en: "Get started", sv: "Kom igång" },
  "landing.pricing.roadmapName": { en: "Grows with you", sv: "Växer med dig" },
  "landing.pricing.roadmapPrice": { en: "On the roadmap", sv: "På roadmapen" },
  "landing.pricing.roadmapNote": { en: "asked for by restaurants, built next", sv: "efterfrågat av restauranger, byggs härnäst" },
  "landing.pricing.roadmap1": { en: "Swish and card in one checkout", sv: "Swish och kort i samma kassa" },
  "landing.pricing.roadmap2": { en: "Multiple locations", sv: "Flera platser" },
  "landing.pricing.roadmap3": { en: "Staff accounts & roles", sv: "Personalkonton och roller" },
  "landing.pricing.roadmap4": { en: "Multi-language menus", sv: "Menyer på flera språk" },
  "landing.pricing.roadmap5": { en: "Custom domain", sv: "Egen domän" },
  "landing.pricing.roadmap6": { en: "Priority support", sv: "Prioriterad support" },

  // ── FAQ ────────────────────────────────────────────────────────────────
  "landing.faq.eyebrow": { en: "Questions", sv: "Frågor" },
  "landing.faq.title": { en: "Frequently asked", sv: "Vanliga frågor" },
  "landing.faq.q1": { en: "Do guests need to download an app?", sv: "Måste gästerna ladda ner en app?" },
  "landing.faq.a1": {
    en: "No. Guests scan the QR code with their phone camera and the menu opens in the browser. No download, no account, no login.",
    sv: "Nej. Gästerna skannar QR-koden med telefonens kamera och menyn öppnas i webbläsaren. Ingen nedladdning, inget konto, ingen inloggning.",
  },
  "landing.faq.q2": { en: "Do I need any special hardware?", sv: "Behöver jag någon speciell hårdvara?" },
  "landing.faq.a2": {
    en: "No. You need a printer for the QR codes and any device with a browser — phone, tablet or laptop — to watch orders come in. The kitchen screen is just a browser tab.",
    sv: "Nej. Du behöver en skrivare för QR-koderna och vilken enhet som helst med webbläsare — mobil, surfplatta eller dator — för att se beställningarna komma in. Köksskärmen är bara en webbläsarflik.",
  },
  "landing.faq.q3": { en: "How does the allergen feature work?", sv: "Hur fungerar allergenfunktionen?" },
  "landing.faq.a3": {
    en: "Each dish can carry tags from the 14 allergens listed in Annex II of EU Regulation 1169/2011. It is a fixed list rather than free text, so it stays consistent across your menu. Guests see the tags on the item card while they are choosing, and can filter the whole menu to hide anything containing an allergen.",
    sv: "Varje rätt kan märkas med de 14 allergener som listas i bilaga II till EU-förordning 1169/2011. Det är en fast lista i stället för fritext, så den håller sig konsekvent i hela menyn. Gästerna ser märkningen på rättens kort medan de väljer och kan filtrera hela menyn för att dölja allt som innehåller en allergen.",
  },
  "landing.faq.q4": { en: "Can guests customise a dish?", sv: "Kan gästerna anpassa en rätt?" },
  "landing.faq.a4": {
    en: "Yes. Set up choice groups (pick your meat) and ingredient lists (tap to remove the onion, or ask for extra). Each guest can also add a free-text note to an individual dish, and it prints on that dish's own line of the ticket.",
    sv: "Ja. Ställ in valgrupper (välj kött) och ingredienslistor (tryck för att ta bort löken, eller be om extra). Varje gäst kan också lägga en fritextnotis på en enskild rätt, och den hamnar på rättens egen rad på ticketen.",
  },
  "landing.faq.q5": { en: "How do orders arrive?", sv: "Hur kommer beställningarna in?" },
  "landing.faq.a5": {
    en: "Orders appear live on your dashboard and on the kitchen screen as guests place them. Pick one up, mark it done, and it clears — one tap, or a single keypress on the kitchen screen.",
    sv: "Beställningar visas live på din dashboard och på köksskärmen i samma stund gästerna lägger dem. Ta upp en, markera den klar och den försvinner — ett tryck, eller en enda tangent på köksskärmen.",
  },
  "landing.faq.q6": { en: "Can I edit my menu anytime?", sv: "Kan jag ändra menyn när som helst?" },
  "landing.faq.a6": {
    en: "Yes. Change items, prices, descriptions or availability whenever you like — guests always see the latest version instantly. Sold out? Toggle the dish, or just one of its options, and it disappears from the menu.",
    sv: "Ja. Ändra rätter, priser, beskrivningar eller tillgänglighet precis när du vill — gästerna ser alltid den senaste versionen direkt. Slut på en rätt? Stäng av rätten, eller bara ett av dess val, och den försvinner från menyn.",
  },
  "landing.faq.q7": { en: "What does it cost?", sv: "Vad kostar det?" },
  "landing.faq.a7": {
    en: "There is no monthly fee and no contract. You pay a small fee per order your guests pay for — if a table doesn't order, you pay nothing. Menus, QR codes, allergen tagging and the live orders dashboard are included.",
    sv: "Det finns ingen månadsavgift och inget bindande avtal. Du betalar en liten avgift per beställning dina gäster betalar för — beställer ett bord inget betalar du inget. Menyer, QR-koder, allergenmärkning och live-dashboarden ingår.",
  },
  "landing.faq.q8": { en: "Can I take payments through MenuQR?", sv: "Kan jag ta betalt via MenuQR?" },
  "landing.faq.a8": {
    en: "Yes. Guests can pay by card at checkout directly from their phone — the order only reaches your kitchen once the payment has gone through, so no unpaid food leaves the pass. Swish is next on the list.",
    sv: "Ja. Gästerna kan betala med kort i kassan direkt från mobilen — beställningen når köket först när betalningen gått igenom, så ingen obetald mat lämnar passen. Swish är näst på tur.",
  },

  // ── Closing CTA + footer ───────────────────────────────────────────────
  "landing.cta.title": { en: "Set up your menu tonight", sv: "Sätt upp din meny ikväll" },
  "landing.cta.text": {
    en: "Take orders tomorrow. No monthly fee, no contract — you pay only when your guests pay.",
    sv: "Ta emot beställningar imorgon. Ingen månadsavgift, inget bindande avtal — du betalar bara när dina gäster betalar.",
  },
  "landing.cta.button": { en: "Create your menu now", sv: "Skapa din meny nu" },
  "landing.footer.tagline": {
    en: "QR code menus, allergen declarations and live table ordering for restaurants and cafés.",
    sv: "QR-meny, allergeninformation och live-beställning vid bordet för restauranger och kaféer.",
  },
  "landing.footer.product": { en: "Product", sv: "Produkt" },
  "landing.footer.account": { en: "Account", sv: "Konto" },
  "landing.footer.legal": { en: "Legal", sv: "Juridik" },
  "landing.footer.signup": { en: "Sign up", sv: "Skapa konto" },
  "landing.footer.privacy": { en: "Privacy Policy", sv: "Integritetspolicy" },
  "landing.footer.terms": { en: "Terms of Service", sv: "Användarvillkor" },
  "landing.footer.copyright": { en: "© {year} MenuQR. All rights reserved.", sv: "© {year} MenuQR. Alla rättigheter förbehållna." },
} as const satisfies Record<string, Entry>;
