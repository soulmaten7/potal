/**
 * POTAL BigCommerce Integration
 *
 * Install via BigCommerce Script Manager:
 * 1. Go to Storefront → Script Manager → Create a Script
 * 2. Name: "POTAL Landed Cost Widget"
 * 3. Placement: Footer
 * 4. Location: All Pages (or Product Pages)
 * 5. Script Type: Script
 * 6. Paste this script content
 *
 * Configuration: Update the POTAL_CONFIG object below with your credentials.
 */

(function () {
  'use strict';

  // ─── Configuration (UPDATE THESE) ───────────────
  const POTAL_CONFIG = {
    sellerId: 'YOUR_SELLER_ID',       // From potal.app/dashboard
    apiKey: 'YOUR_API_KEY',            // From potal.app/dashboard
    origin: 'US',                      // Your shipping origin country (ISO 2-letter)
    widgetPosition: 'after-price',     // 'after-price' | 'after-cart-btn' | 'custom'
    customSelector: '',                // CSS selector if position = 'custom'
    enableDdp: false,                  // Show DDP option at checkout
    theme: 'light',                    // 'light' | 'dark' | 'auto'
  };

  // ─── Detect Product Page ────────────────────────
  function isProductPage() {
    return document.querySelector('[data-product-price]') !== null
      || document.querySelector('.productView-price') !== null
      || window.location.pathname.includes('/products/');
  }

  // ─── Get Product Info ───────────────────────────
  function getProductInfo() {
    const priceEl =
      document.querySelector('[data-product-price]') ||
      document.querySelector('.productView-price .price--withoutTax') ||
      document.querySelector('.productView-price .price--withTax');

    const nameEl =
      document.querySelector('[data-product-title]') ||
      document.querySelector('.productView-title') ||
      document.querySelector('h1.productView-title');

    if (!priceEl) return null;

    const priceText = priceEl.textContent || '';
    const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
    const name = nameEl ? nameEl.textContent.trim() : '';

    if (isNaN(price) || price <= 0) return null;

    return { price, name };
  }

  // ─── Insert Widget Container ────────────────────
  function insertWidget(product) {
    // Don't duplicate
    if (document.getElementById('potal-bc-widget')) return;

    const container = document.createElement('div');
    container.id = 'potal-bc-widget';
    container.setAttribute('data-product-name', product.name);
    container.setAttribute('data-price', String(product.price));
    container.setAttribute('data-origin', POTAL_CONFIG.origin);
    container.setAttribute('data-seller-id', POTAL_CONFIG.sellerId);

    let target;
    switch (POTAL_CONFIG.widgetPosition) {
      case 'after-cart-btn':
        target = document.querySelector('.productView-options form') ||
                 document.querySelector('[data-cart-item-add]');
        if (target) target.parentNode.insertBefore(container, target.nextSibling);
        break;
      case 'custom':
        target = document.querySelector(POTAL_CONFIG.customSelector);
        if (target) target.appendChild(container);
        break;
      case 'after-price':
      default:
        target = document.querySelector('.productView-price') ||
                 document.querySelector('[data-product-price]');
        if (target) target.parentNode.insertBefore(container, target.nextSibling);
        break;
    }

    if (!target) {
      // Fallback: append to product view
      const fallback = document.querySelector('.productView-details') ||
                       document.querySelector('.productView');
      if (fallback) fallback.appendChild(container);
    }
  }

  // ─── Load POTAL Widget Script ───────────────────
  function loadPotalScript() {
    if (document.querySelector('script[src*="potal-widget.js"]')) return;

    const script = document.createElement('script');
    script.src = 'https://www.potal.app/widget/potal-widget.js';
    script.async = true;
    document.head.appendChild(script);
  }

  // ─── Initialize ─────────────────────────────────
  function init() {
    if (!isProductPage()) return;

    const product = getProductInfo();
    if (!product) return;

    insertWidget(product);
    loadPotalScript();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Also handle SPA navigation (BigCommerce Stencil)
  if (typeof window.stencilUtils !== 'undefined') {
    document.addEventListener('stencil-quick-view-open', init);
  }

  // ─── Cart DDP Integration (optional) ────────────
  if (POTAL_CONFIG.enableDdp) {
    // Listen for cart updates to recalculate DDP
    document.addEventListener('cart-quantity-update', async function () {
      // DDP calculation would be triggered here
      // This is a placeholder for the full DDP cart integration
    });
  }
})();
