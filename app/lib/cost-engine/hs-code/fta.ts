/**
 * POTAL FTA (Free Trade Agreement) Logic
 *
 * Determines if preferential duty rates apply based on
 * origin → destination country pairs and applicable FTAs.
 *
 * Sources: WTO RTA database, official FTA texts
 *
 * Phase 1: Major FTAs with simplified preferential rates
 * Phase 3: Certificate of Origin verification, product-specific rules
 */

// ─── FTA Definitions ───────────────────────────────────────────

interface FtaAgreement {
  /** Agreement name */
  name: string;
  /** Short code */
  code: string;
  /** Member countries (ISO 2-letter codes) */
  members: string[];
  /** Default preferential rate discount (multiplier, e.g. 0.0 = duty-free, 0.5 = 50% of MFN) */
  preferentialMultiplier: number;
  /** Chapter-specific overrides (some chapters excluded from FTA) */
  excludedChapters?: string[];
  /** Is the FTA currently in effect? */
  isActive: boolean;
}

const FTA_AGREEMENTS: FtaAgreement[] = [
  // ─── USMCA (US-Mexico-Canada) ───
  {
    name: 'United States-Mexico-Canada Agreement',
    code: 'USMCA',
    members: ['US', 'MX', 'CA'],
    preferentialMultiplier: 0.0, // duty-free for qualifying goods
    isActive: true,
  },

  // ─── RCEP (Regional Comprehensive Economic Partnership) ───
  {
    name: 'Regional Comprehensive Economic Partnership',
    code: 'RCEP',
    members: ['CN', 'JP', 'KR', 'AU', 'NZ', 'SG', 'MY', 'TH', 'VN', 'PH', 'ID', 'BN', 'KH', 'LA', 'MM'],
    preferentialMultiplier: 0.5, // ~50% reduction on average (varies by product)
    excludedChapters: ['24'], // Tobacco often excluded
    isActive: true,
  },

  // ─── EU-Korea FTA ───
  {
    name: 'EU-Korea Free Trade Agreement',
    code: 'EU-KR',
    members: [
      'KR',
      // EU members
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
    ],
    preferentialMultiplier: 0.0,
    isActive: true,
  },

  // ─── EU-Japan EPA ───
  {
    name: 'EU-Japan Economic Partnership Agreement',
    code: 'EU-JP',
    members: [
      'JP',
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
    ],
    preferentialMultiplier: 0.0,
    isActive: true,
  },

  // ─── KORUS FTA (Korea-US) ───
  {
    name: 'Korea-US Free Trade Agreement',
    code: 'KORUS',
    members: ['US', 'KR'],
    preferentialMultiplier: 0.0,
    isActive: true,
  },

  // ─── Australia FTAs ───
  {
    name: 'China-Australia Free Trade Agreement',
    code: 'ChAFTA',
    members: ['CN', 'AU'],
    preferentialMultiplier: 0.0, // Most goods duty-free by 2025
    excludedChapters: ['24'],
    isActive: true,
  },
  {
    name: 'Australia-US Free Trade Agreement',
    code: 'AUSFTA',
    members: ['US', 'AU'],
    preferentialMultiplier: 0.0,
    isActive: true,
  },

  // ─── UK Trade Agreements (post-Brexit) ───
  {
    name: 'UK-Japan CEPA',
    code: 'UK-JP',
    members: ['GB', 'JP'],
    preferentialMultiplier: 0.0,
    isActive: true,
  },
  {
    name: 'UK-Australia FTA',
    code: 'UK-AU',
    members: ['GB', 'AU'],
    preferentialMultiplier: 0.0,
    isActive: true,
  },

  // ─── CPTPP ───
  {
    name: 'Comprehensive and Progressive Trans-Pacific Partnership',
    code: 'CPTPP',
    members: ['AU', 'BN', 'CA', 'CL', 'JP', 'MY', 'MX', 'NZ', 'PE', 'SG', 'VN', 'GB'],
    preferentialMultiplier: 0.0,
    isActive: true,
  },

  // ─── Korea-China FTA ───
  {
    name: 'Korea-China FTA',
    code: 'KR-CN',
    members: ['KR', 'CN'],
    preferentialMultiplier: 0.3, // Partial reduction (varies heavily by product)
    excludedChapters: ['87'], // Many auto/vehicle exclusions
    isActive: true,
  },

  // ─── ASEAN-China FTA ───
  {
    name: 'ASEAN-China Free Trade Area',
    code: 'ACFTA',
    members: ['CN', 'SG', 'MY', 'TH', 'VN', 'PH', 'ID', 'BN', 'KH', 'LA', 'MM'],
    preferentialMultiplier: 0.0,
    isActive: true,
  },

  // ─── EU-Vietnam FTA ───
  {
    name: 'EU-Vietnam Free Trade Agreement',
    code: 'EVFTA',
    members: [
      'VN',
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
    ],
    preferentialMultiplier: 0.0,
    excludedChapters: ['24'], // Tobacco excluded
    isActive: true,
  },

  // ─── EU-Canada (CETA) ───
  {
    name: 'Comprehensive Economic and Trade Agreement',
    code: 'CETA',
    members: [
      'CA',
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
    ],
    preferentialMultiplier: 0.0,
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── EU-Singapore FTA ───
  {
    name: 'EU-Singapore Free Trade Agreement',
    code: 'EU-SG',
    members: [
      'SG',
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
    ],
    preferentialMultiplier: 0.0,
    isActive: true,
  },

  // ─── EU-Mexico FTA ───
  {
    name: 'EU-Mexico Free Trade Agreement',
    code: 'EU-MX',
    members: [
      'MX',
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
    ],
    preferentialMultiplier: 0.0,
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── EU-Mercosur (pending but partially active) ───
  {
    name: 'EU-Mercosur Association Agreement',
    code: 'EU-MERCOSUR',
    members: [
      'AR', 'BR', 'PY', 'UY',
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
    ],
    preferentialMultiplier: 0.3, // Partially active, negotiation ongoing
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── US-Israel FTA ───
  {
    name: 'United States-Israel Free Trade Agreement',
    code: 'US-IL',
    members: ['US', 'IL'],
    preferentialMultiplier: 0.0,
    isActive: true,
  },

  // ─── US-Singapore FTA ───
  {
    name: 'United States-Singapore Free Trade Agreement',
    code: 'US-SG',
    members: ['US', 'SG'],
    preferentialMultiplier: 0.0,
    isActive: true,
  },

  // ─── US-Chile FTA ───
  {
    name: 'United States-Chile Free Trade Agreement',
    code: 'US-CL',
    members: ['US', 'CL'],
    preferentialMultiplier: 0.0,
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── US-Colombia TPA ───
  {
    name: 'United States-Colombia Trade Promotion Agreement',
    code: 'US-CO',
    members: ['US', 'CO'],
    preferentialMultiplier: 0.0,
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── Korea-Vietnam FTA ───
  {
    name: 'Korea-Vietnam Free Trade Agreement',
    code: 'KR-VN',
    members: ['KR', 'VN'],
    preferentialMultiplier: 0.0,
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── Korea-ASEAN FTA ───
  {
    name: 'Korea-ASEAN Free Trade Agreement',
    code: 'AKFTA',
    members: ['KR', 'SG', 'MY', 'TH', 'VN', 'PH', 'ID', 'BN', 'KH', 'LA', 'MM'],
    preferentialMultiplier: 0.0,
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── India-ASEAN FTA ───
  {
    name: 'India-ASEAN Free Trade Agreement',
    code: 'AIFTA',
    members: ['IN', 'SG', 'MY', 'TH', 'VN', 'PH', 'ID', 'BN', 'KH', 'LA', 'MM'],
    preferentialMultiplier: 0.5, // Partial implementation
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── Japan-India CEPA ───
  {
    name: 'Japan-India Comprehensive Economic Partnership Agreement',
    code: 'JP-IN',
    members: ['JP', 'IN'],
    preferentialMultiplier: 0.0,
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── China-New Zealand FTA ───
  {
    name: 'China-New Zealand Free Trade Agreement',
    code: 'CN-NZ',
    members: ['CN', 'NZ'],
    preferentialMultiplier: 0.0,
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── Pacific Alliance ───
  {
    name: 'Pacific Alliance Free Trade Area',
    code: 'PA',
    members: ['MX', 'CL', 'CO', 'PE'],
    preferentialMultiplier: 0.0,
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── GCC (Gulf Cooperation Council) ───
  {
    name: 'Gulf Cooperation Council Customs Union',
    code: 'GCC',
    members: ['AE', 'SA', 'QA', 'BH', 'KW', 'OM'],
    preferentialMultiplier: 0.0,
    isActive: true,
  },

  // ─── EFTA (European Free Trade Association) ───
  {
    name: 'European Free Trade Association',
    code: 'EFTA',
    members: ['CH', 'NO', 'IS', 'LI'],
    preferentialMultiplier: 0.0,
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── EFTA-Korea FTA ───
  {
    name: 'EFTA-Korea Free Trade Agreement',
    code: 'EFTA-KR',
    members: ['CH', 'NO', 'IS', 'LI', 'KR'],
    preferentialMultiplier: 0.0,
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── Turkey-EU Customs Union ───
  {
    name: 'Turkey-EU Customs Union',
    code: 'TR-EU',
    members: [
      'TR',
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
    ],
    preferentialMultiplier: 0.0, // For manufactured goods
    excludedChapters: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15'], // Agricultural exclusions
    isActive: true,
  },

  // ─── UK-New Zealand FTA ───
  {
    name: 'UK-New Zealand Free Trade Agreement',
    code: 'UK-NZ',
    members: ['GB', 'NZ'],
    preferentialMultiplier: 0.0,
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── AfCFTA (African Continental Free Trade Area) ───
  {
    name: 'African Continental Free Trade Area',
    code: 'AfCFTA',
    members: [
      'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CM', 'CV', 'CF', 'TD', 'KM', 'CG', 'CD', 'CI', 'DJ', 'EG', 'GQ', 'ER', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'KE', 'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW', 'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'SZ', 'TZ', 'TG', 'TN', 'UG', 'ZM', 'ZW',
    ],
    preferentialMultiplier: 0.7, // Partial implementation across continent
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── US-Peru TPA ───
  {
    name: 'United States-Peru Trade Promotion Agreement',
    code: 'US-PE',
    members: ['US', 'PE'],
    preferentialMultiplier: 0.0,
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── US-Morocco FTA ───
  {
    name: 'United States-Morocco Free Trade Agreement',
    code: 'US-MA',
    members: ['US', 'MA'],
    preferentialMultiplier: 0.0,
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── US-Jordan FTA ───
  {
    name: 'United States-Jordan Free Trade Agreement',
    code: 'US-JO',
    members: ['US', 'JO'],
    preferentialMultiplier: 0.0,
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── US-Bahrain FTA ───
  {
    name: 'United States-Bahrain Free Trade Agreement',
    code: 'US-BH',
    members: ['US', 'BH'],
    preferentialMultiplier: 0.0,
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── US-Oman FTA ───
  {
    name: 'United States-Oman Free Trade Agreement',
    code: 'US-OM',
    members: ['US', 'OM'],
    preferentialMultiplier: 0.0,
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── US-Panama TPA ───
  {
    name: 'United States-Panama Trade Promotion Agreement',
    code: 'US-PA',
    members: ['US', 'PA'],
    preferentialMultiplier: 0.0,
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── DR-CAFTA ───
  {
    name: 'Dominican Republic-Central America Free Trade Agreement',
    code: 'DR-CAFTA',
    members: ['US', 'DO', 'CR', 'SV', 'GT', 'HN', 'NI'],
    preferentialMultiplier: 0.0,
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── UK-Canada FTA (Continuity) ───
  {
    name: 'UK-Canada Trade Continuity Agreement',
    code: 'UK-CA',
    members: ['GB', 'CA'],
    preferentialMultiplier: 0.0,
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── UK-Korea FTA ───
  {
    name: 'UK-Korea Free Trade Agreement',
    code: 'UK-KR',
    members: ['GB', 'KR'],
    preferentialMultiplier: 0.0,
    isActive: true,
  },

  // ─── UK-Singapore FTA ───
  {
    name: 'UK-Singapore Free Trade Agreement',
    code: 'UK-SG',
    members: ['GB', 'SG'],
    preferentialMultiplier: 0.0,
    isActive: true,
  },

  // ─── UK-Vietnam FTA ───
  {
    name: 'UK-Vietnam Free Trade Agreement',
    code: 'UK-VN',
    members: ['GB', 'VN'],
    preferentialMultiplier: 0.0,
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── Japan-ASEAN EPA ───
  {
    name: 'Japan-ASEAN Comprehensive Economic Partnership',
    code: 'JACEPA',
    members: ['JP', 'SG', 'MY', 'TH', 'VN', 'PH', 'ID', 'BN', 'KH', 'LA', 'MM'],
    preferentialMultiplier: 0.0,
    excludedChapters: ['10', '24'], // Rice and tobacco excluded
    isActive: true,
  },

  // ─── Japan-Switzerland FTA ───
  {
    name: 'Japan-Switzerland Economic Partnership Agreement',
    code: 'JP-CH',
    members: ['JP', 'CH'],
    preferentialMultiplier: 0.0,
    excludedChapters: ['10', '24'],
    isActive: true,
  },

  // ─── Korea-India CEPA ───
  {
    name: 'Korea-India Comprehensive Economic Partnership Agreement',
    code: 'KR-IN',
    members: ['KR', 'IN'],
    preferentialMultiplier: 0.5, // Partial coverage
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── Korea-Turkey FTA ───
  {
    name: 'Korea-Turkey Free Trade Agreement',
    code: 'KR-TR',
    members: ['KR', 'TR'],
    preferentialMultiplier: 0.0,
    excludedChapters: ['01', '02', '03', '04', '24'], // Agricultural exclusions
    isActive: true,
  },

  // ─── SACU (Southern African Customs Union) ───
  {
    name: 'Southern African Customs Union',
    code: 'SACU',
    members: ['ZA', 'BW', 'LS', 'NA', 'SZ'],
    preferentialMultiplier: 0.0,
    isActive: true,
  },

  // ─── SADC (Southern African Development Community) ───
  {
    name: 'Southern African Development Community FTA',
    code: 'SADC',
    members: ['ZA', 'BW', 'LS', 'NA', 'SZ', 'MZ', 'TZ', 'ZM', 'ZW', 'MG', 'MU', 'MW', 'CD', 'AO'],
    preferentialMultiplier: 0.5, // Partial implementation
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── EAC (East African Community) ───
  {
    name: 'East African Community Customs Union',
    code: 'EAC',
    members: ['KE', 'TZ', 'UG', 'RW', 'SS', 'CD'],
    preferentialMultiplier: 0.0,
    isActive: true,
  },

  // ─── ECOWAS (West African Economic Community) ───
  {
    name: 'Economic Community of West African States',
    code: 'ECOWAS',
    members: ['NG', 'GH', 'CI', 'SN', 'ML', 'BF', 'NE', 'BJ', 'TG', 'GN', 'SL', 'LR', 'GM'],
    preferentialMultiplier: 0.0,
    isActive: true,
  },

  // ─── India-Japan CEPA ─── (already exists but verify)
  // Already defined above as JP-IN

  // ─── China-Singapore FTA ───
  {
    name: 'China-Singapore Free Trade Agreement',
    code: 'CN-SG',
    members: ['CN', 'SG'],
    preferentialMultiplier: 0.0,
    isActive: true,
  },

  // ─── India-Singapore CECA ───
  {
    name: 'India-Singapore Comprehensive Economic Cooperation Agreement',
    code: 'IN-SG',
    members: ['IN', 'SG'],
    preferentialMultiplier: 0.0,
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── Australia-India ECTA ───
  {
    name: 'Australia-India Economic Cooperation and Trade Agreement',
    code: 'AU-IN',
    members: ['AU', 'IN'],
    preferentialMultiplier: 0.5, // Phased implementation
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── MERCOSUR Internal ───
  {
    name: 'MERCOSUR Internal Free Trade',
    code: 'MERCOSUR',
    members: ['BR', 'AR', 'PY', 'UY'],
    preferentialMultiplier: 0.0,
    isActive: true,
  },

  // ─── Chile-China FTA ───
  {
    name: 'Chile-China Free Trade Agreement',
    code: 'CL-CN',
    members: ['CL', 'CN'],
    preferentialMultiplier: 0.0,
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── Peru-China FTA ───
  {
    name: 'Peru-China Free Trade Agreement',
    code: 'PE-CN',
    members: ['PE', 'CN'],
    preferentialMultiplier: 0.0,
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── Israel-EU Association Agreement ───
  {
    name: 'EU-Israel Association Agreement',
    code: 'EU-IL',
    members: [
      'IL',
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
    ],
    preferentialMultiplier: 0.0, // Industrial goods duty-free
    excludedChapters: ['01', '02', '03', '04', '24'], // Agricultural exclusions
    isActive: true,
  },

  // ─── EFTA-Singapore FTA ───
  {
    name: 'EFTA-Singapore Free Trade Agreement',
    code: 'EFTA-SG',
    members: ['CH', 'NO', 'IS', 'LI', 'SG'],
    preferentialMultiplier: 0.0,
    isActive: true,
  },

  // ─── EFTA-Hong Kong FTA ───
  {
    name: 'EFTA-Hong Kong Free Trade Agreement',
    code: 'EFTA-HK',
    members: ['CH', 'NO', 'IS', 'LI', 'HK'],
    preferentialMultiplier: 0.0,
    isActive: true,
  },

  // ─── EU-Turkey Customs Union for Agricultural goods ───
  // Already defined as TR-EU (manufactured goods)
  // Agricultural products excluded but covered under separate protocol

  // ─── China-Pakistan FTA ───
  {
    name: 'China-Pakistan Free Trade Agreement',
    code: 'CN-PK',
    members: ['CN', 'PK'],
    preferentialMultiplier: 0.3,
    excludedChapters: ['24'],
    isActive: true,
  },

  // ─── India-Thailand FTA ───
  {
    name: 'India-Thailand Framework Agreement',
    code: 'IN-TH',
    members: ['IN', 'TH'],
    preferentialMultiplier: 0.5, // Limited coverage (82 items)
    excludedChapters: ['24'],
    isActive: true,
  },
];

// ─── Public API ────────────────────────────────────────────────

export interface FtaResult {
  /** Does an FTA apply? */
  hasFta: boolean;
  /** FTA name */
  ftaName?: string;
  /** FTA code */
  ftaCode?: string;
  /** Preferential rate multiplier (0.0 = duty-free, 0.5 = 50% of MFN) */
  preferentialMultiplier?: number;
  /** Is this chapter excluded from FTA benefits? */
  isExcluded?: boolean;
}

/**
 * Find applicable FTA between origin and destination countries.
 *
 * @param originCountry - ISO code of exporting country
 * @param destinationCountry - ISO code of importing country
 * @param hsChapter - Optional HS chapter to check exclusions
 * @returns FTA result with preferential rate info
 */
export function findApplicableFta(
  originCountry: string,
  destinationCountry: string,
  hsChapter?: string,
): FtaResult {
  const origin = originCountry.toUpperCase();
  const dest = destinationCountry.toUpperCase();

  // Same country = no duty
  if (origin === dest) {
    return { hasFta: true, ftaName: 'Domestic', ftaCode: 'DOMESTIC', preferentialMultiplier: 0.0 };
  }

  // Find best FTA (lowest multiplier = most preferential)
  let bestFta: FtaAgreement | null = null;
  let bestMultiplier = 1.0;

  for (const fta of FTA_AGREEMENTS) {
    if (!fta.isActive) continue;
    if (!fta.members.includes(origin) || !fta.members.includes(dest)) continue;

    // Check chapter exclusion
    if (hsChapter && fta.excludedChapters?.includes(hsChapter)) {
      continue;
    }

    if (fta.preferentialMultiplier < bestMultiplier) {
      bestFta = fta;
      bestMultiplier = fta.preferentialMultiplier;
    }
  }

  if (!bestFta) {
    return { hasFta: false };
  }

  return {
    hasFta: true,
    ftaName: bestFta.name,
    ftaCode: bestFta.code,
    preferentialMultiplier: bestMultiplier,
  };
}

/**
 * Calculate preferential duty rate after FTA application
 *
 * @param mfnRate - MFN duty rate (decimal)
 * @param originCountry - ISO code
 * @param destinationCountry - ISO code
 * @param hsChapter - HS chapter (2 digits)
 * @returns Adjusted duty rate after FTA discount
 */
export function applyFtaRate(
  mfnRate: number,
  originCountry: string,
  destinationCountry: string,
  hsChapter?: string,
): { rate: number; fta: FtaResult } {
  const fta = findApplicableFta(originCountry, destinationCountry, hsChapter);

  if (!fta.hasFta || fta.preferentialMultiplier === undefined) {
    return { rate: mfnRate, fta };
  }

  const preferentialRate = mfnRate * fta.preferentialMultiplier;
  return { rate: preferentialRate, fta };
}

/**
 * List all FTAs a country participates in
 */
export function getCountryFtas(countryCode: string): Array<{ code: string; name: string; partners: string[] }> {
  const code = countryCode.toUpperCase();
  return FTA_AGREEMENTS
    .filter((fta) => fta.isActive && fta.members.includes(code))
    .map((fta) => ({
      code: fta.code,
      name: fta.name,
      partners: fta.members.filter((m) => m !== code),
    }));
}
