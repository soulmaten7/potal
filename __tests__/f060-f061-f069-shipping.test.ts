/**
 * F060 + F061 + F069: Shipping & Customs — Test Suite
 */

import { getCarrierRates, recommendCarrier } from '@/app/lib/shipping/carrier-rates';
import { generateLabelData, getLabelRequirements } from '@/app/lib/shipping/label-generator';
import { canConsolidate, calculateConsolidatedDuty, detectSplitShipments } from '@/app/lib/customs/consolidation';

// ─── F060: Multi-Carrier Rates ──────────────────────

describe('F060: Carrier Rates', () => {
  test('returns rates for US→GB 5kg shipment', () => {
    const rates = getCarrierRates({ originCountry: 'US', destinationCountry: 'GB', weightKg: 5, declaredValue: 100 });
    expect(rates.length).toBeGreaterThan(5);
    expect(rates[0].carrier).toBeTruthy();
    expect(rates[0].rate).toBeGreaterThan(0);
    expect(rates[0].estimatedDays.min).toBeGreaterThan(0);
  });

  test('sorted by rate ascending', () => {
    const rates = getCarrierRates({ originCountry: 'US', destinationCountry: 'JP', weightKg: 2, declaredValue: 50 });
    for (let i = 1; i < rates.length; i++) {
      expect(rates[i].rate).toBeGreaterThanOrEqual(rates[i - 1].rate);
    }
  });

  test('filters out carriers exceeding max weight', () => {
    const rates = getCarrierRates({ originCountry: 'US', destinationCountry: 'DE', weightKg: 50, declaredValue: 500 });
    // USPS First-Class max 2kg should be excluded
    const uspsFirstClass = rates.find(r => r.carrier === 'USPS' && r.service.includes('First-Class'));
    expect(uspsFirstClass).toBeUndefined();
  });

  test('recommendCarrier cheapest works', () => {
    const rates = getCarrierRates({ originCountry: 'US', destinationCountry: 'CA', weightKg: 1, declaredValue: 20 });
    const cheapest = recommendCarrier(rates, 'cheapest');
    expect(cheapest).not.toBeNull();
    expect(cheapest!.rate).toBe(Math.min(...rates.map(r => r.rate)));
  });

  test('recommendCarrier fastest works', () => {
    const rates = getCarrierRates({ originCountry: 'US', destinationCountry: 'GB', weightKg: 1, declaredValue: 20 });
    const fastest = recommendCarrier(rates, 'fastest');
    expect(fastest).not.toBeNull();
    expect(fastest!.estimatedDays.min).toBe(Math.min(...rates.map(r => r.estimatedDays.min)));
  });

  test('volumetric weight applied when dimensions provided', () => {
    const withDims = getCarrierRates({ originCountry: 'US', destinationCountry: 'GB', weightKg: 1, lengthCm: 50, widthCm: 40, heightCm: 30, declaredValue: 100 });
    const withoutDims = getCarrierRates({ originCountry: 'US', destinationCountry: 'GB', weightKg: 1, declaredValue: 100 });
    // Volumetric: 50*40*30/5000 = 12kg > 1kg actual → higher rates
    expect(withDims[0].rate).toBeGreaterThan(withoutDims[0].rate);
  });
});

// ─── F061: Label Generator ──────────────────────────

describe('F061: Label Generator', () => {
  const testRequest = {
    sender: { name: 'Test Seller', addressLine1: '123 Main St', city: 'New York', postalCode: '10001', country: 'US' },
    receiver: { name: 'Test Buyer', addressLine1: '456 High St', city: 'London', postalCode: 'W1A 1AA', country: 'GB' },
    items: [{ description: 'Widget', quantity: 2, unitPrice: 25, currency: 'USD', weightGrams: 500, hsCode: '847130', originCountry: 'CN' }],
  };

  test('generates CN22 for low-value items', () => {
    const result = generateLabelData(testRequest);
    expect(result.customsForm.formType).toBe('CN22');
    expect(result.customsForm.totalValue).toBe(50);
    expect(result.customsForm.items.length).toBe(1);
  });

  test('generates CN23 for high-value items', () => {
    const highValue = { ...testRequest, items: [{ ...testRequest.items[0], unitPrice: 300 }] };
    const result = generateLabelData(highValue);
    expect(result.customsForm.formType).toBe('CN23');
  });

  test('generates commercial invoice', () => {
    const result = generateLabelData(testRequest);
    expect(result.commercialInvoice.invoiceNumber).toBeTruthy();
    expect(result.commercialInvoice.subtotal).toBe(50);
    expect(result.commercialInvoice.items[0].hsCode).toBe('847130');
  });

  test('getLabelRequirements JP includes Japanese language', () => {
    const reqs = getLabelRequirements('JP');
    expect(reqs.some(r => r.requirement.includes('Japanese'))).toBe(true);
  });

  test('getLabelRequirements KR includes Korean language', () => {
    const reqs = getLabelRequirements('KR');
    expect(reqs.some(r => r.requirement.includes('Korean') || r.requirement.includes('한국어'))).toBe(true);
  });
});

// ─── F069: Consolidation ────────────────────────────

describe('F069: Consolidation', () => {
  const baseShipment = (id: string, value: number) => ({
    id,
    items: [{ description: 'Product', hsCode: '847130', value, quantity: 1 }],
    origin: 'CN',
    destination: 'US',
    recipient: 'John Doe',
    shipDate: '2026-03-25',
  });

  test('canConsolidate: same recipient/origin/dest → eligible', () => {
    const result = canConsolidate([baseShipment('s1', 100), baseShipment('s2', 200)]);
    expect(result.eligible).toBe(true);
  });

  test('canConsolidate: different destinations → ineligible', () => {
    const s1 = baseShipment('s1', 100);
    const s2 = { ...baseShipment('s2', 200), destination: 'GB' };
    const result = canConsolidate([s1, s2]);
    expect(result.eligible).toBe(false);
    expect(result.reasons.some(r => r.includes('destination'))).toBe(true);
  });

  test('calculateConsolidatedDuty: warns when over de minimis', () => {
    const result = calculateConsolidatedDuty([baseShipment('s1', 500), baseShipment('s2', 500)]);
    expect(result.consolidatedValue).toBe(1000);
    expect(result.formalEntryRequired).toBe(true);
    expect(result.warnings.some(w => w.includes('de minimis'))).toBe(true);
  });

  test('detectSplitShipments: flags multiple under-threshold to same recipient', () => {
    const shipments = [
      baseShipment('s1', 700),
      baseShipment('s2', 750),
      baseShipment('s3', 600),
    ];
    const result = detectSplitShipments(shipments);
    expect(result.detected).toBe(true);
    expect(result.groups.length).toBeGreaterThan(0);
    expect(result.groups[0].warning).toContain('split shipment');
  });

  test('single shipment → cannot consolidate', () => {
    const result = canConsolidate([baseShipment('s1', 100)]);
    expect(result.eligible).toBe(false);
  });
});
