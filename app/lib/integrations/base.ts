/**
 * POTAL Integration Framework — Base abstract client
 */

export interface IntegrationStatus {
  connected: boolean;
  platform: string;
  lastSync?: string;
  error?: string;
}

export abstract class IntegrationClient {
  abstract platform: string;
  abstract connect(credentials: Record<string, string>): Promise<IntegrationStatus>;
  abstract disconnect(): Promise<void>;
  abstract test(): Promise<{ ok: boolean; message: string }>;
  abstract sync(): Promise<{ synced: number; errors: number }>;
}

export interface IntegrationConfig {
  platform: string;
  name: string;
  description: string;
  icon: string;
  status: 'connected' | 'available' | 'coming_soon';
  authType: 'api_key' | 'oauth2' | 'credentials';
  fields: { key: string; label: string; type: 'text' | 'password'; required: boolean }[];
}

export const INTEGRATIONS: IntegrationConfig[] = [
  {
    platform: 'shopify', name: 'Shopify', description: 'Shopify Theme App Extension for product page widgets',
    icon: '🛍️', status: 'available', authType: 'oauth2',
    fields: [{ key: 'shop_domain', label: 'Shop Domain', type: 'text', required: true }],
  },
  {
    platform: 'woocommerce', name: 'WooCommerce', description: 'WordPress/WooCommerce plugin for landed cost display',
    icon: '🔌', status: 'available', authType: 'api_key',
    fields: [
      { key: 'site_url', label: 'Site URL', type: 'text', required: true },
      { key: 'consumer_key', label: 'Consumer Key', type: 'text', required: true },
      { key: 'consumer_secret', label: 'Consumer Secret', type: 'password', required: true },
    ],
  },
  {
    platform: 'bigcommerce', name: 'BigCommerce', description: 'Stencil theme integration for duty calculations',
    icon: '🏪', status: 'available', authType: 'api_key',
    fields: [
      { key: 'store_hash', label: 'Store Hash', type: 'text', required: true },
      { key: 'access_token', label: 'Access Token', type: 'password', required: true },
    ],
  },
  {
    platform: 'magento', name: 'Magento 2', description: 'Magento module for pre-checkout duty estimation',
    icon: '🧱', status: 'available', authType: 'api_key',
    fields: [{ key: 'api_token', label: 'API Token', type: 'password', required: true }],
  },
  { platform: 'ebay', name: 'eBay', description: 'eBay listing sync and duty calculation', icon: '🏷️', status: 'coming_soon', authType: 'oauth2', fields: [] },
  { platform: 'etsy', name: 'Etsy', description: 'Etsy shop integration', icon: '🧶', status: 'coming_soon', authType: 'oauth2', fields: [] },
  { platform: 'quickbooks', name: 'QuickBooks', description: 'Auto-post duty/tax journal entries', icon: '📊', status: 'coming_soon', authType: 'oauth2', fields: [] },
  { platform: 'xero', name: 'Xero', description: 'Duty expense accounting sync', icon: '📘', status: 'coming_soon', authType: 'oauth2', fields: [] },
];
