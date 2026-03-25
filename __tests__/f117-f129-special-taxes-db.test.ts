/**
 * F117-F129: Regional Tax Rules DB — Test Suite
 */

describe('F117-F129: Special Taxes DB', () => {
  test('migration creates table with correct columns', async () => {
    const fs = await import('fs');
    const sql = fs.readFileSync('supabase/migrations/053_special_taxes_db.sql', 'utf-8');
    expect(sql).toContain('CREATE TABLE');
    expect(sql).toContain('special_tax_rules');
    expect(sql).toContain('country_code TEXT NOT NULL');
    expect(sql).toContain('tax_type TEXT NOT NULL');
    expect(sql).toContain('rate DECIMAL');
    expect(sql).toContain('per_unit_amount');
    expect(sql).toContain('hs_codes TEXT[]');
    expect(sql).toContain('GIN(hs_codes)');
  });

  test('migration seeds 12 countries', async () => {
    const fs = await import('fs');
    const sql = fs.readFileSync('supabase/migrations/053_special_taxes_db.sql', 'utf-8');
    const countries = ['US', 'EU', 'GB', 'IN', 'TH', 'KR', 'JP', 'AU', 'CA', 'SA', 'AE', 'SG'];
    for (const c of countries) {
      expect(sql).toContain(`('${c}',`);
    }
  });

  test('migration includes US excise tax data', async () => {
    const fs = await import('fs');
    const sql = fs.readFileSync('supabase/migrations/053_special_taxes_db.sql', 'utf-8');
    expect(sql).toContain('Federal Excise Tax - Spirits');
    expect(sql).toContain('TTB');
    expect(sql).toContain('proof_gallon');
    expect(sql).toContain('13.50');
  });

  test('DB query module exports correct functions', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('app/lib/tax/special-taxes-db.ts', 'utf-8');
    expect(content).toContain('export async function getSpecialTaxRules');
    expect(content).toContain('export async function getSpecialTaxCountries');
    expect(content).toContain("from('special_tax_rules')");
    expect(content).toContain('.contains(');
  });

  test('DB query filters by HS code heading (4 digits)', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('app/lib/tax/special-taxes-db.ts', 'utf-8');
    expect(content).toContain('substring(0, 4)');
    expect(content).toContain('contains');
  });

  test('no as any in DB module', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('app/lib/tax/special-taxes-db.ts', 'utf-8');
    expect(content).not.toContain(': any');
  });
});
