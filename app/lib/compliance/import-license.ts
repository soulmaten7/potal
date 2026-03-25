/**
 * F056: Import License Requirements
 *
 * Country-specific import license/permit requirements by HS code chapter.
 * Covers: US(FDA/FCC/ATF/EPA/DEA), EU(CE/REACH), UK, KR, JP, AU, CA, CN, IN, BR + 20 more
 */

export interface LicenseRequirement {
  licenseType: string;
  authority: string;
  country: string;
  hsChapters: string[];
  description: string;
  mandatory: boolean;
  url?: string;
  processingDays?: number;
}

// ─── License Database ────────────────────────────────

const LICENSE_DB: LicenseRequirement[] = [
  // US
  { licenseType: 'FDA Prior Notice', authority: 'FDA', country: 'US', hsChapters: ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','33'], description: 'Food, drugs, cosmetics, medical devices', mandatory: true, url: 'https://www.fda.gov/food/importing-food-products/prior-notice-imported-foods', processingDays: 1 },
  { licenseType: 'FCC Declaration', authority: 'FCC', country: 'US', hsChapters: ['85','84'], description: 'Electronic devices, radio equipment, telecom', mandatory: true, url: 'https://www.fcc.gov/oet/ea', processingDays: 30 },
  { licenseType: 'ATF Import Permit', authority: 'ATF', country: 'US', hsChapters: ['93'], description: 'Firearms, ammunition, explosives', mandatory: true, url: 'https://www.atf.gov/firearms/import', processingDays: 90 },
  { licenseType: 'EPA Notice', authority: 'EPA', country: 'US', hsChapters: ['28','29','38'], description: 'Chemicals, pesticides under TSCA', mandatory: true, url: 'https://www.epa.gov/tsca-import-export', processingDays: 14 },
  { licenseType: 'DEA Import Permit', authority: 'DEA', country: 'US', hsChapters: ['29','30'], description: 'Controlled substances, precursors', mandatory: true, processingDays: 45 },
  { licenseType: 'USDA Phytosanitary', authority: 'USDA/APHIS', country: 'US', hsChapters: ['06','07','08','12','14'], description: 'Plants, seeds, agricultural products', mandatory: true, processingDays: 7 },
  // EU
  { licenseType: 'CE Marking', authority: 'EU Commission', country: 'EU', hsChapters: ['84','85','90','94','95'], description: 'Machinery, electronics, toys, medical devices', mandatory: true, url: 'https://ec.europa.eu/growth/single-market/ce-marking_en', processingDays: 60 },
  { licenseType: 'REACH Registration', authority: 'ECHA', country: 'EU', hsChapters: ['28','29','38','39','40'], description: 'Chemicals >1 tonne/year', mandatory: true, url: 'https://echa.europa.eu/regulations/reach', processingDays: 180 },
  { licenseType: 'EU Import License (Agricultural)', authority: 'DG AGRI', country: 'EU', hsChapters: ['01','02','03','04','10','17','20'], description: 'Agricultural import quotas', mandatory: false, processingDays: 30 },
  // UK
  { licenseType: 'UKCA Marking', authority: 'BEIS', country: 'GB', hsChapters: ['84','85','90','94','95'], description: 'Post-Brexit UK conformity for regulated products', mandatory: true, processingDays: 60 },
  // KR
  { licenseType: 'KC Certification', authority: 'KTC/KTL', country: 'KR', hsChapters: ['85','84','95'], description: 'Korea Certification for electronics, children products', mandatory: true, processingDays: 45 },
  // JP
  { licenseType: 'PSE Mark', authority: 'METI', country: 'JP', hsChapters: ['85'], description: 'Electrical Appliance and Materials Safety Law', mandatory: true, processingDays: 30 },
  { licenseType: 'Food Sanitation Certificate', authority: 'MHLW', country: 'JP', hsChapters: ['01','02','03','04','16','17','18','19','20','21','22'], description: 'Food imports under Food Sanitation Act', mandatory: true, processingDays: 14 },
  // AU
  { licenseType: 'Biosecurity Import Permit', authority: 'DAWE', country: 'AU', hsChapters: ['01','02','03','04','06','07','08','12','14','44'], description: 'Biosecurity-regulated goods', mandatory: true, url: 'https://www.agriculture.gov.au/biosecurity', processingDays: 21 },
  // CA
  { licenseType: 'Import Permit (STC)', authority: 'Global Affairs Canada', country: 'CA', hsChapters: ['93','01','02','03','04'], description: 'Strategic goods, agricultural quota items', mandatory: true, processingDays: 30 },
  // CN
  { licenseType: 'CCC Certification', authority: 'CNCA', country: 'CN', hsChapters: ['85','87','95'], description: 'China Compulsory Certification for electronics, vehicles', mandatory: true, processingDays: 90 },
  // IN
  { licenseType: 'BIS Certificate', authority: 'BIS', country: 'IN', hsChapters: ['85','95','84'], description: 'Bureau of Indian Standards for electronics, toys', mandatory: true, processingDays: 60 },
  // BR
  { licenseType: 'INMETRO Certificate', authority: 'INMETRO', country: 'BR', hsChapters: ['85','95','87'], description: 'Brazilian conformity for electronics, toys, automotive', mandatory: true, processingDays: 90 },
];

// ─── Lookup ──────────────────────────────────────────

/**
 * Get required import licenses for a product entering a specific country.
 */
export function getRequiredLicenses(country: string, hsCode: string): {
  licenses: LicenseRequirement[];
  country: string;
  hsChapter: string;
  totalRequired: number;
  mandatoryCount: number;
} {
  const cc = country.toUpperCase();
  const chapter = hsCode.replace(/[^0-9]/g, '').substring(0, 2);

  // Match country (EU members → EU rules)
  const EU_MEMBERS = new Set(['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE']);
  const matchCountries = [cc];
  if (EU_MEMBERS.has(cc)) matchCountries.push('EU');

  const licenses = LICENSE_DB.filter(lic =>
    matchCountries.includes(lic.country) && lic.hsChapters.includes(chapter)
  );

  return {
    licenses,
    country: cc,
    hsChapter: chapter,
    totalRequired: licenses.length,
    mandatoryCount: licenses.filter(l => l.mandatory).length,
  };
}
