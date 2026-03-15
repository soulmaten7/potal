/**
 * POTAL BigCommerce Stencil Theme Integration
 * Adds "Estimated Import Duties & Taxes" section to product pages
 */

interface PotalBigCommerceConfig {
  apiKey: string;
  destinationCountry?: string;
  currency?: string;
  position?: 'after-price' | 'before-add-to-cart' | 'custom';
  containerId?: string;
}

declare const window: Window & {
  PotalBigCommerce?: { init: (config: PotalBigCommerceConfig) => void };
};

const POTAL_API = 'https://www.potal.app/api/v1';

async function calculateDuty(apiKey: string, price: number, destination: string, productName?: string) {
  const res = await fetch(`${POTAL_API}/calculate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      price,
      destinationCountry: destination,
      productName,
    }),
  });
  if (!res.ok) return null;
  return res.json();
}

function renderWidget(container: HTMLElement, data: Record<string, unknown>) {
  const d = data.data as Record<string, unknown> | undefined;
  if (!d) return;

  container.innerHTML = `
    <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:12px 0;font-family:system-ui,-apple-system,sans-serif">
      <div style="font-weight:600;font-size:14px;margin-bottom:8px;color:#111">Estimated Import Duties & Taxes</div>
      <div style="display:flex;justify-content:space-between;font-size:13px;color:#555;margin-bottom:4px">
        <span>Import Duty</span><span>$${((d.importDuty as number) || 0).toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:13px;color:#555;margin-bottom:4px">
        <span>${(d.vatLabel as string) || 'VAT/Tax'}</span><span>$${((d.vat as number) || 0).toFixed(2)}</span>
      </div>
      <div style="border-top:1px solid #e5e7eb;margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;font-weight:600;font-size:14px;color:#111">
        <span>Total Landed Cost</span><span>$${((d.totalLandedCost as number) || 0).toFixed(2)}</span>
      </div>
      <div style="font-size:11px;color:#999;margin-top:8px">Powered by POTAL</div>
    </div>
  `;
}

function init(config: PotalBigCommerceConfig) {
  const priceEl = document.querySelector('[data-product-price]') || document.querySelector('.productView-price');
  if (!priceEl) return;

  const priceText = priceEl.textContent || '';
  const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
  if (!price || price <= 0) return;

  const productName = document.querySelector('[data-product-title]')?.textContent
    || document.querySelector('.productView-title')?.textContent || undefined;

  const container = document.createElement('div');
  container.id = 'potal-duty-widget';

  if (config.containerId) {
    const custom = document.getElementById(config.containerId);
    if (custom) custom.appendChild(container);
  } else {
    priceEl.parentElement?.insertBefore(container, priceEl.nextSibling);
  }

  container.innerHTML = '<div style="padding:16px;color:#999;font-size:13px">Calculating duties...</div>';

  calculateDuty(config.apiKey, price, config.destinationCountry || 'US', productName || undefined)
    .then(data => {
      if (data) renderWidget(container, data);
      else container.innerHTML = '';
    })
    .catch(() => { container.innerHTML = ''; });
}

if (typeof window !== 'undefined') {
  window.PotalBigCommerce = { init };
}

export { init };
export type { PotalBigCommerceConfig };
