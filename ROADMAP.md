# MenuQR — Roadmap

Working document. Written 2026-08-10 against `1a2c7c9`, after the security audit
(`AUDIT-FINDINGS.md`) was fully closed. Revised 2026-09-02 against `f909ae9`: items 1-3
shipped, item 4 dropped, item 5 promoted to *Now* and specced out as the groundwork for
Stripe. Revised 2026-09-04: item 5 **written and verified, awaiting deploy**; the backlog
pruned of eight entries that had already shipped or were closed alongside it. Revised
2026-09-05: a bug-hunting pass over the boards, Menu Builder and Table Manager — findings
and fixes recorded under *Already closed*, all still awaiting the same deploy. Revised
2026-09-06: landing page rebuilt, and **payments promoted out of Deferred into a real
plan** now that structured orders make an order chargeable.

Structure: **Now** is the next working session. **Then** is the following one or two.
**Later** is real but not scheduled. **Backlog** is small stuff to pick up any time.
**Deferred** is explicitly not being worked on yet.

Sizing is rough: `S` = under an hour, `M` = half a day, `L` = a day or more.

---

## Now — next session

### 5. Structured orders `L` — and the groundwork for Stripe

> **Status 2026-09-04: written, typechecked, built and unit-verified — not yet deployed.**
> The spec below is kept as written; everything in it is implemented. Two things the spec
> did not anticipate, both now in:
>
> - `seen_at` / `done_at` are stamped by a **database trigger**, not by the app. There are
>   three writers (both boards and the Supabase table editor) and a column that is only
>   sometimes filled in is worse than no column. `pending → done` deliberately leaves
>   `seen_at` null rather than inventing a timestamp that would flatter prep-time averages.
> - The server can now reject an order the old one always accepted — a sold-out dish or
>   choice, or a required group left unanswered. Those return a named error plus the dish
>   name, and the guest menu reports each one specifically. Without that a stale cart gives
>   "Something went wrong" and the guest retries an order that can never succeed.
>
> **Deploy order is not optional: apply the schema first, push second.** Every schema change
> is additive, so an applied schema with un-deployed code is a no-op. The reverse makes both
> boards query a table that does not exist.

Promoted from *Then* on 2026-09-02, because the payment flow is now decided: **guest orders →
guest pays → the kitchen gets the ticket**. That makes this the next piece of work rather than
a cleanup, and it makes item 4 below redundant.

Two things in today's design don't survive pay-before-kitchen:

**The price is decided by the browser.** `GuestMenuClient.submitCart` builds the order as one
sentence (`x2 Kebab Brödet [Fläsk, − lök | no mayo]`) plus a total it calculated itself, and
`/api/order` files both without ever looking the dish up in `menu_items` or adding the prices
up. The item-ownership check at `route.ts:74-83` looks like it covers this, but it sits inside
`if (item_id != null)` and the cart always sends `null` — so it is skipped on every order, and
`table_requests.item_id` is null on every row. `sendRequest` is the only other writer and is
only ever called as `sendRequest(type)` for quick actions, so its `item`/`note`/`quantity`
parameters are dead.

