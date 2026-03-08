'use client';

import { useEffect } from 'react';
import { isShopifyEmbedded } from './ShopifyAppBridge';

/**
 * ShopifyNavMenu — App Bridge navigation menu for embedded apps.
 *
 * Replaces static app navigation (deprecated Dec 2024, removed Dec 2026).
 * Uses the <ui-nav-menu> web component from App Bridge.
 *
 * @see https://shopify.dev/docs/api/app-bridge-library/web-components/ui-nav-menu
 */
export function ShopifyNavMenu() {
  useEffect(() => {
    if (!isShopifyEmbedded()) return;

    // Create ui-nav-menu element if App Bridge is loaded
    const existing = document.querySelector('ui-nav-menu');
    if (existing) return; // Already exists

    const navMenu = document.createElement('ui-nav-menu');

    // Dashboard link (required — the "home" link)
    const dashboardLink = document.createElement('a');
    dashboardLink.href = '/dashboard';
    dashboardLink.rel = 'home';
    dashboardLink.textContent = 'Dashboard';
    navMenu.appendChild(dashboardLink);

    // Widget Settings
    const widgetLink = document.createElement('a');
    widgetLink.href = '/dashboard/widget';
    widgetLink.textContent = 'Widget Settings';
    navMenu.appendChild(widgetLink);

    // API Keys
    const apiLink = document.createElement('a');
    apiLink.href = '/dashboard/api-keys';
    apiLink.textContent = 'API Keys';
    navMenu.appendChild(apiLink);

    // Usage & Analytics
    const usageLink = document.createElement('a');
    usageLink.href = '/dashboard/usage';
    usageLink.textContent = 'Usage';
    navMenu.appendChild(usageLink);

    // Pricing
    const pricingLink = document.createElement('a');
    pricingLink.href = '/pricing';
    pricingLink.textContent = 'Pricing';
    navMenu.appendChild(pricingLink);

    // Insert at the beginning of body
    document.body.insertBefore(navMenu, document.body.firstChild);

    return () => {
      navMenu.remove();
    };
  }, []);

  return null;
}
