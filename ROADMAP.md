# MenuQR — Roadmap

Working document. Written 2026-08-10 against `1a2c7c9`, after the security audit
(`AUDIT-FINDINGS.md`) was fully closed.

Structure: **Now** is the next working session. **Then** is the following one or two.
**Later** is real but not scheduled. **Backlog** is small stuff to pick up any time.
**Deferred** is explicitly not being worked on yet.

Sizing is rough: `S` = under an hour, `M` = half a day, `L` = a day or more.

---

## Now — next session

### 1. Allergen declaration `L` — flagship

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

### 2. Per-choice availability `S`

Out of nöt today? `is_available` exists on `menu_items` but not on
`menu_item_option_choices`, so the only way to handle a sold-out choice is deleting it and
re-adding it later. One boolean column, one toggle in the editor, one filter in the guest
sheet.

Commercial platforms treat sold-out handling ("86'd items") as table stakes. You have it for
items; choices are the gap.

### 3. "Extra" as well as removal `S`

The ingredient picker is one-directional — you can only remove. Cycling a chip
`included → removed → extra` covers a very common request. It's a change to
`toggleIngredient` plus the label builder in `GuestMenuClient.tsx:395-400`, which already
emits the language-neutral `− lök`; add `+ lök` alongside it.

Highest guest-delight-per-line-of-code on this list.

### 4. Server-side validation of options `S`

`GuestMenuClient.tsx:385` enforces required choice groups in the browser only, and the
server still accepts `item_name` as a free string. Not a real threat from ordinary guests,
but it means a malformed or hand-crafted order lands on staff's board verbatim. Validate
that required groups were answered, and that submitted choice IDs belong to the item.

Becomes unnecessary once *Structured orders* lands, so it's worth doing only if that's more
than a week out.

---

## Then — the next one or two sessions

### 5. Structured orders `L` — unlocks most of what follows

An order is still a text blob in `item_name`, with `total_price` bolted on beside it.
Replacing it with an `order_items` table — `request_id`, `item_id`, `quantity`,
`unit_price`, `selected_options jsonb` — would:

- Remove the truncation class of bug permanently rather than raising a cap
- Let the server rebuild the display string from IDs it trusts (absorbs item 4)
- Allow **marking one item done while the rest cooks** — currently all-or-nothing
- Make an itemised bill possible instead of a single total
- Make per-item revenue and "which meat sells best" possible in Stats
- Become the precondition for payments (see *Deferred*)

Touches the guest menu, both boards, and the schema. Design it on paper first.

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

### 10. Multi-language menus `M`

Commercial platforms call this out specifically for tourist-heavy markets, which describes
Sweden in summer precisely. A `menu_item_translations` table plus a language toggle on the
guest header.

Pairs naturally with templates and with a *fixed* allergen list — a standard list
translates cleanly, free text doesn't.

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

### 16. Richer Stats `M`

Once 15 lands: peak-hours heatmap (which hours are busiest by weekday), average time to
serve, per-item popularity, revenue by category. Current Stats is daily volume bars only.

---

## Backlog — small, any time

- **Table rename** — there is no rename in `TableManager`. Renaming today means delete and
  recreate, which silently invalidates the printed QR code. `S`
- **QR token rotation** — no way to rotate a leaked or lost token without deleting the
  table and losing its history. A "regenerate QR" action would cover it. `S`
- **Item description in the add sheet** — the card clamps it to two lines
  (`WebkitLineClamp: 2`) and the sheet omits it entirely, so a long description is
  unreadable everywhere. `S`
- **Guest menu search** — staff have search in the Menu Builder; guests have none. With 68
  items across 8 categories that's a real gap. `S`
- **Repeat last order** — one tap to re-add what the guest ordered ten minutes ago. `S`
- **CSV export of request history** — for accounting. Falls out of item 8. `S`
- **`prefers-reduced-motion`** — a lot of animation across the guest menu and boards, with
  no support for the OS setting. Accessibility, and cheap. `S`
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

## Deferred — payments

**Not being worked on yet. Scheduled last, after everything above.**

Decision recorded: **Stripe**, with **Swish** as a payment method through it, plus whatever
else Stripe exposes (cards, Apple/Google Pay). One integration, one dashboard, no separate
bank gateway.

Context for when it comes up:

- Roughly two-thirds of Sweden uses Swish, so it is not optional in this market.
- Guest self-pay is the most-requested capability in this product category and is reported
  to improve table turnover meaningfully.
- Stripe documents Swish as a first-class payment method, which avoids negotiating a
  **Swish Handel** agreement and gateway integration separately.

**Hard prerequisite:** *Structured orders* (item 5). You cannot charge for an order whose
composition and total exist only as a text blob plus a single `total_price` the client
supplied. Itemised, server-authoritative order data has to come first.

Related but separate: subscription billing for MenuQR's own paid tiers. Same provider, same
"later" bucket — worth deciding together rather than twice.

---

## Already closed

Kept so nothing here gets re-litigated. All verified in code.

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
