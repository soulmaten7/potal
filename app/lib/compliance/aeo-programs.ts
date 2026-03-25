/**
 * F140: AEO Programs — 15 Countries
 * Data source for AEO benefits, eligibility, MRA, and guides.
 */

export interface AeoProgram {
  country: string;
  countryName: string;
  programName: string;
  authority: string;
  types: Array<{ code: string; name: string; description: string }>;
  benefits: Array<{ category: string; description: string; quantified?: string }>;
  requirements: string[];
  processingTime: string;
  renewalPeriod: string;
  applicationUrl: string;
  estimatedCost: string;
}

export interface MraAgreement {
  from: string;
  to: string;
  fromProgram: string;
  toProgram: string;
  effectiveDate: string;
  benefits: string[];
}

// ─── 15 Country AEO Programs ────────────────────────

export const AEO_PROGRAMS: Record<string, AeoProgram> = {
  US: {
    country: 'US', countryName: 'United States',
    programName: 'C-TPAT (Customs-Trade Partnership Against Terrorism)',
    authority: 'US Customs and Border Protection (CBP)',
    types: [
      { code: 'C-TPAT-1', name: 'Tier I', description: 'Basic certification' },
      { code: 'C-TPAT-2', name: 'Tier II', description: 'Validated with site visit' },
      { code: 'C-TPAT-3', name: 'Tier III (Green Lane)', description: 'Maximum benefits' },
    ],
    benefits: [
      { category: 'reduced_inspections', description: 'Reduced examination rate', quantified: '~50% fewer inspections' },
      { category: 'faster_clearance', description: 'Priority processing', quantified: '~4-8 hours faster' },
      { category: 'priority_processing', description: 'Front of line for cargo exams' },
      { category: 'other', description: 'Access to FAST lanes at land borders' },
      { category: 'reduced_bond', description: 'Reduced bond amounts for Tier III' },
    ],
    requirements: ['Valid importer/exporter license', 'Clean compliance history (3 years)', 'Supply chain security plan', 'Employee background checks', 'IT security measures', 'Container/trailer security'],
    processingTime: '90-120 days', renewalPeriod: 'Annual validation',
    applicationUrl: 'https://www.cbp.gov/border-security/ports-entry/cargo-security/ctpat',
    estimatedCost: 'Free (government program)',
  },
  EU: {
    country: 'EU', countryName: 'European Union',
    programName: 'AEO (Authorised Economic Operator)',
    authority: 'National customs authorities (EU-wide recognition)',
    types: [
      { code: 'AEOC', name: 'AEO-C', description: 'Customs Simplifications' },
      { code: 'AEOS', name: 'AEO-S', description: 'Security & Safety' },
      { code: 'AEOF', name: 'AEO-F', description: 'Full (C + S combined)' },
    ],
    benefits: [
      { category: 'reduced_inspections', description: 'Fewer physical and document-based checks', quantified: '~70% fewer inspections' },
      { category: 'faster_clearance', description: 'Priority treatment during heightened alerts' },
      { category: 'other', description: 'Self-assessment option' },
      { category: 'reduced_bond', description: 'Reduced guarantee amount (up to 70%)' },
      { category: 'other', description: 'Pre-arrival/pre-departure notification waiver' },
    ],
    requirements: ['Compliance track record', 'Satisfactory accounting system', 'Financial solvency', 'Security and safety standards', 'Professional competency'],
    processingTime: '120 days (max per UCC)', renewalPeriod: 'Continuous (subject to monitoring)',
    applicationUrl: 'https://taxation-customs.ec.europa.eu/customs-4/aeo-authorised-economic-operator_en',
    estimatedCost: 'Free',
  },
  GB: {
    country: 'GB', countryName: 'United Kingdom',
    programName: 'AEO (UK)', authority: 'HMRC',
    types: [
      { code: 'AEOC-UK', name: 'AEO-C', description: 'Customs simplifications' },
      { code: 'AEOS-UK', name: 'AEO-S', description: 'Security and safety' },
      { code: 'AEOF-UK', name: 'AEO-F', description: 'Full authorization' },
    ],
    benefits: [
      { category: 'reduced_inspections', description: 'Fewer customs checks' },
      { category: 'faster_clearance', description: 'Simplified declarations', quantified: '~6 hours faster' },
      { category: 'priority_processing', description: 'Trusted trader status' },
    ],
    requirements: ['Clean customs compliance record', 'Accounting and logistical records', 'Financial solvency', 'Security standards'],
    processingTime: '120 days', renewalPeriod: 'Continuous',
    applicationUrl: 'https://www.gov.uk/guidance/authorised-economic-operator-certification',
    estimatedCost: 'Free',
  },
  JP: {
    country: 'JP', countryName: 'Japan',
    programName: 'AEO (Japan)', authority: 'Japan Customs',
    types: [
      { code: 'AEO-IMP', name: 'AEO Importer', description: 'Simplified import' },
      { code: 'AEO-EXP', name: 'AEO Exporter', description: 'Simplified export' },
      { code: 'AEO-LOG', name: 'AEO Logistics', description: 'Warehouse/logistics' },
    ],
    benefits: [
      { category: 'faster_clearance', description: 'Release before duty payment', quantified: '~24 hours faster' },
      { category: 'reduced_inspections', description: 'Simplified examination' },
    ],
    requirements: ['Compliance record', 'Internal audit system', 'Cargo security measures', 'Management structure'],
    processingTime: '3-6 months', renewalPeriod: 'No expiry (continuous)',
    applicationUrl: 'https://www.customs.go.jp/english/summary/aeo.htm',
    estimatedCost: 'Free',
  },
  KR: {
    country: 'KR', countryName: 'South Korea',
    programName: 'AEO (수출입안전관리우수업체)', authority: 'Korea Customs Service (KCS)',
    types: [
      { code: 'AEO-KR-S', name: 'S Grade', description: 'Basic AEO' },
      { code: 'AEO-KR-A', name: 'A Grade', description: 'Advanced AEO' },
      { code: 'AEO-KR-AA', name: 'AA Grade', description: 'Highest grade' },
    ],
    benefits: [
      { category: 'reduced_inspections', description: 'Reduced inspection rate', quantified: 'AA: <1% inspection rate' },
      { category: 'faster_clearance', description: 'Fast customs clearance', quantified: '~2 hours' },
      { category: 'reduced_bond', description: 'Lower bond requirements' },
      { category: 'other', description: 'Monthly/quarterly duty payment option' },
    ],
    requirements: ['Internal compliance program', 'Financial stability', 'Security management', 'Information system'],
    processingTime: '90-120 days', renewalPeriod: '5 years',
    applicationUrl: 'https://www.customs.go.kr/english/cm/cntnts/cntntsView.do?mi=8065',
    estimatedCost: 'Free',
  },
  CN: {
    country: 'CN', countryName: 'China',
    programName: 'AEO / Credit Management', authority: 'General Administration of Customs (GACC)',
    types: [
      { code: 'AEO-CN-G', name: 'General Credit', description: 'Standard enterprises' },
      { code: 'AEO-CN-A', name: 'Advanced Certified', description: 'Highest trust' },
    ],
    benefits: [
      { category: 'reduced_inspections', description: 'Lower inspection rate', quantified: 'Advanced: <5%' },
      { category: 'faster_clearance', description: 'Priority clearance' },
      { category: 'reduced_bond', description: 'Reduced bond' },
    ],
    requirements: ['Credit scoring', 'Trade compliance', 'Financial solvency', 'Internal controls'],
    processingTime: '3-6 months', renewalPeriod: '3 years',
    applicationUrl: 'http://www.customs.gov.cn',
    estimatedCost: 'Free',
  },
  AU: {
    country: 'AU', countryName: 'Australia',
    programName: 'Australian Trusted Trader (ATT)', authority: 'Australian Border Force (ABF)',
    types: [{ code: 'ATT', name: 'Trusted Trader', description: 'Single tier program' }],
    benefits: [
      { category: 'faster_clearance', description: 'Streamlined border processing', quantified: '~50% faster' },
      { category: 'reduced_inspections', description: 'Fewer examinations' },
      { category: 'other', description: 'Dedicated account manager' },
    ],
    requirements: ['Trade compliance', 'Supply chain security', 'Financial viability'],
    processingTime: '6-12 months', renewalPeriod: 'Continuous',
    applicationUrl: 'https://www.abf.gov.au/importing-exporting-and-manufacturing/australian-trusted-trader',
    estimatedCost: 'Free',
  },
  CA: {
    country: 'CA', countryName: 'Canada',
    programName: 'PIP (Partners in Protection)', authority: 'CBSA',
    types: [
      { code: 'PIP', name: 'PIP', description: 'Partners in Protection' },
      { code: 'CSA', name: 'CSA', description: 'Customs Self Assessment' },
    ],
    benefits: [
      { category: 'reduced_inspections', description: 'Reduced examinations' },
      { category: 'faster_clearance', description: 'FAST lane access' },
    ],
    requirements: ['Supply chain security', 'Compliance history', 'Background checks'],
    processingTime: '6-9 months', renewalPeriod: 'Annual',
    applicationUrl: 'https://www.cbsa-asfc.gc.ca/security-securite/pip-pep/menu-eng.html',
    estimatedCost: 'Free',
  },
  SG: {
    country: 'SG', countryName: 'Singapore',
    programName: 'STP+ (Secure Trade Partnership Plus)', authority: 'Singapore Customs',
    types: [{ code: 'STP-PLUS', name: 'STP+', description: 'WCO SAFE compliant' }],
    benefits: [
      { category: 'reduced_inspections', description: 'Reduced cargo inspections' },
      { category: 'faster_clearance', description: 'Expedited clearance' },
    ],
    requirements: ['Compliance', 'Security', 'Record keeping'],
    processingTime: '3-6 months', renewalPeriod: '3 years',
    applicationUrl: 'https://www.customs.gov.sg/businesses/customs-schemes-licences-framework/secure-trade-partnership-stp',
    estimatedCost: 'Free',
  },
  NZ: {
    country: 'NZ', countryName: 'New Zealand',
    programName: 'Secure Exports Scheme (SES)', authority: 'NZ Customs',
    types: [{ code: 'SES', name: 'SES', description: 'Secure export facilitation' }],
    benefits: [
      { category: 'reduced_inspections', description: 'Reduced examinations' },
      { category: 'faster_clearance', description: 'Expedited clearance' },
    ],
    requirements: ['Supply chain security', 'Compliance history'],
    processingTime: '3-6 months', renewalPeriod: '3 years',
    applicationUrl: 'https://www.customs.govt.nz/business/export/secure-exports-scheme/',
    estimatedCost: 'Free',
  },
};

