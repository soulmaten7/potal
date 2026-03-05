/**
 * POTAL — EU TARIC (Tarif Intégré Communautaire) API Provider
 *
 * EU 27개국 공통 관세율 조회
 *
 * API: EU Access2Markets / EU Open Data Portal
 * - 무료, 인증 불요
 * - TARIC 10자리 commodity code 기반
 * - MFN duty, EU FTA 특혜세율 제공
 *
 * Primary: EU TARIC Consultation
 *   https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp
 *
 * Alternative: UK Trade Tariff API (XI prefix for Northern Ireland / EU-aligned data)
 *   https://www.trade-tariff.service.gov.uk/xi/api/v2/commodities/{code}
 *   (영국 API이지만 /xi/ 경로는 EU TARIC 데이터를 제공)
 *
 * ⚠️ EU 공식 TARIC API는 XML/SOAP 기반으로 파싱이 복잡하므로,
 *    UK Trade Tariff의 /xi/ (Northern Ireland) 엔드포인트를 활용.
 *    이 엔드포인트는 EU CET (Common External Tariff)를 그대로 반영합니다.
 */

import type { HsCodeDutyRate } from '../hs-code/types';

// UK Trade Tariff의 XI (Northern Ireland = EU aligned) 엔드포인트
const EU_TARIFF_API_BASE = 'https://www.trade-tariff.service.gov.uk/xi/api/v2';

// EU 27개국 ISO codes
const EU_MEMBER_STATES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
]);

/**
 * 해당 국가가 EU 회원국인지 확인
 */
export function isEuMemberState(countryCode: string): boolean {
  return EU_MEMBER_STATES.has(countryCode.toUpperCase());
}

/**
 * EU TARIC API에서 관세율 조회
 *
 * UK Trade Tariff의 /xi/ 엔드포인트를 사용하여 EU CET 데이터를 가져옵니다.
 * EU 회원국은 모두 같은 대외 관세율(CET)을 적용하므로,
 * destinationCountry가 어떤 EU 국가든 같은 결과를 반환합니다.
 *
 * @param hsCode - HS Code (6~10자리)
 * @param destinationCountry - 목적지 EU 회원국
 * @param originCountry - 원산지 (FTA 적용 판단용)
 * @param timeoutMs - 타임아웃
 */
export async function fetchEuTaricDutyRate(
  hsCode: string,
  destinationCountry: string,
  originCountry?: string,
  timeoutMs: number = 15000,
): Promise<HsCodeDutyRate | null> {
  try {
    const commodityCode = padToTenDigits(hsCode);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const url = `${EU_TARIFF_API_BASE}/commodities/${commodityCode}`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/vnd.uktt.v2',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      if (response.status === 404) {
        return await tryFallbackCodes(hsCode, destinationCountry, originCountry, timeoutMs);
      }
      console.warn(`[POTAL EU] API returned ${response.status}`);
      return null;
    }

    const data = await response.json();

    const mfnRate = extractMfnDutyRate(data);

    if (mfnRate === null) {
      console.warn(`[POTAL EU] Could not extract MFN rate for ${commodityCode}`);
      return null;
    }

    // FTA 특혜세율 추출
    let ftaRate: number | undefined;
    if (originCountry) {
      ftaRate = extractPreferentialRate(data, originCountry);
    }

    console.log(`[POTAL EU] ${hsCode} → ${commodityCode} (${destinationCountry}) = ${(mfnRate * 100).toFixed(1)}% CET`);

    return {
      hsCode: commodityCode,
      destinationCountry: destinationCountry.toUpperCase(),
      originCountry,
      mfnRate,
      ftaRate,
      notes: `Source: EU TARIC (via XI) | CET for all EU member states`,
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('[POTAL EU] Request timed out');
    } else {
      console.warn('[POTAL EU] API error:', error.message);
    }
    return null;
  }
}

// ─── Helper Functions ──────────────────────────────

function padToTenDigits(hsCode: string): string {
  const digits = hsCode.replace(/\./g, '');
  return digits.padEnd(10, '0');
}

