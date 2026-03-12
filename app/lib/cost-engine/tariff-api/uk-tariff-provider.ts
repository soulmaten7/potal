/**
 * POTAL — UK Trade Tariff API Provider
 *
 * 영국 관세율 조회 (HMRC UK Trade Tariff API)
 *
 * API: https://www.trade-tariff.service.gov.uk/api/v2
 * - 무료, 인증 불요
 * - 10자리 commodity code로 조회
 * - MFN (third-country) duty, VAT, 특혜세율 등 반환
 *
 * Endpoint: GET /api/v2/commodities/{commodity_code}
 * Accept: application/vnd.uktt.v2
 *
 * 응답 구조: JSON:API format
 * - data.attributes.import_measures → 수입 관세 측정값
 * - measures[].duty_expression → 관세율 표현식
 */

import type { HsCodeDutyRate } from '../hs-code/types';

const UK_TARIFF_API_BASE = 'https://www.trade-tariff.service.gov.uk/api/v2';

/**
 * UK Trade Tariff API에서 관세율 조회
 *
 * @param hsCode - HS Code (6~10자리, 영국은 10자리 commodity code 사용)
 * @param originCountry - 원산지 (FTA 적용 판단용)
 * @param timeoutMs - 타임아웃
 */
export async function fetchUkTariffDutyRate(
  hsCode: string,
  originCountry?: string,
  timeoutMs: number = 15000,
): Promise<HsCodeDutyRate | null> {
  try {
    // 영국 commodity code는 10자리 (6자리면 0으로 패딩)
    const commodityCode = padToTenDigits(hsCode);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const url = `${UK_TARIFF_API_BASE}/commodities/${commodityCode}`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/vnd.uktt.v2',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      // 10자리 코드가 없으면 8자리, 6자리로 시도
      if (response.status === 404) {
        return await tryFallbackCodes(hsCode, originCountry, timeoutMs);
      }
      console.warn(`[POTAL UK] API returned ${response.status}`);
      return null;
    }

    const data = await response.json();

    // JSON:API 응답에서 관세율 추출
    const mfnRate = extractMfnDutyRate(data);

    if (mfnRate === null) {
      console.warn(`[POTAL UK] Could not extract MFN rate for ${commodityCode}`);
      return null;
    }

    // FTA 특혜세율 추출 (원산지가 있으면)
    let ftaRate: number | undefined;
    if (originCountry) {
      ftaRate = extractPreferentialRate(data, originCountry);
    }

    return {
      hsCode: commodityCode,
      destinationCountry: 'GB',
      originCountry,
      mfnRate,
      ftaRate,
      notes: `Source: UK Trade Tariff | Commodity ${commodityCode}`,
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('[POTAL UK] Request timed out');
    } else {
      console.warn('[POTAL UK] API error:', error.message);
    }
    return null;
  }
}

// ─── Helper Functions ──────────────────────────────

/**
 * HS Code를 10자리로 패딩
 * "640411" → "6404110000"
 */
function padToTenDigits(hsCode: string): string {
  const digits = hsCode.replace(/\./g, '');
  return digits.padEnd(10, '0');
}

/**
 * 10자리가 없을 때 상위 코드로 폴백 시도
 */