Today that only makes Stats revenue wrong (`Analytics.tsx:163` sums the client's number).
Wired to Stripe, a guest sets the total to 1 kr and legitimately pays 1 kr for a 400 kr meal.

**There is no "paid yet?" state.** An order is inserted as `pending` and hits the kitchen board
instantly. Pay-first needs the ticket held back until Stripe confirms.

Do it now, while the project is still in testing — there is little real order history to
migrate, so this is the cheapest it will ever be. **Build the seams Stripe needs; do not build
Stripe.**

Beyond unblocking payments, replacing the text blob with rows also:

- Removes the truncation class of bug permanently rather than raising a cap
- Lets the server rebuild the display string from IDs it trusts (absorbs item 4)
- Allows **marking one item done while the rest cooks** — currently all-or-nothing
- Makes an itemised bill possible instead of a single total
- Makes per-item revenue and "which meat sells best" possible in Stats

#### Schema — `supabase-schema.sql` (idempotent; applied by hand in the SQL editor)

New `order_items`:

| column | notes |
|---|---|
| `id` | pk |
| `restaurant_id` | not null — same denormalised-for-RLS pattern as every other table |
| `request_id` | → `table_requests` **on delete cascade** |
| `item_id` | → `menu_items` **on delete set null** |
| `name_snapshot` | dish name as ordered, so history survives a menu rename |
| `quantity` | int |
| `unit_price` | `numeric(10,2)` — **server-computed**, item price + chosen deltas |
| `selected_options` | `jsonb` — chosen / removed / extra choice ids + labels |
| `note` | this item's free-text note |
| `sort_order` | int |

RLS: `for all` with the same `auth.uid() = (select owner_id from restaurants where id =
restaurant_id)` expression the existing tables use. Index on `(request_id)`.

On `table_requests`:
- `payment_status` check `('not_required','awaiting','paid','failed')` default `'not_required'`,
  so current behaviour is unchanged until Stripe exists.
- Fold in **item 15** (`seen_at`, `done_at`) while the schema is open — tiny, and real
  prep-time history starts accumulating now even though the Stats UI comes later.
- **Keep `item_name`**, but written by the server from the rows. It keeps both boards,
  `RequestHistory` search and the migration window working with no downstream change.

#### `/api/order` becomes the pricing authority

New body: `{ session_id, table_id, type, items: [{ item_id, quantity, choice_ids[],
removed_choice_ids[], extra_choice_ids[], note }] }`

- Stop accepting `total_price` and `item_name` from the client at all.
- Load items, option groups and choices **by id, scoped to the `restaurant_id` already derived
  from the table** at `route.ts:67`. Reject unknown ids, unavailable items, and unavailable
  choices (`menu_item_option_choices.is_available`).
- Enforce that every `is_required` choice group was answered — that check currently exists only
  in the browser (`GuestMenuClient.tsx:385`).
- `unit_price = item.price + Σ choice.price_delta`; `total_price = Σ quantity × unit_price`.
- Server generates `item_name` in the exact format `order-lines.ts` already parses, so nothing
  downstream breaks on day one.
- No transactions from the JS client: insert the request, then the items, and delete the request
  if the items insert fails.
- Leave the session check, table check, rate limiting and quick-action dedup exactly as they are
  — that part is sound. The unreachable `if (item_id != null)` block becomes the per-item loop.

#### Guest side — keep the ids instead of discarding them

`GuestMenuClient.tsx` already has the ids in hand at lines 447-457 and flattens them into
display labels. Change `CartItem.options` (line 31) to carry `choice_ids`,
`removed_choice_ids` and `extra_choice_ids` alongside the labels it needs for rendering.
`submitCart` (line 349) then sends ids instead of building `combinedName`/`totalPrice` for the
request body — keep the local total for the cart UI only. Leave the tri-state ingredient cycle
(`toggleIngredient`, `extraIngredients`, `ingredientState`) untouched; it already tracks by
choice id.

#### Boards read rows, with a fallback

`LiveOrders.tsx` (`RequestCard`) and `KitchenDisplay.tsx` render from `order_items` when
present, falling back to `parseOrderLines(item_name)` for rows created before the migration.
Same visual output either way. Once no pre-migration rows fall inside either board's window,
`src/lib/order-lines.ts` can be deleted. `Analytics.tsx` keeps reading `total_price` — the
number just becomes trustworthy.

#### Stripe seams only — no Stripe

- Both boards filter out `payment_status = 'awaiting'`, so an unpaid ticket can never reach the
  kitchen.
- Request creation takes `payment_status` as an argument, `'not_required'` today.
- Leave a commented seam for where a webhook flips `awaiting → paid` and where abandoned
  checkouts get swept.
- Do **not** add Stripe keys, dependencies or routes in this change.

#### Verification

1. `npm run typecheck` and `npm run build` (not `npx tsc`).
2. Apply the schema by hand, then run it a second time to confirm it is still idempotent.
3. Order two items with a choice, a removal, an extra and a per-item note. Check `order_items`
   has one row per item, `unit_price` matches `menu_items.price` + deltas, and both boards look
   the same as before.
4. **Tamper test** — the point of the change. POST to `/api/order` with (a) a bogus `item_id`,
   (b) an `item_id` from another restaurant, (c) a `total_price` field: all rejected or ignored,
   and the stored total matches the menu.
5. Quick actions still dedupe with a 409 and still render.
6. A pre-migration row still renders on both boards via the fallback.
7. `payment_status` defaults to `not_required` and today's orders still appear.

#### Open product question, not part of this change

Pay-first fits **takeaway** and **café**, but table-service guests normally expect to pay at the
end. `restaurants.venue_type` already exists, so it can drive this per venue rather than being
one global flow. Worth deciding before the Stripe work, since it changes when the ticket is
released to the kitchen.

---

## Closed — kept in place for the reasoning

Items 1-3 shipped in `7aa76f3` (with `a85cc7b` and `3b205b7` finishing the allergen UX).
Item 4 is dropped — item 5 above absorbs it, exactly as its own last line predicted.

Left here rather than compressed into *Already closed* at the end, because the allergen
research below (EU 1169/2011, Annex II, the Livsmedelsverket caveat, the positioning argument)
is reference material worth keeping, not task text.

### 1. Allergen declaration `L` — flagship — **SHIPPED**

**The highest-value feature available, because it is a legal requirement, the data model
already exists, and no competitor at this price point does it well.**

EU Regulation 1169/2011 has required allergen information for *non-prepacked* food —
restaurants, cafés, takeaways, food trucks, catering — since December 2014. Annex II lists
14 substances: cereals containing gluten, crustaceans, eggs, fish, peanuts, soybeans, milk,
tree nuts, celery, mustard, sesame, sulphites, lupin, molluscs.

The information must be available **at the point the guest chooses**. It may be given
orally only where there is written signposting saying it is available on request. MenuQR
currently has no field for it.

> Confirm the Swedish specifics with Livsmedelsverket before making compliance claims in
> marketing copy. This document establishes that the requirement is real, not the exact
> wording to advertise.

**Why it's cheap here:** `menu_item_options` already models *"a named group of labelled
things attached to an item"*, with `type` as an enum (`'choice' | 'ingredients'`). Allergens
are a third variant of that same shape. The guest sheet already renders chip groups; the
Menu Builder already has a group editor.

**Build:**
- Add `'allergens'` to the `type` check constraint. Display-only — not selectable,
  `is_required` irrelevant.
- Seed the 14 EU allergens as a **fixed picker** in the Menu Builder, not free text.
  Consistency matters for a legal field, and a fixed list is translatable later (see
  *Multi-language*) whereas free text is not.
- Guest menu: render allergen tags **on the item card**, not only inside the add sheet —
  the guest must see it while choosing, which is the whole point of the regulation.
- Add a `Contains: …` line to the item detail sheet.
- Add a menu-wide allergen filter — *hide items containing milk / gluten*. This is the part
  guests will love, and the part nobody in this segment offers.

**Positioning:** this turns a compliance burden into the strongest sales line available.
"MenuQR keeps your menu allergen-compliant" lands very differently with a Swedish
restaurant than "QR menus do", and it justifies a paid tier on its own.

### 2. Per-choice availability `S` — **SHIPPED** (`menu_item_option_choices.is_available`)

Out of nöt today? `is_available` exists on `menu_items` but not on
`menu_item_option_choices`, so the only way to handle a sold-out choice is deleting it and
re-adding it later. One boolean column, one toggle in the editor, one filter in the guest
sheet.

Commercial platforms treat sold-out handling ("86'd items") as table stakes. You have it for
items; choices are the gap.

### 3. "Extra" as well as removal `S` — **SHIPPED** (chips cycle included → removed → extra)

The ingredient picker is one-directional — you can only remove. Cycling a chip
`included → removed → extra` covers a very common request. It's a change to
`toggleIngredient` plus the label builder in `GuestMenuClient.tsx:395-400`, which already
emits the language-neutral `− lök`; add `+ lök` alongside it.

Highest guest-delight-per-line-of-code on this list.

### 4. Server-side validation of options `S` — **DROPPED**, absorbed by item 5

`GuestMenuClient.tsx:385` enforces required choice groups in the browser only, and the
server still accepts `item_name` as a free string. Not a real threat from ordinary guests,
but it means a malformed or hand-crafted order lands on staff's board verbatim. Validate
that required groups were answered, and that submitted choice IDs belong to the item.

Becomes unnecessary once *Structured orders* lands, so it's worth doing only if that's more
than a week out.

---

## Then — the next one or two sessions

### 5. Structured orders — **promoted to Now**, see above

### 6. Item photos `M`

`image_url` exists on `menu_items` and has **zero usages anywhere in the codebase** — no
upload UI, no rendering. Photos are the single biggest ordering lever on a food menu, and
the column is already sitting there.

Needs: Supabase Storage upload in the Menu Builder (not a URL field — see what the logo
field taught us), a thumbnail on the guest item card, and the full image in the add sheet.
Lazy-load and constrain dimensions; guests are on phones and often on mobile data.

### 7. Reusable option templates `M`

`scripts/gen_ingredients_sql.py` exists because ingredients are shared across many items
but stored per item — stamping 42 items by hand wasn't viable. That's the tell.

Templates attachable to items, with per-item overrides, make the menu maintainable without
scripts and make allergens practical to fill in at scale. Do this *after* allergens, so the
template system covers both from the start.

### 8. CSV menu import/export `M`

You already built this twice in Python for the Prima Pizza import. Productising it turns a
painful onboarding step (typing in 68 items) into a five-minute one, which is a real
conversion lever for signups. Export doubles as the backup story.

---

## Later — real, not scheduled

### 9. Staff accounts and roles `L`

Every restaurant is a single `owner_id`, so the floor tablet, the kitchen screen, and the
owner's laptop all share one login. A real restaurant has a manager, waiters, and kitchen
staff who should not all be able to delete the menu.

Needs a `restaurant_staff` table (`restaurant_id`, `user_id`, `role`) and RLS policies that
check membership rather than ownership. Note this touches **every existing policy** — it's
the largest structural change on this list, and worth doing before you have many paying
customers rather than after.

### 10. Multi-language menus `M` → `L`

Commercial platforms call this out specifically for tourist-heavy markets, which describes
Sweden in summer precisely. Sized `M` when this list was written; it is really an `L`, and
the design below is why. Recording it properly because it was worked out once and then
lived nowhere.

#### Three layers, not one

Treating the menu as one bag of strings is the obvious approach and the wrong one. The
content splits into three layers with completely different economics:

1. **Fixed vocabulary** — the 14 EU allergens, dietary tags, UI chrome ("Add to order",
   "Call Waiter"). Finite, shared by every restaurant on the platform, translated **once by
   hand** and never again. Zero marginal cost. This is the strongest argument for the
   allergen list being a fixed picker rather than free text (see item 1).
2. **Ingredient terms** — *ost*, *rödlök*, *färska champinjoner*. Not finite in principle,
   but overwhelmingly repetitive in practice, and shared far beyond one restaurant. Every
   pizzeria in Sweden uses the same eighty words.
3. **Prose** — dish names and descriptions. Genuinely per-restaurant, genuinely open-ended,
   and the only layer that actually needs a machine translation call.

#### The measurement that makes layer 2 worth building

`scripts/primapizza-ingredients.sql` — one real 68-item menu — contains **248 ingredient
rows made of 98 distinct terms**. A 2.5× collapse *inside a single restaurant*. Across
restaurants the ratio gets dramatically better, because *ost* and *tomatsås* are the same
two words in every pizzeria in the country.

So layer 2 should not be stored per restaurant. It wants a **global `term_translations`
cache**, keyed on `(normalised source term, source lang, target lang)` and shared platform
-wide. Translate *rödlök* → *red onion* once, and every restaurant that ever adds red onion
gets it free, forever.

#### Why MenuQR should own the translation API

Given that cache, the marginal cost of translating a new menu **falls as the platform
grows** — the hit rate on layers 1 and 2 approaches 100%, and only layer 3 ever reaches a
paid API. That inverts the usual per-seat cost curve and makes it sane to offer translation
as an included **Pro** feature rather than making each restaurant bring its own API key.

It is also the better product: a restaurant owner should not have to hold a translation
account, and MenuQR gets to correct a bad translation once, centrally, for everyone. Human
overrides therefore have to outrank cache entries — a `is_reviewed` flag on the cache row,
never overwritten by a later machine pass.

#### Shape

- `term_translations` — global, no `restaurant_id`. `(source_term, source_lang,
  target_lang)` unique, plus `translation`, `is_reviewed`, `source` (`human` / `machine`).
- `menu_item_translations` — per restaurant, layer 3 only: `item_id`, `lang`, `name`,
  `description`.
- Guest header language toggle; fall back to the original string on any miss, never to an
  empty one.
- Translate **on write, not on read** — a guest on mobile data must never wait on a
  translation API. A menu edit enqueues the work; the guest page only ever reads rows.

Pairs naturally with templates (item 7): a translated template is translated for every item
that uses it.

Note that **money formatting is already locale-aware** and keyed on the restaurant's
currency (see *Money formatting* under Already closed). Layer 3 translation should follow
the same rule — the venue decides the presentation, not the guest's browser — so that a
translated menu still shows the same prices as the printed one.

### 11. Multiple restaurants per owner `M`

The landing page FAQ already promises this for a Pro plan, and the schema half-assumes it
(`restaurants` has an `owner_id`, but every query uses `.single()`). Making it real is
mostly a restaurant-picker in the shell plus removing the `.single()` assumptions.

### 12. Scheduled availability `M`

Lunch menu 11:00–14:00, dinner after 17:00 — a very common restaurant need that currently
requires manually toggling items twice a day. Time windows on categories or items, evaluated
server-side in the guest page fetch.

### 13. Multi-select add-on groups `M`

`type` is `'choice' | 'ingredients'` (soon `'allergens'`). The missing variant is *add-ons*
— extra cheese **and** bacon **and** double meat — with `min`/`max` selection counts. The
enum is already the right home, and it composes with per-choice availability.

### 14. Dietary tags `S`

Vegan, vegetarian, spicy, halal, gluten-free. Same rendering infrastructure as allergens, so
build it as part of that work if it's cheap. Distinct from allergens: these are preferences
guests filter *toward*, where allergens are filtered *away*.

### 15. Service-time metrics `S`

`table_requests` has only `created_at`. Adding `seen_at` and `done_at` (stamped when status
changes) unlocks *actual* prep-time and time-to-serve numbers, which is the most useful
operational metric a restaurant can get from a system like this — and it replaces the
current "assume ~3 min per pending request" estimate in `LiveOrders.tsx` with something real.

Tiny schema change, disproportionate analytical payoff. Do it early even if the Stats UI
comes later, so history accumulates.

**The data half shipped with item 5.** `seen_at` and `done_at` exist and are stamped by the
`trg_stamp_request_status` trigger, so history accumulates from the moment that schema is
applied. Only the Stats UI remains here — and note that `seen_at` is null for orders taken
straight from pending to done, so prep time has to be averaged over the rows that have it
rather than assumed present.

### 16. Richer Stats `M`

Once 15's UI half lands: peak-hours heatmap (which hours are busiest by weekday), average
time to serve, per-item popularity, revenue by category. Revenue totals and per-day revenue
shipped in `f909ae9`; what is still missing is everything that needs a *breakdown* —
which is now possible, because `order_items` gives per-dish rows with a server-computed
`unit_price` instead of one opaque total per order.

---

## Backlog — small, any time

- **`clsx` and `lucide-react` are unused dependencies** — declared, never imported. Removing
  them from `package.json` alone is **not safe**: `package-lock.json` has to be regenerated in
  the same change or Vercel's `npm ci` fails on the mismatch. Needs an `npm install`, so it is
  its own commit, not a fold-in. `S`
- **`README.md` lists `src/app/app/OnboardingChecklist.tsx`**, which does not exist. `S`
- **Repeat last order** — one tap to re-add what the guest ordered ten minutes ago. `S`
- **CSV export of request history** — for accounting. Falls out of item 8. `S`
- **Focus traps in modals** — no modal traps focus. `ConfirmDialog` handles Escape now;
  the cart, add-item, and QR modals don't. `S`
- **Category tab semantics** — the guest category row uses `role="tablist"` but the items
  below aren't in a matching `tabpanel`. `S`
- **Error monitoring** — client errors currently vanish. Sentry or similar would have caught
  the reorder-upsert failure without a review pass. `S`
- **Undo on destructive actions** — deleting an item or category is confirm-then-gone. A
  short-lived undo toast is friendlier than a modal. `M`
- **Rate limiter** — `src/lib/ratelimit.ts` is in-process, so on Vercel the limits are
  per-instance and reset on cold start. Fine at current volume; swap for Upstash Redis
  when traffic justifies it. `S`

---

## Payments — Stripe + Swish

**Status 2026-09-06: planned, not started.** Promoted out of *Deferred* because the
prerequisite landed — orders are now itemised rows with a server-computed total, so there
is finally something trustworthy to charge for.

Decision recorded: **Stripe**, with **Swish** as a payment method through it, plus whatever
else Stripe exposes (cards, Apple/Google Pay). One integration, one dashboard, no separate
bank gateway.

- Roughly two-thirds of Sweden uses Swish, so it is not optional in this market.
- Guest self-pay is the most-requested capability in this category and is reported to
  improve table turnover.
- Stripe documents Swish as a first-class payment method, which avoids negotiating a
  **Swish Handel** agreement and a gateway integration separately.

### What Swish actually constrains — verified against Stripe's docs, 2026-09-06

These are not incidental; three of them change the data model.

| Constraint | Consequence for MenuQR |
|---|---|
| **SEK only.** Every line item in the Checkout Session must be SEK | A venue whose `restaurants.currency` is EUR/USD/GBP **cannot** offer Swish. Payment methods are a function of the venue's currency, so it is not one global config |
| **Swedish bank account + mobile BankID required**, customer side | Tourists cannot pay by Swish — the exact people a QR menu attracts. Cards must always be offered alongside it, never instead of |
| **3-minute window.** A PaymentIntent in `requires_action` expires after 3 minutes and drops to `requires_payment_method` | This is the number the abandoned-order sweep is sized against. An order cannot sit in `awaiting` for an hour |
| Single-use, **payment mode only** — no setup or subscription mode | Fine for guest orders. MenuQR's own Pro-plan billing has to be cards; that is a separate integration, not this one |
| Mobile redirects into the Swish app; desktop shows a QR to scan | Guests are on phones, so the redirect path is the one that matters. Test both anyway |
| Swish logo and the business name must be displayed | A checkout-surface requirement, not an afterthought |

Declines are richly coded (`AM21` daily limit, `BANKIDCL` customer cancelled BankID,
`ACMT01` enrolled but app not activated, `RP06` another Swish payment already in progress).
Several are recoverable by the guest retrying or picking a card. The failure UI should say
which, not just "payment failed" — the same lesson as the sold-out-cart errors.

### The product decision that comes first

Pay-first and pay-at-end are different products, and `restaurants.venue_type` already
distinguishes them:

- **`takeaway` / `cafe` → pay first.** Guest orders, pays, and only then does the ticket
  reach the kitchen. This is what the `awaiting` state and the board filters were built for.
- **`table_service` → pay at the end.** Sit-down guests expect a tab. Forcing a Swish prompt
  on every round is worse than what they have now, and a table that orders four times would
  face four BankID signings. Here the **Request Bill** quick action becomes the payment:
  total the session's orders, take one payment, mark them all paid.

Both still resolve to the same `table_requests.payment_status` column, so the schema already
covers each — the difference is *when* the payment is created, not what it writes.

### Seams that already exist

Built with the structured-orders change; nothing below needs inventing.

- `table_requests.payment_status` — `not_required` | `awaiting` | `paid` | `failed`,
  defaulting to `not_required` so today's behaviour is unchanged.
- Both boards, the nav badge, the per-table counts, the Today/Done counters and Stats
  revenue all filter `awaiting` out. An unpaid ticket cannot reach the kitchen and cannot
  inflate takings.
- `order_items` carries a server-computed `unit_price` per line, so the amount to charge is
  derived from rows the server wrote, never from anything a browser said.

### Build outline

1. **`POST /api/checkout`** — takes a `request_id` (pay-first) or a `session_id`
   (pay-at-end). Re-reads `order_items` and **recomputes the total server-side**; never
   accepts an amount. Converts to minor units with `Math.round(total * 100)` — öre are
   integers and a float that drifted by a cent will be rejected or, worse, charged. Creates
   the Checkout Session, flips `payment_status` to `awaiting`, returns the URL.
2. **`POST /api/stripe/webhook`** — verifies the signature with the raw body, so it needs
   `export const runtime = "nodejs"` and must read `req.text()`, not `req.json()`. Must be
   **idempotent**: Stripe retries, and a replayed `payment_intent.succeeded` must not double
   anything. Handles `payment_intent.succeeded` → `paid`, `payment_intent.payment_failed`
   and `checkout.session.expired` → `failed`. Excluded from the middleware matcher.
3. **Sweep** — a small job that moves `awaiting` rows older than ~15 minutes to `failed`.
   Webhooks are the primary signal; this only catches the case where one never arrives.
   Fifteen rather than three, because cards with 3DS legitimately take longer than Swish.
4. **Guest UI** — a pay step after the cart, the Swish logo and venue name on it, a
   "waiting for BankID" state that respects the 3-minute limit, and decline messages
   specific enough to act on.
5. **Staff UI** — payment state on the order card, and a way to mark an order paid by other
   means (cash still exists). Refunds start in the Stripe dashboard, not in MenuQR.

### Hard prerequisite: somewhere that is not production

**This is the blocker, and it is not a Stripe problem.** There is no staging environment —
`main` deploys straight to production, and there is no local dev. Every other feature has
been safe to verify that way because the worst case was a visual bug. Payments are the first
change where the worst case is money moving incorrectly, in public, with no way to rehearse.

Before any Stripe code is written:

- A **Vercel preview deployment** from a branch, pointed at **Stripe test-mode keys**.
  Previews already happen automatically; they have simply never been used.
- Preview must not write to the production Supabase project. Either a second Supabase
  project, or at minimum a dedicated test restaurant that no real venue shares.
- The Stripe CLI (`stripe listen`, `stripe trigger`) to replay webhook events against the
  preview — this is how idempotency and the failure paths get tested without a real card.
- Test-mode Swish presents an approve/decline page instead of the real app, so both branches
  are reachable.

Only once a payment can be taken, failed, expired and refunded against test mode should live
keys go anywhere near the project.

### Also worth knowing

Stripe now ships agent-facing tooling — `npm install -g @stripe/cli` then `stripe agent
setup`, plus per-topic docs readable in the terminal via `stripe docs`. Worth using rather
than working from memory, since the API moves.

Related but separate: subscription billing for MenuQR's own paid tiers. Same provider, and
worth deciding alongside — but note Swish cannot do subscriptions, so that one is cards.

#### Sources

- [Swish payments — Stripe Docs](https://docs.stripe.com/payments/swish/accept-a-payment?payment-ui=checkout)
- [Accept Swish Payments — Stripe](https://stripe.com/payment-method/swish)

---

## Already closed

Kept so nothing here gets re-litigated. All verified in code.

**Guest lockout under load, 2026-09-05.** The worst bug found in the sweep, and it only
appears when a venue is busy — which is when it matters. `/api/table-status` was rate
limited at 60/min keyed on **client IP alone**, and every guest phone polled it every 3
seconds. A restaurant's WiFi presents one `x-forwarded-for` for the whole building, so four
phones exhausted the budget between them. A 429 body has no `is_active`, the client did
`setTableActive(data.is_active)` unconditionally, `undefined` is falsy — and guests were
shown **"We're closed"** on an open table.

Fixed at all three layers, because any one of them alone would have been enough:

- Keys now include the table token / the guest's own order id, and the limits are 120/min.
  One table can no longer starve another.
- The client only accepts an explicit boolean. A failed check never closes a table — the
  rule the staff boards already followed for orders.
- `table-status` polls every 15s instead of 3s (it barely ever changes), split from the
  session-approval poll, which needs to stay fast and is keyed per session anyway.

Two neighbours of the same bug, found while fixing it:

- `/api/session/create` allowed **5 per minute per table**, but each phone creates its own
  session, so a party of six locked the sixth person out of the menu. Now 20.
- Any failure from that endpoint matched neither client branch, leaving the guest on
  "waiting for staff to approve" **forever** while no session existed and staff saw no
  request. Every outcome now returns them to a button they can press.

Both guest polls also stop while the tab is hidden and re-check on return — the guest menu
runs on a customer's phone, usually on mobile data, and a backgrounded tab was polling
indefinitely.

**Money formatting, 2026-09-05.** Prices were built as `${amount} ${symbol}` with
`toFixed(2)`, which produced "89.50 kr" for a Swedish venue (should be "89,50 kr") and
"89.50 $" for a dollar one (should be "$89.50" — symbol placement is part of the locale,
not decoration). Three near-identical formatters in three files are now one
`formatMoney(amount, currency)` in `lib/constants.ts`, built on `Intl.NumberFormat`.

The locale comes from the restaurant's **currency**, deliberately not from the guest's
browser: the guest menu is server-rendered, so a `navigator`-derived locale would differ
between the server and client render and trip a React hydration mismatch — and a price
should read the same on the printed menu, the guest's phone and the staff board. Whole
amounts still drop their decimals ("89 kr"), because letting Intl pick 0-2 digits renders
89.5 as "89,5 kr", which is not a price. Verified against all ten supported currencies plus
an unknown code, which falls back instead of throwing.

Input was fixed in the same pass: `parsePrice()` accepts "89,50", "1 299" and a pasted
"− 5", and rejects a typo with a message instead of writing NaN — which `JSON.stringify`
turns into `null`, so mistyping a price used to silently delete it.

**Backlog entries removed 2026-09-04**, each verified in code before deleting:

- *Table rename* — `TableManager` has it; the printed QR survives a rename.
- *QR token rotation* — `regenerateToken()` in `TableManager.tsx:206`, with best-effort
  session cleanup.
- *Item description in the add sheet* — rendered at `GuestMenuClient.tsx:979`.
- *Guest menu search* — searches name and description across all categories, and shows every
  match rather than only the active category.
- *`prefers-reduced-motion`* — `globals.css:248`.
- *Middleware gates `/kitchen` in name only* — the redirect now tests `/kitchen` as well as
  `/app`. It was never an actual hole (the page has its own check), but it was burning a
  `getUser()` per kitchen request and discarding the result, and `README.md` claimed a
  protection that was not there.
- *Two build artifacts tracked in git* — `.gitignore` now covers `tsconfig.tsbuildinfo` and
  `__pycache__/`. **Still needs `git rm --cached` once** to stop tracking what is already
  tracked; the commands are in a comment at the top of the `.gitignore` entry.
- *Dead `Profile` type* — removed from `src/lib/types.ts`. The `clsx` / `lucide-react` half
  of that entry is still open and stayed in the backlog, because it cannot be done safely
  without regenerating the lockfile.

**Security audit** (`AUDIT-FINDINGS.md`, commits `b2e816c` → `80a7308`) — all 25 items,
including four public RLS holes, client-supplied `restaurant_id`, an open redirect, silent
row caps, and three regressions introduced by the sweep itself.

**Options review** (commit `1a2c7c9`):
- Schema `drop table` on the options tables removed — re-running `supabase-schema.sql` no
  longer destroys every choice group and ingredient list
- `item_name` cap raised 200 → 1000, so customised multi-item orders stop being truncated
  mid-word
- `total_price` added to `table_requests`, validated server-side, and shown on both the
  Live Orders and Kitchen boards — staff can finally see order value
- Ingredient removals switched from hardcoded Swedish `utan X` to language-neutral `− X`
- Option price deltas now show the currency symbol and render negatives as `− 5 kr`
- Indexes added on `menu_item_options` and `menu_item_option_choices`
- Logo has an `onError` fallback instead of showing guests a broken-image icon

---

## Sources

- [EU legal requirements on food allergen labelling — University of Manchester](https://sites.manchester.ac.uk/foodallergens/information-for-food-businesses/eu-legal-requirements-on-food-allergen-labelling/)
- [EU 1169/2011 Guide: Allergen Labelling requirements — Menutech](https://menutech.com/en/blog/legal-requirements/eu-11692011-guide-allergen-labelling-requirements)
- [Food information to consumers – legislation — European Commission](https://food.ec.europa.eu/food-safety/labelling-and-nutrition/food-information-consumers-legislation_en)
- [EU Food Labeling Requirements for Restaurants (2026) — VivaShelf](https://vivashelf.com/blog/eu-food-labeling-requirements-restaurants)
- [Best QR Ordering Systems: 2026 Features & Pricing Comparison — Eats365](https://www.eats365pos.com/us/blog/post/top-asked-questions-about-qr-code-ordering)
- [10 Best QR Code Menu Platforms for Restaurants in 2026 — Logix360](https://logix360.studio/blog/best-qr-code-menu-platforms-restaurants-2026/)
- [Swish payments — Stripe Documentation](https://docs.stripe.com/payments/swish/accept-a-payment?payment-ui=direct-api)
