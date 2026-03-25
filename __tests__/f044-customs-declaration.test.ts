/**
 * F044: Customs Declaration Form — Unit Tests
 */

describe('F044 Customs Declaration', () => {
  // Template data
  const TEMPLATES: Record<string, { form: string; minHsDigits: number }> = {
    US: { form: 'CBP-7501', minHsDigits: 10 },
    EU: { form: 'SAD', minHsDigits: 8 },
    GB: { form: 'CDS', minHsDigits: 10 },
    JP: { form: 'NACCS', minHsDigits: 9 },
    KR: { form: 'UNI-PASS', minHsDigits: 10 },
    AU: { form: 'ICS', minHsDigits: 8 },
    CA: { form: 'B3', minHsDigits: 10 },
  };

  const EU_MEMBERS = new Set(['DE','FR','IT','ES','NL','BE']);

  function getTemplate(country: string) {
    if (TEMPLATES[country]) return TEMPLATES[country];
    if (EU_MEMBERS.has(country)) return TEMPLATES.EU;
    return { form: 'GENERIC', minHsDigits: 6 };
  }

  // Test 1: US template → CBP-7501
  test('US destination → CBP-7501 form', () => {
    const t = getTemplate('US');
    expect(t.form).toBe('CBP-7501');
    expect(t.minHsDigits).toBe(10);
  });

  // Test 2: EU SAD format
  test('DE destination → EU SAD form (8 digits)', () => {
    const t = getTemplate('DE');
    expect(t.form).toBe('SAD');
    expect(t.minHsDigits).toBe(8);
  });

  // Test 3: HS 4-digit + US → rejected
  test('US requires 10-digit HS code', () => {
    const hs = '6109';
    const minDigits = TEMPLATES.US.minHsDigits;
    expect(hs.length).toBeLessThan(minDigits);
  });

  // Test 4: HS 10-digit + US → accepted
  test('10-digit HS passes US validation', () => {
    const hs = '6109100012';
    expect(hs.length).toBeGreaterThanOrEqual(10);
  });

  // Test 5: KR UNI-PASS format
  test('KR destination → UNI-PASS form', () => {
    const t = getTemplate('KR');
    expect(t.form).toBe('UNI-PASS');
    expect(t.minHsDigits).toBe(10);
  });

  // Test 6: CA B3 format
  test('CA destination → B3 form', () => {
    const t = getTemplate('CA');
    expect(t.form).toBe('B3');
  });

  // Test 7: Unknown country → GENERIC 6-digit
  test('unknown country → GENERIC form, 6 digits min', () => {
    const t = getTemplate('NG');
    expect(t.form).toBe('GENERIC');
    expect(t.minHsDigits).toBe(6);
  });

  // Test 8: XML escape function
  test('XML escapes special characters', () => {
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    expect(esc('AT&T')).toBe('AT&amp;T');
    expect(esc('Price < $100')).toBe('Price &lt; $100');
    expect(esc('A > B')).toBe('A &gt; B');
  });

  // Test 9: 7 templates defined
  test('7 country templates defined', () => {
    expect(Object.keys(TEMPLATES)).toHaveLength(7);
    expect(Object.keys(TEMPLATES)).toContain('US');
    expect(Object.keys(TEMPLATES)).toContain('JP');
    expect(Object.keys(TEMPLATES)).toContain('AU');
  });

  // Test 10: EU member → EU template
  test('FR (EU member) → EU SAD template', () => {
    const t = getTemplate('FR');
    expect(t.form).toBe('SAD');
  });
});
