/**
 * POTAL External Tariff API — Abstraction Layer
 *
 * 외부 관세 API 프로바이더를 추상화합니다.
 * 현재 지원: WTO Tariff Download Facility, 향후 Dutify/Customs API 추가 가능
 *
 * 흐름:
 * 1. duty_rates_live 테이블에서 조회
 * 2. 없으면 외부 API 호출
 * 3. 결과를 duty_rates_live에 저장 (캐싱)
 * 4. 실패 시 하드코딩된 기존 데이터로 폴백
 *
 * 서킷 브레이커: 연속 실패 시 일정 시간 동안 외부 API 호출 중단
 */

import { createClient } from '@supabase/supabase-js';
import type { HsCodeDutyRate } from '../hs-code/types';
import { fetchUsitcDutyRate } from './usitc-provider';
import { fetchUkTariffDutyRate } from './uk-tariff-provider';
import { fetchEuTaricDutyRate, isEuMemberState } from './eu-taric-provider';
import { fetchCanadaCbsaDutyRate } from './canada-cbsa-provider';
import { fetchAustraliaDutyRate } from './australia-abf-provider';
import { fetchKoreaDutyRate } from './korea-kcs-provider';
import { fetchJapanDutyRate } from './japan-customs-provider';

// ─── Configuration ────────────────────────────────

export interface TariffApiConfig {
  enabled: boolean;
  primaryProvider: string;
  timeoutMs: number;
  circuitBreakerThreshold: number;     // 연속 실패 허용 횟수
  circuitBreakerResetMs: number;       // 서킷 브레이커 리셋 시간
}

export function getTariffApiConfig(): TariffApiConfig {
  return {
    enabled: process.env.TARIFF_API_ENABLED !== 'false',
    primaryProvider: process.env.TARIFF_API_PROVIDER || 'open-trade',
    timeoutMs: parseInt(process.env.TARIFF_API_TIMEOUT_MS || '15000', 10),
    circuitBreakerThreshold: parseInt(process.env.TARIFF_API_CIRCUIT_BREAKER_THRESHOLD || '5', 10),
    circuitBreakerResetMs: parseInt(process.env.TARIFF_API_CIRCUIT_BREAKER_RESET_MS || '300000', 10),
  };
}

// ─── Circuit Breaker ──────────────────────────────

let consecutiveFailures = 0;
let circuitOpenedAt: number | null = null;

function isCircuitOpen(): boolean {
  const config = getTariffApiConfig();
  if (consecutiveFailures < config.circuitBreakerThreshold) return false;
  if (!circuitOpenedAt) return false;

  // 리셋 시간이 지났으면 반 개방 (half-open) — 한 번 시도
  if (Date.now() - circuitOpenedAt > config.circuitBreakerResetMs) {
    console.log('[POTAL Tariff] Circuit breaker half-open, allowing one retry');
    return false;
  }

  return true;
}

function recordSuccess(): void {
  consecutiveFailures = 0;
  circuitOpenedAt = null;
}

function recordFailure(): void {
  consecutiveFailures++;
  const config = getTariffApiConfig();
  if (consecutiveFailures >= config.circuitBreakerThreshold && !circuitOpenedAt) {
    circuitOpenedAt = Date.now();
    console.warn(`[POTAL Tariff] Circuit breaker OPEN after ${consecutiveFailures} failures. Will retry in ${config.circuitBreakerResetMs / 1000}s`);
  }
}

// ─── Supabase Client ──────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── DB Cache: duty_rates_live ────────────────────

/**
 * duty_rates_live 테이블에서 관세율 조회 (캐시)
 */