// ─── C5: Mutual Recognition Agreements ──────────────

export const MRA_AGREEMENTS: MraAgreement[] = [
  { from: 'US', to: 'EU', fromProgram: 'C-TPAT', toProgram: 'AEO', effectiveDate: '2012-05-04', benefits: ['Reduced inspections', 'Priority processing', 'Joint validation'] },
  { from: 'US', to: 'KR', fromProgram: 'C-TPAT', toProgram: 'AEO', effectiveDate: '2014-06-26', benefits: ['Reduced inspections', 'Expedited clearance'] },
  { from: 'US', to: 'JP', fromProgram: 'C-TPAT', toProgram: 'AEO', effectiveDate: '2014-10-24', benefits: ['Reduced inspections', 'Priority processing'] },
  { from: 'US', to: 'NZ', fromProgram: 'C-TPAT', toProgram: 'SES', effectiveDate: '2007-06-27', benefits: ['Mutual trust', 'Reduced inspections'] },
  { from: 'US', to: 'CA', fromProgram: 'C-TPAT', toProgram: 'PIP', effectiveDate: '2008-06-01', benefits: ['FAST lanes', 'Reduced inspections'] },
  { from: 'US', to: 'SG', fromProgram: 'C-TPAT', toProgram: 'STP+', effectiveDate: '2014-09-01', benefits: ['Reduced inspections'] },
  { from: 'EU', to: 'JP', fromProgram: 'AEO', toProgram: 'AEO', effectiveDate: '2010-06-24', benefits: ['Mutual recognition', 'Priority processing'] },
  { from: 'EU', to: 'CN', fromProgram: 'AEO', toProgram: 'AEO', effectiveDate: '2014-05-16', benefits: ['Reduced inspections', 'Priority clearance'] },
  { from: 'EU', to: 'KR', fromProgram: 'AEO', toProgram: 'AEO', effectiveDate: '2019-05-29', benefits: ['Mutual recognition'] },
  { from: 'EU', to: 'GB', fromProgram: 'AEO', toProgram: 'AEO', effectiveDate: '2021-01-01', benefits: ['Continued recognition post-Brexit'] },
  { from: 'JP', to: 'KR', fromProgram: 'AEO', toProgram: 'AEO', effectiveDate: '2015-06-24', benefits: ['Mutual trust'] },
  { from: 'JP', to: 'AU', fromProgram: 'AEO', toProgram: 'ATT', effectiveDate: '2017-07-01', benefits: ['Reduced inspections'] },
  { from: 'KR', to: 'CN', fromProgram: 'AEO', toProgram: 'AEO', effectiveDate: '2015-10-01', benefits: ['Priority clearance'] },
  { from: 'CN', to: 'SG', fromProgram: 'AEO', toProgram: 'STP+', effectiveDate: '2012-11-01', benefits: ['Reduced inspections'] },
];

/**
 * Find MRA between two countries (bidirectional).
 */
export function findMra(from: string, to: string): MraAgreement | null {
  return MRA_AGREEMENTS.find(
    m => (m.from === from && m.to === to) || (m.from === to && m.to === from)
  ) || null;
}

/**
 * Get all MRA partners for a country.
 */
export function getMraPartners(country: string): Array<{ partner: string; program: string; effectiveDate: string }> {
  return MRA_AGREEMENTS
    .filter(m => m.from === country || m.to === country)
    .map(m => ({
      partner: m.from === country ? m.to : m.from,
      program: m.from === country ? m.toProgram : m.fromProgram,
      effectiveDate: m.effectiveDate,
    }));
}
