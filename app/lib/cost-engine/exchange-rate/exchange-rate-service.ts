/**
 * POTAL — Real-time Exchange Rate Service
 *
 * 실시간 환율 API를 통한 통화 변환
 *
 * 무료 API 프로바이더 (폴백 체인):
 * 1. ExchangeRate-API (무료 티어: 1500 req/month)
 *    https://open.er-api.com/v6/latest/USD
 * 2. Fawaz Ahmed Currency API (무료, CDN 기반)
 *    https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json
 *
 * 캐싱 전략:
 * - 메모리 캐시: 1시간 TTL (환율은 자주 변하지 않음)
 * - DB 캐시: 향후 Supabase에 저장하여 API 콜 절감 가능
 *
 * 사용처:
 * - TLC 계산 결과를 현지 통화로 변환
 * - De minimis 임계값을 USD로 변환
 * - API 응답에 환율 정보 포함
 */

// ─── Types ──────────────────────────────────────────

export interface ExchangeRates {
  base: string;           // 기준 통화 (USD)
  rates: Record<string, number>;  // 통화별 환율
  lastUpdated: string;    // 마지막 업데이트 시간
  source: string;         // API 소스
}

export interface CurrencyConversion {
  from: string;
  to: string;
  amount: number;
  convertedAmount: number;
  rate: number;
  lastUpdated: string;
}

// ─── Configuration ──────────────────────────────────

interface ExchangeRateConfig {
  enabled: boolean;
  cacheTtlMs: number;      // 캐시 유효 시간 (기본 1시간)
  timeoutMs: number;        // API 타임아웃
}

function getConfig(): ExchangeRateConfig {
  return {
    enabled: process.env.EXCHANGE_RATE_ENABLED !== 'false',
    cacheTtlMs: parseInt(process.env.EXCHANGE_RATE_CACHE_TTL_MS || '3600000', 10), // 1시간
    timeoutMs: parseInt(process.env.EXCHANGE_RATE_TIMEOUT_MS || '10000', 10),
  };
}

// ─── In-Memory Cache ────────────────────────────────

let cachedRates: ExchangeRates | null = null;
let cacheTimestamp: number = 0;

function isCacheValid(): boolean {
  if (!cachedRates) return false;
  const config = getConfig();
  return Date.now() - cacheTimestamp < config.cacheTtlMs;
}

// ─── API Providers ──────────────────────────────────

/**
 * Provider 1: ExchangeRate-API (Open API)
 * 무료, 인증 불요, 1500 req/month
 */
async function fetchFromExchangeRateApi(timeoutMs: number): Promise<ExchangeRates | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[POTAL FX] ExchangeRate-API returned ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.result !== 'success' || !data.rates) {
      console.warn('[POTAL FX] ExchangeRate-API invalid response');
      return null;
    }

    return {
      base: 'USD',
      rates: data.rates,
      lastUpdated: data.time_last_update_utc || new Date().toISOString(),
      source: 'exchangerate-api',
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('[POTAL FX] ExchangeRate-API timed out');
    } else {
      console.warn('[POTAL FX] ExchangeRate-API error:', error.message);
    }
    return null;
  }
}

/**
 * Provider 2: Fawaz Ahmed Currency API (CDN)
 * 무료, 인증 불요, 무제한
 */
async function fetchFromFawazApi(timeoutMs: number): Promise<ExchangeRates | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[POTAL FX] Fawaz API returned ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.usd) {
      console.warn('[POTAL FX] Fawaz API invalid response');
      return null;
    }

    // Fawaz API는 소문자 키 사용 → 대문자로 변환
    const rates: Record<string, number> = {};
    for (const [key, value] of Object.entries(data.usd)) {
      rates[key.toUpperCase()] = value as number;
    }

    return {
      base: 'USD',
      rates,
      lastUpdated: data.date || new Date().toISOString(),
      source: 'fawaz-currency-api',
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('[POTAL FX] Fawaz API timed out');
    } else {
      console.warn('[POTAL FX] Fawaz API error:', error.message);
    }
    return null;
  }
}

// ─── Hardcoded Fallback Rates ───────────────────────

