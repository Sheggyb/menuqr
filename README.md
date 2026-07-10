# MenuQR

Digital menu & table ordering for restaurants, cafés, and takeaways. Guests scan a QR code at their table and can browse the menu, order items, call the waiter, or request the bill — straight from their phone, no app and no login. Staff see every request live on a realtime dashboard.

## Features

- **QR code per table** — generate, download, and print-ready sheets
- **Guest approval flow** — staff approve each scanning guest before they can order
- **Live orders board** — realtime kanban (New / In progress) with sound alerts and keyboard shortcuts
- **Menu builder** — categories, items, prices, images, availability toggles, drag reorder
- **Analytics** — 7/30-day volumes, completion rate, request-type breakdown
- **Multi-currency, custom accent color, light/dark theme, venue types** (table service / café / takeaway)

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Supabase** — Auth (SSR cookies), Postgres with RLS, Realtime
- Inline styles + CSS custom properties for theming (no UI library)

## Setup

### 1. Supabase

1. [supabase.com](https://supabase.com) → New project
2. **SQL Editor** → paste and run `supabase-schema.sql` (idempotent — safe to re-run on upgrades)
3. **Project Settings → API** → copy the values into `.env.local` (see step 2)
4. **Authentication → URL Configuration**:
   - Site URL: your production URL
   - Redirect URLs: `https://your-domain/**` and `http://localhost:3000/**`

### 2. Local dev

```bash
cp .env.example .env.local   # then fill in the Supabase values
npm install
npm run dev
```

### 3. Quality checks

```bash
npm run typecheck   # TypeScript
npm run build       # production build
```

### 4. Deploy

Any Next.js host works (Vercel recommended). Set the four env vars from `.env.example`, including `NEXT_PUBLIC_SITE_URL` (used for SEO metadata and the sitemap).

## How it works

1. Owner signs up → creates a restaurant → builds the menu
2. Owner adds tables → each gets a unique QR code
3. Guest scans the QR → requests access → staff approve on the dashboard
4. Guest orders items or taps quick actions (waiter / bill / refill)
5. Requests stream to the Live Orders board via Supabase Realtime

## Security model

- The owner dashboard (`/app/*`) is gated by Supabase SSR auth middleware.
- Guest API routes validate input, verify the approved session, and are rate limited.
- Staff API routes (approve/decline sessions, clear/close tables, pending list) verify that the authenticated user owns the restaurant before acting.
- The service-role key is used server-side only (`src/lib/supabase/admin.ts`); never expose it to the browser.

## File structure

```
src/
  middleware.ts            # Auth gate for /app/*
  app/
    page.tsx               # Landing page
    privacy/  terms/       # Legal pages
    login/  signup/  auth/ # Auth flows
    robots.ts  sitemap.ts  opengraph-image.tsx
    app/                   # Owner dashboard
      AppShell.tsx         # Tab shell + realtime + mobile nav
      LiveOrders.tsx       # Realtime orders kanban
      MenuBuilder.tsx      # Menu CRUD
      TableManager.tsx     # Tables, QR codes, guest sessions
      Analytics.tsx  RequestHistory.tsx  SettingsPanel.tsx
      SetupRestaurant.tsx  OnboardingChecklist.tsx
      print-qr/            # Printable QR sheet
    menu/[token]/          # Guest-facing menu (mobile-first)
    api/                   # Guest + staff endpoints (validated, rate limited)
  components/              # Toast, ConfirmDialog, Skeleton, ContextMenu, ErrorBoundary
  lib/                     # supabase clients, auth-helpers, validate, ratelimit, constants, types
supabase-schema.sql        # Complete idempotent database schema
```
