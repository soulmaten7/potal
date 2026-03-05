/**
 * POTAL Tariff API — Public Exports
 */

export {
  fetchDutyRateWithFallback,
  getDutyRateFromLiveDb,
  getFtaRateFromLiveDb,
  invalidateDutyRateCache,
  invalidateAllLiveCache,
  getTariffApiConfig,
} from './tariff-api-client';

export type { TariffApiConfig } from './tariff-api-client';
