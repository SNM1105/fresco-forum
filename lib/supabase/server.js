import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Used inside server components, server actions, and route handlers —
// reads/writes go through RLS as the signed-in user, cookies carry the
// session. Do not use this for admin-only operations; see server-admin.js.
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component with no writable cookies —
            // safe to ignore as long as middleware.js is refreshing sessions.
          }
        },
      },
    }
  );
}
