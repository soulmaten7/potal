/**
 * POTAL Master Data Registry
 *
 * 모든 데이터 소스의 메타데이터: 출처, 갱신 주기, 공식 URL, 자동화 상태
 * data-freshness API와 /data-sources 페이지가 이 레지스트리를 참조
 *
 * CW38 — Created 2026-04-17
 * 근거: DATA_SOURCE_AUDIT_REPORT.md + DATA_FLOW_TRACE_REPORT.md
 */

export type UpdateFrequency =
  | 'realtime'     // 15분 이내 캐시
  | 'daily'        // 매일 자동 cron
  | 'weekly'       // 매주 자동 모니터
  | 'monthly'      // 매월 자동 모니터
  | 'semiannual'   // 반기 자동 체크
  | 'annual'       // 연 1회 수동 또는 공시 시
  | 'quinquennial' // 5년 주기 (WCO HS)
  | 'on_change'    // 변경 감지 시 자동 반영
  | 'manual';      // 수동 임포트 필요

export type AutomationLevel =
  | 'auto_cron'     // 완전 자동 (cron → DB upsert)
  | 'auto_monitor'  // 변경 감지만 (알림만, DB 갱신 없음)
  | 'semi_auto'     // 감지 + 수동 확인 후 import
  | 'manual';       // 수동 임포트

export type DataCategory =
  | 'tariff'
  | 'sanctions'
  | 'fta'
  | 'exchange_rate'
  | 'tax'
  | 'trade_remedy'
  | 'classification'
  | 'restrictions'
  | 'regulatory'
  | 'country_meta'
  | 'shipping';

export interface DataSource {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Short label for ticker/UI */
  shortLabel: string;
  /** Data category */
  category: DataCategory;
  /** Supabase table(s) storing this data */
  tables: string[];
  /** Approximate row count */
  approxRows: number;
  /** How often the source publishes updates */
  updateFrequency: UpdateFrequency;
  /** POTAL's automation level for this source */
  automationLevel: AutomationLevel;
  /** Cron job name (if auto) */
  cronJob?: string;
  /** Cron schedule (UTC) */
  cronSchedule?: string;
  /** Official data source URL */
  sourceUrl: string;
  /** Where to check for update announcements */
  announcementUrl?: string;
  /** Country/region this source covers */
  coverage: string;
  /** Organization that publishes this data */
  publisher: string;
  /** Current known publication version */
  currentVersion?: string;
  /** Notes */
  notes?: string;
}

// ═══════════════════════════════════════════════════
// MASTER REGISTRY
// ═══════════════════════════════════════════════════