async function tryFallbackCodes(
  hsCode: string,
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

      const response = await fetch(`${UK_TARIFF_API_BASE}/commodities/${code8}`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/vnd.uktt.v2' },
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        const mfnRate = extractMfnDutyRate(data);
        if (mfnRate !== null) {
          return {
            hsCode: code8,
            destinationCountry: 'GB',
            originCountry,
            mfnRate,
            notes: `Source: UK Trade Tariff | Commodity ${code8} (fallback)`,
          };
        }
      }
    } catch { /* try heading next */ }
  }

  // Heading (4자리) 조회 — subheadings 리스트 반환
  if (digits.length >= 4) {
    try {
      const heading = digits.substring(0, 4);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${UK_TARIFF_API_BASE}/headings/${heading}`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/vnd.uktt.v2' },
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        // Heading 레벨의 기본 관세율이 있으면 사용
        const mfnRate = extractMfnFromHeading(data);
        if (mfnRate !== null) {
          return {
            hsCode: heading.padEnd(10, '0'),
            destinationCountry: 'GB',
            originCountry,
            mfnRate,
            notes: `Source: UK Trade Tariff | Heading ${heading} (est.)`,
          };
        }
      }
    } catch { /* give up */ }
  }

  return null;
}

/**
 * JSON:API 응답에서 MFN (third-country) 관세율 추출
 *
 * UK Trade Tariff API에서 measures는 'included' 배열에 있고,
 * measure_type이 "103" (Third country duty) 또는 "105" (Non Preferential Quota)인 것을 찾음
 */
function extractMfnDutyRate(apiResponse: any): number | null {
  try {
    const included = apiResponse?.included;
    if (!Array.isArray(included)) return null;

    // Third country duty measures 찾기
    const measures = included.filter(
      (item: any) => item.type === 'measure' && item.attributes
    );

    for (const measure of measures) {
      const measureType = measure.relationships?.measure_type?.data?.id;

      // 103 = Third country duty, 142 = Tariff preference
      if (measureType === '103') {
        // duty_expression 관계에서 세율 추출
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

    // 직접 measure attributes에서 duty_expression 찾기
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
    console.warn('[POTAL UK] Error extracting MFN rate:', error);
    return null;
  }
}

/**
 * JSON:API 응답에서 특혜(FTA) 세율 추출
 */
function extractPreferentialRate(apiResponse: any, originCountry: string): number | undefined {
  try {
    const included = apiResponse?.included;
    if (!Array.isArray(included)) return undefined;

    const measures = included.filter(
      (item: any) => item.type === 'measure' && item.attributes
    );

    // 원산지 국가에 해당하는 특혜세율 찾기
    for (const measure of measures) {
      const geographicalArea = measure.relationships?.geographical_area?.data?.id;

      // 국가 코드 매칭 또는 지역 그룹 매칭
      if (geographicalArea === originCountry) {
        const measureType = measure.relationships?.measure_type?.data?.id;
        // 142 = Tariff preference, 145 = Preferential tariff quota
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

/**
 * Heading 레벨 응답에서 대표 관세율 추출
 */
function extractMfnFromHeading(apiResponse: any): number | null {
  try {
    // Heading 응답에는 subheadings가 있고, 일부는 duty_expression을 가짐
    const included = apiResponse?.included;
    if (!Array.isArray(included)) return null;

    const commodities = included.filter((item: any) => item.type === 'commodity');

    // 첫 번째 commodity의 관세율을 대표값으로 사용
    for (const commodity of commodities) {
      if (commodity.attributes?.import_measures) {
        // import_measures가 있으면 commodity endpoint를 호출해야 함
        // heading 레벨에서는 개략적인 정보만 제공
        break;
      }
    }

    return null; // Heading 레벨에서는 구체적 세율 추출 어려움
  } catch {
    return null;
  }
}

/**
 * Duty expression 문자열 파싱
 * "8.00 %" → 0.08
 * "0.00 %" → 0
 * "12.50 % + 1.50 GBP / 100 kg" → 0.125
 */
function parseDutyExpression(expression: string): number | null {
  if (!expression) return null;

  const clean = expression.trim().toLowerCase();

  // "free" 또는 "0.00 %"
  if (clean === 'free' || clean === '0.00 %' || clean === '0 %') {
    return 0;
  }

  // Ad valorem: "8.00 %"
  const adValoremMatch = clean.match(/(\d+(?:\.\d+)?)\s*%/);
  if (adValoremMatch) {
    return parseFloat(adValoremMatch[1]) / 100;
  }

  return null;
}
