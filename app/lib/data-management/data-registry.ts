/**
 * Data Registry — Complete inventory of all data files used by 12 TLC Areas.
 * Each entry: path, area, type, description, record count, source, update frequency, priority.
 */

export interface DataFile {
  path: string;
  area: number;
  areaName: string;
  type: 'code' | 'data' | 'db' | 'external';
  description: string;
  recordCount?: number;
  sizeKB?: number;
  sourceUrl?: string;
  updateFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'immutable' | 'on_demand';
  dependencies?: string[];
  priority: 'P0' | 'P1' | 'P2' | 'P3';
}

export const DATA_REGISTRY: DataFile[] = [
  // ═══ Area 0: HS Classification ═══
  { path: 'app/lib/cost-engine/gri-classifier/steps/v3/step0-input.ts', area: 0, areaName: 'HS Classification', type: 'code', description: 'Material keyword extraction (79 groups)', updateFrequency: 'immutable', priority: 'P1' },
  { path: 'app/lib/cost-engine/gri-classifier/steps/v3/step2-1-section-candidate.ts', area: 0, areaName: 'HS Classification', type: 'code', description: 'MATERIAL_TO_SECTION (116) + CATEGORY_TO_SECTION (128)', updateFrequency: 'immutable', priority: 'P1' },
  { path: 'app/lib/cost-engine/gri-classifier/steps/v3/step3-heading.ts', area: 0, areaName: 'HS Classification', type: 'code', description: 'KEYWORD_TO_HEADINGS (400 inline)', updateFrequency: 'on_demand', priority: 'P1' },
  { path: 'app/lib/cost-engine/gri-classifier/data/codified-rules.ts', area: 0, areaName: 'HS Classification', type: 'data', description: 'Section/Chapter Note codified rules', recordCount: 592, updateFrequency: 'annual', priority: 'P1' },
  { path: 'app/lib/cost-engine/gri-classifier/data/heading-descriptions.ts', area: 0, areaName: 'HS Classification', type: 'data', description: 'WCO HS 2022 heading descriptions', recordCount: 1233, updateFrequency: 'annual', priority: 'P0', sourceUrl: 'https://github.com/datasets/harmonized-system' },
  { path: 'app/lib/cost-engine/gri-classifier/data/subheading-descriptions.ts', area: 0, areaName: 'HS Classification', type: 'data', description: 'WCO HS 2022 subheading descriptions', recordCount: 5621, updateFrequency: 'annual', priority: 'P0', sourceUrl: 'https://github.com/datasets/harmonized-system' },
  { path: 'app/lib/cost-engine/gri-classifier/data/chapter-descriptions.ts', area: 0, areaName: 'HS Classification', type: 'data', description: 'WCO HS 2022 chapter descriptions', recordCount: 97, updateFrequency: 'annual', priority: 'P0' },
  { path: 'app/lib/cost-engine/gri-classifier/data/section-notes.ts', area: 0, areaName: 'HS Classification', type: 'data', description: 'WCO Section Notes (9 with text, 12 genuinely empty)', recordCount: 21, updateFrequency: 'annual', priority: 'P1' },
  { path: 'app/lib/cost-engine/gri-classifier/data/chapter-notes.ts', area: 0, areaName: 'HS Classification', type: 'data', description: 'WCO Chapter Notes (94 with text)', recordCount: 96, updateFrequency: 'annual', priority: 'P1' },
  { path: 'app/lib/cost-engine/gri-classifier/data/conflict-patterns-data.ts', area: 0, areaName: 'HS Classification', type: 'data', description: 'CBP+EBTI conflict patterns (top 20/chapter)', recordCount: 1563, updateFrequency: 'monthly', priority: 'P2' },
  { path: 'db:product_hs_mappings', area: 0, areaName: 'HS Classification', type: 'db', description: 'Product→HS6 mapping cache', recordCount: 1360000, updateFrequency: 'on_demand', priority: 'P2' },
  { path: 'db:hs_classification_vectors', area: 0, areaName: 'HS Classification', type: 'db', description: 'Vector embeddings for HS search', recordCount: 3431, updateFrequency: 'on_demand', priority: 'P2' },
  { path: 'db:gov_tariff_schedules', area: 0, areaName: 'HS Classification', type: 'db', description: '7-country tariff schedules (HS 8-10 digit)', recordCount: 89842, updateFrequency: 'annual', priority: 'P1', sourceUrl: 'https://api.trade.gov/' },

  // ═══ Area 1: Duty Rate ═══
  { path: 'app/lib/cost-engine/macmap-lookup.ts', area: 1, areaName: 'Duty Rate', type: 'code', description: 'MacMap DB lookup logic (MFN/MIN/AGR)', updateFrequency: 'immutable', priority: 'P0' },
  { path: 'app/lib/cost-engine/section301-lookup.ts', area: 1, areaName: 'Duty Rate', type: 'code', description: 'US Section 301/232 additional tariffs', updateFrequency: 'monthly', priority: 'P0', sourceUrl: 'https://ustr.gov/issue-areas/enforcement/section-301-investigations' },
  { path: 'app/lib/cost-engine/trade-remedy-lookup.ts', area: 1, areaName: 'Duty Rate', type: 'code', description: 'AD/CVD trade remedy lookup', updateFrequency: 'immutable', priority: 'P0' },
  { path: 'db:macmap_ntlc_rates', area: 1, areaName: 'Duty Rate', type: 'db', description: 'MFN tariff rates (53 countries)', recordCount: 537894, updateFrequency: 'annual', priority: 'P0', sourceUrl: 'https://www.macmap.org/' },
  { path: 'db:macmap_min_rates', area: 1, areaName: 'Duty Rate', type: 'db', description: 'Minimum tariff rates (53 countries bilateral)', recordCount: 105450824, updateFrequency: 'annual', priority: 'P1', sourceUrl: 'https://www.macmap.org/' },
  { path: 'db:macmap_agr_rates', area: 1, areaName: 'Duty Rate', type: 'db', description: 'Agreement tariff rates (FTA)', recordCount: 128774560, updateFrequency: 'annual', priority: 'P1', sourceUrl: 'https://www.macmap.org/' },

  // ═══ Area 2: VAT/GST ═══
  { path: 'app/lib/cost-engine/GlobalCostEngine.ts', area: 2, areaName: 'VAT/GST', type: 'code', description: 'Global VAT/GST calculation engine', updateFrequency: 'immutable', priority: 'P0' },
  { path: 'app/lib/cost-engine/eu-vat-rates.ts', area: 2, areaName: 'VAT/GST', type: 'code', description: 'EU country+chapter-specific reduced VAT rates', updateFrequency: 'quarterly', priority: 'P1', sourceUrl: 'https://ec.europa.eu/taxation_customs/tedb/' },
  { path: 'app/lib/cost-engine/ioss-oss.ts', area: 2, areaName: 'VAT/GST', type: 'code', description: 'EU IOSS/OSS calculation', updateFrequency: 'annual', priority: 'P1' },
  { path: 'db:vat_gst_rates', area: 2, areaName: 'VAT/GST', type: 'db', description: 'Standard VAT/GST rates (240 countries)', recordCount: 240, updateFrequency: 'quarterly', priority: 'P0' },

  // ═══ Area 3: De Minimis ═══
  { path: 'app/lib/cost-engine/country-data.ts', area: 3, areaName: 'De Minimis', type: 'code', description: 'Country-specific de minimis thresholds', updateFrequency: 'annual', priority: 'P0' },
  { path: 'db:de_minimis_thresholds', area: 3, areaName: 'De Minimis', type: 'db', description: 'De minimis thresholds (240 countries)', recordCount: 240, updateFrequency: 'annual', priority: 'P0' },

  // ═══ Area 4: Special Tax ═══
  { path: 'app/lib/cost-engine/CostEngine.ts', area: 4, areaName: 'Special Tax', type: 'code', description: 'Special tax engine (12 countries)', updateFrequency: 'quarterly', priority: 'P1' },

  // ═══ Area 5: Customs Fees ═══
  { path: 'db:customs_fees', area: 5, areaName: 'Customs Fees', type: 'db', description: 'Customs processing fees (240 countries)', recordCount: 240, updateFrequency: 'annual', priority: 'P1', sourceUrl: 'https://www.cbp.gov/trade/basic-import-export' },

  // ═══ Area 6: AD/CVD ═══
  { path: 'db:trade_remedy_cases', area: 6, areaName: 'AD/CVD', type: 'db', description: 'Trade remedy cases', recordCount: 10999, updateFrequency: 'weekly', priority: 'P0', sourceUrl: 'https://www.trade.gov/enforcement-and-compliance' },
  { path: 'db:trade_remedy_products', area: 6, areaName: 'AD/CVD', type: 'db', description: 'Products subject to trade remedies', recordCount: 55259, updateFrequency: 'weekly', priority: 'P0' },
  { path: 'db:trade_remedy_duties', area: 6, areaName: 'AD/CVD', type: 'db', description: 'AD/CVD duty rates', recordCount: 37513, updateFrequency: 'weekly', priority: 'P0' },
  { path: 'db:safeguard_exemptions', area: 6, areaName: 'AD/CVD', type: 'db', description: 'Safeguard exemptions', recordCount: 15935, updateFrequency: 'monthly', priority: 'P1' },

  // ═══ Area 7: Rules of Origin ═══
  { path: 'app/lib/trade/roo-engine.ts', area: 7, areaName: 'Rules of Origin', type: 'code', description: 'FTA rules of origin engine', updateFrequency: 'on_demand', priority: 'P2' },
  { path: 'db:macmap_trade_agreements', area: 7, areaName: 'Rules of Origin', type: 'db', description: 'Trade agreements database', recordCount: 1319, updateFrequency: 'monthly', priority: 'P1', sourceUrl: 'https://rtais.wto.org/' },

  // ═══ Area 8: Currency ═══
  { path: 'app/lib/cost-engine/exchange-rate/exchange-rate-service.ts', area: 8, areaName: 'Currency', type: 'code', description: 'ECB exchange rate fetcher', updateFrequency: 'immutable', priority: 'P0' },
  { path: 'external:ecb_daily_xml', area: 8, areaName: 'Currency', type: 'external', description: 'ECB daily exchange rates', updateFrequency: 'daily', priority: 'P0', sourceUrl: 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml' },

  // ═══ Area 9: Insurance/Shipping ═══
  { path: 'app/lib/cost-engine/insurance-calculator.ts', area: 9, areaName: 'Insurance/Shipping', type: 'code', description: 'Insurance estimation formulas', updateFrequency: 'immutable', priority: 'P3' },
  { path: 'app/lib/shipping/shipping-calculator.ts', area: 9, areaName: 'Insurance/Shipping', type: 'code', description: 'Shipping cost estimation', updateFrequency: 'immutable', priority: 'P3' },

  // ═══ Area 10: Export Controls ═══
  { path: 'app/lib/compliance/export-controls.ts', area: 10, areaName: 'Export Controls', type: 'code', description: 'ECCN classification (9 chapters hardcoded)', updateFrequency: 'quarterly', priority: 'P2', sourceUrl: 'https://www.bis.doc.gov/index.php/regulations/commerce-control-list-ccl' },

  // ═══ Area 11: Sanctions ═══
  { path: 'app/lib/compliance/fuzzy-screening.ts', area: 11, areaName: 'Sanctions', type: 'code', description: 'Fuzzy name matching for sanctions screening', updateFrequency: 'immutable', priority: 'P0' },
  { path: 'db:sanctions_entries', area: 11, areaName: 'Sanctions', type: 'db', description: 'OFAC SDN + CSL entries', recordCount: 21301, updateFrequency: 'daily', priority: 'P0', sourceUrl: 'https://sanctionslist.ofac.treas.gov/Home/SdnList' },
  { path: 'db:sanctions_aliases', area: 11, areaName: 'Sanctions', type: 'db', description: 'Sanctions name aliases', recordCount: 22328, updateFrequency: 'daily', priority: 'P0' },
  { path: 'db:sanctions_addresses', area: 11, areaName: 'Sanctions', type: 'db', description: 'Sanctions addresses', recordCount: 24176, updateFrequency: 'daily', priority: 'P0' },
  { path: 'db:sanctions_ids', area: 11, areaName: 'Sanctions', type: 'db', description: 'Sanctions identification numbers', recordCount: 8000, updateFrequency: 'daily', priority: 'P0' },

  // ═══ Cross-Area: Pre-computed ═══
  { path: 'db:precomputed_landed_costs', area: 1, areaName: 'Duty Rate', type: 'db', description: 'Pre-computed TLC cache (490 HS6 × 240 countries)', recordCount: 117600, updateFrequency: 'on_demand', priority: 'P2', dependencies: ['db:macmap_ntlc_rates', 'db:vat_gst_rates'] },
];

/** Get all files for a specific area */
export function getAreaFiles(area: number): DataFile[] {
  return DATA_REGISTRY.filter(f => f.area === area);
}

/** Get all P0 priority files */
export function getP0Files(): DataFile[] {
  return DATA_REGISTRY.filter(f => f.priority === 'P0');
}

/** Get all DB tables */
export function getDbTables(): DataFile[] {
  return DATA_REGISTRY.filter(f => f.type === 'db');
}

/** Get files that need updating at a given frequency */
export function getFilesByFrequency(freq: DataFile['updateFrequency']): DataFile[] {
  return DATA_REGISTRY.filter(f => f.updateFrequency === freq);
}