export const MASTER_DATA_REGISTRY: DataSource[] = [

  // ─── TARIFF & DUTY RATES ───────────────────────

  {
    id: 'macmap-mfn',
    name: 'ITC MacMap MFN Rates',
    shortLabel: 'MacMap MFN',
    category: 'tariff',
    tables: ['macmap_ntlc_rates', 'macmap_agr_rates', 'macmap_min_rates', 'macmap_trade_agreements'],
    approxRows: 245_496_084,
    updateFrequency: 'annual',
    automationLevel: 'auto_monitor',
    cronJob: 'macmap-update-monitor',
    cronSchedule: '0 8 1 * *',
    sourceUrl: 'https://www.macmap.org/',
    announcementUrl: 'https://www.macmap.org/en/about/release-notes',
    coverage: 'Global (190+ countries)',
    publisher: 'International Trade Centre (ITC/UNCTAD/WTO)',
    currentVersion: 'HS2017 (H6 Revision)',
    notes: 'Bulk import via Python. 3 parallel tables: AGR (132M), MIN (112M), NTLC (874K)',
  },
  {
    id: 'usitc-hts',
    name: 'USITC Harmonized Tariff Schedule',
    shortLabel: 'USITC HTS',
    category: 'tariff',
    tables: ['duty_rates_live', 'us_additional_tariffs'],
    approxRows: 12_000,
    updateFrequency: 'daily',
    automationLevel: 'auto_cron',
    cronJob: 'update-tariffs',
    cronSchedule: '0 4 * * *',
    sourceUrl: 'https://hts.usitc.gov/',
    announcementUrl: 'https://hts.usitc.gov/current',
    coverage: 'United States',
    publisher: 'US International Trade Commission',
    currentVersion: 'HTS 2026 Edition',
  },
  {
    id: 'uk-tariff',
    name: 'UK Trade Tariff',
    shortLabel: 'UK Tariff',
    category: 'tariff',
    tables: ['duty_rates_live'],
    approxRows: 0,
    updateFrequency: 'daily',
    automationLevel: 'auto_cron',
    cronJob: 'update-tariffs',
    cronSchedule: '0 4 * * *',
    sourceUrl: 'https://www.trade-tariff.service.gov.uk/',
    announcementUrl: 'https://www.gov.uk/government/collections/customs-tariff-notices',
    coverage: 'United Kingdom',
    publisher: 'HMRC',
    currentVersion: 'UK Global Tariff 2026',
  },
  {
    id: 'eu-taric',
    name: 'EU TARIC (Combined Nomenclature)',
    shortLabel: 'EU TARIC',
    category: 'tariff',
    tables: ['duty_rates_live'],
    approxRows: 0,
    updateFrequency: 'daily',
    automationLevel: 'auto_cron',
    cronJob: 'update-tariffs',
    cronSchedule: '0 4 * * *',
    sourceUrl: 'https://ec.europa.eu/taxation_customs/dds2/taric/',
    announcementUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=OJ:L:2025:2782',
    coverage: 'European Union (27 member states)',
    publisher: 'European Commission DG TAXUD',
    currentVersion: 'CN 2026',
  },
  {
    id: 'canada-cbsa',
    name: 'Canada Customs Tariff',
    shortLabel: 'Canada CBSA',
    category: 'tariff',
    tables: ['duty_rates_live'],
    approxRows: 0,
    updateFrequency: 'daily',
    automationLevel: 'auto_cron',
    cronJob: 'update-tariffs',
    cronSchedule: '0 4 * * *',
    sourceUrl: 'https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/',
    announcementUrl: 'https://www.cbsa-asfc.gc.ca/publications/dm-md/d11-eng.html',
    coverage: 'Canada',
    publisher: 'Canada Border Services Agency',
    currentVersion: 'Customs Tariff 2026',
  },
  {
    id: 'australia-abf',
    name: 'Australia Customs Tariff',
    shortLabel: 'AU ABF',
    category: 'tariff',
    tables: ['duty_rates_live'],
    approxRows: 0,
    updateFrequency: 'daily',
    automationLevel: 'auto_cron',
    cronJob: 'update-tariffs',
    cronSchedule: '0 4 * * *',
    sourceUrl: 'https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification',
    announcementUrl: 'https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-concessions-system/current-tcos',
    coverage: 'Australia',
    publisher: 'Australian Border Force',
    currentVersion: 'Schedule 3 — 2026',
  },
  {
    id: 'korea-kcs',
    name: 'Korea Customs Service Tariff',
    shortLabel: 'KR KCS',
    category: 'tariff',
    tables: ['duty_rates_live'],
    approxRows: 0,
    updateFrequency: 'daily',
    automationLevel: 'auto_cron',
    cronJob: 'update-tariffs',
    cronSchedule: '0 4 * * *',
    sourceUrl: 'https://www.customs.go.kr/english/cm/cntnts/cntntsView.do?mi=8058&cntntsId=2731',
    announcementUrl: 'https://www.customs.go.kr/kcs/ad/lcm/getLawList.do',
    coverage: 'South Korea',
    publisher: 'Korea Customs Service (관세청)',
    currentVersion: '관세율표 2026',
  },
  {
    id: 'japan-customs',
    name: 'Japan Customs Tariff Schedule',
    shortLabel: 'JP Customs',
    category: 'tariff',
    tables: ['duty_rates_live'],
    approxRows: 0,
    updateFrequency: 'daily',
    automationLevel: 'auto_cron',
    cronJob: 'update-tariffs',
    cronSchedule: '0 4 * * *',
    sourceUrl: 'https://www.customs.go.jp/english/tariff/',
    announcementUrl: 'https://www.customs.go.jp/english/tariff/index.htm',
    coverage: 'Japan',
    publisher: 'Japan Customs (税関)',
    currentVersion: 'FY2026 (Apr 2026–)',
  },
  {
    id: 'precomputed-cache',
    name: 'Precomputed Landed Costs',
    shortLabel: 'Precomputed Cache',
    category: 'tariff',
    tables: ['precomputed_landed_costs'],
    approxRows: 117_600,
    updateFrequency: 'on_change',
    automationLevel: 'semi_auto',
    sourceUrl: 'N/A (internal computation)',
    coverage: 'Top HS codes × Top countries',
    publisher: 'POTAL (internal)',
    notes: 'Stage 0 cache. Regenerated when underlying rates change.',
  },
  {
    id: 'us-additional-tariffs',
    name: 'US Section 301/232 Additional Tariffs',
    shortLabel: 'US 301/232',
    category: 'tariff',
    tables: ['us_additional_tariffs', 'us_tariff_rate_quotas'],
    approxRows: 607,
    updateFrequency: 'on_change',
    automationLevel: 'auto_monitor',
    cronJob: 'federal-register-monitor',
    cronSchedule: '0 6 * * *',
    sourceUrl: 'https://www.federalregister.gov/',
    announcementUrl: 'https://ustr.gov/issue-areas/enforcement/section-301-investigations',
    coverage: 'United States',
    publisher: 'USTR / Commerce / White House',
    currentVersion: 'EO 14307 (Mar 12, 2025)',
  },

  // ─── SANCTIONS & SCREENING ─────────────────────

  {
    id: 'ofac-sdn',
    name: 'OFAC Specially Designated Nationals (SDN)',
    shortLabel: 'OFAC SDN',
    category: 'sanctions',
    tables: ['sanctioned_entities', 'sanctions_entries', 'sanctions_aliases'],
    approxRows: 95_739,
    updateFrequency: 'daily',
    automationLevel: 'auto_cron',
    cronJob: 'sdn-sync',
    cronSchedule: '0 5 * * *',
    sourceUrl: 'https://sanctionslist.ofac.treas.gov/Home/SdnList',
    announcementUrl: 'https://ofac.treasury.gov/recent-actions',
    coverage: 'Global (US sanctions jurisdiction)',
    publisher: 'US Treasury OFAC',
  },
  {
    id: 'bis-el',
    name: 'BIS Entity List & ECCN',
    shortLabel: 'BIS EL/CCL',
    category: 'sanctions',
    tables: ['eccn_entries'],
    approxRows: 658,
    updateFrequency: 'on_change',
    automationLevel: 'auto_monitor',
    cronJob: 'federal-register-monitor',
    cronSchedule: '0 6 * * *',
    sourceUrl: 'https://www.bis.doc.gov/index.php/the-denied-persons-list',
    announcementUrl: 'https://www.federalregister.gov/agencies/industry-and-security-bureau',
    coverage: 'Global (US export controls)',
    publisher: 'US Commerce Bureau of Industry and Security',
  },
  {
    id: 'embargo-programs',
    name: 'Embargo Programs',
    shortLabel: 'Embargoes',
    category: 'sanctions',
    tables: ['embargo_programs'],
    approxRows: 30,
    updateFrequency: 'on_change',
    automationLevel: 'auto_monitor',
    cronJob: 'sdn-sync',
    cronSchedule: '0 5 * * *',
    sourceUrl: 'https://ofac.treasury.gov/sanctions-programs-and-country-information',
    coverage: 'Global',
    publisher: 'OFAC / EU / UN',
  },

  // ─── FREE TRADE AGREEMENTS ─────────────────────

  {
    id: 'fta-agreements',
    name: 'FTA Agreements Registry',
    shortLabel: 'FTA Registry',
    category: 'fta',
    tables: ['fta_agreements', 'fta_members', 'fta_product_rules', 'fta_country_pairs'],
    approxRows: 2_833,
    updateFrequency: 'on_change',
    automationLevel: 'auto_monitor',
    cronJob: 'fta-change-monitor',
    cronSchedule: '0 6 * * 5',
    sourceUrl: 'https://rtais.wto.org/',
    announcementUrl: 'https://www.wto.org/english/tratop_e/region_e/region_e.htm',
    coverage: 'Global (1,319 agreements)',
    publisher: 'WTO Regional Trade Agreements Information System',
    notes: 'DB covers 65 key agreements. RoO engine uses hardcoded FTA_CONFIG for 6 major FTAs.',
  },

  // ─── EXCHANGE RATES ────────────────────────────

  {
    id: 'exchange-rates',
    name: 'Exchange Rates',
    shortLabel: 'FX Rates',
    category: 'exchange_rate',
    tables: ['exchange_rate_history'],
    approxRows: 50,
    updateFrequency: 'daily',
    automationLevel: 'auto_cron',
    cronJob: 'exchange-rate-sync',
    cronSchedule: '30 0 * * *',
    sourceUrl: 'https://www.exchangerate-api.com/',
    announcementUrl: 'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/',
    coverage: 'Global (161 currencies)',
    publisher: 'ExchangeRate-API / ECB (fallback)',
    notes: '15-min in-memory cache at runtime. Fawaz CDN as secondary fallback.',
  },

  // ─── VAT / GST / TAX ──────────────────────────

  {
    id: 'vat-gst',
    name: 'VAT/GST Rates',
    shortLabel: 'VAT/GST',
    category: 'tax',
    tables: ['vat_gst_rates', 'country_profiles'],
    approxRows: 241,
    updateFrequency: 'annual',
    automationLevel: 'manual',
    sourceUrl: 'https://taxfoundation.org/data/all/global/vat-rates/',
    announcementUrl: 'https://taxfoundation.org/research/all/global/',
    coverage: 'Global (241 countries)',
    publisher: 'Tax Foundation / OECD / national authorities',
    notes: 'VAT changes announced by national governments, typically effective Jan 1.',
  },
  {
    id: 'de-minimis',
    name: 'De Minimis Thresholds',
    shortLabel: 'De Minimis',
    category: 'tax',
    tables: ['de_minimis_thresholds'],
    approxRows: 241,
    updateFrequency: 'on_change',
    automationLevel: 'auto_monitor',
    cronJob: 'federal-register-monitor',
    cronSchedule: '0 6 * * *',
    sourceUrl: 'https://globalexpress.org/knowledge-hub/',
    announcementUrl: 'https://globalexpress.org/knowledge-hub/de-minimis/',
    coverage: 'Global (241 jurisdictions)',
    publisher: 'Global Express Association / national customs',
    notes: 'US de minimis: $800 (CN/HK: $0 per IEEPA Aug 2025)',
  },
  {
    id: 'eu-reduced-vat',
    name: 'EU Reduced VAT Rates',
    shortLabel: 'EU Reduced VAT',
    category: 'tax',
    tables: ['eu_reduced_vat_rates'],
    approxRows: 46,
    updateFrequency: 'annual',
    automationLevel: 'manual',
    sourceUrl: 'https://taxation-customs.ec.europa.eu/vat-rates_en',
    coverage: 'European Union (27 member states)',
    publisher: 'European Commission DG TAXUD',
  },
  {
    id: 'us-state-tax',
    name: 'US State Sales Tax',
    shortLabel: 'US State Tax',
    category: 'tax',
    tables: ['us_state_sales_tax'],
    approxRows: 51,
    updateFrequency: 'annual',
    automationLevel: 'manual',
    sourceUrl: 'https://taxfoundation.org/data/all/state/2026-sales-taxes/',
    coverage: 'United States (50 states + DC)',
    publisher: 'Tax Foundation / state governments',
  },
  {
    id: 'dst',
    name: 'Digital Services Tax',
    shortLabel: 'DST',
    category: 'tax',
    tables: ['digital_services_tax'],
    approxRows: 33,
    updateFrequency: 'annual',
    automationLevel: 'manual',
    sourceUrl: 'https://taxfoundation.org/data/all/global/digital-tax-policies-in-europe/',
    coverage: 'Global (33 jurisdictions with DST)',
    publisher: 'OECD / national authorities',
  },

  // ─── TRADE REMEDIES ────────────────────────────

  {
    id: 'trade-remedies',
    name: 'AD/CVD Orders & Safeguards',
    shortLabel: 'Trade Remedies',
    category: 'trade_remedy',
    tables: ['trade_remedies', 'trade_remedy_products', 'trade_remedy_cases', 'trade_remedy_duties', 'safeguard_exemptions'],
    approxRows: 590,
    updateFrequency: 'weekly',
    automationLevel: 'auto_cron',
    cronJob: 'trade-remedy-sync',
    cronSchedule: '30 6 * * 1',
    sourceUrl: 'https://www.trade.gov/enforcement-and-compliance',
    announcementUrl: 'https://enforcement.trade.gov/frn/',
    coverage: 'United States (ITC/Commerce)',
    publisher: 'US International Trade Administration',
  },
  {
    id: 'federal-register',
    name: 'Federal Register Regulatory Updates',
    shortLabel: 'Federal Register',
    category: 'regulatory',
    tables: ['country_regulatory_notes'],
    approxRows: 43,
    updateFrequency: 'daily',
    automationLevel: 'auto_cron',
    cronJob: 'federal-register-monitor',
    cronSchedule: '0 6 * * *',
    sourceUrl: 'https://www.federalregister.gov/api/v1/',
    announcementUrl: 'https://www.federalregister.gov/',
    coverage: 'United States',
    publisher: 'Office of the Federal Register',
  },

  // ─── HS CLASSIFICATION ─────────────────────────

  {
    id: 'hs-nomenclature',
    name: 'WCO HS Nomenclature',
    shortLabel: 'HS Codes',
    category: 'classification',
    tables: ['hs_codes', 'hs_keywords'],
    approxRows: 77_408,
    updateFrequency: 'quinquennial',
    automationLevel: 'manual',
    sourceUrl: 'https://www.wcoomd.org/en/topics/nomenclature/instrument-and-tools.aspx',
    announcementUrl: 'https://www.wcoomd.org/en/topics/nomenclature/instrument-and-tools/hs-nomenclature-2027-edition.aspx',
    coverage: 'Global (WCO 185 member countries)',
    publisher: 'World Customs Organization',
    currentVersion: 'HS2022 (7th Edition)',
    notes: 'Next revision: HS2027 (effective Jan 2027). 29,903 HS codes + 47,505 keywords.',
  },
  {
    id: 'customs-rulings',
    name: 'Customs Rulings Database',
    shortLabel: 'Rulings DB',
    category: 'classification',
    tables: ['customs_rulings'],
    approxRows: 645_591,
    updateFrequency: 'weekly',
    automationLevel: 'auto_monitor',
    cronJob: 'rulings-update-monitor',
    cronSchedule: '0 6 * * 1',
    sourceUrl: 'https://rulings.cbp.gov/home',
    announcementUrl: 'https://rulings.cbp.gov/search?term=&collection=ALL',
    coverage: 'United States (CBP rulings)',
    publisher: 'US Customs and Border Protection',
    notes: 'CW34-S3 warehouse pipeline. Monitor detects new rulings, manual refresh needed.',
  },
  {
    id: 'classification-rules',
    name: 'HS Chapter Rules & JP Classification',
    shortLabel: 'Chapter Rules',
    category: 'classification',
    tables: ['hs_chapter_rules', 'jp_classification_rules'],
    approxRows: 180,
    updateFrequency: 'on_change',
    automationLevel: 'auto_monitor',
    cronJob: 'classification-ruling-monitor',
    cronSchedule: '0 6 * * 3',
    sourceUrl: 'https://www.wcoomd.org/en/topics/nomenclature/instrument-and-tools/hs-nomenclature-2022-edition/explanatory-notes.aspx',
    coverage: 'Global + Japan-specific',
    publisher: 'WCO / Japan Customs',
  },

  // ─── RESTRICTIONS ──────────────────────────────

  {
    id: 'restricted-items',
    name: 'Import Restricted Items',
    shortLabel: 'Restrictions',
    category: 'restrictions',
    tables: ['restricted_items'],
    approxRows: 161,
    updateFrequency: 'on_change',
    automationLevel: 'manual',
    sourceUrl: 'https://www.cbp.gov/trade/basic-import-export/prohibited-restricted',
    coverage: 'Multi-country',
    publisher: 'Various national customs authorities',
  },

  // ─── COUNTRY METADATA ──────────────────────────

  {
    id: 'country-profiles',
    name: 'Country Tax & Trade Profiles',
    shortLabel: 'Country Profiles',
    category: 'country_meta',
    tables: ['country_profiles', 'countries'],
    approxRows: 240,
    updateFrequency: 'annual',
    automationLevel: 'manual',
    sourceUrl: 'https://www.wto.org/english/res_e/statis_e/statis_e.htm',
    announcementUrl: 'https://www.wto.org/english/tratop_e/tariffs_e/tariff_data_e.htm',
    coverage: 'Global (240 countries/territories)',
    publisher: 'WTO / national authorities',
    notes: 'CW38: Expanded from 53 → 240 via migration 070.',
  },

  // ─── REGULATORY MONITORING (CRON-ONLY) ─────────

  {
    id: 'taric-rss',
    name: 'EU TARIC RSS Changes',
    shortLabel: 'TARIC RSS',
    category: 'regulatory',
    tables: [],
    approxRows: 0,
    updateFrequency: 'daily',
    automationLevel: 'auto_monitor',
    cronJob: 'taric-rss-monitor',
    cronSchedule: '0 7 * * *',
    sourceUrl: 'https://ec.europa.eu/taxation_customs/dds2/taric/measures.jsp',
    coverage: 'European Union',
    publisher: 'European Commission DG TAXUD',
    notes: 'Monitor only — detects TARIC regulation changes via RSS.',
  },
  {
    id: 'tariff-change-monitor',
    name: 'Multi-Country Tariff Change Monitor',
    shortLabel: 'Tariff Monitor',
    category: 'regulatory',
    tables: [],
    approxRows: 0,
    updateFrequency: 'weekly',
    automationLevel: 'auto_monitor',
    cronJob: 'tariff-change-monitor',
    cronSchedule: '0 5 * * 0',
    sourceUrl: 'N/A (multi-source)',
    coverage: '47 countries',
    publisher: 'POTAL (internal)',
    notes: 'Hash comparison across 47 country tariff endpoints. Detects any change.',
  },
  {
    id: 'wco-news',
    name: 'WCO News & Nomenclature Updates',
    shortLabel: 'WCO News',
    category: 'regulatory',
    tables: [],
    approxRows: 0,
    updateFrequency: 'monthly',
    automationLevel: 'auto_monitor',
    cronJob: 'wco-news-monitor',
    cronSchedule: '0 8 15 * *',
    sourceUrl: 'https://www.wcoomd.org/en/media/newsroom.aspx',
    coverage: 'Global',
    publisher: 'World Customs Organization',
  },
  {
    id: 'us-nexus',
    name: 'US State Nexus Thresholds',
    shortLabel: 'US Nexus',
    category: 'tax',
    tables: ['us_state_sales_tax'],
    approxRows: 51,
    updateFrequency: 'semiannual',
    automationLevel: 'auto_monitor',
    cronJob: 'us-nexus-check',
    cronSchedule: '0 6 1 1,7 *',
    sourceUrl: 'https://www.avalara.com/us/en/learn/sales-tax/economic-nexus.html',
    coverage: 'United States (50 states + DC)',
    publisher: 'State governments',
  },
];

