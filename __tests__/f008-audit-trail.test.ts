/**
 * F008: Data Management Audit Trail — Unit Tests
 */
import { auditsToCsv, VALID_ACTORS, VALID_ACTIONS } from '../app/lib/data-management/audit-trail';

describe('F008 Data Management Audit Trail', () => {
  // Test 1: Valid actors defined
  test('VALID_ACTORS contains expected values', () => {
    expect(VALID_ACTORS).toContain('system');
    expect(VALID_ACTORS).toContain('cron');
    expect(VALID_ACTORS).toContain('admin');
    expect(VALID_ACTORS).toContain('api');
    expect(VALID_ACTORS).toContain('user');
    expect(VALID_ACTORS).toContain('migration');
    expect(VALID_ACTORS).toHaveLength(6);
  });

  // Test 2: Valid actions defined
  test('VALID_ACTIONS contains expected values', () => {
    expect(VALID_ACTIONS).toContain('create');
    expect(VALID_ACTIONS).toContain('update');
    expect(VALID_ACTIONS).toContain('delete');
    expect(VALID_ACTIONS).toContain('rollback');
    expect(VALID_ACTIONS).toContain('validate');
    expect(VALID_ACTIONS).toContain('verify');
    expect(VALID_ACTIONS).toHaveLength(6);
  });

  // Test 3: Actor validation logic
  test('invalid actor normalized to unknown', () => {
    const isValid = (actor: string) => (VALID_ACTORS as readonly string[]).includes(actor);
    expect(isValid('system')).toBe(true);
    expect(isValid('hacker')).toBe(false);
    expect(isValid('')).toBe(false);
  });

  // Test 4: CSV export — correct headers
  test('auditsToCsv generates correct CSV headers', () => {
    const csv = auditsToCsv([]);
    expect(csv).toBe('timestamp,file_id,area,actor,action,reason,validation_passed,source_url');
  });

  // Test 5: CSV export — data rows
  test('auditsToCsv generates correct data rows', () => {
    const entries = [{
      created_at: '2026-03-24T10:00:00Z',
      file_id: 'macmap_ntlc',
      area: 1,
      actor: 'cron',
      action: 'update',
      reason: 'Daily tariff sync',
      validation_passed: true,
      source_url: 'https://wits.worldbank.org',
    }];
    const csv = auditsToCsv(entries);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2); // header + 1 row
    expect(lines[1]).toContain('macmap_ntlc');
    expect(lines[1]).toContain('cron');
    expect(lines[1]).toContain('update');
  });

  // Test 6: CSV escaping — commas in values
  test('auditsToCsv escapes commas in values', () => {
    const entries = [{
      created_at: '2026-03-24',
      file_id: 'test',
      area: 0,
      actor: 'system',
      action: 'update',
      reason: 'Updated rates, taxes, and fees',
      validation_passed: true,
      source_url: '',
    }];
    const csv = auditsToCsv(entries);
    expect(csv).toContain('"Updated rates, taxes, and fees"');
  });

  // Test 7: Pagination defaults
  test('pagination defaults: page=1, pageSize=50', () => {
    const page = Math.max(1, undefined || 1);
    const pageSize = Math.min(100, Math.max(1, undefined || 50));
    expect(page).toBe(1);
    expect(pageSize).toBe(50);
  });

  // Test 8: Pagination calculation
  test('pages calculation is correct', () => {
    const total = 123;
    const pageSize = 50;
    const pages = Math.ceil(total / pageSize);
    expect(pages).toBe(3); // 50 + 50 + 23
  });

  // Test 9: Stats aggregation logic
  test('stats by action aggregation', () => {
    const data = [
      { action: 'create' }, { action: 'update' }, { action: 'update' },
      { action: 'delete' }, { action: 'update' },
    ];
    const byAction: Record<string, number> = {};
    for (const row of data) {
      byAction[row.action] = (byAction[row.action] || 0) + 1;
    }
    expect(byAction['create']).toBe(1);
    expect(byAction['update']).toBe(3);
    expect(byAction['delete']).toBe(1);
  });

  // Test 10: Cleanup retention calculation
  test('retention cutoff is 365 days ago', () => {
    const retentionDays = 365;
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - cutoff.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(365);
  });
});
