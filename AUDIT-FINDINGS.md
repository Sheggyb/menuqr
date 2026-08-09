# MenuQR — full codebase audit

Reviewed 2026-08-09 against commit `278a892`. Every source file read line by line except
`src/app/app/SettingsPanel.tsx` (uncommitted edits in progress by another agent — earlier
findings for it are listed separately in section 6).

Ordered by severity. Each item names the file:line, the defect, and the fix.

---

## 1. Security / data integrity — fix first

### 1.1 Anyone with the public anon key can insert orders into any restaurant
`supabase-schema.sql:130-132`

```sql
create policy "Public insert requests" on table_requests
  for insert with check (true);
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` ships in the browser bundle, so it is public by design.
This policy lets any holder of it `POST` directly to
`https://<project>.supabase.co/rest/v1/table_requests` and insert arbitrary rows — any
`restaurant_id`, any `table_id`, any content — with no session, no approval, and no rate
limit. It bypasses `/api/order` and the entire guest-approval design.

The policy is also **unnecessary**: `/api/order` inserts with `createAdminClient()`
(service role), which bypasses RLS regardless.

**Fix:** drop the policy. Guests never insert directly.
```sql
drop policy if exists "Public insert requests" on table_requests;
```

### 1.2 Every table token in the database is publicly readable
`supabase-schema.sql:53-55`

```sql
create policy "Public read tables by token" on restaurant_tables
  for select using (is_active = true);
```

This is not scoped to a token — it permits selecting *all* active tables, across *all*
restaurants. With the anon key an attacker can enumerate the whole `restaurant_tables`
table and harvest every `token`. The token is the only thing protecting a guest menu, so
this hands out access to every restaurant's ordering page, plus the ability to spam staff
with access requests at arbitrary tables.

Same pattern, lower stakes: `Public read categories` (`using (true)`) and
`Public read available items` (`using (is_available = true)`) expose every restaurant's
full menu.

These are also unnecessary — `src/app/menu/[token]/page.tsx:27` reads the table and menu
server-side with `createAdminClient()`. Confirmed: `GuestMenuClient` calls
`createClient()` at line 62 but never issues a single query with it (see 5.3).

**Fix:** drop all three public read policies.

### 1.3 `/api/order` trusts the client's `restaurant_id`
`src/app/api/order/route.ts:19-82`

The route validates that the session matches `table_id` and that the table is active, but
it never checks that `restaurant_id` is the restaurant that table belongs to — it inserts
the client-supplied value verbatim (line 73). A guest with a legitimate session at
restaurant A can post `restaurant_id` = restaurant B and the row lands on **B's** Live
Orders board. B's `restaurant_id` is easy to obtain: it is serialized into the props of
any of B's guest menu pages.

**Fix:** derive it server-side and ignore the client value. The table row is already being
fetched at line 48 — add `restaurant_id` to that select and use `table.restaurant_id` in
the insert.

### 1.4 Open redirect on login
`src/app/login/page.tsx:42`

```ts
router.push(searchParams.get("redirectTo") || "/app");
```

`redirectTo` is unvalidated, so `/login?redirectTo=https://evil.example` sends the user
off-site after a successful login — a credible phishing vector on a real domain. Nothing
in the app generates this parameter (middleware redirects to a bare `/login`), so it is
pure attack surface.

**Fix:** accept only same-origin relative paths — reject anything not matching `/^\/(?!\/)/`.

---

## 2. Correctness bugs users will hit

### 2.1 Analytics silently undercounts past 1000 rows
`src/app/app/Analytics.tsx:61-70`

Fetches 30 days of `table_requests` with `select("*")` and **no `limit`**. PostgREST caps
responses at 1000 rows by default, so any restaurant exceeding 1000 requests in 30 days
(≈33/day — an ordinary week for a real venue) gets silently truncated. Totals, completion
rate, the daily chart, and the type breakdown are all then wrong, with nothing indicating
it.

**Fix:** aggregate server-side (an RPC or a count query per bucket) rather than pulling
raw rows to the browser.

