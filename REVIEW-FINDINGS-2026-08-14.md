# MenuQR — review findings (handoff for AI code review)

Reviewed 2026-08-14 against commit `96f5e4d` (current main). Audit was **read-only** —
no changes were made. This document exists so a fresh reviewer (e.g. Claude Opus) can
pick up the findings cold, verify them against the code, and decide what to fix.

Two sections: **bugs worth fixing** (ordered by severity) and **ideas** (roadmap gaps,
new opportunities). The ROADMAP.md statuses at the end are stale — several "backlog"
items are already implemented; this file records the verified current state.

---

## Part 1 — Bugs found (verified in code)

### 1.1 Hardcoded "+kr" placeholder in the choice price input (currency bug)
`src/app/app/MenuBuilder.tsx:1319`

The price-delta input for choice options shows `placeholder="+kr"` regardless of the
restaurant's currency. The main price field just above uses the correct pattern
(`placeholder={`Price (${currencySymbol})`}` at line 916), so a USD/EUR/GBP restaurant
sees a "+kr" hint on every choice price field — inconsistent and confusing.

**Fix:** `placeholder={`+${currencySymbol}`}` — `currencySymbol` is already in scope
(line 102: `const currencySymbol = CURRENCIES[currency] ?? currency;`).

### 1.2 Duplicated currency symbol map (drift risk)
`src/app/menu/[token]/GuestMenuClient.tsx:196-199` vs `src/lib/constants.ts:11`

GuestMenuClient carries its own inline `{ SEK: "kr", USD: "$", EUR: "€", ... }` map that
duplicates `CURRENCIES` in `lib/constants.ts` (which also exports `currencySymbol(code)`).
Two copies of a static map is how bugs like 1.1 happen — the constants module is the
canonical source, the inline copy is not.

**Fix:** import `CURRENCIES` / `currencySymbol` from `@/lib/constants` in
GuestMenuClient and delete the inline map.

### 1.3 Guest can forge the order total_price
`src/app/api/order/route.ts:36-40`

`total_price` is accepted from the client, validated only as `typeof number &&
finite && >= 0 && <= 1_000_000`, then stored verbatim. A guest POSTing to `/api/order`
can set any total (including 0 or 1,000,000) for their cart. The value is shown on both
boards and in Analytics.

Impact today: cosmetic/analytics corruption only — there is no payment flow yet. But
this is the exact field Stripe will charge later, and "client supplies the price" is the
same trust boundary the roadmap's Structured orders (ROADMAP.md item 5) is meant to
close. Worth a decision: block or recompute now, or accept as known-until-Structured-orders.

**Possible mitigation without structured orders:** server recomputes the total from the
referenced `item_id` + parsed option deltas (fragile — options ride inside `item_name`
text). Real fix is Structured orders.

### 1.4 Comma in a choice label silently breaks kitchen ticket parsing
`src/lib/order-lines.ts:82` (split on `,`)

`parseOrderLines` splits the options blob of a ticket line on `","`. If a restaurant
creates a choice/ingredient label containing a comma (e.g. "BBQ sauce, mild"), the
kitchen ticket renders it as two separate choices. The parser's fallback only triggers
when the whole line fails to parse, so this misrenders silently.

**Options:**
- Disallow `,` (and `(` / `)`) in choice labels in the Menu Builder — cheap, keeps the
  parser simple.
- Or make the parser delimiter-aware (e.g. emit a rare separator like `␟` when building
  the string in GuestMenuClient submitCart).

Note the same risk applies to `(` and `)` in labels — the trailing-parens peeling
(`TRAILING_PARENS_RE`) would also misparse those.

### 1.5 GuestMenuClient currency fallback is "kr" (minor)
`src/app/menu/[token]/GuestMenuClient.tsx:199` (inside the inline map)

`return map[restaurant.currency] ?? restaurant.currency ?? "kr"` — the final fallback
hardcodes "kr" instead of falling back to the raw code. Cosmetic (DB column is NOT NULL
default 'SEK'), but falls away once 1.2 lands.

---

## Part 2 — Roadmap status (verified current state, 2026-08-14)

ROADMAP.md was written 2026-08-10 and several items have since landed. Verified in code:

