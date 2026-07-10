import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Server-side ownership checks for staff API routes.
// Returns null when the caller is not authenticated or does not own the resource.

export async function getAuthedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Verify the authenticated user owns the given restaurant. */
export async function requireRestaurantOwner(restaurantId: string) {
  const user = await getAuthedUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("restaurants")
    .select("id")
    .eq("id", restaurantId)
    .eq("owner_id", user.id)
    .single();
  return data ? { user } : null;
}

/** Verify the authenticated user owns the restaurant the table belongs to. */
export async function requireTableOwner(tableId: string) {
  const user = await getAuthedUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: table } = await admin
    .from("restaurant_tables")
    .select("id, restaurant_id, restaurants!inner(owner_id)")
    .eq("id", tableId)
    .single();
  const ownerId = (table as { restaurants?: { owner_id?: string } } | null)
    ?.restaurants?.owner_id;
  if (!table || ownerId !== user.id) return null;
  return { user, restaurantId: table.restaurant_id as string };
}

/** Verify the authenticated user owns the restaurant a session belongs to. */
export async function requireSessionOwner(sessionId: string) {
  const user = await getAuthedUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: session } = await admin
    .from("table_sessions")
    .select("session_id, restaurant_id, restaurants!inner(owner_id)")
    .eq("session_id", sessionId)
    .single();
  const ownerId = (session as { restaurants?: { owner_id?: string } } | null)
    ?.restaurants?.owner_id;
  if (!session || ownerId !== user.id) return null;
  return { user, restaurantId: session.restaurant_id as string };
}
