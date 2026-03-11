'use client';

/**
 * Crisp Chat Widget — D9 Customer Success Layer 1
 *
 * Loads the Crisp live chat widget on all pages.
 * Crisp Website ID is configured via NEXT_PUBLIC_CRISP_WEBSITE_ID env var.
 *
 * Setup steps:
 * 1. Create account at https://crisp.chat
 * 2. Get Website ID from Settings > Website Settings > Setup Instructions
 * 3. Add NEXT_PUBLIC_CRISP_WEBSITE_ID to Vercel env vars
 *
 * The widget only loads in production (or when the env var is set).
 */

import { useEffect } from 'react';

declare global {
  interface Window {
    $crisp?: unknown[];
    CRISP_WEBSITE_ID?: string;
  }
}

export function CrispChat() {
  const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;

  useEffect(() => {
    if (!websiteId) return;

    // Prevent double-init
    if (window.$crisp) return;

    window.$crisp = [];
    window.CRISP_WEBSITE_ID = websiteId;

    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount (unlikely for root layout)
      try {
        document.head.removeChild(script);
      } catch {
        // Already removed
      }
    };
  }, [websiteId]);

  // Render nothing — Crisp injects its own UI
  return null;
}
