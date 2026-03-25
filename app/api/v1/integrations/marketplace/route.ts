/**
 * POTAL API v1 — /api/v1/integrations/marketplace
 *
 * Marketplace integration management with full OAuth flow.
 * C1: OAuth URL generation + callback token exchange
 * C2: AES-256-CBC token encryption
 * C3: Product sync stub
 * C4: Auto token refresh
 * C5: Connection health check
 * C6: Bidirectional disconnect
 * C7: Webhook topic info
 *
 * GET  — List connections + health status
 * POST — Connect/disconnect/configure/sync/oauth-callback
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';
import {
  MARKETPLACE_CONFIGS,
  generateOAuthUrl,
  decodeOAuthState,
  exchangeCodeForTokens,
  encryptToken,
  checkConnectionHealth,
  disconnectMarketplace,
  syncMarketplaceProducts,
  getWebhookTopics,
  getWebhookEndpoint,
} from '@/app/lib/integrations/marketplace';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── GET: List connections with health ──────────────

export const GET = withApiAuth(async (_req: NextRequest, context: ApiAuthContext) => {
  const supabase = getSupabase();
  if (!supabase) return apiError(ApiErrorCode.INTERNAL_ERROR, 'Database unavailable.');

  try {
    const { data } = await supabase
      .from('marketplace_connections')
      .select('id, marketplace, region, status, settings, shop_domain, external_seller_id, token_expires_at, last_sync_at, error_message, created_at, updated_at')
      .eq('seller_id', context.sellerId)
      .order('created_at', { ascending: false });

    const connections = await Promise.all((data || []).map(async (c: Record<string, unknown>) => {
      const marketplace = String(c.marketplace ?? '');
      const health = await checkConnectionHealth(context.sellerId, marketplace);
      return {
        id: c.id,
        marketplace,
        marketplaceName: MARKETPLACE_CONFIGS[marketplace]?.name || marketplace,
        region: c.region,
        status: c.status,
        health,
        shopDomain: c.shop_domain || null,
        externalSellerId: c.external_seller_id || null,
        settings: c.settings || {},
        lastSync: c.last_sync_at || null,
        errorMessage: c.error_message || null,
        connectedAt: c.created_at,
        updatedAt: c.updated_at,
        webhookTopics: getWebhookTopics(marketplace),
        webhookEndpoint: getWebhookEndpoint(marketplace),
      };
    }));

    return apiSuccess(
      {
        connections,
        total: connections.length,
        availableMarketplaces: Object.entries(MARKETPLACE_CONFIGS).map(([key, config]) => ({
          id: key,
          name: config.name,
          regions: config.regions,
          features: config.features,
          requiresOAuth: config.authUrl.length > 0,
        })),
      },
      { sellerId: context.sellerId, plan: context.planId }
    );
  } catch {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to retrieve marketplace connections.');
  }
});

// ─── POST: Connect/Disconnect/Configure/Sync/Callback

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const marketplace = typeof body.marketplace === 'string' ? body.marketplace.toLowerCase().trim() : '';
  const action = typeof body.action === 'string' ? body.action.toLowerCase().trim() : '';

  if (!marketplace && action !== 'oauth_callback') {
    return apiError(ApiErrorCode.BAD_REQUEST, '"marketplace" is required.');
  }

  if (marketplace && !MARKETPLACE_CONFIGS[marketplace]) {
    return apiError(ApiErrorCode.BAD_REQUEST,
      `Unsupported marketplace "${marketplace}". Supported: ${Object.keys(MARKETPLACE_CONFIGS).join(', ')}`);
  }

  const validActions = ['connect', 'disconnect', 'configure', 'sync', 'health', 'oauth_callback'];
  if (!validActions.includes(action)) {
    return apiError(ApiErrorCode.BAD_REQUEST, `"action" must be: ${validActions.join(', ')}`);
  }

  const supabase = getSupabase();
  if (!supabase) return apiError(ApiErrorCode.INTERNAL_ERROR, 'Database unavailable.');

  // ── C1: Connect (generate OAuth URL) ──────────────
  if (action === 'connect') {
    const config = MARKETPLACE_CONFIGS[marketplace];
    const region = typeof body.region === 'string' ? body.region.toUpperCase() : 'US';
    const credentials = body.credentials as Record<string, string> | undefined;
    const settings = body.settings as Record<string, unknown> | undefined;

    if (!config.regions.includes(region)) {
      return apiError(ApiErrorCode.BAD_REQUEST,
        `Region "${region}" not available for ${config.name}. Available: ${config.regions.join(', ')}`);
    }

    // Check required params
    for (const param of config.requiredParams) {
      if (!credentials?.[param]) {
        return apiError(ApiErrorCode.BAD_REQUEST, `"credentials.${param}" is required for ${config.name}.`);
      }
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.potal.app'}/api/v1/integrations/marketplace/callback`;

    // Generate OAuth URL
    const oauthResult = generateOAuthUrl(marketplace, context.sellerId, redirectUri, credentials);
    if ('error' in oauthResult) {
      return apiError(ApiErrorCode.BAD_REQUEST, oauthResult.error);
    }

    // If credentials include API key/secret directly (non-OAuth like Walmart)
    if (credentials?.apiKey || credentials?.clientId) {
      const tokenData: Record<string, unknown> = {
        seller_id: context.sellerId,
        marketplace,
        region,
        status: 'connected',
        settings: settings || { autoCalculateDuty: true, autoClassifyHs: true, syncOrders: true },
        external_seller_id: credentials?.sellerId || null,
        shop_domain: credentials?.shop || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Encrypt and store API credentials
      if (credentials?.apiKey) {
        tokenData.access_token_encrypted = encryptToken(credentials.apiKey);
      }
      if (credentials?.apiSecret || credentials?.clientSecret) {
        tokenData.refresh_token_encrypted = encryptToken(credentials.apiSecret || credentials.clientSecret);
      }

      const { error } = await supabase
        .from('marketplace_connections')
        .upsert(tokenData, { onConflict: 'seller_id,marketplace,region' });

      if (error) {
        return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to save connection.');
      }

      return apiSuccess({
        marketplace,
        marketplaceName: config.name,
        region,
        status: 'connected',
        action: 'connect',
        method: 'api_key',
        features: config.features,
      }, { sellerId: context.sellerId, plan: context.planId });
    }

    // OAuth flow — save pending connection + return auth URL
    await supabase.from('marketplace_connections').upsert({
      seller_id: context.sellerId,
      marketplace,
      region,
      status: 'pending_oauth',
      settings: settings || { autoCalculateDuty: true, autoClassifyHs: true, syncOrders: true },
      shop_domain: credentials?.shop || null,
      external_seller_id: credentials?.sellerId || null,
      created_at: new Date().toISOString(),
    }, { onConflict: 'seller_id,marketplace,region' });

    return apiSuccess({
      marketplace,
      marketplaceName: config.name,
      region,
      status: 'pending_oauth',
      action: 'connect',
      method: 'oauth',
      oauthUrl: oauthResult.url,
      state: oauthResult.state,
      redirectUri,
      instructions: `Redirect user to oauthUrl. After authorization, callback will complete the connection.`,
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  // ── C1: OAuth Callback ────────────────────────────
  if (action === 'oauth_callback') {
    const code = typeof body.code === 'string' ? body.code : '';
    const state = typeof body.state === 'string' ? body.state : '';

    if (!code || !state) {
      return apiError(ApiErrorCode.BAD_REQUEST, '"code" and "state" required for oauth_callback.');
    }

    const stateData = decodeOAuthState(state);
    if (!stateData) {
      return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid OAuth state parameter.');
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.potal.app'}/api/v1/integrations/marketplace/callback`;

    // Get shop domain from pending connection
    const { data: pendingConn } = await supabase
      .from('marketplace_connections')
      .select('shop_domain')
      .eq('seller_id', stateData.sellerId)
      .eq('marketplace', stateData.marketplace)
      .single();

    const tokens = await exchangeCodeForTokens(
      stateData.marketplace, code, redirectUri,
      pendingConn?.shop_domain ? { shop: String(pendingConn.shop_domain) } : undefined,
    );

    if ('error' in tokens) {
      return apiError(ApiErrorCode.INTERNAL_ERROR, tokens.error);
    }

    // C2: Encrypt tokens before storage
    await supabase.from('marketplace_connections').update({
      access_token_encrypted: encryptToken(tokens.accessToken),
      refresh_token_encrypted: tokens.refreshToken ? encryptToken(tokens.refreshToken) : null,
      token_expires_at: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(),
      status: 'connected',
      updated_at: new Date().toISOString(),
    }).eq('seller_id', stateData.sellerId).eq('marketplace', stateData.marketplace);

    return apiSuccess({
      marketplace: stateData.marketplace,
      status: 'connected',
      action: 'oauth_callback',
      tokenExpires: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(),
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  // ── C6: Disconnect ────────────────────────────────
  if (action === 'disconnect') {
    const result = await disconnectMarketplace(context.sellerId, marketplace);

    if (!result.success) {
      return apiError(ApiErrorCode.INTERNAL_ERROR, result.error || 'Failed to disconnect.');
    }

    return apiSuccess({
      marketplace,
      status: 'disconnected',
      action: 'disconnect',
      revokedRemote: result.revokedRemote,
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  // ── Configure ─────────────────────────────────────
  if (action === 'configure') {
    const settings = body.settings as Record<string, unknown> | undefined;
    if (!settings) {
      return apiError(ApiErrorCode.BAD_REQUEST, '"settings" object required for configure action.');
    }

    await supabase.from('marketplace_connections')
      .update({ settings, updated_at: new Date().toISOString() })
      .eq('seller_id', context.sellerId)
      .eq('marketplace', marketplace);

    return apiSuccess({
      marketplace,
      action: 'configure',
      settings,
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  // ── C3: Sync Products ─────────────────────────────
  if (action === 'sync') {
    const syncResult = await syncMarketplaceProducts(context.sellerId, marketplace);

    if ('error' in syncResult) {
      return apiError(ApiErrorCode.BAD_REQUEST, syncResult.error);
    }

    // Update last_sync_at
    await supabase.from('marketplace_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('seller_id', context.sellerId)
      .eq('marketplace', marketplace);

    return apiSuccess({
      action: 'sync',
      ...syncResult,
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  // ── C5: Health Check ──────────────────────────────
  if (action === 'health') {
    const health = await checkConnectionHealth(context.sellerId, marketplace);
    return apiSuccess({
      marketplace,
      action: 'health',
      ...health,
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  return apiError(ApiErrorCode.BAD_REQUEST, `Unknown action: ${action}`);
});
