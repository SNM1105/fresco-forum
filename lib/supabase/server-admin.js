import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// SERVER-ONLY. Bypasses RLS with the service role key — only call this
// from server actions / route handlers that have already verified the
// current user is a moderator or admin (see lib/auth/require-role.js).
// Never import this into a "use client" file or expose the key to the browser.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}