/**
 * API 모두 실패 시 사용할 하드코딩 환율 (대략적인 값)
 * 주요 통화만 포함
 */
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  KRW: 1340,
  CAD: 1.36,
  AUD: 1.53,
  CNY: 7.24,
  INR: 83.5,
  BRL: 4.97,
  MXN: 17.15,
  CHF: 0.88,
  SEK: 10.5,
  NOK: 10.6,
  DKK: 6.87,
  NZD: 1.64,
  SGD: 1.35,
  HKD: 7.82,
  TWD: 31.5,
  THB: 35.5,
  MYR: 4.7,
  PHP: 56.5,
  IDR: 15700,
  VND: 24500,
  ZAR: 18.5,
  TRY: 32.5,
  AED: 3.67,
  SAR: 3.75,
  PLN: 4.0,
  CZK: 23.0,
  HUF: 360,
  RON: 4.6,
  BGN: 1.8,
  HRK: 6.9, // Croatia → EUR since 2023, but kept for legacy
  ILS: 3.7,
  CLP: 950,
  COP: 4000,
  PEN: 3.75,
  ARS: 850,
};

function getFallbackRates(): ExchangeRates {
  return {
    base: 'USD',
    rates: FALLBACK_RATES,
    lastUpdated: '2025-01-01T00:00:00Z',
    source: 'hardcoded-fallback',
  };
}

// ─── Public API ─────────────────────────────────────

/**
 * 최신 환율 가져오기 (캐시 → API → 하드코딩)
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  // 캐시 유효하면 즉시 리턴
  if (isCacheValid() && cachedRates) {
    return cachedRates;
  }

  const config = getConfig();

  if (!config.enabled) {
    return getFallbackRates();
  }

  // API 호출 (폴백 체인)
  let rates = await fetchFromExchangeRateApi(config.timeoutMs);

  if (!rates) {
    rates = await fetchFromFawazApi(config.timeoutMs);
  }

  if (rates) {
    // 캐시에 저장
    cachedRates = rates;
    cacheTimestamp = Date.now();
    console.log(`[POTAL FX] Rates updated from ${rates.source} (${Object.keys(rates.rates).length} currencies)`);
    return rates;
  }

  // 모든 API 실패 → 하드코딩 사용
  console.warn('[POTAL FX] All APIs failed, using fallback rates');

  // 이전 캐시가 있으면 만료되었더라도 사용 (stale > fallback)
  if (cachedRates) {
    console.log('[POTAL FX] Using stale cache');
    return cachedRates;
  }

  return getFallbackRates();
}

/**
 * 통화 변환
 *
 * @param amount - 변환할 금액
 * @param from - 원본 통화 (ISO 코드)
 * @param to - 대상 통화 (ISO 코드)
 */
export async function convertCurrency(
  amount: number,
  from: string,
  to: string,
): Promise<CurrencyConversion> {
  const fromUpper = from.toUpperCase();
  const toUpper = to.toUpperCase();

  // 같은 통화면 변환 불요
  if (fromUpper === toUpper) {
    return {
      from: fromUpper,
      to: toUpper,
      amount,
      convertedAmount: amount,
      rate: 1,
      lastUpdated: new Date().toISOString(),
    };
  }

  const rates = await getExchangeRates();

  // USD 기준이므로:
  // from → USD → to
  const fromRate = rates.rates[fromUpper] || 1;
  const toRate = rates.rates[toUpper] || 1;

  const rate = toRate / fromRate;
  const convertedAmount = Math.round(amount * rate * 100) / 100;

  return {
    from: fromUpper,
    to: toUpper,
    amount,
    convertedAmount,
    rate: Math.round(rate * 10000) / 10000,
    lastUpdated: rates.lastUpdated,
  };
}

/**
 * USD를 다른 통화로 변환 (간편 함수)
 */
export async function usdToLocal(amountUsd: number, localCurrency: string): Promise<number> {
  const result = await convertCurrency(amountUsd, 'USD', localCurrency);
  return result.convertedAmount;
}

/**
 * 다른 통화를 USD로 변환 (간편 함수)
 */
export async function localToUsd(amount: number, localCurrency: string): Promise<number> {
  const result = await convertCurrency(amount, localCurrency, 'USD');
  return result.convertedAmount;
}

/**
 * 특정 통화의 환율 가져오기 (USD 기준)
 */
export async function getRate(currency: string): Promise<number> {
  const rates = await getExchangeRates();
  return rates.rates[currency.toUpperCase()] || 1;
}

/**
 * 캐시 강제 무효화 (테스트/디버깅용)
 */
export function invalidateExchangeRateCache(): void {
  cachedRates = null;
  cacheTimestamp = 0;
}
