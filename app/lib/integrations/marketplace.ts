/**
 * F082: Marketplace Integration Engine
 *
 * C1: OAuth flow (auth URL generation + callback token exchange)
 * C2: AES-256-CBC token encryption/decryption
 * C3: Product sync stub (per-marketplace API abstraction)
 * C4: Token refresh with 5-minute buffer
 * C5: Connection health check
 * C6: Bidirectional disconnect
 * C7: Webhook registration stub
 */

import { createClient } from '@supabase/supabase-js';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

// ─── Types ──────────────────────────────────────────

export interface MarketplaceConfig {
  name: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string;
  revokeUrl?: string;
  regions: string[];
  features: string[];
  requiredParams: string[];
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  scope?: string;
}

export interface ConnectionInfo {
  id: string;
  marketplace: string;
  region: string;
  status: string;
  shopDomain?: string;
  externalSellerId?: string;
  tokenExpiresAt?: string;
  lastSyncAt?: string;
  errorMessage?: string;
  settings: Record<string, unknown>;
  connectedAt: string;
}

export interface HealthStatus {
  status: 'healthy' | 'token_expiring' | 'token_expired' | 'error' | 'disconnected';
  lastChecked: string;
  error?: string;
  tokenExpiresIn?: number;
}

export interface SyncResult {
  marketplace: string;
  productsFound: number;
  productsSynced: number;
  errors: string[];
}

// ─── Marketplace Configs ────────────────────────────

export const MARKETPLACE_CONFIGS: Record<string, MarketplaceConfig> = {
  shopify: {
    name: 'Shopify',
    authUrl: 'https://{shop}.myshopify.com/admin/oauth/authorize',
    tokenUrl: 'https://{shop}.myshopify.com/admin/oauth/access_token',
    revokeUrl: 'https://{shop}.myshopify.com/admin/api_permissions/current.json',
    scopes: 'read_products,read_orders,read_shipping',
    regions: ['US', 'CA', 'UK', 'DE', 'FR', 'IT', 'ES', 'JP', 'AU', 'IN', 'SG', 'AE'],
    features: ['OAuth', 'Product sync', 'Order sync', 'Tax calculation', 'HS classification', 'Webhook'],
    requiredParams: ['shop'],
  },
  amazon: {
    name: 'Amazon',
    authUrl: 'https://sellercentral.amazon.com/apps/authorize/consent',
    tokenUrl: 'https://api.amazon.com/auth/o2/token',
    scopes: 'sellingpartnerapi::migration',
    regions: ['US', 'CA', 'MX', 'UK', 'DE', 'FR', 'IT', 'ES', 'JP', 'AU', 'IN', 'SG', 'AE', 'SA', 'BR'],
    features: ['OAuth', 'Product sync', 'Order sync', 'Tax calculation', 'HS classification', 'FBA tracking'],
    requiredParams: ['sellerId', 'region'],
  },
  ebay: {
    name: 'eBay',
    authUrl: 'https://auth.ebay.com/oauth2/authorize',
    tokenUrl: 'https://api.ebay.com/identity/v1/oauth2/token',
    scopes: 'https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.fulfillment',
    regions: ['US', 'UK', 'DE', 'AU', 'CA', 'FR', 'IT', 'ES'],
    features: ['OAuth', 'Product sync', 'Order sync', 'Tax calculation', 'GSP support'],
    requiredParams: [],
  },
  etsy: {
    name: 'Etsy',
    authUrl: 'https://www.etsy.com/oauth/connect',
    tokenUrl: 'https://api.etsy.com/v3/public/oauth/token',
    scopes: 'transactions_r listings_r',
    regions: ['US', 'UK', 'CA', 'AU', 'DE', 'FR'],
    features: ['OAuth', 'Product sync', 'Order sync', 'Tax calculation'],
    requiredParams: [],
  },
  walmart: {
    name: 'Walmart',
    authUrl: 'https://developer.walmart.com/api/authorize',
    tokenUrl: 'https://marketplace.walmartapis.com/v3/token',
    scopes: 'items orders',
    regions: ['US', 'CA', 'MX'],
    features: ['API Key', 'Product sync', 'Order sync', 'Tax calculation', 'WFS inventory'],
    requiredParams: ['clientId', 'clientSecret'],
  },
  shopee: {
    name: 'Shopee',
    authUrl: 'https://partner.shopeemobile.com/api/v2/shop/auth_partner',
    tokenUrl: 'https://partner.shopeemobile.com/api/v2/auth/token/get',
    scopes: 'shop.item shop.order',
    regions: ['SG', 'MY', 'TH', 'ID', 'PH', 'VN', 'TW', 'BR', 'MX', 'CL', 'CO'],
    features: ['OAuth', 'Product sync', 'Order sync', 'Cross-border support'],
    requiredParams: ['shopId'],
  },
  lazada: {
    name: 'Lazada',
    authUrl: 'https://auth.lazada.com/oauth/authorize',
    tokenUrl: 'https://auth.lazada.com/rest/auth/token/create',
    scopes: 'all',
    regions: ['SG', 'MY', 'TH', 'ID', 'PH', 'VN'],
    features: ['OAuth', 'Product sync', 'Order sync', 'Tax calculation'],
    requiredParams: [],
  },
  mercadolibre: {
    name: 'MercadoLibre',
    authUrl: 'https://auth.mercadolibre.com/authorization',
    tokenUrl: 'https://api.mercadolibre.com/oauth/token',
    scopes: 'read write',
    regions: ['MX', 'BR', 'AR', 'CL', 'CO', 'UY'],
    features: ['OAuth', 'Product sync', 'Order sync', 'CFDI support'],
    requiredParams: [],
  },
  rakuten: {
    name: 'Rakuten',
    authUrl: 'https://api.rms.rakuten.co.jp/oauth2/authorize',
    tokenUrl: 'https://api.rms.rakuten.co.jp/oauth2/token',
    scopes: 'items orders',
    regions: ['JP', 'FR', 'DE', 'US'],
    features: ['OAuth', 'Product sync', 'Order sync', 'JCT support'],
    requiredParams: [],
  },
};

