export interface CountryFilingGuide {
  code: string;
  name: string;
  flag: string;
  system: string;
  systemUrl: string;
  authorityName: string;
  authorityUrl: string;
  exportDocs: string[];
  importDocs: string[];
  exportSteps: string[];
  importSteps: string[];
  tips: string[];
  links: { label: string; url: string }[];
}

export const FILING_GUIDES: Record<string, CountryFilingGuide> = {
  KR: {
    code: 'KR', name: 'South Korea', flag: '\uD83C\uDDF0\uD83C\uDDF7',
    system: 'UNI-PASS', systemUrl: 'https://unipass.customs.go.kr',
    authorityName: 'Korea Customs Service', authorityUrl: 'https://www.customs.go.kr',
    exportDocs: ['Export Declaration Form', 'Commercial Invoice', 'Packing List', 'B/L or AWB', 'Certificate of Origin (for FTA)'],
    importDocs: ['Import Declaration Form', 'Commercial Invoice', 'Packing List', 'B/L or AWB', 'Import License (if applicable)', 'Certificate of Origin'],
    exportSteps: ['Login to UNI-PASS (digital certificate required)', 'Complete export declaration form', 'Wait for approval (usually same day)', 'Cargo release'],
    importSteps: ['Cargo arrival notification', 'Submit import declaration via UNI-PASS', 'Pay duties and taxes', 'Customs inspection (if selected)', 'Cargo release'],
    tips: ['Licensed customs broker recommended (KRW 30,000-50,000 per declaration)', 'First-time exporters can use free KCS consultation', 'FTA PASS portal for preferential rate applications'],
    links: [{ label: 'UNI-PASS', url: 'https://unipass.customs.go.kr' }, { label: 'Korea Customs Service', url: 'https://www.customs.go.kr' }, { label: 'FTA PASS', url: 'https://www.customs.go.kr/ftaportalkor' }],
  },
  US: {
    code: 'US', name: 'United States', flag: '\uD83C\uDDFA\uD83C\uDDF8',
    system: 'ACE (Automated Commercial Environment)', systemUrl: 'https://www.cbp.gov/trade/automated',
    authorityName: 'U.S. Customs and Border Protection', authorityUrl: 'https://www.cbp.gov',
    exportDocs: ['Electronic Export Information (EEI) via AES', 'Commercial Invoice', 'Packing List', 'Shipper\'s Letter of Instruction', 'Export License (if required by BIS)'],
    importDocs: ['CBP Form 3461 (Entry/Immediate Delivery)', 'CBP Form 7501 (Entry Summary)', 'Commercial Invoice', 'Packing List', 'B/L or AWB', 'Bond (continuous or single entry)'],
    exportSteps: ['File EEI via AESDirect for shipments > $2,500', 'Obtain ITN (Internal Transaction Number)', 'Provide ITN to carrier', 'Cargo departs'],
    importSteps: ['File entry within 15 days of arrival', 'Pay estimated duties (CBP Form 7501)', 'Customs examination (if selected)', 'Liquidation (final duty determination, up to 314 days)'],
    tips: ['Informal entry for goods < $2,500 (simplified process)', 'Continuous bond recommended for frequent importers', 'De minimis threshold: $800 (no duty for low-value shipments)', 'Licensed customs broker required for formal entries > $2,500'],
    links: [{ label: 'ACE Portal', url: 'https://www.cbp.gov/trade/automated' }, { label: 'AESDirect', url: 'https://aesdirect.census.gov' }, { label: 'CBP', url: 'https://www.cbp.gov' }, { label: 'CROSS Rulings', url: 'https://rulings.cbp.gov' }],
  },
  EU: {
    code: 'EU', name: 'European Union', flag: '\uD83C\uDDEA\uD83C\uDDFA',
    system: 'NCTS / AES (varies by member state)', systemUrl: 'https://ec.europa.eu/taxation_customs',
    authorityName: 'DG TAXUD (European Commission)', authorityUrl: 'https://ec.europa.eu/taxation_customs',
    exportDocs: ['Export Declaration (EAD)', 'Commercial Invoice', 'Packing List', 'EUR.1 or EUR-MED (for preferential origin)', 'Export License (dual-use goods)'],
    importDocs: ['Import Declaration (SAD/CDS)', 'Commercial Invoice', 'Packing List', 'EORI Number', 'Certificate of Origin', 'Conformity certificates (CE marking)'],
    exportSteps: ['Obtain EORI number', 'File export declaration via national system', 'Present goods to customs', 'Receive export clearance (MRN)'],
    importSteps: ['Pre-arrival notification (ENS for ICS2)', 'File import declaration', 'Pay import duties + VAT', 'Customs inspection (risk-based)', 'Goods release'],
    tips: ['EORI number mandatory for all EU trade', 'REX system for self-certification of origin', 'IOSS for e-commerce VAT (goods < EUR 150)', 'Each member state has its own customs IT system'],
    links: [{ label: 'TARIC Database', url: 'https://ec.europa.eu/taxation_customs/dds2/taric' }, { label: 'EBTI Rulings', url: 'https://ec.europa.eu/taxation_customs/dds2/ebti' }, { label: 'EORI Validation', url: 'https://ec.europa.eu/taxation_customs/dds2/eos/eori_validation.jsp' }],
  },
  GB: {
    code: 'GB', name: 'United Kingdom', flag: '\uD83C\uDDEC\uD83C\uDDE7',
    system: 'CDS (Customs Declaration Service)', systemUrl: 'https://www.gov.uk/guidance/customs-declaration-service',
    authorityName: 'HMRC', authorityUrl: 'https://www.gov.uk/government/organisations/hm-revenue-customs',
    exportDocs: ['Export Declaration via CDS', 'Commercial Invoice', 'Packing List', 'Export License (if applicable)'],
    importDocs: ['Import Declaration via CDS', 'Commercial Invoice', 'Packing List', 'EORI Number (GB)', 'Commodity Code', 'Import License (if applicable)'],
    exportSteps: ['Register for CDS via Government Gateway', 'Submit export declaration', 'Present goods at port/airport', 'Receive permission to progress'],
    importSteps: ['Ensure GB EORI number', 'Submit import declaration via CDS', 'Pay duties and VAT', 'Goods released (or examined)'],
    tips: ['Post-Brexit: full customs declarations required for EU goods', 'UK Global Tariff applies (replaced EU CET)', 'Simplified declaration available for authorized traders', 'Windsor Framework: special rules for Northern Ireland'],
    links: [{ label: 'UK Trade Tariff', url: 'https://www.trade-tariff.service.gov.uk' }, { label: 'CDS Guide', url: 'https://www.gov.uk/guidance/customs-declaration-service' }, { label: 'Check duties', url: 'https://www.gov.uk/trade-tariff' }],
  },
  JP: {
    code: 'JP', name: 'Japan', flag: '\uD83C\uDDEF\uD83C\uDDF5',
    system: 'NACCS', systemUrl: 'https://www.naccs.jp/e/',
    authorityName: 'Japan Customs', authorityUrl: 'https://www.customs.go.jp/english/',
    exportDocs: ['Export Declaration', 'Commercial Invoice', 'Packing List', 'Export License (for controlled items under FEFTL)'],
    importDocs: ['Import Declaration', 'Commercial Invoice', 'Packing List', 'Certificate of Origin', 'Import License (if applicable)', 'Food sanitation certificate (for food)'],
    exportSteps: ['File export declaration via NACCS', 'Customs examination', 'Export permit issued', 'Cargo loaded'],
    importSteps: ['File import declaration via NACCS', 'Pay customs duties + consumption tax (10%)', 'Customs examination (if selected)', 'Import permit issued', 'Cargo release'],
    tips: ['9-digit statistical code required (not just HS6)', 'Advance ruling (jizen kyoji) available for uncertain classifications', 'AEO program for trusted traders', 'Consumption tax: 10% standard, 8% reduced for food'],
    links: [{ label: 'NACCS', url: 'https://www.naccs.jp/e/' }, { label: 'Japan Customs', url: 'https://www.customs.go.jp/english/' }, { label: 'Tariff Schedule', url: 'https://www.customs.go.jp/english/tariff/' }],
  },
  CN: {
    code: 'CN', name: 'China', flag: '\uD83C\uDDE8\uD83C\uDDF3',
    system: 'China International Trade Single Window', systemUrl: 'https://www.singlewindow.cn',
    authorityName: 'General Administration of Customs (GACC)', authorityUrl: 'http://english.customs.gov.cn',
    exportDocs: ['Export Declaration', 'Commercial Invoice', 'Packing List', 'Sales Contract', 'Export License (for restricted goods)'],
    importDocs: ['Import Declaration', 'Commercial Invoice', 'Packing List', 'B/L or AWB', 'Certificate of Origin', 'CCC Certificate (for regulated products)', 'Import License (if applicable)'],
    exportSteps: ['Register on Single Window platform', 'File export declaration electronically', 'Customs review and inspection', 'Export clearance issued'],
    importSteps: ['Pre-arrival declaration via Single Window', 'File import declaration', 'Pay import duties + VAT (13% standard)', 'Customs inspection', 'Goods release'],
    tips: ['CCC (China Compulsory Certification) required for many product categories', 'Cross-border e-commerce has simplified procedures (zones)', 'VAT: 13% standard, 9% for agricultural products', 'Pre-classification ruling (yuguili) available but application required in Chinese'],
    links: [{ label: 'Single Window', url: 'https://www.singlewindow.cn' }, { label: 'GACC', url: 'http://english.customs.gov.cn' }],
  },
  AU: {
    code: 'AU', name: 'Australia', flag: '\uD83C\uDDE6\uD83C\uDDFA',
    system: 'ICS (Integrated Cargo System)', systemUrl: 'https://www.abf.gov.au/importing-exporting-and-manufacturing/importing/how-to-import',
    authorityName: 'Australian Border Force', authorityUrl: 'https://www.abf.gov.au',
    exportDocs: ['Export Declaration (EDN)', 'Commercial Invoice', 'Packing List', 'Export Permit (for controlled goods)'],
    importDocs: ['Import Declaration (N10)', 'Commercial Invoice', 'Packing List', 'Permits (biosecurity, therapeutic goods)', 'Certificate of Origin'],
    exportSteps: ['Lodge Export Declaration Number (EDN) via ICS', 'Present goods for examination', 'Export clearance granted'],
    importSteps: ['Lodge import declaration (self-assessed clearance)', 'Pay duties + GST (10%)', 'Biosecurity inspection (BICON)', 'Goods released'],
    tips: ['GST: 10% on most imported goods', 'De minimis: AUD 1,000 (no duty below this)', 'Biosecurity is strict (food, wood, animal products)', 'Licensed customs broker recommended'],
    links: [{ label: 'ABF', url: 'https://www.abf.gov.au' }, { label: 'Tariff Classification', url: 'https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification' }],
  },
  CA: {
    code: 'CA', name: 'Canada', flag: '\uD83C\uDDE8\uD83C\uDDE6',
    system: 'CERS / ACROSS', systemUrl: 'https://www.cbsa-asfc.gc.ca/prog/cers-sdce/menu-eng.html',
    authorityName: 'Canada Border Services Agency', authorityUrl: 'https://www.cbsa-asfc.gc.ca',
    exportDocs: ['Export Declaration (B13A)', 'Commercial Invoice', 'Packing List', 'Export Permit (if applicable)'],
    importDocs: ['Customs Coding Form (B3)', 'Commercial Invoice', 'Packing List', 'Certificate of Origin (CUSMA/CPTPP)', 'Import Permit (if applicable)', 'Business Number (BN)'],
    exportSteps: ['File B13A via CERS', 'Present goods to CBSA', 'Export clearance'],
    importSteps: ['Obtain Business Number with import-export account', 'File B3 declaration', 'Pay duties + GST/HST', 'CBSA examination (if selected)', 'Goods released'],
    tips: ['CUSMA (formerly NAFTA) preferential rates for US/MX origin goods', 'CPTPP rates for qualifying Asia-Pacific goods', 'GST: 5% federal + provincial HST varies', 'De minimis: CAD 20 duty-free + CAD 40 tax-free'],
    links: [{ label: 'CBSA', url: 'https://www.cbsa-asfc.gc.ca' }, { label: 'Customs Tariff', url: 'https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/menu-eng.html' }],
  },
};

export const COUNTRY_CODES = Object.keys(FILING_GUIDES);
