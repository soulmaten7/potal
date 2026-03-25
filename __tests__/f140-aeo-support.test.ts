/**
 * F140: AEO Support — Test Suite
 */

import { AEO_PROGRAMS, MRA_AGREEMENTS, findMra, getMraPartners } from '@/app/lib/compliance/aeo-programs';

describe('F140: AEO Programs Database', () => {
  test('C1: 10+ country programs defined', () => {
    expect(Object.keys(AEO_PROGRAMS).length).toBeGreaterThanOrEqual(10);
    expect(AEO_PROGRAMS['US']).toBeDefined();
    expect(AEO_PROGRAMS['EU']).toBeDefined();
    expect(AEO_PROGRAMS['JP']).toBeDefined();
    expect(AEO_PROGRAMS['KR']).toBeDefined();
    expect(AEO_PROGRAMS['CN']).toBeDefined();
    expect(AEO_PROGRAMS['AU']).toBeDefined();
    expect(AEO_PROGRAMS['CA']).toBeDefined();
    expect(AEO_PROGRAMS['SG']).toBeDefined();
    expect(AEO_PROGRAMS['NZ']).toBeDefined();
    expect(AEO_PROGRAMS['GB']).toBeDefined();
  });

  test('each program has required fields', () => {
    for (const [code, program] of Object.entries(AEO_PROGRAMS)) {
      expect(program.programName).toBeTruthy();
      expect(program.authority).toBeTruthy();
      expect(program.types.length).toBeGreaterThan(0);
      expect(program.benefits.length).toBeGreaterThan(0);
      expect(program.requirements.length).toBeGreaterThan(0);
      expect(program.processingTime).toBeTruthy();
      expect(program.renewalPeriod).toBeTruthy();
      expect(program.applicationUrl).toBeTruthy();
    }
  });

  test('benefits have category field', () => {
    for (const program of Object.values(AEO_PROGRAMS)) {
      for (const benefit of program.benefits) {
        expect(['reduced_inspections', 'faster_clearance', 'priority_processing', 'reduced_bond', 'other']).toContain(benefit.category);
      }
    }
  });
});

describe('F140: MRA Agreements', () => {
  test('C5: 14+ MRA agreements defined', () => {
    expect(MRA_AGREEMENTS.length).toBeGreaterThanOrEqual(14);
  });

  test('findMra US↔EU works bidirectionally', () => {
    const usToEu = findMra('US', 'EU');
    expect(usToEu).not.toBeNull();
    expect(usToEu!.fromProgram).toBe('C-TPAT');
    expect(usToEu!.toProgram).toBe('AEO');

    const euToUs = findMra('EU', 'US');
    expect(euToUs).not.toBeNull();
    expect(euToUs!.fromProgram).toBe('C-TPAT'); // Same agreement
  });

  test('findMra returns null for non-existent pair', () => {
    const result = findMra('US', 'BR');
    expect(result).toBeNull();
  });

  test('getMraPartners returns all partners for US', () => {
    const partners = getMraPartners('US');
    expect(partners.length).toBeGreaterThanOrEqual(5);
    expect(partners.some(p => p.partner === 'EU')).toBe(true);
    expect(partners.some(p => p.partner === 'JP')).toBe(true);
    expect(partners.some(p => p.partner === 'KR')).toBe(true);
  });

  test('getMraPartners returns empty for unknown country', () => {
    const partners = getMraPartners('ZZ');
    expect(partners).toEqual([]);
  });
});

describe('F140: Route Files Exist', () => {
  test('benefits route exists', async () => {
    const fs = await import('fs');
    expect(fs.existsSync('app/api/v1/compliance/aeo/benefits/route.ts')).toBe(true);
    const content = fs.readFileSync('app/api/v1/compliance/aeo/benefits/route.ts', 'utf-8');
    expect(content).toContain('findMra');
    expect(content).toContain('getMraPartners');
    expect(content).toContain('savingsEstimate');
  });

  test('eligibility route exists with scoring', async () => {
    const fs = await import('fs');
    expect(fs.existsSync('app/api/v1/compliance/aeo/eligibility/route.ts')).toBe(true);
    const content = fs.readFileSync('app/api/v1/compliance/aeo/eligibility/route.ts', 'utf-8');
    expect(content).toContain('score');
    expect(content).toContain('missingRequirements');
    expect(content).toContain('recommendedProgram');
    expect(content).toContain('has_compliance_officer');
    expect(content).toContain('has_security_plan');
  });

  test('guide route exists with steps and documents', async () => {
    const fs = await import('fs');
    expect(fs.existsSync('app/api/v1/compliance/aeo/guide/route.ts')).toBe(true);
    const content = fs.readFileSync('app/api/v1/compliance/aeo/guide/route.ts', 'utf-8');
    expect(content).toContain('applicationSteps');
    expect(content).toContain('requiredDocuments');
    expect(content).toContain('tips');
    expect(content).toContain('cbp.gov');
    expect(content).toContain('applicationUrl');
  });
});
