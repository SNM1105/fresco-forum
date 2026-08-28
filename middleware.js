import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Keeps the Supabase session cookie fresh on every request so server
// components always see an up-to-date auth.uid(). Also redirects signed-out
// users away from pages that require an account.
const PROTECTED_PREFIXES = ["/create", "/profile/me", "/admin", "/profile/edit"];

export async function middleware(request) {
  try {
    // Skip middleware for static assets
    if (request.nextUrl.pathname.startsWith("/_next/") || request.nextUrl.pathname.startsWith("/public/")) {
      return NextResponse.next();
    }

    let response = NextResponse.next({ request: { headers: request.headers } });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request: { headers: request.headers } });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const needsAuth = PROTECTED_PREFIXES.some((p) => request.nextUrl.pathname.startsWith(p));
    if (needsAuth && !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    return response;
  } catch (error) {
    // If middleware fails, allow the request to proceed
    // This prevents 500 errors and lets the page handle auth on the client side
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
