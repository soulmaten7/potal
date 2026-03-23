/**
 * Update Scheduler — defines check frequencies and integrates with Vercel Crons.
 */

export interface UpdateSchedule {
  fileId: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'immutable';
  cronEndpoint?: string;
  checkMethod: 'api_call' | 'page_hash' | 'rss' | 'manual' | 'cron_result';
  sourceUrl: string;
}

/** Maps existing Vercel Crons to data files they update */
export const CRON_TO_DATA_MAP: Record<string, string[]> = {
  '/admin/exchange-rate-sync': ['external:ecb_daily_xml'],
  '/admin/sdn-sync': ['db:sanctions_entries', 'db:sanctions_aliases', 'db:sanctions_addresses', 'db:sanctions_ids'],
  '/admin/update-tariffs': ['db:macmap_ntlc_rates'],
  '/admin/trade-remedy-sync': ['db:trade_remedy_cases', 'db:trade_remedy_products', 'db:trade_remedy_duties', 'db:safeguard_exemptions'],
  '/v1/cron/federal-register-monitor': ['app/lib/cost-engine/section301-lookup.ts'],
  '/v1/cron/taric-rss-monitor': ['db:gov_tariff_schedules'],
  '/v1/cron/tariff-change-monitor': ['db:gov_tariff_schedules', 'db:macmap_ntlc_rates'],
  '/v1/cron/classification-ruling-monitor': ['db:product_hs_mappings'],
  '/v1/cron/macmap-update-monitor': ['db:macmap_ntlc_rates', 'db:macmap_min_rates', 'db:macmap_agr_rates'],
  '/v1/cron/wco-news-monitor': ['app/lib/cost-engine/gri-classifier/data/heading-descriptions.ts'],
  '/v1/cron/fta-change-monitor': ['db:macmap_trade_agreements'],
};

/** Get all files that should be checked today */
export function getDailyChecks(): string[] {
  return [
    'external:ecb_daily_xml',
    'db:sanctions_entries',
    'db:sanctions_aliases',
    'db:sanctions_addresses',
    'db:sanctions_ids',
  ];
}

/** Get all files due for weekly check */
export function getWeeklyChecks(): string[] {
  return [
    'db:trade_remedy_cases',
    'db:trade_remedy_products',
    'db:trade_remedy_duties',
    'db:gov_tariff_schedules',
    'db:macmap_trade_agreements',
    'app/lib/cost-engine/section301-lookup.ts',
  ];
}
