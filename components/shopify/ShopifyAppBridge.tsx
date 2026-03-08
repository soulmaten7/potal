'use client';

import { useEffect, useState } from 'react';

/**
 * ShopifyAppBridge — detects Shopify embedded context and initializes App Bridge.
 *
 * When the app is loaded inside the Shopify admin iframe:
 * 1. Detects via URL params (shop, host) or window.shopify
 * 2. App Bridge auto-initializes from the CDN script in layout.tsx
 *    (requires <meta name="shopify-api-key"> before the script tag)
 * 3. Uses session tokens (idToken) for authenticated API calls
 *
 * When loaded outside Shopify (normal potal.app), does nothing.
 */

declare global {
  interface Window {
    shopify?: {
      idToken: () => Promise<string>;
      environment: { embedded: boolean; mobile: boolean };
    };
    __potalShopifyToken?: string;
  }
}

/**
 * Get the current Shopify session token.
 * Use this in fetch() calls for authenticated requests.
 *
 * Example:
 *   const token = getShopifySessionToken();
 *   fetch('/api/shopify/session', {
 *     headers: { Authorization: `Bearer ${token}` }
 *   });
 */
export function getShopifySessionToken(): string | null {
  if (typeof window !== 'undefined') {
    return window.__potalShopifyToken || null;
  }
  return null;
}

/**
 * Check if app is running inside Shopify admin iframe.
 */
export function isShopifyEmbedded(): boolean {
  if (typeof window === 'undefined') return false;
  return !!window.shopify?.environment?.embedded;
}

export function ShopifyAppBridge() {
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    // Detect Shopify embedded context
    const params = new URLSearchParams(window.location.search);
    const shop = params.get('shop');
    const host = params.get('host');

    // If we have shop and host params, we're likely in Shopify admin
    if (shop && host) {
      setIsEmbedded(true);

      let retryCount = 0;
      const MAX_RETRIES = 10;

      // Wait for App Bridge to be available
      const initAppBridge = () => {
        if (window.shopify) {
          // Request session token for authentication
          window.shopify.idToken().then((token: string) => {
            if (token) {
              window.__potalShopifyToken = token;
            }
          }).catch(() => {
            // Token request failed — App Bridge may not be fully ready
          });

          // Refresh token every 50 seconds (tokens expire after 60s)
          const refreshInterval = setInterval(() => {
            if (window.shopify) {
              window.shopify.idToken().then((token: string) => {
                if (token) {
                  window.__potalShopifyToken = token;
                }
              }).catch(() => {});
            }
          }, 50000);

          return () => clearInterval(refreshInterval);
        } else if (retryCount < MAX_RETRIES) {
          retryCount++;
          setTimeout(initAppBridge, 500);
        }
      };

      initAppBridge();
    }
  }, []);

  // When embedded in Shopify, hide certain UI elements
  useEffect(() => {
    if (isEmbedded) {
      document.body.classList.add('shopify-embedded');
    }
    return () => {
      document.body.classList.remove('shopify-embedded');
    };
  }, [isEmbedded]);

  return null;
}