async function tryFallbackCodes(
  hsCode: string,
  destinationCountry: string,
  originCountry?: string,
  timeoutMs: number = 15000,
): Promise<HsCodeDutyRate | null> {
  const digits = hsCode.replace(/\./g, '');

  // 8자리로 시도
  if (digits.length >= 6) {
    const code8 = digits.substring(0, 8).padEnd(10, '0');
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${EU_TARIFF_API_BASE}/commodities/${code8}`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/vnd.uktt.v2' },
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        const mfnRate = extractMfnDutyRate(data);
        if (mfnRate !== null) {
          console.log(`[POTAL EU] Fallback to ${code8} = ${(mfnRate * 100).toFixed(1)}% CET`);
          return {
            hsCode: code8,
            destinationCountry: destinationCountry.toUpperCase(),
            originCountry,
            mfnRate,
            notes: `Source: EU TARIC (via XI) | ${code8} (fallback)`,
          };
        }
      }
    } catch { /* continue */ }
  }

  return null;
}

/**
 * XI API 응답에서 MFN (Third country duty) 추출
 * 구조는 UK Trade Tariff API와 동일 (JSON:API format)
 */
function extractMfnDutyRate(apiResponse: any): number | null {
  try {
    const included = apiResponse?.included;
    if (!Array.isArray(included)) return null;

    const measures = included.filter(
      (item: any) => item.type === 'measure' && item.attributes
    );

    // Third country duty (103) 찾기
    for (const measure of measures) {
      const measureType = measure.relationships?.measure_type?.data?.id;

      if (measureType === '103') {
        const dutyExprId = measure.relationships?.duty_expression?.data?.id;
        if (dutyExprId) {
          const dutyExpr = included.find(
            (item: any) => item.type === 'duty_expression' && item.id === dutyExprId
          );
          if (dutyExpr?.attributes?.base) {
            const rate = parseDutyExpression(dutyExpr.attributes.base);
            if (rate !== null) return rate;
          }
        }
      }
    }

    // Fallback: attributes에서 직접 찾기
    for (const measure of measures) {
      const attrs = measure.attributes;
      if (attrs?.duty_expression?.base) {
        const isMfn = attrs.measure_type_id === '103' ||
                      attrs.origin === 'erga_omnes';
        if (isMfn) {
          const rate = parseDutyExpression(attrs.duty_expression.base);
          if (rate !== null) return rate;
        }
      }
    }

    return null;
  } catch (error) {
    console.warn('[POTAL EU] Error extracting MFN rate:', error);
    return null;
  }
}

/**
 * 원산지별 특혜세율 추출
 */
function extractPreferentialRate(apiResponse: any, originCountry: string): number | undefined {
  try {
    const included = apiResponse?.included;
    if (!Array.isArray(included)) return undefined;

    const measures = included.filter(
      (item: any) => item.type === 'measure' && item.attributes
    );

    for (const measure of measures) {
      const geographicalArea = measure.relationships?.geographical_area?.data?.id;

      if (geographicalArea === originCountry.toUpperCase()) {
        const measureType = measure.relationships?.measure_type?.data?.id;
        if (measureType === '142' || measureType === '145') {
          const dutyExprId = measure.relationships?.duty_expression?.data?.id;
          if (dutyExprId) {
            const dutyExpr = included.find(
              (item: any) => item.type === 'duty_expression' && item.id === dutyExprId
            );
            if (dutyExpr?.attributes?.base) {
              const rate = parseDutyExpression(dutyExpr.attributes.base);
              if (rate !== null) return rate;
            }
          }
        }
      }
    }

    return undefined;
  } catch {
    return undefined;
  }
}

function parseDutyExpression(expression: string): number | null {
  if (!expression) return null;

  const clean = expression.trim().toLowerCase();

  if (clean === 'free' || clean === '0.00 %' || clean === '0 %') {
    return 0;
  }

  const adValoremMatch = clean.match(/(\d+(?:\.\d+)?)\s*%/);
  if (adValoremMatch) {
    return parseFloat(adValoremMatch[1]) / 100;
  }

  return null;
}
