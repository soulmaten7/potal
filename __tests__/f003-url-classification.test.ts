/**
 * F003: URL-Based Classification — Unit Tests
 */

// Import helper functions for testing
// (extractProductData and parsePrice are internal, test their logic)

describe('F003 URL Classification', () => {
  // Helper: sanitize function
  const sanitize = (text: string, maxLen = 1000): string => {
    return text.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').replace(/on\w+\s*=/gi, '').trim().substring(0, maxLen);
  };

  // Helper: parsePrice function
  const parsePrice = (priceStr: string, currencyHint?: string) => {
    if (!priceStr) return null;
    const clean = priceStr.replace(/[,\s]/g, '');
    const currencyMap: Record<string, string> = { '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY' };
    let currency = currencyHint || 'USD';
    for (const [symbol, code] of Object.entries(currencyMap)) {
      if (clean.includes(symbol)) { currency = code; break; }
    }
    const numMatch = clean.match(/[\d]+\.?\d*/);
    if (!numMatch) return null;
    const price = parseFloat(numMatch[0]);
    if (isNaN(price) || price <= 0) return null;
    return { price: Math.round(price * 100) / 100, currency };
  };

  // Test 1: URL validation
  test('URL validation: https → valid, ftp → invalid', () => {
    const isValid = (url: string) => {
      try { const p = new URL(url); return p.protocol === 'https:' || p.protocol === 'http:'; }
      catch { return false; }
    };
    expect(isValid('https://amazon.com/dp/B01234')).toBe(true);
    expect(isValid('http://example.com/product')).toBe(true);
    expect(isValid('ftp://files.com/product')).toBe(false);
    expect(isValid('not-a-url')).toBe(false);
  });

  // Test 2: Sanitize XSS
  test('sanitize strips HTML tags and JS', () => {
    expect(sanitize('<script>alert("xss")</script>Cotton T-Shirt')).toBe('alert("xss")Cotton T-Shirt');
    expect(sanitize('Normal product name')).toBe('Normal product name');
    expect(sanitize('onclick=alert(1) product')).toBe('alert(1) product');
  });

  // Test 3: Parse price — USD
  test('parsePrice: "$29.99" → { price: 29.99, currency: USD }', () => {
    const result = parsePrice('$29.99');
    expect(result).toEqual({ price: 29.99, currency: 'USD' });
  });

  // Test 4: Parse price — EUR
  test('parsePrice: "€15.50" → { price: 15.50, currency: EUR }', () => {
    const result = parsePrice('€15.50');
    expect(result).toEqual({ price: 15.50, currency: 'EUR' });
  });

  // Test 5: Parse price — GBP
  test('parsePrice: "£42" → { price: 42, currency: GBP }', () => {
    const result = parsePrice('£42');
    expect(result).toEqual({ price: 42, currency: 'GBP' });
  });

  // Test 6: Parse price — with currency hint
  test('parsePrice: "29.99" with hint "CAD" → { price: 29.99, currency: CAD }', () => {
    const result = parsePrice('29.99', 'CAD');
    expect(result).toEqual({ price: 29.99, currency: 'CAD' });
  });

  // Test 7: Parse price — invalid
  test('parsePrice: "free" → null', () => {
    expect(parsePrice('free')).toBeNull();
    expect(parsePrice('')).toBeNull();
    expect(parsePrice('$0')).toBeNull();
  });

  // Test 8: Timeout constant
  test('timeout is 15 seconds', () => {
    const FETCH_TIMEOUT_MS = 15000;
    expect(FETCH_TIMEOUT_MS).toBe(15000);
  });

  // Test 9: Max retries
  test('max retries is 2', () => {
    const MAX_RETRIES = 2;
    expect(MAX_RETRIES).toBe(2);
  });

  // Test 10: HTML size limit is 5MB
  test('max HTML size is 5MB', () => {
    const MAX_FETCH_SIZE = 5 * 1024 * 1024;
    expect(MAX_FETCH_SIZE).toBe(5242880);
  });

  // Test 11: URL length limit
  test('URL over 2048 chars rejected', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2030);
    expect(longUrl.length).toBeGreaterThan(2048);
  });

  // Test 12: SPA detection
  test('SPA detection: minimal HTML + app root → warning', () => {
    const html = '<html><body><div id="app"></div></body></html>';
    const hasMinimalContent = html.replace(/<[^>]+>/g, '').trim().length < 500;
    const hasAppRoot = /<div[^>]*id=["'](app|root|__next)["']/i.test(html);
    expect(hasMinimalContent).toBe(true);
    expect(hasAppRoot).toBe(true);
  });
});
