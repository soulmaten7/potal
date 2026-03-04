/**
 * POTAL — Create Test Seller + API Key
 *
 * Generates a test seller record and pre-hashed API key.
 * Outputs SQL to run in Supabase SQL Editor.
 *
 * Usage: npx tsx scripts/create-test-seller.ts
 */

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

async function main() {
  // Generate keys
  const pkFull = 'pk_live_' + generateRandomString(36);
  const skFull = 'sk_live_' + generateRandomString(36);
  const pkHash = await hashKey(pkFull);
  const skHash = await hashKey(skFull);

  const sellerId = crypto.randomUUID();

  console.log('='.repeat(60));
  console.log('POTAL Test Seller Setup');
  console.log('='.repeat(60));
  console.log('');
  console.log('📌 SAVE THESE KEYS (shown only once):');
  console.log('');
  console.log(`   Publishable Key: ${pkFull}`);
  console.log(`   Secret Key:      ${skFull}`);
  console.log(`   Seller ID:       ${sellerId}`);
  console.log('');
  console.log('='.repeat(60));
  console.log('📋 Copy the SQL below and run in Supabase SQL Editor:');
  console.log('='.repeat(60));
  console.log('');

  const sql = `
-- ============================================
-- POTAL Test Seller + API Keys
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Create test seller (no auth.users link — API-only)
INSERT INTO public.sellers (id, company_name, contact_email, website_url, platform, plan_id, subscription_status, trial_ends_at)
VALUES (
  '${sellerId}',
  'POTAL Test Seller',
  'soulmaten7@gmail.com',
  'https://potal.app',
  'custom',
  'starter',
  'trialing',
  NOW() + INTERVAL '14 days'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create publishable key (for widget)
INSERT INTO public.api_keys (seller_id, key_prefix, key_hash, key_type, name, rate_limit_per_minute, is_active)
VALUES (
  '${sellerId}',
  '${pkFull.substring(0, 8)}',
  '${pkHash}',
  'publishable',
  'Test Publishable',
  60,
  true
);

-- 3. Create secret key (for server API)
INSERT INTO public.api_keys (seller_id, key_prefix, key_hash, key_type, name, rate_limit_per_minute, is_active)
VALUES (
  '${sellerId}',
  '${skFull.substring(0, 8)}',
  '${skHash}',
  'secret',
  'Test Secret',
  120,
  true
);

-- 4. Create default widget config
INSERT INTO public.widget_configs (seller_id, name, allowed_domains)
VALUES (
  '${sellerId}',
  'Default Widget',
  ARRAY['potal.app', 'localhost']
);

-- Verify
SELECT s.company_name, s.plan_id, s.subscription_status,
       ak.key_prefix, ak.key_type, ak.name
FROM sellers s
JOIN api_keys ak ON ak.seller_id = s.id
WHERE s.id = '${sellerId}';
`.trim();

  console.log(sql);
  console.log('');
  console.log('='.repeat(60));
  console.log('📡 After running SQL, test with curl:');
  console.log('='.repeat(60));
  console.log('');
  console.log(`curl -X POST https://potal.app/api/v1/calculate \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -H "X-API-Key: ${pkFull}" \\`);
  console.log(`  -d '{"price": 49.99, "shippingPrice": 5, "origin": "CN", "zipcode": "10001", "destinationCountry": "US"}'`);
  console.log('');
  console.log('# Global test (China → UK):');
  console.log(`curl -X POST https://potal.app/api/v1/calculate \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -H "X-API-Key: ${pkFull}" \\`);
  console.log(`  -d '{"price": 200, "origin": "CN", "destinationCountry": "GB"}'`);
  console.log('');
  console.log('# Health check (no auth needed):');
  console.log('curl https://potal.app/api/v1/health');
}

main().catch(console.error);
