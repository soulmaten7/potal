/**
 * POTAL API v1 — /api/v1/sellers/complete-oauth-profile
 *
 * Completes profile for Google OAuth users who signed up without
 * company/country/industry info. Creates seller record + API keys.
 *
 * POST /api/v1/sellers/complete-oauth-profile
 * Body: { companyName, country, industry }
 * Auth: Supabase session cookie (logged-in user)
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { createApiKey } from "@/app/lib/api-auth/keys";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey);
}

const VALID_INDUSTRIES = [
  "ecommerce_seller", "logistics_freight", "customs_broker",
  "marketplace_operator", "developer", "other",
];

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const dummyResponse = {
      cookies: {
        set: (_name: string, _value: string, _options?: object) => { /* noop */ },
      },
    };
    const supabase = createServerSupabaseClient(cookieStore, dummyResponse);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { message: "Not authenticated. Please sign in first." } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { companyName, country, industry } = body;

    if (!companyName || !companyName.trim()) {
      return NextResponse.json(
        { success: false, error: { message: "Company name is required." } },
        { status: 400 }
      );
    }
    if (!country || typeof country !== "string" || country.length !== 2) {
      return NextResponse.json(
        { success: false, error: { message: "Country (ISO 2-letter code) is required." } },
        { status: 400 }
      );
    }
    if (!industry || !VALID_INDUSTRIES.includes(industry)) {
      return NextResponse.json(
        { success: false, error: { message: `Industry is required. Options: ${VALID_INDUSTRIES.join(", ")}` } },
        { status: 400 }
      );
    }

    const service = getServiceClient();
    const userId = user.id;
    const email = user.email || "";

    // Check if seller already exists
    const { data: existing } = await (service
      .from("sellers") as any)
      .select("id")
      .eq("id", userId)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        data: { message: "Profile already exists.", sellerId: userId },
      });
    }

    const trialExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Create seller record
    const { error: sellerError } = await (service
      .from("sellers") as any)
      .insert({
        id: userId,
        email,
        company_name: companyName.trim(),
        country: country.toUpperCase(),
        industry,
        plan_id: "free",
        subscription_status: "active",
        trial_type: "monthly",
        trial_expires_at: trialExpiresAt,
      });

    if (sellerError) {
      return NextResponse.json(
        { success: false, error: { message: "Failed to create seller profile.", detail: sellerError?.message || sellerError?.code || JSON.stringify(sellerError) } },
        { status: 500 }
      );
    }

    // Auto-generate API keys
    let keys = null;
    try {
      const pk = await createApiKey(service as any, {
        sellerId: userId,
        type: "publishable",
        name: "Default Publishable Key",
        rateLimitPerMinute: 60,
      });
      const sk = await createApiKey(service as any, {
        sellerId: userId,
        type: "secret",
        name: "Default Secret Key",
        rateLimitPerMinute: 60,
      });
      keys = {
        publishable: { fullKey: pk.fullKey, prefix: pk.prefix },
        secret: { fullKey: sk.fullKey, prefix: sk.prefix },
      };
    } catch {
      // Keys failed but seller was created — user can generate from dashboard
    }

    return NextResponse.json({
      success: true,
      data: {
        message: "Profile completed! Welcome to POTAL.",
        sellerId: userId,
        email,
        keys,
        trial: { type: "monthly", expiresAt: trialExpiresAt },
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: "Internal server error." } },
      { status: 500 }
    );
  }
}
