import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ─── CORS for /api/v1/* (B2B API — external access) ────
  if (pathname.startsWith("/api/v1/")) {
    // Handle preflight OPTIONS request
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // For actual requests, add CORS headers
    const apiResponse = NextResponse.next({ request: { headers: request.headers } });
    apiResponse.headers.set("Access-Control-Allow-Origin", "*");
    apiResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    apiResponse.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");

    // ─── RBAC: Route-level role hints via header ────
    // Actual enforcement is in each API route, but we set a hint header
    // so routes can quickly check the required access level.
    if (pathname.startsWith("/api/v1/admin/")) {
      apiResponse.headers.set("X-Required-Role", "admin");
    } else if (pathname.startsWith("/api/v1/billing/") || pathname.startsWith("/api/v1/team/")) {
      apiResponse.headers.set("X-Required-Role", "manager");
    } else if (pathname.startsWith("/api/v1/")) {
      apiResponse.headers.set("X-Required-Role", "analyst");
    }

    return apiResponse;
  }

  if (pathname === "/auth/callback") {
    return NextResponse.next({
      request: { headers: request.headers },
    });
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // ─── Security Headers ────
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refresh session if expired and sync cookies with response
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