export async function getDutyRateFromLiveDb(
  hsCode: string,
  destinationCountry: string,
  originCountry?: string,
): Promise<HsCodeDutyRate | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    let query = supabase
      .from('duty_rates_live')
      .select('*')
      .eq('destination_country', destinationCountry.toUpperCase())
      .is('invalidated_at', null);

    // HS Code 매칭: 정확한 코드 → 6자리 → 챕터(2자리) 순으로 시도
    // 가장 구체적인 것부터 매칭
    const hsChapter = hsCode.substring(0, 2);
    const hs6 = hsCode.substring(0, 6);

    query = query.or(`hs_code.eq.${hsCode},hs_code.eq.${hs6},hs_code.eq.${hsChapter}`);

    const { data, error } = await query
      .order('hs_code', { ascending: false }) // 더 구체적인 코드 우선
      .limit(1);

    if (error || !data || data.length === 0) return null;

    const row = data[0] as any;
    return {
      hsCode: row.hs_code,
      destinationCountry: row.destination_country,
      originCountry: row.origin_country || originCountry,
      mfnRate: parseFloat(row.mfn_rate),
      additionalTariff: parseFloat(row.additional_tariff || '0'),
      antiDumpingRate: parseFloat(row.anti_dumping_rate || '0'),
      notes: row.notes || `Source: ${row.source_api}`,
    };
  } catch (error) {
    console.warn('[POTAL Tariff] Live DB lookup failed:', error);
    return null;
  }
}

/**
 * 관세율을 duty_rates_live에 저장
 */
async function saveDutyRateToLiveDb(
  hsCode: string,
  destinationCountry: string,
  rate: HsCodeDutyRate,
  sourceApi: string,
  apiResponseRaw?: any,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('duty_rates_live').upsert(
      {
        hs_code: hsCode,
        destination_country: destinationCountry.toUpperCase(),
        origin_country: rate.originCountry || null,
        mfn_rate: rate.mfnRate,
        additional_tariff: rate.additionalTariff || 0,
        anti_dumping_rate: rate.antiDumpingRate || 0,
        source_api: sourceApi,
        effective_date: new Date().toISOString().split('T')[0],
        api_response_raw: apiResponseRaw || null,
        invalidated_at: null,
      },
      { onConflict: 'hs_code,destination_country' }
    );
  } catch (error) {
    console.warn('[POTAL Tariff] Failed to save duty rate to live DB:', error);
  }
}

// ─── External API Providers ───────────────────────

/**
 * Tariff API Provider 인터페이스
 * 새로운 프로바이더를 추가하려면 이 인터페이스를 구현하면 됩니다.
 */
interface TariffApiProvider {
  name: string;
  fetchDutyRate(
    hsCode: string,
    destinationCountry: string,
    originCountry?: string,
  ): Promise<HsCodeDutyRate | null>;
}

/**
 * Open Trade API Provider
 * 무료 오픈소스 관세 데이터 (WTO 기반)
 *
 * 실제 프로덕션에서는 아래 중 하나로 교체:
 * - WTO Tariff Download Facility API
 * - Dutify API (상용)
 * - 각국 세관 오픈 API
 *
 * 현재는 Supabase에 시드 데이터를 직접 넣고,
 * 외부 API는 데이터 보강용으로 사용
 */