### Already done (ROADMAP.md should be updated — items currently mislabeled "backlog" or "Now")
- **Allergen declaration** (Now item 1) — done: `type in ('choice','ingredients','allergens')`
  in schema, fixed EU 14 picker, "Contains" block in add sheet, menu-wide allergen filter.
- **Per-choice availability** (Now item 2) — done: `is_available` on
  `menu_item_option_choices`, sold-out toggle in MenuBuilder, hidden from guests.
- **Extra ingredients** (Now item 3) — done: `cycleIngredient` cycles
  included → removed → extra, emits `+ X` / `− X`.
- **Table rename** (Backlog) — done: `startRename`/`saveRename` in TableManager.
- **QR token rotation** (Backlog) — done: `regenerateToken` in TableManager, also closes
  guest sessions on the old token.
- **Guest menu search** (Backlog) — done: search box, matches name + description,
  cross-category results.
- **Item description in add sheet** (Backlog) — done (GuestMenuClient shows it above Qty).

### Deliberate deviation from roadmap
- **Allergen tags on the item card** — roadmap said "render allergen tags on the item
  card", but code deliberately shows allergens only in the add sheet (comment at
  GuestMenuClient.tsx:870-871). EU 1169/2011 only requires info "at the point the guest
  chooses", which the sheet satisfies. Decide if the card display is still wanted —
  the roadmap text is now misleading either way.

### Still open (confirmed against code)
- **Structured orders** (item 5, L) — `src/lib/order-lines.ts` header comment states it
  is a stopgap: "the real fix is storing orders structurally". Parse-based tickets live
  on both boards.
- **Server-side option validation** (item 4) — `/api/order` comment at lines 71-73
  confirms: cart submissions carry `item_id: null` and contents in `item_name` text, so
  per-option validation isn't possible until Structured orders.
- **Item photos** (item 6) — `image_url` on `menu_items` has zero usages anywhere.
- **Reusable option templates** (item 7), **CSV import/export** (item 8),
  **staff accounts** (item 9), **multi-language** (item 10), **multi-restaurant**
  (item 11), **scheduled availability** (item 12), **multi-select add-ons** (item 13),
  **dietary tags** (item 14), **service-time metrics** (item 15), **richer Stats**
  (item 16), **payments** (Deferred) — all not started.
- Backlog still open: repeat last order, CSV export of history, `prefers-reduced-motion`,
  modal focus traps, category tab semantics (`role="tablist"` without matching
  `tabpanel`), error monitoring (Sentry), undo on destructive actions, Upstash rate
  limiter swap.

---

## Part 3 — New ideas (not on the roadmap)

### 3.1 Charge for extra ingredients
Extras currently cycle to "+ X" with `priceDelta: 0` (GuestMenuClient.tsx:437-440) —
"extra cheese" is free. The price-delta field already exists on choices and the guest
sheet already renders `+ 5 kr` deltas. Letting the owner set a price on an ingredient
extra is a small change to the ingredient editor + the `+` branch of `confirmAddToCart`,
and it's a direct revenue lever per order.

### 3.2 Send part of a cart to the kitchen
One cart = one `table_requests` row with all lines. No way to send "starters first,
mains when ready". With Structured orders this becomes "select lines → send"; even
without it, a "Send selected items" checkbox list in the cart sheet would work.

### 3.3 No connection-loss indicator on the boards
Kitchen and Live Orders have realtime + 12s polling fallback, but a dead socket looks
identical to a working board (stale tickets, no warning). A small "reconnecting…"
indicator on realtime `SUBSCRIBE_ERROR`/channel state change would stop silent staleness.

### 3.4 Currency map is the canary for a settings inconsistency
1.1 + 1.2 together suggest the currency plumbing deserves one shared module
(`lib/constants.ts` is the natural home) — one import everywhere, one map to maintain.

---

## Notes for the reviewer (Opus or human)

- All findings above are **static code review** — none were reproduced against the live
  site (`https://menuqr-delta.vercel.app`). Treat 1.3 and 1.4 as code-level certainties
  (the trust boundary and the split are unambiguous), but 1.1 is worth a visual check.
- Repo: `github.com/Sheggyb/menuqr`, branch `main`, local clone `~/Projects/menuqr`.
- Schema source of truth: `supabase-schema.sql` (re-runnable, additive).
- No local dev environment by design — validate against the live deployment after push.
