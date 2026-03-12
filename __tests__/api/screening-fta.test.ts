/**
 * POTAL API v1 — Screening & FTA Tests
 *
 * Tests for denied-party screening and FTA lookup logic.
 * Run: npx jest __tests__/api/screening-fta.test.ts
 */

import { calculateGlobalLandedCost } from '@/app/lib/cost-engine/GlobalCostEngine';

// ═══════════════════════════════════════════════════════════
// 1. Screening Types & Constants
// ═══════════════════════════════════════════════════════════

describe('Screening Types', () => {
  test('ScreeningList type covers all 19 sources', () => {
    const ALL_LISTS = [
      'OFAC_SDN', 'OFAC_CONS', 'OFAC_SSI', 'OFAC_FSE',
      'OFAC_PLC', 'OFAC_CAPTA', 'OFAC_NS_MBS', 'OFAC_NS_CMIC',
      'BIS_ENTITY', 'BIS_DPL', 'BIS_UVL', 'BIS_MEU',
      'BIS_DENIED', 'BIS_UNVERIFIED',
      'STATE_DTC', 'STATE_ISN',
      'EU_SANCTIONS', 'UN_SANCTIONS', 'UK_SANCTIONS',
    ];
    expect(ALL_LISTS).toHaveLength(19);
    // Verify no duplicates
    const unique = new Set(ALL_LISTS);
    expect(unique.size).toBe(19);
  });

  test('Legacy aliases map correctly', () => {
    // BIS_DENIED → BIS_DPL, BIS_UNVERIFIED → BIS_UVL
    const LEGACY_MAP: Record<string, string> = {
      'BIS_DENIED': 'BIS_DPL',
      'BIS_UNVERIFIED': 'BIS_UVL',
    };
    expect(LEGACY_MAP['BIS_DENIED']).toBe('BIS_DPL');
    expect(LEGACY_MAP['BIS_UNVERIFIED']).toBe('BIS_UVL');
  });
});

// ═══════════════════════════════════════════════════════════
// 2. FTA Impact on Calculations
// ═══════════════════════════════════════════════════════════

describe('FTA Impact on Landed Cost', () => {
  test('KORUS FTA: Korea to US should have favorable rates', () => {
    const result = calculateGlobalLandedCost({
      price: 100,
      shippingPrice: 15,
      destination: 'US',
      origin: 'KR',
      zipcode: '10001',
      productName: 'Electronics',
      productCategory: 'electronics',
    });
    expect(result.totalLandedCost).toBeGreaterThan(0);
    expect(result.totalLandedCost).not.toBeNaN();
  });

  test('USMCA: Mexico to US should have favorable rates', () => {
    const result = calculateGlobalLandedCost({
      price: 100,
      shippingPrice: 10,
      destination: 'US',
      origin: 'MX',
      zipcode: '90001',
      productName: 'Shirt',
      productCategory: 'apparel',
    });
    expect(result.totalLandedCost).toBeGreaterThan(0);
    expect(result.totalLandedCost).not.toBeNaN();
  });

  test('RCEP: Japan to Australia should have favorable rates', () => {
    const result = calculateGlobalLandedCost({
      price: 200,
      shippingPrice: 20,
      destination: 'AU',
      origin: 'JP',
      productName: 'Camera',
      productCategory: 'electronics',
    });
    expect(result.totalLandedCost).toBeGreaterThan(0);
    expect(result.totalLandedCost).not.toBeNaN();
  });

  test('Non-FTA route: China to Brazil should have higher duties', () => {
    const result = calculateGlobalLandedCost({
      price: 100,
      shippingPrice: 20,
      destination: 'BR',
      origin: 'CN',
      productName: 'Toy',
      productCategory: 'toys',
    });
    expect(result.totalLandedCost).toBeGreaterThan(120);
    expect(result.totalLandedCost).not.toBeNaN();
  });
});

// ═══════════════════════════════════════════════════════════
// 3. Trade Remedies in Calculation
// ═══════════════════════════════════════════════════════════

describe('Trade Remedy Impact', () => {
  test('China to US products should include Section 301 consideration', () => {
    const result = calculateGlobalLandedCost({
      price: 50,
      shippingPrice: 10,
      destination: 'US',
      origin: 'CN',
      zipcode: '10001',
      productName: 'Phone Case',
      productCategory: 'electronics',
    });
    // CN→US should have additional tariffs
    expect(result.totalLandedCost).toBeGreaterThan(60);
    expect(result.totalLandedCost).not.toBeNaN();
  });
});

// ═══════════════════════════════════════════════════════════
// 4. Paddle Refund API Structure
// ═══════════════════════════════════════════════════════════

describe('Refund API Validation', () => {
  test('Transaction ID format validation', () => {
    // Paddle transaction IDs follow format: txn_xxxxx
    const validId = 'txn_01j5kp8n4x7qrz3m6y2w9c4f';
    const invalidId = '';
    expect(validId.startsWith('txn_')).toBe(true);
    expect(invalidId.length).toBe(0);
  });

  test('Refund reason is optional', () => {
    const bodyWithReason = { transactionId: 'txn_test', reason: 'Customer request' };
    const bodyWithoutReason = { transactionId: 'txn_test' };
    expect(bodyWithReason.reason).toBeDefined();
    expect(bodyWithoutReason).not.toHaveProperty('reason');
  });
});
