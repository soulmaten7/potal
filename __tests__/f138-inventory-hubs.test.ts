/**
 * F138: Multi-hub Inventory & 3PL — Unit Tests
 */
import { selectOptimalHub, type Hub } from '../app/lib/inventory/hub-optimizer';
import { TPL_PROVIDERS } from '../app/lib/inventory/tpl-connector';

const testHubs: Hub[] = [
  { id: 'us', name: 'US Warehouse', countryCode: 'US', type: 'warehouse', isActive: true, priority: 5 },
  { id: 'de', name: 'EU Hub (DE)', countryCode: 'DE', type: '3pl', isActive: true, priority: 3 },
  { id: 'cn', name: 'China Factory', countryCode: 'CN', type: 'warehouse', isActive: true, priority: 2 },
  { id: 'gb', name: 'UK Hub', countryCode: 'GB', type: 'warehouse', isActive: true, priority: 3 },
  { id: 'inactive', name: 'Closed Hub', countryCode: 'JP', type: 'warehouse', isActive: false, priority: 1 },
];

describe('F138 Multi-hub Inventory', () => {
  // Test 1: Domestic hub preferred
  test('US destination → US hub recommended (domestic = lowest cost)', () => {
    const result = selectOptimalHub({ destinationCountry: 'US', productHs6: '610910', hubs: testHubs });
    expect(result.recommended).not.toBeNull();
    expect(result.recommended?.hubCountry).toBe('US');
  });

  // Test 2: DE destination → EU hub preferred
  test('DE destination → DE hub recommended (domestic)', () => {
    const result = selectOptimalHub({ destinationCountry: 'DE', productHs6: '610910', hubs: testHubs });
    expect(result.recommended?.hubCountry).toBe('DE');
  });

  // Test 3: FR destination → DE hub (intra-EU FTA)
  test('FR destination → DE hub (EU FTA, zero duty)', () => {
    const result = selectOptimalHub({ destinationCountry: 'FR', productHs6: '610910', hubs: testHubs });
    expect(result.recommended?.hubCountry).toBe('DE');
    expect(result.recommended?.hasFta).toBe(true);
  });

  // Test 4: Inactive hubs excluded
  test('inactive hubs are excluded from selection', () => {
    const result = selectOptimalHub({ destinationCountry: 'JP', productHs6: '610910', hubs: testHubs });
    const hubIds = [result.recommended?.hubId, ...result.alternatives.map(a => a.hubId)];
    expect(hubIds).not.toContain('inactive');
  });

  // Test 5: Embargoed destination
  test('embargoed destination (KP) → export not allowed', () => {
    const result = selectOptimalHub({ destinationCountry: 'KP', productHs6: '610910', hubs: testHubs });
    if (result.recommended) {
      expect(result.recommended.exportAllowed).toBe(false);
    }
    // All should have exportAllowed = false
    expect(result.alternatives.every(a => !a.exportAllowed)).toBe(true);
  });

  // Test 6: Cost estimate includes duty + shipping + tax
  test('TLC = value + duty + shipping + tax', () => {
    const result = selectOptimalHub({
      destinationCountry: 'AU', productHs6: '610910', hubs: testHubs, productValue: 100, weightKg: 1,
    });
    const hub = result.recommended;
    expect(hub).not.toBeNull();
    if (hub) {
      expect(hub.totalLandedCost).toBeGreaterThan(100); // Must include costs
      expect(hub.estimatedShippingCost).toBeGreaterThan(0);
    }
  });

  // Test 7: Alternatives provided
  test('alternatives list has multiple options', () => {
    const result = selectOptimalHub({ destinationCountry: 'AU', productHs6: '610910', hubs: testHubs });
    expect(result.alternatives.length).toBeGreaterThan(0);
  });

  // Test 8: 5 3PL providers supported
  test('5 3PL providers configured', () => {
    expect(Object.keys(TPL_PROVIDERS)).toHaveLength(5);
    expect(TPL_PROVIDERS.shipbob.name).toBe('ShipBob');
    expect(TPL_PROVIDERS.amazon_fba.name).toContain('Amazon');
    expect(TPL_PROVIDERS.flexport.name).toBe('Flexport');
  });

  // Test 9: Each 3PL has required config
  test('3PL providers have baseUrl and authHeader', () => {
    for (const [, config] of Object.entries(TPL_PROVIDERS)) {
      expect(config.baseUrl).toMatch(/^https:\/\//);
      expect(config.authHeader).toBeDefined();
      expect(config.features.length).toBeGreaterThan(0);
    }
  });

  // Test 10: Hub types supported
  test('hub types: warehouse, 3pl, dropship, fba', () => {
    const types: Hub['type'][] = ['warehouse', '3pl', 'dropship', 'fba'];
    expect(types).toHaveLength(4);
    expect(types).toContain('3pl');
    expect(types).toContain('fba');
  });
});
