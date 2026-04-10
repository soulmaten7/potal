/**
 * Scenario Configuration — 6 Entry Types
 *
 * 결정 3 (HOMEPAGE_REDESIGN_SPEC.md): 5+1 유형 선택
 *
 * Spec 표:
 *   | # | 버튼 이름 | 부제 | 본질 질문 | 기본 기능 |
 *   | 1 | 온라인 셀러 | Etsy, Shopify, eBay | "내 마진 얼마 남아?" | HS + Landed Cost |
 *   | 2 | D2C 브랜드 | 자체 쇼핑몰 | "어느 나라가 좋아?" | Country Comparison + Landed Cost + FTA |
 *   | 3 | 수입업자 | B2B 컨테이너 | "컨테이너 원가 얼마?" | HS(정밀) + FTA + Landed Cost + Restriction |
 *   | 4 | 수출업자 | 견적/계약 | "고객이 얼마 내?" | Landed Cost + Document + FTA |
 *   | 5 | 포워더/3PL | 소규모 물류 | "고객사 대신 계산" | 전 기능 API 자동화 |
 *   | 6 | CUSTOM ⚙️ | 조립형 | "내가 직접 조립" | 140개 체크박스 |
 */

export type ScenarioId = 'seller' | 'd2c' | 'importer' | 'exporter' | 'forwarder' | 'custom';

export interface ScenarioConfig {
  id: ScenarioId;
  icon: string;
  // i18n keys — resolved via useI18n().t() at render time
  titleKey: string;
  subtitleKey: string;
  questionKey: string;
  // Default feature ids (used by Sprint 2 when building NonDev/Dev panels)
  defaultFeatures: string[];
  // Whether this scenario uses the CUSTOM builder (140 checkboxes) instead of
  // the regular NonDev/Dev split. Only `custom` should be true.
  isCustom: boolean;
}

export const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'seller',
    icon: '🛒',
    titleKey: 'home.scenario.seller.title',
    subtitleKey: 'home.scenario.seller.subtitle',
    questionKey: 'home.scenario.seller.question',
    defaultFeatures: ['hs_classify', 'landed_cost'],
    isCustom: false,
  },
  {
    id: 'd2c',
    icon: '🌐',
    titleKey: 'home.scenario.d2c.title',
    subtitleKey: 'home.scenario.d2c.subtitle',
    questionKey: 'home.scenario.d2c.question',
    defaultFeatures: ['country_compare', 'landed_cost', 'fta_lookup'],
    isCustom: false,
  },
  {
    id: 'importer',
    icon: '📦',
    titleKey: 'home.scenario.importer.title',
    subtitleKey: 'home.scenario.importer.subtitle',
    questionKey: 'home.scenario.importer.question',
    defaultFeatures: ['hs_classify_precise', 'fta_lookup', 'landed_cost', 'restriction_check'],
    isCustom: false,
  },
  {
    id: 'exporter',
    icon: '✈️',
    titleKey: 'home.scenario.exporter.title',
    subtitleKey: 'home.scenario.exporter.subtitle',
    questionKey: 'home.scenario.exporter.question',
    defaultFeatures: ['landed_cost', 'document_gen', 'fta_lookup'],
    isCustom: false,
  },
  {
    id: 'forwarder',
    icon: '🚚',
    titleKey: 'home.scenario.forwarder.title',
    subtitleKey: 'home.scenario.forwarder.subtitle',
    questionKey: 'home.scenario.forwarder.question',
    defaultFeatures: ['all_features_api'],
    isCustom: false,
  },
  {
    id: 'custom',
    icon: '⚙️',
    titleKey: 'home.scenario.custom.title',
    subtitleKey: 'home.scenario.custom.subtitle',
    questionKey: 'home.scenario.custom.question',
    defaultFeatures: [],
    isCustom: true,
  },
];

export function getScenarioById(id: string | null | undefined): ScenarioConfig | null {
  if (!id) return null;
  return SCENARIOS.find(s => s.id === id) || null;
}

/** Top-level question shown above the 6-button grid. */
export const SCENARIO_TOP_QUESTION_KEY = 'home.scenario.topQuestion';

/**
 * English fallback copy for scenario titles/subtitles/questions.
 * Used when a translation key is missing — i18n system already falls back to en.ts,
 * but this ensures a clean baseline for Sprint 1 before translations are added.
 */
export const SCENARIO_FALLBACK_COPY: Record<string, string> = {
  'home.scenario.topQuestion': 'What describes your cross-border workflow?',

  'home.scenario.seller.title': 'Online Seller',
  'home.scenario.seller.subtitle': 'Etsy, Shopify, eBay',
  'home.scenario.seller.question': 'How much margin am I keeping?',

  'home.scenario.d2c.title': 'D2C Brand',
  'home.scenario.d2c.subtitle': 'Your own store',
  'home.scenario.d2c.question': 'Which country should I sell to?',

  'home.scenario.importer.title': 'Importer',
  'home.scenario.importer.subtitle': 'B2B container loads',
  'home.scenario.importer.question': 'What is my full landed cost?',

  'home.scenario.exporter.title': 'Exporter',
  'home.scenario.exporter.subtitle': 'Quotes & contracts',
  'home.scenario.exporter.question': 'What will my buyer actually pay?',

  'home.scenario.forwarder.title': 'Forwarder / 3PL',
  'home.scenario.forwarder.subtitle': 'Small-team logistics',
  'home.scenario.forwarder.question': 'Calculate on behalf of clients?',

  'home.scenario.custom.title': 'CUSTOM',
  'home.scenario.custom.subtitle': 'Build your own combo',
  'home.scenario.custom.question': 'Pick any features you want.',
};