const openTradeProvider: TariffApiProvider = {
  name: 'open-trade',

  async fetchDutyRate(
    hsCode: string,
    destinationCountry: string,
    originCountry?: string,
  ): Promise<HsCodeDutyRate | null> {
    const config = getTariffApiConfig();

    // WTO Tariff Data API (무료)
    // 엔드포인트: https://api.wto.org/tariffs
    // 인증: API Key (무료 등록)
    const wtoApiKey = process.env.WTO_TARIFF_API_KEY;

    if (wtoApiKey) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

        const hs6 = hsCode.substring(0, 6);
        const url = `https://api.wto.org/timeseries/v1/data?i=HS_M_0010&r=${destinationCountry}&ps=2024&pc=${hs6}&fmt=json`;

        const response = await fetch(url, {
          headers: { 'Ocp-Apim-Subscription-Key': wtoApiKey },
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json();
          if (data?.Dataset?.length > 0) {
            const rate = parseFloat(data.Dataset[0].Value) / 100;
            return {
              hsCode,
              destinationCountry,
              originCountry,
              mfnRate: rate,
              notes: 'Source: WTO Tariff Data',
            };
          }
        }
      } catch (error: any) {
        console.warn('[POTAL Tariff] WTO API error:', error.message);
      }
    }

    // Dutify API (상용, 옵션)
    const dutifyApiKey = process.env.DUTIFY_API_KEY;

    if (dutifyApiKey) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

        const url = `https://api.dutify.com/v1/tariff?hs_code=${hsCode}&destination=${destinationCountry}${originCountry ? `&origin=${originCountry}` : ''}`;

        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${dutifyApiKey}` },
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json();
          if (data?.duty_rate !== undefined) {
            return {
              hsCode,
              destinationCountry,
              originCountry,
              mfnRate: parseFloat(data.duty_rate) / 100,
              additionalTariff: parseFloat(data.additional_duty || '0') / 100,
              notes: `Source: Dutify API`,
            };
          }
        }
      } catch (error: any) {
        console.warn('[POTAL Tariff] Dutify API error:', error.message);
      }
    }

    return null;
  },
};

// ─── Main Tariff Lookup Function ──────────────────

/**
 * 관세율 조회 (전체 폴백 체인)
 *
 * 순서:
 * 1. duty_rates_live DB 조회 (캐시)
 * 2. 서킷 브레이커 확인
 * 3. 외부 API 호출 → DB에 저장
 * 4. 실패 시 null 리턴 (caller가 하드코딩 폴백 사용)
 *
 * @returns 관세율 또는 null (하드코딩으로 폴백해야 함)
 */
export async function fetchDutyRateWithFallback(
  hsCode: string,
  destinationCountry: string,
  originCountry?: string,
): Promise<{ rate: HsCodeDutyRate; source: string } | null> {
  const config = getTariffApiConfig();

  // ━━━ 1단계: Live DB 캐시 조회 ━━━
  const cached = await getDutyRateFromLiveDb(hsCode, destinationCountry, originCountry);
  if (cached) {
    console.log(`[POTAL Tariff] Live DB HIT: ${hsCode} → ${destinationCountry} = ${cached.mfnRate}`);
    return { rate: cached, source: 'live_db' };
  }

  // ━━━ 2단계: 외부 API 호출 ━━━
  if (!config.enabled) {
    return null;
  }

  if (isCircuitOpen()) {
    console.warn('[POTAL Tariff] Circuit breaker OPEN, skipping external API');
    return null;
  }

  try {
    // ━━━ 국가별 API 라우팅 ━━━
    // 목적지에 따라 가장 정확한 정부 API를 선택
    const dest = destinationCountry.toUpperCase();
    let result: HsCodeDutyRate | null = null;
    let providerName = 'unknown';

    if (dest === 'US') {
      // 미국: USITC HTS API (무료, 10자리, 인증 불요)
      result = await fetchUsitcDutyRate(hsCode, originCountry, config.timeoutMs);
      providerName = 'usitc';
    } else if (dest === 'GB') {
      // 영국: UK Trade Tariff API (무료, 10자리, 인증 불요)
      result = await fetchUkTariffDutyRate(hsCode, originCountry, config.timeoutMs);
      providerName = 'uk-trade-tariff';
    } else if (isEuMemberState(dest)) {
      // EU 27개국: EU TARIC via XI endpoint (무료, 10자리)
      result = await fetchEuTaricDutyRate(hsCode, dest, originCountry, config.timeoutMs);
      providerName = 'eu-taric';
    } else if (dest === 'CA') {
      // 캐나다: CBSA Tariff Schedule (하드코딩 + FTA 적용)
      result = await fetchCanadaCbsaDutyRate(hsCode, originCountry, config.timeoutMs);
      providerName = 'canada-cbsa';
    } else if (dest === 'AU') {
      // 호주: ABF Customs Tariff (하드코딩 + FTA 적용)
      result = await fetchAustraliaDutyRate(hsCode, originCountry, config.timeoutMs);
      providerName = 'australia-abf';
    } else if (dest === 'JP') {
      // 일본: Japan Customs Tariff (하드코딩 + FTA 적용)
      result = await fetchJapanDutyRate(hsCode, originCountry, config.timeoutMs);
      providerName = 'japan-customs';
    } else if (dest === 'KR') {
      // 한국: KCS Customs Tariff (하드코딩 + FTA 적용)
      result = await fetchKoreaDutyRate(hsCode, originCountry, config.timeoutMs);
      providerName = 'korea-kcs';
    } else {
      // 기타 국가: 기존 WTO/Dutify 프로바이더 사용
      result = await openTradeProvider.fetchDutyRate(hsCode, destinationCountry, originCountry);
      providerName = openTradeProvider.name;
    }

    if (result) {
      recordSuccess();

      // DB에 저장 (다음 요청부터 API 호출 없이 DB 리턴)
      await saveDutyRateToLiveDb(hsCode, destinationCountry, result, providerName);

      console.log(`[POTAL Tariff] External API (${providerName}): ${hsCode} → ${destinationCountry} = ${result.mfnRate}`);
      return { rate: result, source: `external_${providerName}` };
    }

    recordFailure();
    return null;
  } catch (error) {
    recordFailure();
    console.error('[POTAL Tariff] External API error:', error);
    return null;
  }
}

// ─── FTA Live DB Operations ───────────────────────

/**
 * fta_rates_live 테이블에서 FTA 특혜 세율 조회
 */
export async function getFtaRateFromLiveDb(
  originCountry: string,
  destinationCountry: string,
  hsChapter?: string,
): Promise<{
  ftaName: string;
  preferentialRate: number;
  source: string;
} | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    let query = supabase
      .from('fta_rates_live')
      .select('*')
      .eq('origin_country', originCountry.toUpperCase())
      .eq('destination_country', destinationCountry.toUpperCase())
      .eq('is_active', true)
      .is('invalidated_at', null);

    if (hsChapter) {
      query = query.or(`hs_chapter.eq.${hsChapter},hs_chapter.is.null`);
    }

    const { data, error } = await query
      .order('preferential_rate', { ascending: true }) // 가장 유리한(낮은) 세율 우선
      .limit(1);

    if (error || !data || data.length === 0) return null;

    const row = data[0] as any;
    return {
      ftaName: row.fta_name,
      preferentialRate: parseFloat(row.preferential_rate),
      source: `live_db_${row.source_api}`,
    };
  } catch (error) {
    console.warn('[POTAL Tariff] FTA live DB lookup failed:', error);
    return null;
  }
}

// ─── Cache Invalidation ───────────────────────────

/**
 * 특정 HS Code의 캐시를 무효화 (관세율 변경 시)
 */
export async function invalidateDutyRateCache(
  hsCode?: string,
  destinationCountry?: string,
): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) return 0;

  try {
    let query = supabase
      .from('duty_rates_live')
      .update({ invalidated_at: new Date().toISOString() });

    if (hsCode) query = query.eq('hs_code', hsCode);
    if (destinationCountry) query = query.eq('destination_country', destinationCountry);

    const result = await query.select('*');
    return (result.data as any[])?.length || 0;
  } catch {
    return 0;
  }
}

/**
 * 전체 라이브 캐시 무효화 (긴급 업데이트 시)
 */
export async function invalidateAllLiveCache(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const now = new Date().toISOString();
  await Promise.all([
    supabase.from('duty_rates_live').update({ invalidated_at: now }).is('invalidated_at', null),
    supabase.from('fta_rates_live').update({ invalidated_at: now }).is('invalidated_at', null),
    supabase.from('hs_classification_cache').update({ invalidated_at: now }).is('invalidated_at', null),
  ]);
}
