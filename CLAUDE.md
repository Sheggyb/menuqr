@AGENTS.md

# MenuQR conventions

- **Next.js 16 App Router** (breaking changes vs 15 — see AGENTS.md), React 19, TypeScript strict.
- **Styling**: inline `style={{}}` objects + CSS custom properties from `src/app/globals.css` (`var(--bg)`, `var(--card)`, `var(--text)`, `var(--text-muted)`, `var(--border)`, `var(--accent)`). No Tailwind classes, no CSS modules. Light/dark themes via `.light`/`.dark` on `<html>` (`src/lib/theme.tsx`).
- **Shared constants** (request-type labels, currency symbols) live in `src/lib/constants.ts` — don't redeclare per component.
- **User feedback**: use `useToast()` from `src/components/Toast.tsx` for mutation success/error; `useConfirm()` from `src/components/ConfirmDialog.tsx` for destructive actions. Never ignore a Supabase `{ error }`.
- **API routes**: guest endpoints validate input with `src/lib/validate.ts` and rate limit with `src/lib/ratelimit.ts`; staff endpoints must verify ownership via `src/lib/auth-helpers.ts`. The admin (service-role) client is server-only.
- **Database**: `supabase-schema.sql` is the source of truth and must stay idempotent. If code starts depending on a new table/column, add it to the schema file in the same change.
- **Verify**: `npm run typecheck` and `npm run build` before considering work done. (`npx tsc` does not work here; the npm script does.)
