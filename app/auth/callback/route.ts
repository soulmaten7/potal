import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "../../../utils/supabase/server";
import { createApiKey } from "@/app/lib/api-auth/keys";

const AUTH_CODE_ERROR_PATH = "/auth/auth-code-error";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  const cookieStore = await cookies();

  if (!code) {
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  const response = NextResponse.redirect(`${origin}/dashboard`);

  try {
    const supabase = createServerSupabaseClient(cookieStore, response);
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !sessionData?.user) {
      return NextResponse.redirect(`${origin}${AUTH_CODE_ERROR_PATH}`);
    }

    const user = sessionData.user;
    const userId = user.id;
    const email = user.email || "";
    const meta = user.user_metadata || {};

    // Check if seller record already exists
    const service = getServiceClient();
    const { data: existingSeller } = await (service
      .from("sellers") as any)
      .select("id")
      .eq("id", userId)
      .single();

    if (existingSeller) {
      // Seller exists → go to dashboard
      return response;
    }

    // No seller record — check if user_metadata has profile info (email signup)
    const companyName = meta.company_name;
    const country = meta.country;
    const industry = meta.industry;

    if (companyName && country && industry) {
      // Email signup with metadata → create seller + API keys automatically
      const trialExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { error: sellerError } = await (service
        .from("sellers") as any)
        .insert({
          id: userId,
          email,
          company_name: companyName,
          country: typeof country === "string" ? country.toUpperCase() : country,
          industry,
          plan_id: "free",
          subscription_status: "active",
          trial_type: "monthly",
          trial_expires_at: trialExpiresAt,
        });

      if (!sellerError) {
        try {
          await createApiKey(service as any, {
            sellerId: userId,
            type: "publishable",
            name: "Default Publishable Key",
            rateLimitPerMinute: 60,
          });
          await createApiKey(service as any, {
            sellerId: userId,
            type: "secret",
            name: "Default Secret Key",
            rateLimitPerMinute: 60,
          });
        } catch {
          // Keys failed but seller was created — user can generate from dashboard
        }
      }

      return response; // → /dashboard
    }

    // Google OAuth without profile info → redirect to complete-profile
    return NextResponse.redirect(`${origin}/auth/complete-profile`);
  } catch {
    return NextResponse.redirect(`${origin}${AUTH_CODE_ERROR_PATH}`);
  }
}
