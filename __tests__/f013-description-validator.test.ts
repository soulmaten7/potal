/**
 * F013: Bad Product Description Detection — Unit Tests
 */
import { validateProductDescription } from '../app/lib/cost-engine/ai-classifier/description-validator';

describe('F013 Description Validator', () => {
  // Test 1: Empty/too short string
  test('empty string → too_short error', () => {
    const result = validateProductDescription('');
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.type === 'too_short')).toBe(true);
    expect(result.qualityScore).toBeLessThan(100);
  });

  // Test 2: 2-character string
  test('2-char string → too_short error', () => {
    const result = validateProductDescription('ab');
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.type === 'too_short')).toBe(true);
  });

  // Test 3: Vague term "gift"
  test('"gift" → vague error', () => {
    const result = validateProductDescription('gift');
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.type === 'vague')).toBe(true);
  });

  // Test 4: Prohibited term "no commercial value"
  test('"no commercial value" → prohibited error', () => {
    const result = validateProductDescription('no commercial value');
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.type === 'prohibited')).toBe(true);
  });

  // Test 5: Numeric-only
  test('"12345" → generic error (numeric only)', () => {
    const result = validateProductDescription('12345');
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.message.toLowerCase().includes('numbers'))).toBe(true);
  });

  // Test 6: Good description
  test('detailed description → valid, high score', () => {
    const result = validateProductDescription('Cotton T-Shirt, short sleeve, men, knitted');
    expect(result.valid).toBe(true);
    expect(result.qualityScore).toBeGreaterThanOrEqual(80);
    expect(result.riskLevel).toBe('low');
  });

  // Test 7: qualityScore clamped to 0-100
  test('qualityScore is always 0-100', () => {
    // Many issues should push score down but not below 0
    const result = validateProductDescription('gift');
    expect(result.qualityScore).toBeGreaterThanOrEqual(0);
    expect(result.qualityScore).toBeLessThanOrEqual(100);

    const good = validateProductDescription('Premium organic cotton t-shirt short sleeve for men size medium');
    expect(good.qualityScore).toBeGreaterThanOrEqual(0);
    expect(good.qualityScore).toBeLessThanOrEqual(100);
  });

  // Test 8: Special characters only
  test('"!!@@##$$" → error (no alphabetic content)', () => {
    const result = validateProductDescription('!!@@##$$');
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.message.toLowerCase().includes('alphabetic'))).toBe(true);
  });

  // Test 9: Generic category word alone
  test('"tools" → generic warning', () => {
    const result = validateProductDescription('tools');
    expect(result.issues.some(i => i.type === 'generic')).toBe(true);
  });

  // Test 10: Misdeclaration indicator
  test('"consolidated shipment" → misdeclaration warning', () => {
    const result = validateProductDescription('consolidated shipment of various items');
    expect(result.issues.some(i => i.type === 'misdeclaration')).toBe(true);
  });
});
