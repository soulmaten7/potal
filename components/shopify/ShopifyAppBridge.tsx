'use client';

import { useEffect, useState } from 'react';

/**
 * ShopifyAppBridge — detects Shopify embedded context and initializes App Bridge.
 *
 * When the app is loaded inside the Shopify admin iframe:
 * 1. Detects via URL params (shop, host) or window.shopify
 * 2. App Bridge auto-initializes from the CDN script in layout.tsx
 * 3. Uses session tokens for authentication
 *
 * When loaded outside Shopify (normal potal.app), does nothing.
 */
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

      // Wait for App Bridge to be available
      const initAppBridge = () => {
        if (typeof window !== 'undefined' && (window as any).shopify) {
          const shopify = (window as any).shopify;

          // Request session token to verify embedded auth works
          if (shopify.idToken) {
            shopify.idToken().then((token: string) => {
              // Store the session token for API calls
              if (token) {
                sessionStorage.setItem('shopify_session_token', token);
                console.log('[POTAL] Shopify App Bridge initialized, session token obtained');
              }
            }).catch((err: Error) => {
              console.warn('[POTAL] Session token request failed:', err);
            });
          }

          // Set up token refresh interval (tokens expire every 1 minute)
          const refreshInterval = setInterval(() => {
            if (shopify.idToken) {
              shopify.idToken().then((token: string) => {
                if (token) {
                  sessionStorage.setItem('shopify_session_token', token);
                }
              }).catch(() => {});
            }
          }, 50000); // Refresh every 50 seconds

          return () => clearInterval(refreshInterval);
        } else {
          // Retry after a short delay (App Bridge CDN might still be loading)
          setTimeout(initAppBridge, 500);
        }
      };

      // Start initialization
      initAppBridge();
    }
  }, []);

  // When embedded in Shopify, we might want to hide certain UI elements
  useEffect(() => {
    if (isEmbedded) {
      // Add a class to body so CSS can conditionally hide header/footer
      document.body.classList.add('shopify-embedded');
    }
    return () => {
      document.body.classList.remove('shopify-embedded');
    };
  }, [isEmbedded]);

  // This component doesn't render anything visible
  return null;
}