// ─── Supabase ───────────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── C2: Encryption ────────────────────────────────

function getEncryptionKey(): Buffer {
  const envKey = process.env.MARKETPLACE_ENCRYPTION_KEY;
  if (envKey && envKey.length === 64) {
    return Buffer.from(envKey, 'hex');
  }
  // Derive a key from CRON_SECRET or a fallback
  const secret = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'potal-default-key';
  return createHash('sha256').update(secret).digest();
}

export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptToken(ciphertext: string): string {
  const key = getEncryptionKey();
  const parts = ciphertext.split(':');
  if (parts.length !== 2) throw new Error('Invalid encrypted token format');
  const iv = Buffer.from(parts[0], 'hex');
  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(parts[1], 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ─── C1: OAuth Flow ────────────────────────────────

export function generateOAuthUrl(
  marketplace: string,
  sellerId: string,
  redirectUri: string,
  params?: Record<string, string>,
): { url: string; state: string } | { error: string } {
  const config = MARKETPLACE_CONFIGS[marketplace];
  if (!config) return { error: `Unsupported marketplace: ${marketplace}` };

  // State encodes seller + marketplace for callback
  const statePayload = Buffer.from(JSON.stringify({
    sellerId, marketplace, ts: Date.now(),
  })).toString('base64url');

  let authUrl = config.authUrl;

  // Shopify: replace {shop} placeholder
  if (marketplace === 'shopify' && params?.shop) {
    authUrl = authUrl.replace('{shop}', params.shop);
  }

  const clientId = process.env[`${marketplace.toUpperCase()}_CLIENT_ID`] || '';

  const urlParams = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: config.scopes,
    state: statePayload,
    response_type: 'code',
  });

  return { url: `${authUrl}?${urlParams.toString()}`, state: statePayload };
}

