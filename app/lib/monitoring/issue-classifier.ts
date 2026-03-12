/**
 * Layer Classification — Issue Classifier
 *
 * Classifies Division check results (Yellow/Red) into Layer 1/2/3:
 * - Layer 1 (Automation): Auto-retryable (cron failures, API timeouts, sync failures)
 * - Layer 2 (Monitor): Auto-adjustable (spot-check drift, data anomalies)
 * - Layer 3 (Active): Requires human judgment (new features, code changes, external issues)
 */

export type IssueLayer = 1 | 2 | 3;

export interface ClassifiedIssue {
  division: string;
  divisionName: string;
  checkId: string;
  checkLabel: string;
  status: 'yellow' | 'red';
  message: string;
  layer: IssueLayer;
  layerLabel: string;
  recommendation: string;
  autoRemediable: boolean;
  remediationAction?: string;
}

interface ClassificationRule {
  pattern: string | RegExp;
  layer: IssueLayer;
  recommendation: string;
  autoRemediable: boolean;
  remediationAction?: string;
}

/**
 * Division-specific classification rules.
 * Checked in order — first match wins.
 */
const CLASSIFICATION_RULES: Record<string, ClassificationRule[]> = {
  D1: [
    { pattern: /cron.*log|last run/i, layer: 1, recommendation: 'Trigger update-tariffs or trade-remedy-sync manually', autoRemediable: true, remediationAction: 'retry_cron' },
    { pattern: /data.*integrit|row.*count|불일치/i, layer: 2, recommendation: 'Verify table row counts, compare with previous snapshot', autoRemediable: false },
    { pattern: /FTA.*law|legal|법률/i, layer: 3, recommendation: 'Review FTA/trade law changes — requires business decision', autoRemediable: false },
  ],
  D2: [
    { pattern: /VAT.*data|de.*minimis/i, layer: 2, recommendation: 'Check vat_gst_rates and de_minimis_thresholds tables', autoRemediable: false },
    { pattern: /engine.*error|계산.*오류/i, layer: 3, recommendation: 'GlobalCostEngine logic issue — needs code review', autoRemediable: false },
  ],
  D3: [
    { pattern: /classifier|분류/i, layer: 2, recommendation: 'Check AI classifier pipeline health', autoRemediable: false },
    { pattern: /model|architecture|아키텍처/i, layer: 3, recommendation: 'ML model architecture issue — needs expert review', autoRemediable: false },
  ],
  D4: [
    { pattern: /exchange.*rate|환율/i, layer: 1, recommendation: 'Retry exchange-rate-sync', autoRemediable: true, remediationAction: 'retry_cron' },
    { pattern: /gov.*api|정부.*API/i, layer: 1, recommendation: 'Retry gov-api-health check', autoRemediable: true, remediationAction: 'retry_cron' },
    { pattern: /all.*down|전체.*다운/i, layer: 3, recommendation: 'All government APIs down — external issue, monitor and wait', autoRemediable: false },
    { pattern: /cron|last run/i, layer: 1, recommendation: 'Trigger data pipeline cron manually', autoRemediable: true, remediationAction: 'retry_cron' },
  ],
  D5: [
    { pattern: /uptime|page.*down|페이지.*다운/i, layer: 1, recommendation: 'Check Vercel deployment, trigger redeployment if needed', autoRemediable: true, remediationAction: 'retry_cron' },
    { pattern: /slow|성능.*저하|latency/i, layer: 2, recommendation: 'Monitor performance, may recover on next check', autoRemediable: false },
    { pattern: /UI.*change|UI.*변경/i, layer: 3, recommendation: 'UI change required — needs design decision', autoRemediable: false },
  ],
  D6: [
    { pattern: /plugin.*health|위젯|webhook/i, layer: 1, recommendation: 'Retry plugin-health check', autoRemediable: true, remediationAction: 'retry_cron' },
    { pattern: /shopify.*review|심사/i, layer: 3, recommendation: 'Shopify review issue — external process', autoRemediable: false },
  ],
  D7: [
    { pattern: /api.*health|endpoint/i, layer: 1, recommendation: 'Check API health endpoint', autoRemediable: true, remediationAction: 'retry_cron' },
    { pattern: /rate.*limit|plan.*check/i, layer: 2, recommendation: 'Review rate limiting configuration', autoRemediable: false },
  ],
  D8: [
    { pattern: /spot.*check|계산.*케이스/i, layer: 2, recommendation: 'Review spot-check results — may need range adjustment', autoRemediable: false },
    { pattern: /accuracy|정확도.*오류|logic/i, layer: 3, recommendation: 'Calculation logic error — needs code review', autoRemediable: false },
  ],
  D9: [
    { pattern: /FAQ|crisp|chat/i, layer: 2, recommendation: 'Check customer-facing services', autoRemediable: false },
    { pattern: /content.*update|콘텐츠/i, layer: 3, recommendation: 'Content update needed — requires editorial decision', autoRemediable: false },
  ],
  D10: [
    { pattern: /overage|billing.*cron/i, layer: 1, recommendation: 'Retry billing-overage cron', autoRemediable: true, remediationAction: 'retry_cron' },
    { pattern: /paddle.*webhook/i, layer: 1, recommendation: 'Check Paddle webhook connectivity', autoRemediable: true, remediationAction: 'retry_cron' },
    { pattern: /pricing|요금제/i, layer: 3, recommendation: 'Pricing strategy change — business decision required', autoRemediable: false },
  ],
  D11: [
    { pattern: /DB.*connect|database|DB.*unreachable/i, layer: 1, recommendation: 'Retry database connectivity check', autoRemediable: true, remediationAction: 'retry_cron' },
    { pattern: /auth|인증/i, layer: 1, recommendation: 'Retry auth service check', autoRemediable: true, remediationAction: 'retry_cron' },
    { pattern: /health.*check|헬스체크/i, layer: 1, recommendation: 'Trigger health-check manually', autoRemediable: true, remediationAction: 'retry_cron' },
    { pattern: /security|보안|vulnerab/i, layer: 3, recommendation: 'Security issue — immediate attention required', autoRemediable: false },
  ],
  D12: [
    { pattern: /email|Make\.com/i, layer: 2, recommendation: 'Check Make.com scenario status', autoRemediable: false },
    { pattern: /campaign|마케팅/i, layer: 3, recommendation: 'Marketing decision required', autoRemediable: false },
  ],
  D13: [
    { pattern: /legal.*review|법률/i, layer: 2, recommendation: 'Check Google Calendar legal review schedule', autoRemediable: false },
    { pattern: /compliance|규정|GDPR/i, layer: 3, recommendation: 'Legal compliance issue — requires legal review', autoRemediable: false },
  ],
  D14: [
    { pattern: /cost.*track|비용/i, layer: 2, recommendation: 'Update finance tracker spreadsheet', autoRemediable: false },
    { pattern: /budget|예산|investment/i, layer: 3, recommendation: 'Financial decision required', autoRemediable: false },
  ],
  D15: [
    { pattern: /competitor.*scan|경쟁사/i, layer: 1, recommendation: 'Trigger competitor-scan manually', autoRemediable: true, remediationAction: 'retry_cron' },
    { pattern: /market.*change|시장/i, layer: 3, recommendation: 'Market intelligence — strategic analysis needed', autoRemediable: false },
  ],
};

