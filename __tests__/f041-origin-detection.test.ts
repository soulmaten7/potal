/**
 * F041: Origin Country AI Prediction — Test Suite
 * Tests: detectOrigin (sync), predictOrigin (category-based), input validation
 */

import { detectOrigin } from '@/app/lib/cost-engine/origin-detection';
import { predictOrigin } from '@/app/lib/trade/origin-predictor';

// ─── detectOrigin tests ─────────────────────────────────

describe('F041: detectOrigin', () => {
  test('Nike shoes → US (brand detection)', () => {
    const result = detectOrigin('Nike Air Max shoes');
    expect(result.country).toBe('US');
    expect(result.method).toBe('brand');
    expect(result.score).toBeGreaterThan(0);
  });

  test('Xiaomi phone → CN (brand detection)', () => {
    const result = detectOrigin('Xiaomi Redmi Note 12');
    expect(result.country).toBe('CN');
    expect(result.method).toBe('brand');
  });

  test('AliExpress product → CN (platform detection)', () => {
    const result = detectOrigin('Phone case', undefined, undefined, 'AliExpress');
    expect(result.country).toBe('CN');
    expect(result.method).toBe('platform');
    expect(result.matchedName).toBe('aliexpress');
  });

  test('Made in Japan → JP (keyword detection)', () => {
    const result = detectOrigin('Traditional ceramics Made in Japan');
    expect(result.country).toBe('JP');
    expect(result.method).toBe('keyword');
    expect(result.score).toBeGreaterThanOrEqual(0.9);
  });

  test('Empty string → returns default without error', () => {
    const result = detectOrigin('');
    expect(result).toBeDefined();
    expect(result.country).toBeTruthy();
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  test('Special characters only → returns default without error', () => {
    const result = detectOrigin('!@#$%^&*()');
    expect(result).toBeDefined();
    expect(result.country).toBeTruthy();
    expect(result.method).toBe('default');
  });
});

// ─── predictOrigin tests ────────────────────────────────

describe('F041: predictOrigin', () => {
  test('cotton t-shirt → results include CN', () => {
    const result = predictOrigin('cotton t-shirt');
    expect(result.predictedOrigins.length).toBeGreaterThan(0);
    expect(result.predictedOrigins.some(o => o.country === 'CN')).toBe(true);
  });

  test('brand "apple" → US in results', () => {
    const result = predictOrigin('smartphone', 'apple');
    expect(result.predictedOrigins.some(o => o.country === 'US')).toBe(true);
  });

  test('returns valid structure with needsVerification', () => {
    const result = predictOrigin('random unknown product xyz');
    expect(result).toHaveProperty('predictedOrigins');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('needsVerification');
    expect(typeof result.confidence).toBe('number');
  });
});

// ─── Error resilience ───────────────────────────────────

describe('F041: Error resilience', () => {
  test('detectOrigin handles undefined args gracefully', () => {
    const result = detectOrigin(undefined, undefined, undefined, undefined);
    expect(result).toBeDefined();
    expect(result.country).toBeDefined();
  });

  test('predictOrigin handles empty string gracefully', () => {
    const result = predictOrigin('');
    expect(result).toBeDefined();
    expect(result.predictedOrigins).toBeDefined();
  });

  test('predictOrigin try-catch returns safe default', () => {
    // Force an unusual input — should not throw
    const result = predictOrigin(null as unknown as string);
    expect(result).toBeDefined();
    expect(result.needsVerification).toBe(true);
  });
});
