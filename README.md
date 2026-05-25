# MenuQR

Digital menu & table ordering system. Guests scan a QR code at their table and can browse the menu, order items, ask for the waiter, request the bill, and more — all without an app.

## Stack

- **Next.js 15** + TypeScript + Tailwind v4
- **Supabase** — Auth, Postgres, Realtime
- **Vercel** — deployment

## Project location

`C:\Users\sargo\Documents\Project\menuqr\`

## Setup

### 1. Supabase

1. Go to [supabase.com](https://supabase.com) → New project
2. Once created, go to **SQL Editor** → paste and run `supabase-schema.sql`
3. Go to **Project Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`
4. Go to **Authentication → URL Configuration**:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**` and `http://localhost:3000/**`

### 2. Local dev

Fill in `.env.local`, then:

```bash
npm install
npm run dev
```

### 3. Deploy to Vercel

```bash
gh repo create Sheggyb/menuqr --public --source=. --push
```

Then connect repo on vercel.com and add the 3 env vars before deploying.

## How it works

1. Owner signs up → creates restaurant → adds menu categories + items
2. Owner adds tables → each gets a unique QR code (download PNG)
3. Guest scans QR → sees live menu → taps to request waiter, bill, refill, or a specific item
4. Owner dashboard shows live requests via Supabase Realtime — mark seen / done

## File structure

```
src/app/
  page.tsx               # Landing page
  login/                 # Auth
  signup/
  auth/callback/
  auth/signout/
  app/
    page.tsx             # Server: load restaurant
    AppShell.tsx         # Tab shell (orders/menu/tables)
    SetupRestaurant.tsx  # First-time setup
    LiveOrders.tsx       # Real-time orders dashboard
    MenuBuilder.tsx      # Add/edit menu categories + items
    TableManager.tsx     # Add tables, generate QR codes
  menu/[token]/
    page.tsx             # Server: load table + menu data
    GuestMenuClient.tsx  # Guest mobile UI
```
