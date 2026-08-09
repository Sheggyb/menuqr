import { createClient } from "@supabase/supabase-js";

// Service role client — bypasses RLS, use only server-side for guest page reads
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    // Server-only usage: no session persistence or token refresh (audit 4)
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