Same class of silent cap elsewhere:
- `LiveOrders.tsx:348` / `KitchenDisplay.tsx:338` — "Today" stats, no limit, same 1000 cap.
- `RequestHistory.tsx:74` — `.limit(500)`. Search and filters only ever see those 500, so
  searching an older table returns nothing. The "N requests" label (line 148) reads as a
  total but is "N of the last 500".
- `LiveOrders.tsx:226` / `KitchenDisplay.tsx:245` — `.limit(100)` on open requests; a
  backlog over 100 silently drops off the board.

### 2.2 Money is float arithmetic, printed unformatted
`src/app/menu/[token]/GuestMenuClient.tsx:374, 648, 758, 818`

`price` is `numeric(10,2)` and arrives as a JS number. Totals are summed with `+` and
rendered raw — no `toFixed(2)`. Two visible consequences on the guest menu:
- Float error surfaces directly: `12.10 + 5.30` renders as `17.400000000000002 kr`.
- Inconsistent formatting: `12.00` renders as `12`, `12.50` as `12.5`.

**Fix:** format at the render boundary (`toFixed(2)` or `Intl.NumberFormat` with the
restaurant's currency), and prefer integer minor units for the arithmetic.

### 2.3 Context menu hover is black in light theme
`src/components/ContextMenu.tsx:182`

```ts
onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2, #1a1a20)")}
```

The variable is `--surface-2` everywhere else in the codebase; `--surface2` is defined
nowhere. The fallback — a near-black `#1a1a20` — therefore always applies, so in light
theme every context-menu row turns near-black on hover with dark text on it. Affects the
right-click menus in Menu Builder and Table Manager.

**Fix:** `var(--surface-2)`.

### 2.4 Flash of light theme on every page load
`src/lib/theme.tsx:19-25`

State initializes to `light` and `localStorage` is only read in a `useEffect` after mount,
so a dark-mode user sees a white flash on every navigation — including the guest menu.
`<html>` carries no theme class during SSR.

**Fix:** the standard blocking inline script in `<head>` that stamps the class from
`localStorage`/`prefers-color-scheme` before first paint.

### 2.5 Kitchen badge counts orders the board is hiding
`src/app/kitchen/KitchenDisplay.tsx:219, 307-310`

The default filter is `food` (`item_request` only), but `freshCount` — driving both the
"Waiting" stat and the browser tab title — counts **all** pending types. So the tab can
read `(5) Kitchen` while the visible board shows zero cards, with no hint that four
waiter/bill/refill requests are filtered out.

**Fix:** count within the active filter, or badge the filter chips with their own counts.

Related: the `drinks` filter maps only to `refill` (line 34). A drink ordered off the menu
is an `item_request`, so it lands under **Food**. The label promises something the data
model can't deliver — drinks aren't distinguishable from food without a category flag on
`menu_items`.

### 2.6 Guest taps that fail silently
`src/app/menu/[token]/GuestMenuClient.tsx:284-298, 334-342`

Both `sendRequest` and `submitCart` only branch on `data.ok`, `409 duplicate_request`, and
`session_invalid`. Every other failure — `429 rate_limited`, `table_closed`, any `500` —
falls through with no toast: spinner stops, cart stays full, nothing happens, no
explanation. A rate-limited guest just sees a dead button.

**Fix:** an `else` branch with a generic failure toast, plus specific copy for `429`.

### 2.7 Hydration mismatch from `sessionStorage` in state initializers
`src/app/menu/[token]/GuestMenuClient.tsx:73-83, 95-108`

`useState(() => sessionStorage.getItem(...))` runs during SSR (throws, caught, returns
`null`) and again on the client (returns the stored value). Different initial state on the
two passes = hydration mismatch, and a returning guest sees the "Request Menu Access"
screen flash before it corrects to "Waiting for staff".

**Fix:** initialize to the server-safe value and hydrate from storage in a mount effect.

### 2.8 Signup dies on a duplicate or non-Latin restaurant name
`src/app/app/SetupRestaurant.tsx:19, 36-45`

`slug` is `not null unique`. Two problems on the first-run path:
- Two restaurants with the same name collide and the raw Postgres error is rendered to the
  user: *duplicate key value violates unique constraint "restaurants_slug_key"*.
- `slugify` strips every non-`[a-z0-9-]` character, so a fully non-Latin name (e.g.
  `日本料理`) yields `""`. The first such restaurant stores an empty slug; the next one
  hits the same unique violation.

**Fix:** append a short random suffix on collision (retry loop), fall back to a generated
slug when `slugify` yields empty, and map the unique-violation error to friendly copy.
`name` should also be `.trim()`ed here — `SettingsPanel` trims, this doesn't.

---

## 3. Behaviour that will surprise staff

### 3.1 "Clear all orders" silently signs out every guest at the table
`src/app/api/table/clear/route.ts:28-36`, menu label at `TableManager.tsx:249`

The endpoint marks pending/seen requests done **and** closes all sessions for that table.
The menu item says only "Clear all orders (N pending will be marked done)". Staff tidying
the board mid-service will kick every guest back to the approval queue without warning.

**Fix:** say so in the label, or split into two actions.

### 3.2 "Close all" leaves sessions open; per-table close doesn't
`src/app/app/TableManager.tsx:185-191` vs `199-210`

`closeTable` calls `/api/session/close-table`; `toggleAll` doesn't. So after "Close all"
every session stays `active` — guests see the closed screen only because `is_active` is
false, and the moment you reopen they are straight back in with no re-approval.

**Fix:** have `toggleAll` invalidate sessions on close, like the single-table path.

### 3.3 Enter confirms a destructive dialog
`src/components/ConfirmDialog.tsx:73`

`autoFocus` sits on the confirm button, which is the red destructive one when
`danger: true`. Trigger a delete, press Enter, it's gone. There is also no Escape handler
(click-outside only) and no focus trap — `ContextMenu` handles Escape, this doesn't.

**Fix:** `autoFocus` on Cancel for `danger`, and add an Escape listener.

### 3.4 The kitchen screen cannot report failures
`src/app/kitchen/page.tsx:24`, `KitchenDisplay.tsx:294-305`

`KitchenDisplay` is rendered with no `ToastProvider` and no `ErrorBoundary` (unlike every
tab in `AppShell`). On a failed status update `move()` just calls `load()` — the card
silently reappears and the cook has no idea the tap didn't take. Contradicts the
"never ignore a Supabase `{ error }`" rule in CLAUDE.md.

**Fix:** wrap the kitchen tree in `ToastProvider` + `ErrorBoundary` and surface the error.

### 3.5 Newly added tables jump to the bottom of the list
`src/app/app/TableManager.tsx:168`

Load sorts with `localeCompare(..., { numeric: true })`; `addTable` appends. Add "Table 2"
to a list containing "Table 10" and the ordering is wrong until a reload.

**Fix:** re-apply the same sort after insert.

### 3.6 Reorder writes are non-atomic and roll back to stale state
`src/app/app/MenuBuilder.tsx:372-379` (items), `592-598` (categories)

One `UPDATE` per row via `Promise.all`. A partial failure leaves the database in a mixed
order, and the rollback (`setAllItems(allItems)`) restores the *pre-drag local* array —
which no longer matches what actually persisted.

**Fix:** a single batched `upsert`, then reload from the server on failure rather than
restoring a local snapshot.

---

## 4. Data-layer inconsistencies

- **`types.ts:10`** declares `currency?: string` optional; the schema has it
  `not null default 'SEK'`. The optionality is what keeps the dead localStorage fallbacks
  in 5.1 alive.
- **`AppShell.tsx:65-73`** refetches the restaurant on every tab change. Because each tab
  is conditionally mounted and every panel seeds state via `useState(restaurant.x)`, a
  panel mounts with the *old* object and never picks up the refetch that resolves after
  it. Works today only because switching away unmounts the panel first. Fragile: an edit
  followed immediately by a tab switch can have the refetch read pre-commit values.
- **`TableManager.tsx:79`** — effect keyed on `[tables, ...]`, a new array identity on
  every mutation, so every add/delete/toggle refires a 200-row query.
- **`admin.ts:5`** — `createAdminClient()` omits
  `{ auth: { persistSession: false, autoRefreshToken: false } }` (recommended for
  service-role server clients) and builds a fresh client per call.
- **`auth/callback/route.ts:9`** — `exchangeCodeForSession` result is discarded; on failure
  the user is redirected to `/app`, bounced by middleware to `/login`, with no explanation.

---

## 5. Dead code and cruft

### 5.1 The currency localStorage mechanism is entirely dead
`SettingsPanel.tsx:53,321` · `MenuBuilder.tsx:83,500` · `GuestMenuClient.tsx:178`

Written and read in three files, but `restaurant.currency` is `not null` so the DB value
always wins and the fallback never executes. On the guest side it could never have worked
— the key lives in *staff* browser storage, not the guest's. Almost certainly the cause of
the old "currency reverts to SEK" symptom fixed in `278a892`.

### 5.2 `OnboardingChecklist` is never rendered
`src/app/app/OnboardingChecklist.tsx` (122 lines)

Not imported anywhere — verified across the tree. New users never see the onboarding
checklist that was built for them. Its dependency
`localStorage["menuqr_printed_qr"]`, written at `PrintQRClient.tsx:44`, is therefore also
dead.

**Decision needed:** wire it into `AppShell` or delete it. Currently it is neither.

### 5.3 Unused Supabase client on the guest menu
`GuestMenuClient.tsx:62` — `createClient()` is called and never used; all guest traffic
goes through `fetch` to API routes. Removing it makes the case for 1.2 self-evident.

### 5.4 `/auth/signout` route is unreachable
`src/app/auth/signout/route.ts` — `AppShell.tsx:109` signs out client-side instead. No
caller anywhere.

### 5.5 The `slug` is collected, previewed, and never used
`SetupRestaurant.tsx:81` shows "Preview: menuqr.app/**{slug}**", but no `/[slug]` route
exists — the column is write-only. The preview promises a URL that 404s.

### 5.6 Duplicate currency control
A second currency dropdown lives in the Menu Builder sidebar (`MenuBuilder.tsx:495-509`)
and writes the same column as the Settings one. Two sources of truth for one setting.

### 5.7 Redundant duplicated state
`MenuBuilder.tsx:51-52` — `items` and `allItems` are set identically on load and on every
mutation, so they are always the same array. One of them can go.

### 5.8 Fonts loaded twice; Tailwind imported but unused
`globals.css:1-2` `@import`s Tailwind and Google Fonts, while `layout.tsx:6` also loads
Inter via `next/font/google`. Inter is fetched twice, the CSS `@import url()` is
render-blocking and defeats `next/font` optimization, and Tailwind ships its preflight for
a codebase that (per CLAUDE.md) uses no Tailwind classes.

---

## 6. SettingsPanel — reported earlier, another agent is on it

Listed for completeness; the file has uncommitted changes so these may already be fixed.

- Accent-color free-text input has no validation and feeds the guest menu's CSS directly
  (`:212` → `GuestMenuClient.tsx:171`). Typing `hello` saves and breaks the live menu.
- `handleDelete` (`:150-153`) ignores four Supabase `{ error }` values. Those four deletes
  are also redundant — every child table cascades from `restaurants`.
- Blanking the restaurant name silently saves nothing (`:118`), no feedback.

---

## Not defects

Checked and found correct, recorded so they aren't re-investigated:

- Quick actions render in a fixed order on the guest side regardless of Settings toggle
  order (`GuestMenuClient.tsx:550-554`).
- All staff API routes verify ownership via `auth-helpers.ts`; middleware covers `/app/*`
  and `/kitchen/*` (`/app/:path*` does match `/app` itself).
- Item reorder correctly leaves other categories' `sort_order` untouched
  (`MenuBuilder.tsx:364-367`).
- Guest menu pages are `noindex` (`menu/[token]/page.tsx:21`); `robots.ts` disallows
  `/app`, `/api`, `/kitchen`.
- The realtime + 12s polling fallback pattern in both boards is sound.
