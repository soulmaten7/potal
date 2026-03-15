/**
 * F032: Import Licensing Check
 */

export interface LicenseResult {
  required: boolean;
  licenseType: 'automatic' | 'non-automatic' | 'quota' | 'none';
  authority: string;
  processingTimeDays: number;
  documentsNeeded: string[];
  fee?: number;
  notes: string;
}

// HS chapters typically requiring import licenses
const LICENSE_REQUIREMENTS: Record<string, { type: LicenseResult['licenseType']; authority: string; days: number; docs: string[] }> = {
  '01': { type: 'non-automatic', authority: 'Agriculture/Veterinary', days: 30, docs: ['Import permit', 'Veterinary certificate', 'Health certificate'] },
  '02': { type: 'non-automatic', authority: 'Food Safety Authority', days: 14, docs: ['Import permit', 'Sanitary certificate', 'Certificate of origin'] },
  '10': { type: 'automatic', authority: 'Agriculture Ministry', days: 7, docs: ['Phytosanitary certificate', 'Quality certificate'] },
  '22': { type: 'non-automatic', authority: 'Alcohol Control Board', days: 30, docs: ['Import license', 'Laboratory analysis certificate', 'Excise stamp'] },
  '24': { type: 'non-automatic', authority: 'Tobacco Authority', days: 45, docs: ['Import license', 'Health warnings compliance', 'Tax stamps'] },
  '27': { type: 'automatic', authority: 'Energy Ministry', days: 7, docs: ['Import declaration', 'Quality certificate'] },
  '29': { type: 'non-automatic', authority: 'Chemical Safety Authority', days: 21, docs: ['Chemical import permit', 'SDS/MSDS', 'End-use certificate'] },
  '30': { type: 'non-automatic', authority: 'Drug Regulatory Authority', days: 60, docs: ['Drug import license', 'GMP certificate', 'Product registration', 'Certificate of pharmaceutical product'] },
  '36': { type: 'non-automatic', authority: 'Defense/Interior Ministry', days: 90, docs: ['Explosives license', 'End-user certificate', 'Security clearance'] },
  '93': { type: 'non-automatic', authority: 'Defense Ministry', days: 120, docs: ['Arms import license', 'End-user certificate', 'Government authorization'] },
};

export function checkLicenseRequirement(hsCode: string, destination: string): LicenseResult {
  const chapter = hsCode.replace(/\./g, '').slice(0, 2);
  const req = LICENSE_REQUIREMENTS[chapter];

  if (!req) {
    return {
      required: false, licenseType: 'none',
      authority: 'N/A', processingTimeDays: 0,
      documentsNeeded: [], notes: 'No import license required for this product category.',
    };
  }

  return {
    required: true,
    licenseType: req.type,
    authority: `${destination.toUpperCase()} ${req.authority}`,
    processingTimeDays: req.days,
    documentsNeeded: req.docs,
    fee: req.type === 'non-automatic' ? 50 : undefined,
    notes: `Import license of type "${req.type}" required. Processing time approximately ${req.days} days.`,
  };
}
