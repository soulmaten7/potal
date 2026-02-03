import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../utils/supabase/server";

const AUTH_CODE_ERROR_PATH = "/auth/auth-code-error";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const origin = requestUrl.origin;

  // Always send user to home after successful session exchange so cookies are set on same origin
  const homeUrl = `${origin}/`;
  const successRedirect =
    next && next.startsWith("http")
      ? next
      : next && next.startsWith("/")
        ? `${origin}${next}`
        : next
          ? `${origin}/${next}`
          : homeUrl;

  const cookieStore = await cookies();

  if (!code) {
    return NextResponse.redirect(successRedirect);
  }

  const response = NextResponse.redirect(homeUrl);

  try {
    const supabase = createServerSupabaseClient(cookieStore, response);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("auth/callback exchangeCodeForSession error:", error);
      return NextResponse.redirect(`${origin}${AUTH_CODE_ERROR_PATH}`);
    }
  } catch (err) {
    console.error("auth/callback error:", err);
    return NextResponse.redirect(`${origin}${AUTH_CODE_ERROR_PATH}`);
  }

  return response;
}
