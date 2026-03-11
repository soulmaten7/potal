/**
 * Layer 2 Monitor — Division Checklists
 *
 * 15개 Division 각각의 체크 항목 정의.
 * Morning Brief API와 Division Status 대시보드에서 사용.
 */

export type CheckSource =
  | 'health_check_logs'   // health_check_logs 테이블에서 조회
  | 'cron_log'            // health_check_logs의 source 필드 기반
  | 'app_builtin'         // 앱 내장 로직 (항상 green)
  | 'external'            // 외부 서비스 (Make.com, Google Calendar 등)
  | 'manual';             // 수동 확인 필요

export interface CheckItem {
  id: string;
  label: string;
  source: CheckSource;
  /** health_check_logs의 source 필드에서 매칭할 값 */
  cronEndpoint?: string;
  /** green 판정 기준: 마지막 체크 후 경과 허용 시간 (분) */
  maxAgeMinutes?: number;
}

export interface DivisionChecklist {
  id: string;         // D1, D2, ...
  name: string;
  layer1Status: 'done' | 'pending';
  checks: CheckItem[];
}

export const DIVISION_CHECKLISTS: DivisionChecklist[] = [
  {
    id: 'D1',
    name: 'Tariff & Trade Rules',
    layer1Status: 'done',
    checks: [
      { id: 'd1-tariff-cron', label: '관세율 자동 업데이트 (매주 월)', source: 'cron_log', cronEndpoint: 'update-tariffs', maxAgeMinutes: 10200 },
      { id: 'd1-trade-remedy', label: '무역구제 테이블 검증 (매주 월)', source: 'cron_log', cronEndpoint: 'trade-remedy-sync', maxAgeMinutes: 10200 },
      { id: 'd1-duty-lookup', label: 'lookup_duty_rate_v2() 정상', source: 'app_builtin' },
    ],
  },
  {
    id: 'D2',
    name: 'Tax Engine',
    layer1Status: 'done',
    checks: [
      { id: 'd2-cost-engine', label: 'GlobalCostEngine 정상', source: 'app_builtin' },
      { id: 'd2-vat-data', label: 'VAT/GST 240개국 데이터', source: 'health_check_logs' },
      { id: 'd2-de-minimis', label: 'De Minimis 240개국 데이터', source: 'health_check_logs' },
    ],
  },
  {
    id: 'D3',
    name: 'HS Classification',
    layer1Status: 'done',
    checks: [
      { id: 'd3-classifier', label: 'AI 분류기 정상', source: 'app_builtin' },
      { id: 'd3-hs-data', label: 'HS Code 5,371건 데이터', source: 'app_builtin' },
    ],
  },
  {
    id: 'D4',
    name: 'Data Pipeline',
    layer1Status: 'done',
    checks: [
      { id: 'd4-exchange-rate', label: '환율 자동 업데이트', source: 'app_builtin' },
      { id: 'd4-gov-api', label: '7개국 정부 API 가용성 (매 12시간)', source: 'cron_log', cronEndpoint: 'gov-api-health', maxAgeMinutes: 780 },
      { id: 'd4-min-rates', label: 'MIN 관세율 ~113M행', source: 'health_check_logs' },
      { id: 'd4-agr-rates', label: 'AGR 관세율 임포트 진행중', source: 'manual' },
    ],
  },
  {
    id: 'D5',
    name: 'Product & Web',
    layer1Status: 'done',
    checks: [
      { id: 'd5-uptime', label: '6개 핵심 페이지/API 가용성 (매 6시간)', source: 'cron_log', cronEndpoint: 'uptime-check', maxAgeMinutes: 390 },
      { id: 'd5-vercel-deploy', label: 'Vercel 자동 배포', source: 'app_builtin' },
    ],
  },
  {
    id: 'D6',
    name: 'Platform & Plugins',
    layer1Status: 'done',
    checks: [
      { id: 'd6-plugin-health', label: '위젯/웹훅 엔드포인트 (매 12시간)', source: 'cron_log', cronEndpoint: 'plugin-health', maxAgeMinutes: 780 },
      { id: 'd6-shopify-webhook', label: 'Shopify Webhook 정상', source: 'app_builtin' },
    ],
  },
  {
    id: 'D7',
    name: 'API & Developer',
    layer1Status: 'done',
    checks: [
      { id: 'd7-plan-checker', label: 'Plan Checker 정상', source: 'app_builtin' },
      { id: 'd7-rate-limiter', label: 'Rate Limiter 정상', source: 'app_builtin' },
      { id: 'd7-api-health', label: 'API 엔드포인트 정상', source: 'health_check_logs' },
    ],
  },
  {
    id: 'D8',
    name: 'QA & Accuracy',
    layer1Status: 'done',
    checks: [
      { id: 'd8-spot-check', label: '8개 계산 케이스 Spot Check (매일)', source: 'cron_log', cronEndpoint: 'spot-check', maxAgeMinutes: 1500 },
      { id: 'd8-ci-tests', label: 'CI 테스트 통과', source: 'app_builtin' },
    ],
  },
  {
    id: 'D9',
    name: 'Customer Success',
    layer1Status: 'done',
    checks: [
      { id: 'd9-faq', label: 'FAQ 13개 항목 정상', source: 'app_builtin' },
      { id: 'd9-crisp', label: 'Crisp 채팅 위젯 활성화', source: 'app_builtin' },
    ],
  },
  {
    id: 'D10',
    name: 'Revenue & Billing',
    layer1Status: 'done',
    checks: [
      { id: 'd10-paddle-webhook', label: 'Paddle Webhook 정상', source: 'app_builtin' },
      { id: 'd10-overage-cron', label: 'Overage 빌링 Cron (매월 1일)', source: 'cron_log', cronEndpoint: 'billing-overage', maxAgeMinutes: 44700 },
      { id: 'd10-plan-checker', label: 'Plan Checker 정상', source: 'app_builtin' },
    ],
  },
  {
    id: 'D11',
    name: 'Infrastructure & Security',
    layer1Status: 'done',
    checks: [
      { id: 'd11-health-check', label: 'DB/API/Auth 헬스체크 (매 6시간)', source: 'cron_log', cronEndpoint: 'health-check', maxAgeMinutes: 390 },
      { id: 'd11-db-connect', label: 'Supabase DB 연결', source: 'health_check_logs' },
      { id: 'd11-auth', label: 'Supabase Auth 정상', source: 'health_check_logs' },
    ],
  },
  {
    id: 'D12',
    name: 'Marketing & Growth',
    layer1Status: 'done',
    checks: [
      { id: 'd12-welcome-email', label: 'Make.com Welcome Email 시나리오', source: 'external' },
      { id: 'd12-linkedin', label: 'LinkedIn 소셜공유 시나리오', source: 'external' },
    ],
  },
  {
    id: 'D13',
    name: 'Legal & Compliance',
    layer1Status: 'done',
    checks: [
      { id: 'd13-legal-review', label: 'Google Calendar 법률 리뷰 3개', source: 'external' },
      { id: 'd13-tos', label: 'ToS/Privacy Policy 페이지', source: 'app_builtin' },
    ],
  },
  {
    id: 'D14',
    name: 'Finance',
    layer1Status: 'pending',
    checks: [
      { id: 'd14-cost-tracking', label: '비용 자동 수집 (미설정)', source: 'manual' },
    ],
  },
  {
    id: 'D15',
    name: 'Intelligence',
    layer1Status: 'done',
    checks: [
      { id: 'd15-competitor-scan', label: '10개 경쟁사 스캔 (매주 월)', source: 'cron_log', cronEndpoint: 'competitor-scan', maxAgeMinutes: 10200 },
    ],
  },
];
