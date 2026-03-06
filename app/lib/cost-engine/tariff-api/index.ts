/**
 * POTAL Tariff API — Public Exports
 *
 * 국가별 정부 API를 통한 실시간 관세율 조회:
 * - USITC (미국, 무료)
 * - UK Trade Tariff (영국, 무료)
 * - EU TARIC (EU 27개국, 무료)
 * - WTO/Dutify (기타 국가, 폴백)
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

// Individual providers (for direct use if needed)
export { fetchUsitcDutyRate } from './usitc-provider';
export { fetchUkTariffDutyRate } from './uk-tariff-provider';
export { fetchEuTaricDutyRate, isEuMemberState } from './eu-taric-provider';
export { fetchCanadaCbsaDutyRate } from './canada-cbsa-provider';
export { fetchAustraliaDutyRate } from './australia-abf-provider';
export { fetchKoreaDutyRate } from './korea-kcs-provider';
export { fetchJapanDutyRate } from './japan-customs-provider';