/** Default classification for unmatched issues */
const DEFAULT_RULE: ClassificationRule = {
  pattern: /.*/,
  layer: 2,
  recommendation: 'Review manually — unable to auto-classify',
  autoRemediable: false,
};

const LAYER_LABELS: Record<IssueLayer, string> = {
  1: 'Automation (Auto-Retry)',
  2: 'Monitor (Watch & Verify)',
  3: 'Active (Human Decision)',
};

/**
 * Classify a single check result into a Layer.
 */
export function classifyIssue(
  divisionId: string,
  divisionName: string,
  checkId: string,
  checkLabel: string,
  status: 'yellow' | 'red',
  message: string,
): ClassifiedIssue {
  const rules = CLASSIFICATION_RULES[divisionId] || [];

  // Check message + label against rules
  const combined = `${checkLabel} ${message}`;
  const matched = rules.find(rule => {
    if (typeof rule.pattern === 'string') {
      return combined.toLowerCase().includes(rule.pattern.toLowerCase());
    }
    return rule.pattern.test(combined);
  });

  const rule = matched || DEFAULT_RULE;

  // Red status on Layer 1/2 → escalate to Layer 3 if persistent
  const effectiveLayer = (status === 'red' && rule.layer === 1) ? 2 : rule.layer;

  return {
    division: divisionId,
    divisionName,
    checkId,
    checkLabel,
    status,
    message,
    layer: effectiveLayer,
    layerLabel: LAYER_LABELS[effectiveLayer],
    recommendation: rule.recommendation,
    autoRemediable: rule.autoRemediable && effectiveLayer <= 2,
    remediationAction: rule.autoRemediable ? rule.remediationAction : undefined,
  };
}

/**
 * Map a cron remediationAction to the actual endpoint path.
 */
export function getRemediationEndpoint(action: string, checkId: string): string | null {
  if (action !== 'retry_cron') return null;

  // Extract cron endpoint from checkId pattern: d{N}-{endpoint-name}
  const ENDPOINT_MAP: Record<string, string> = {
    'd1-tariff-cron': '/api/v1/admin/update-tariffs',
    'd1-trade-remedy': '/api/v1/admin/trade-remedy-sync',
    'd4-exchange-rate': '/api/v1/admin/exchange-rate-sync',
    'd4-gov-api': '/api/v1/admin/gov-api-health',
    'd5-uptime': '/api/v1/admin/uptime-check',
    'd6-plugin-health': '/api/v1/admin/plugin-health',
    'd8-spot-check': '/api/v1/admin/spot-check',
    'd10-overage-cron': '/api/v1/admin/billing-overage',
    'd11-health-check': '/api/v1/admin/health-check',
    'd15-competitor-scan': '/api/v1/admin/competitor-scan',
  };

  return ENDPOINT_MAP[checkId] || null;
}