export function decodeOAuthState(state: string): { sellerId: string; marketplace: string; ts: number } | null {
  try {
    return JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

export async function exchangeCodeForTokens(
  marketplace: string,
  code: string,
  redirectUri: string,
  params?: Record<string, string>,
): Promise<OAuthTokens | { error: string }> {
  const config = MARKETPLACE_CONFIGS[marketplace];
  if (!config) return { error: `Unsupported marketplace: ${marketplace}` };

  let tokenUrl = config.tokenUrl;
  if (marketplace === 'shopify' && params?.shop) {
    tokenUrl = tokenUrl.replace('{shop}', params.shop);
  }

  const clientId = process.env[`${marketplace.toUpperCase()}_CLIENT_ID`] || '';
  const clientSecret = process.env[`${marketplace.toUpperCase()}_CLIENT_SECRET`] || '';

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return { error: `Token exchange failed (${response.status}): ${errText.substring(0, 200)}` };
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in || 86400,
      scope: data.scope,
    };
  } catch (err) {
    return { error: `Token exchange error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// ─── C4: Token Refresh ─────────────────────────────

export async function refreshAccessToken(
  marketplace: string,
  refreshTokenEncrypted: string,
  params?: Record<string, string>,
): Promise<OAuthTokens | { error: string }> {
  const config = MARKETPLACE_CONFIGS[marketplace];
  if (!config) return { error: `Unsupported marketplace: ${marketplace}` };

  let refreshToken: string;
  try {
    refreshToken = decryptToken(refreshTokenEncrypted);
  } catch {
    return { error: 'Failed to decrypt refresh token' };
  }

  let tokenUrl = config.tokenUrl;
  if (marketplace === 'shopify' && params?.shop) {
    tokenUrl = tokenUrl.replace('{shop}', params.shop);
  }

  const clientId = process.env[`${marketplace.toUpperCase()}_CLIENT_ID`] || '';
  const clientSecret = process.env[`${marketplace.toUpperCase()}_CLIENT_SECRET`] || '';

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return { error: `Token refresh failed (${response.status})` };
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in || 86400,
    };
  } catch (err) {
    return { error: `Token refresh error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

export async function getValidAccessToken(
  sellerId: string,
  marketplace: string,
): Promise<{ token: string; refreshed: boolean } | { error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Database unavailable' };

  const { data: conn } = await supabase
    .from('marketplace_connections')
    .select('access_token_encrypted, refresh_token_encrypted, token_expires_at, shop_domain, status')
    .eq('seller_id', sellerId)
    .eq('marketplace', marketplace)
    .single();

  if (!conn || conn.status !== 'connected') {
    return { error: `No active ${marketplace} connection found` };
  }

  if (!conn.access_token_encrypted) {
    return { error: 'No access token stored. Re-connect marketplace.' };
  }

  // Check if token is still valid (5-minute buffer)
  const expiresAt = conn.token_expires_at ? new Date(String(conn.token_expires_at)) : null;
  const bufferMs = 5 * 60 * 1000;

  if (!expiresAt || expiresAt.getTime() > Date.now() + bufferMs) {
    try {
      return { token: decryptToken(String(conn.access_token_encrypted)), refreshed: false };
    } catch {
      return { error: 'Failed to decrypt access token' };
    }
  }

  // Token expired or expiring soon — refresh
  if (!conn.refresh_token_encrypted) {
    return { error: 'Token expired and no refresh token available. Re-connect marketplace.' };
  }

  const refreshResult = await refreshAccessToken(
    marketplace,
    String(conn.refresh_token_encrypted),
    conn.shop_domain ? { shop: String(conn.shop_domain) } : undefined,
  );

  if ('error' in refreshResult) return refreshResult;

  // Save refreshed tokens
  await supabase.from('marketplace_connections').update({
    access_token_encrypted: encryptToken(refreshResult.accessToken),
    refresh_token_encrypted: refreshResult.refreshToken
      ? encryptToken(refreshResult.refreshToken)
      : conn.refresh_token_encrypted,
    token_expires_at: new Date(Date.now() + refreshResult.expiresIn * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('seller_id', sellerId).eq('marketplace', marketplace);

  return { token: refreshResult.accessToken, refreshed: true };
}

// ─── C5: Health Check ──────────────────────────────

export async function checkConnectionHealth(
  sellerId: string,
  marketplace: string,
): Promise<HealthStatus> {
  const supabase = getSupabase();
  if (!supabase) return { status: 'error', lastChecked: new Date().toISOString(), error: 'DB unavailable' };

  const { data: conn } = await supabase
    .from('marketplace_connections')
    .select('status, token_expires_at, access_token_encrypted, error_message')
    .eq('seller_id', sellerId)
    .eq('marketplace', marketplace)
    .single();

  if (!conn) return { status: 'disconnected', lastChecked: new Date().toISOString() };
  if (String(conn.status) === 'disconnected') return { status: 'disconnected', lastChecked: new Date().toISOString() };

  if (!conn.access_token_encrypted) {
    return { status: 'error', lastChecked: new Date().toISOString(), error: 'No access token' };
  }

  const expiresAt = conn.token_expires_at ? new Date(String(conn.token_expires_at)) : null;
  const now = Date.now();

  if (expiresAt && expiresAt.getTime() < now) {
    return { status: 'token_expired', lastChecked: new Date().toISOString(), tokenExpiresIn: 0 };
  }

  if (expiresAt && expiresAt.getTime() < now + 3600000) {
    return {
      status: 'token_expiring',
      lastChecked: new Date().toISOString(),
      tokenExpiresIn: Math.round((expiresAt.getTime() - now) / 1000),
    };
  }

  return {
    status: 'healthy',
    lastChecked: new Date().toISOString(),
    tokenExpiresIn: expiresAt ? Math.round((expiresAt.getTime() - now) / 1000) : undefined,
  };
}

// ─── C6: Disconnect ────────────────────────────────

export async function disconnectMarketplace(
  sellerId: string,
  marketplace: string,
): Promise<{ success: boolean; revokedRemote: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, revokedRemote: false, error: 'DB unavailable' };

  const { data: conn } = await supabase
    .from('marketplace_connections')
    .select('access_token_encrypted, shop_domain')
    .eq('seller_id', sellerId)
    .eq('marketplace', marketplace)
    .single();

  let revokedRemote = false;

  // Attempt remote token revocation
  if (conn?.access_token_encrypted) {
    try {
      const token = decryptToken(String(conn.access_token_encrypted));
      const config = MARKETPLACE_CONFIGS[marketplace];

      if (marketplace === 'shopify' && conn.shop_domain && config.revokeUrl) {
        const revokeUrl = config.revokeUrl.replace('{shop}', String(conn.shop_domain));
        const res = await fetch(revokeUrl, {
          method: 'DELETE',
          headers: { 'X-Shopify-Access-Token': token },
          signal: AbortSignal.timeout(10000),
        });
        revokedRemote = res.ok;
      }
      // Other marketplaces: token revocation varies; mark as best-effort
    } catch { /* best-effort remote revocation */ }
  }

  // Clear local tokens and mark as disconnected
  const { error } = await supabase
    .from('marketplace_connections')
    .update({
      status: 'disconnected',
      access_token_encrypted: null,
      refresh_token_encrypted: null,
      token_expires_at: null,
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('seller_id', sellerId)
    .eq('marketplace', marketplace);

  if (error) return { success: false, revokedRemote, error: 'Failed to update connection status' };

  return { success: true, revokedRemote };
}

// ─── C3: Product Sync (stub — per-marketplace) ─────

export async function syncMarketplaceProducts(
  sellerId: string,
  marketplace: string,
): Promise<SyncResult | { error: string }> {
  const tokenResult = await getValidAccessToken(sellerId, marketplace);
  if ('error' in tokenResult) return { error: tokenResult.error };

  // Per-marketplace product fetch would go here
  // For now, return a structured stub
  return {
    marketplace,
    productsFound: 0,
    productsSynced: 0,
    errors: [`Product sync for ${marketplace} requires marketplace API credentials. Configure via POST /integrations/marketplace with action: "connect".`],
  };
}

// ─── C7: Webhook Registration (stub) ───────────────

export function getWebhookTopics(marketplace: string): string[] {
  const topics: Record<string, string[]> = {
    shopify: ['orders/create', 'orders/updated', 'products/create', 'products/update'],
    amazon: ['ORDER_CHANGE', 'ITEM_PRODUCT_TYPE_CHANGE'],
    ebay: ['marketplace.account.deletion', 'marketplace.account.subscription'],
    etsy: ['order.created', 'listing.updated'],
    walmart: ['orders', 'items'],
  };
  return topics[marketplace] || [];
}

export function getWebhookEndpoint(marketplace: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.potal.app';
  return `${baseUrl}/api/v1/integrations/marketplace/webhook/${marketplace}`;
}