// ─── Helper Functions ────────────────────────────

/** Get all sources in a category */
export function getSourcesByCategory(category: DataCategory): DataSource[] {
  return MASTER_DATA_REGISTRY.filter(s => s.category === category);
}

/** Get all auto-cron sources (fully automated) */
export function getAutoCronSources(): DataSource[] {
  return MASTER_DATA_REGISTRY.filter(s => s.automationLevel === 'auto_cron');
}

/** Get all sources that need manual updates */
export function getManualSources(): DataSource[] {
  return MASTER_DATA_REGISTRY.filter(s => s.automationLevel === 'manual');
}

/** Get source by ID */
export function getSourceById(id: string): DataSource | undefined {
  return MASTER_DATA_REGISTRY.find(s => s.id === id);
}

/** Get total data rows across all sources */
export function getTotalRows(): number {
  return MASTER_DATA_REGISTRY.reduce((sum, s) => sum + s.approxRows, 0);
}

/** Summary stats */
export function getRegistryStats() {
  const total = MASTER_DATA_REGISTRY.length;
  const auto = MASTER_DATA_REGISTRY.filter(s => s.automationLevel === 'auto_cron').length;
  const monitor = MASTER_DATA_REGISTRY.filter(s => s.automationLevel === 'auto_monitor').length;
  const manual = MASTER_DATA_REGISTRY.filter(s => s.automationLevel === 'manual').length;
  const categories = new Set(MASTER_DATA_REGISTRY.map(s => s.category)).size;

  return {
    totalSources: total,
    autoCron: auto,
    autoMonitor: monitor,
    manual: manual,
    categories,
    totalRows: getTotalRows(),
  };
}
