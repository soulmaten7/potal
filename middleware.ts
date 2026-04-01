import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function applySecurityHeaders(res: NextResponse) {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://*.vercel-scripts.com https://*.vercel-insights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co https://*.vercel-insights.com wss://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  return res;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ─── CORS for /api/v1/* (B2B API — external access) ────
  if (pathname.startsWith("/api/v1/")) {
    // Session-based endpoints: restrict CORS to potal.app only
    const isSessionEndpoint = pathname.startsWith("/api/v1/community/") ||
      pathname.startsWith("/api/v1/sellers/") ||
      pathname.startsWith("/api/v1/admin/");
    const origin = request.headers.get("Origin") || "";
    const allowedOrigins = ["https://potal.app", "https://www.potal.app"];
    const corsOrigin = isSessionEndpoint
      ? (allowedOrigins.includes(origin) ? origin : allowedOrigins[0])
      : "*";

    // Handle preflight OPTIONS request
    if (request.method === "OPTIONS") {
      return applySecurityHeaders(new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": corsOrigin,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
          "Access-Control-Max-Age": "86400",
          ...(isSessionEndpoint ? { "Vary": "Origin" } : {}),
        },
      }));
    }

    // For actual requests, add CORS headers
    const apiResponse = NextResponse.next({ request: { headers: request.headers } });
    apiResponse.headers.set("Access-Control-Allow-Origin", corsOrigin);
    apiResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    apiResponse.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");
    if (isSessionEndpoint) apiResponse.headers.set("Vary", "Origin");

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

    return applySecurityHeaders(apiResponse);
  }

  if (pathname === "/auth/callback") {
    return applySecurityHeaders(NextResponse.next({
      request: { headers: request.headers },
    }));
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // ─── Security Headers ────
  applySecurityHeaders(response);

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
  // Fail-open: if Supabase is slow/down, skip auth check and let the request through
  try {
    await Promise.race([
      supabase.auth.getUser(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Supabase auth timeout")), 5000)
      ),
    ]);
  } catch {
    // Timeout or network error — pass request through without auth refresh
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
