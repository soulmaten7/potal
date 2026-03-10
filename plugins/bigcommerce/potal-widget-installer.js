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
    async function updateDdpFee() {
      // Only run on cart/checkout pages
      const isCartPage = window.location.pathname.includes('/cart') ||
                         window.location.pathname.includes('/checkout');
      if (!isCartPage) return;

      try {
        // Get cart contents via BigCommerce Storefront API
        const cartRes = await fetch('/api/storefront/carts', {
          credentials: 'same-origin'
        });
        const carts = await cartRes.json();
        if (!carts.length || !carts[0].lineItems) return;

        const cart = carts[0];
        const items = [];

        // Physical items
        for (const item of (cart.lineItems.physicalItems || [])) {
          items.push({
            productName: item.name,
            price: item.salePrice || item.listPrice,
            quantity: item.quantity,
          });
        }
        // Digital items
        for (const item of (cart.lineItems.digitalItems || [])) {
          items.push({
            productName: item.name,
            price: item.salePrice || item.listPrice,
            quantity: item.quantity,
          });
        }

        if (!items.length) return;

        // Get buyer's shipping country (from checkout data or geolocation)
        const geoRes = await fetch('/api/storefront/checkout/' + cart.id, {
          credentials: 'same-origin'
        }).catch(() => null);

        let destination = 'US'; // fallback
        if (geoRes && geoRes.ok) {
          const checkout = await geoRes.json();
          const shipping = checkout.consignments?.[0]?.shippingAddress;
          if (shipping?.countryCode) {
            destination = shipping.countryCode;
          }
        }

        // Skip if domestic
        if (destination.toUpperCase() === POTAL_CONFIG.origin.toUpperCase()) return;

        // Call POTAL DDP quote
        const quoteRes = await fetch('https://www.potal.app/api/v1/checkout?action=quote', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': POTAL_CONFIG.apiKey,
          },
          body: JSON.stringify({
            originCountry: POTAL_CONFIG.origin,
            destinationCountry: destination,
            items: items,
            shippingCost: 0,
          }),
        });

        if (!quoteRes.ok) return;
        const quoteData = await quoteRes.json();
        if (!quoteData.success || !quoteData.data?.quote) return;

        const quote = quoteData.data.quote;
        const dutyTotal = (quote.importDuty || 0) + (quote.vat || 0) + (quote.customsFee || 0);

        // Display DDP info on cart page
        if (dutyTotal > 0) {
          let ddpEl = document.getElementById('potal-ddp-info');
          if (!ddpEl) {
            ddpEl = document.createElement('div');
            ddpEl.id = 'potal-ddp-info';
            ddpEl.style.cssText = 'padding:12px 16px;margin:8px 0;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;font-size:14px;';
            const cartTotal = document.querySelector('.cart-total') ||
                              document.querySelector('[data-cart-totals]') ||
                              document.querySelector('.cart-actions');
            if (cartTotal) cartTotal.parentNode.insertBefore(ddpEl, cartTotal);
          }
          ddpEl.innerHTML = '<strong>🌍 Import Duties & Taxes (DDP)</strong><br/>' +
            'Duty: $' + quote.importDuty.toFixed(2) +
            ' · VAT/GST: $' + quote.vat.toFixed(2) +
            (quote.customsFee > 0 ? ' · Customs: $' + quote.customsFee.toFixed(2) : '') +
            '<br/><strong>Total with duties: $' + quote.grandTotal.toFixed(2) + '</strong>' +
            '<br/><small style="color:#6b7280;">Powered by POTAL — No surprise fees at delivery</small>';
        }
      } catch (e) {
        // Silently fail — DDP is optional enhancement
      }
    }

    // Run on page load and cart updates
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', updateDdpFee);
    } else {
      updateDdpFee();
    }
    document.addEventListener('cart-quantity-update', updateDdpFee);
    document.addEventListener('cart-item-add', updateDdpFee);
  }
})();
