# MenuQR — verification check: REVIEW-FINDINGS-2026-08-14.md (2026-08-22)

Status check of the 5 bugs documented in REVIEW-FINDINGS-2026-08-14.md against the
current state of `main`.

**Verdict: all 5 findings are STILL PRESENT in the code on GitHub main.**

## How this was verified

- Local clone pulled to `4dc1e9d` (fast-forward) — identical to `origin/main`.
- Raw files fetched directly from `raw.githubusercontent.com/Sheggyb/menuqr/main/...`
  and read in full context (not grep-only) — same result.
- Commit history checked: the last commit touching any source file is
  `96f5e4d` (2026-08-11) — the exact commit the review was done against.
  Everything after is docs-only (`ede2d9c` added the findings doc, `4dc1e9d`
  deleted it).

## Evidence per finding (current code on main)

### 1.1 Hardcoded "+kr" placeholder — STILL PRESENT
`src/app/app/MenuBuilder.tsx:1319`

```tsx
placeholder="+kr"
```

`currencySymbol` is in scope (line 102: `const currencySymbol = CURRENCIES[currency] ?? currency;`)
and the main price field uses it correctly (line 916: `placeholder={`Price (${currencySymbol})`}`),
but the choice price-delta input at line 1319 was never switched to it.

**Expected fix:** `placeholder={`+${currencySymbol}`}`

### 1.2 Duplicated currency map — STILL PRESENT
`src/app/menu/[token]/GuestMenuClient.tsx:197-198`

```tsx
const map: Record<string, string> = { SEK: "kr", USD: "$", EUR: "€", GBP: "£", NOK: "kr", DKK: "kr", CHF: "CHF", JPY: "¥", AUD: "$", CAD: "$" };
```

The component imports `EU_ALLERGENS, allergenLabel` from `@/lib/constants` (line 4)
but NOT `CURRENCIES` / `currencySymbol`. The canonical map still lives only in
`src/lib/constants.ts:10-15`; the inline copy was not removed.

**Expected fix:** import `CURRENCIES` / `currencySymbol` from `@/lib/constants`,
delete the inline map.

### 1.3 Client-supplied total_price stored verbatim — STILL PRESENT
`src/app/api/order/route.ts:36-40`

```ts
// Optional client-computed total (item_request only) — validated, never trusted blindly
const rawTotal = body.total_price;
const total_price = typeof rawTotal === "number" && Number.isFinite(rawTotal) && rawTotal >= 0 && rawTotal <= 1_000_000
  ? Math.round(rawTotal * 100) / 100
  : null;
```

The comment was reworded (previously "accepted from the client, validated only as...")
but the code path is identical: a guest can POST any `total_price` between 0 and
1,000,000 and it is stored verbatim. No server-side recompute from item prices exists.

### 1.4 Comma in choice label breaks kitchen ticket parsing — STILL PRESENT
`src/lib/order-lines.ts:82`

```ts
for (const part of optionBlob.split(",")) {
```

No label validation (rejecting `,` / `(` / `)`) was added anywhere — searched
MenuBuilder.tsx, GuestMenuClient.tsx, order-lines.ts: zero hits for any
forbid/reject/character-sanitization on labels.

### 1.5 "kr" fallback — STILL PRESENT
`src/app/menu/[token]/GuestMenuClient.tsx:199`

```tsx
return map[restaurant.currency] ?? restaurant.currency ?? "kr";
```

## Why the "fixed" commit doesn't hold up

Commit `4dc1e9d` — "chore: remove REVIEW-FINDINGS-2026-08-14.md — all findings
verified fixed in current code" — deletes the findings doc but changes ZERO source
files. Full commit list since the review:

```
4dc1e9d  chore: remove REVIEW-FINDINGS-2026-08-14.md — all findings verified fixed in current code
ede2d9c  docs: add REVIEW-FINDINGS-2026-08-14.md — AI-review handoff (bugs + roadmap status + ideas)
96f5e4d  feat: structured order tickets on Live Orders + Kitchen   <- last CODE commit, reviewed one
```

If fixes were made on another machine or branch, they never reached GitHub.
Please re-verify and push the actual code changes.
