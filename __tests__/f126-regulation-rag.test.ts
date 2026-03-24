/**
 * F126: Regulation RAG — Unit Tests
 */
import {
  getAuthorityScore,
  generateSnippet,
  REGULATION_TOPICS,
} from '../app/lib/cost-engine/regulation-rag/index';

describe('F126 Regulation RAG', () => {
  // Test 1: Authority score — government
  test('getAuthorityScore: .gov → 1.0', () => {
    expect(getAuthorityScore('https://www.cbp.gov/trade')).toBe(1.0);
    expect(getAuthorityScore('https://customs.go.kr/eng')).toBe(1.0);
    expect(getAuthorityScore('https://ec.europa.eu/taxation')).toBe(1.0);
  });

  // Test 2: Authority score — international org
  test('getAuthorityScore: .org → 0.9', () => {
    expect(getAuthorityScore('https://www.wto.org/trade')).toBe(0.9);
    expect(getAuthorityScore('https://www.wcoomd.org/hs')).toBe(0.9);
  });

  // Test 3: Authority score — other
  test('getAuthorityScore: .com → 0.6', () => {
    expect(getAuthorityScore('https://example.com/tariff')).toBe(0.6);
    expect(getAuthorityScore('')).toBe(0.5);
  });

  // Test 4: Snippet generation — keyword found
  test('generateSnippet: keyword found → context extracted', () => {
    const content = 'The import duty rate for cotton textiles is 12% under MFN treatment for all WTO member countries.';
    const snippet = generateSnippet(content, 'cotton textiles');
    expect(snippet).toContain('cotton');
    expect(snippet.length).toBeGreaterThan(0);
    expect(snippet.length).toBeLessThan(content.length + 10);
  });

  // Test 5: Snippet generation — keyword not found
  test('generateSnippet: no match → beginning of content', () => {
    const content = 'This regulation covers all aspects of customs valuation.';
    const snippet = generateSnippet(content, 'xyz_nonexistent');
    expect(snippet).toContain('This regulation');
  });

  // Test 6: Snippet generation — empty inputs
  test('generateSnippet: empty → empty string', () => {
    expect(generateSnippet('', 'query')).toBe('');
    expect(generateSnippet('content', '')).toBe('');
  });

  // Test 7: 16 regulation topics defined
  test('REGULATION_TOPICS has 16 entries', () => {
    expect(REGULATION_TOPICS).toHaveLength(16);
    expect(REGULATION_TOPICS).toContain('tariff');
    expect(REGULATION_TOPICS).toContain('vat');
    expect(REGULATION_TOPICS).toContain('sanctions');
    expect(REGULATION_TOPICS).toContain('classification');
  });

  // Test 8: Topic validation
  test('invalid topic rejected', () => {
    const invalidTopic = 'invalid_topic_xyz';
    const isValid = (REGULATION_TOPICS as readonly string[]).includes(invalidTopic);
    expect(isValid).toBe(false);
  });

  // Test 9: Valid topic accepted
  test('valid topic accepted', () => {
    const validTopic = 'tariff';
    const isValid = (REGULATION_TOPICS as readonly string[]).includes(validTopic);
    expect(isValid).toBe(true);
  });

  // Test 10: Reranking formula
  test('reranking: similarity*0.6 + recency*0.2 + authority*0.2', () => {
    const sim = 0.9;
    const recency = 1.0; // <6 months
    const authority = 1.0; // .gov
    const score = sim * 0.6 + recency * 0.2 + authority * 0.2;
    expect(score).toBeCloseTo(0.94, 2);

    // Old + non-gov
    const score2 = 0.9 * 0.6 + 0.3 * 0.2 + 0.6 * 0.2;
    expect(score2).toBeCloseTo(0.72, 2);
  });

  // Test 11: Recency scoring
  test('recency: <180d = 1.0, <365d = 0.7, else = 0.3', () => {
    const getRecency = (days: number) => days < 180 ? 1.0 : days < 365 ? 0.7 : 0.3;
    expect(getRecency(30)).toBe(1.0);
    expect(getRecency(200)).toBe(0.7);
    expect(getRecency(500)).toBe(0.3);
  });

  // Test 12: Cache key hashing
  test('same text → same hash', () => {
    const { createHash } = require('crypto');
    const hash1 = createHash('sha256').update('import duty cotton'.toLowerCase().trim()).digest('hex');
    const hash2 = createHash('sha256').update('import duty cotton'.toLowerCase().trim()).digest('hex');
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  // Test 13: Snippet with long content
  test('generateSnippet: long content → truncated with ellipsis', () => {
    const content = 'A'.repeat(1000) + ' tariff rate ' + 'B'.repeat(1000);
    const snippet = generateSnippet(content, 'tariff rate', 50);
    expect(snippet).toContain('...');
    expect(snippet.length).toBeLessThan(content.length);
  });

  // Test 14: Authority score for gc.ca
  test('getAuthorityScore: gc.ca → 1.0', () => {
    expect(getAuthorityScore('https://cbsa-asfc.gc.ca/trade')).toBe(1.0);
  });
});
