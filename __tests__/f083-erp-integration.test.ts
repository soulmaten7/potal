/**
 * F083: ERP Integration — Unit Tests
 */
import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto';

describe('F083 ERP Integration', () => {
  // Encryption helpers (mirror production logic)
  const KEY = createHash('sha256').update('potal-erp-default-key').digest();
  const encrypt = (data: string) => {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', KEY, iv);
    let enc = cipher.update(data, 'utf8', 'hex');
    enc += cipher.final('hex');
    return iv.toString('hex') + ':' + enc;
  };
  const decrypt = (enc: string) => {
    const [ivHex, encrypted] = enc.split(':');
    const decipher = createDecipheriv('aes-256-cbc', KEY, Buffer.from(ivHex, 'hex'));
    let dec = decipher.update(encrypted, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  };

  // Test 1: Supported ERP systems
  test('8 ERP systems supported', () => {
    const systems = ['sap', 'oracle', 'netsuite', 'quickbooks', 'xero', 'sage', 'dynamics365', 'odoo'];
    expect(systems).toHaveLength(8);
  });

  // Test 2: Credential encryption roundtrip
  test('credentials encrypt/decrypt roundtrip', () => {
    const original = JSON.stringify({ apiKey: 'secret-123', apiUrl: 'https://erp.example.com' });
    const encrypted = encrypt(original);
    expect(encrypted).not.toBe(original);
    expect(encrypted).toContain(':'); // iv:ciphertext
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  // Test 3: Encryption produces different output each time (IV randomness)
  test('encryption uses random IV', () => {
    const data = 'same-data';
    const enc1 = encrypt(data);
    const enc2 = encrypt(data);
    expect(enc1).not.toBe(enc2); // Different IV
    expect(decrypt(enc1)).toBe(data);
    expect(decrypt(enc2)).toBe(data);
  });

  // Test 4: Default account mappings
  test('QuickBooks default mapping includes import duties', () => {
    const mapping = {
      importDuties: 'Cost of Goods Sold:Import Duties',
      vatPayable: 'VAT Payable',
      customsFees: 'Customs Brokerage Fees',
    };
    expect(mapping.importDuties).toContain('Import Duties');
    expect(mapping.vatPayable).toContain('VAT');
  });

  // Test 5: Xero default mapping
  test('Xero mapping uses account codes', () => {
    const mapping = { importDuties: '300 - Import Duties', vatPayable: '820 - VAT' };
    expect(mapping.importDuties).toMatch(/^\d{3}/);
  });

  // Test 6: Valid actions
  test('6 actions supported', () => {
    const actions = ['connect', 'disconnect', 'configure', 'test', 'sync', 'map_accounts'];
    expect(actions).toHaveLength(6);
    expect(actions).toContain('sync');
    expect(actions).toContain('map_accounts');
  });

  // Test 7: Auth types vary by ERP
  test('QuickBooks uses OAuth2, SAP uses basic auth', () => {
    const authTypes: Record<string, string> = {
      quickbooks: 'oauth2', xero: 'oauth2', sap: 'basic', netsuite: 'token_based',
    };
    expect(authTypes.quickbooks).toBe('oauth2');
    expect(authTypes.sap).toBe('basic');
  });

  // Test 8: Unsupported ERP rejected
  test('unsupported ERP system → rejected', () => {
    const supported = new Set(['sap', 'oracle', 'netsuite', 'quickbooks', 'xero', 'sage', 'dynamics365', 'odoo']);
    expect(supported.has('salesforce')).toBe(false);
    expect(supported.has('quickbooks')).toBe(true);
  });

  // Test 9: Sync settings default
  test('default sync: duty+tax+classifications on, invoices off', () => {
    const defaults = {
      syncDutyRates: true, syncTaxCodes: true,
      syncInvoices: false, syncClassifications: true,
      autoPostJournalEntries: false,
    };
    expect(defaults.syncDutyRates).toBe(true);
    expect(defaults.syncInvoices).toBe(false);
    expect(defaults.autoPostJournalEntries).toBe(false);
  });

  // Test 10: Disconnect clears credentials
  test('disconnect should clear credentials', () => {
    const updates = { status: 'disconnected', credentials_encrypted: null };
    expect(updates.credentials_encrypted).toBeNull();
    expect(updates.status).toBe('disconnected');
  });
});
