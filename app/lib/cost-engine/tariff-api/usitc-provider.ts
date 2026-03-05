/**
 * POTAL — USITC (US International Trade Commission) API Provider
 *
 * 미국 HTS (Harmonized Tariff Schedule) 10자리 코드 + 관세율 조회
 *
 * API: https://hts.usitc.gov/api/search
 * - 무료, 인증 불요
 * - HTS 코드로 검색 → general duty rate 반환
 * - 10자리까지 정밀한 관세율 제공
 *
 * General rate 형식 예시:
 * - "Free" → 0%
 * - "8.5%" → 8.5%
 * - "12.5¢/kg + 2.5%" → 복합세 (ad valorem 부분만 추출)
 * - "$1.50/pr." → 종량세 (ad valorem으로 변환 불가 → fallback)
 */

import type { HsCodeDutyRate } from '../hs-code/types';

const USITC_API_BASE = 'https://hts.usitc.gov/api';

/**
 * USITC API 응답 타입
 */
interface UsitcSearchResult {
  htsno: string;         // HTS number (e.g., "6404.11.00.90")
  description: string;   // Description
  general: string;       // General duty rate (e.g., "8.5%", "Free")
  special: string;       // Special rates (FTA, GSP, etc.)
  other: string;         // Column 2 rate
  units: string;
  indent: number;
}

/**
 * USITC HTS API에서 관세율 조회
 *
 * @param hsCode - HS Code (6~10자리)
 * @param originCountry - 원산지 (FTA 적용 판단용)
 * @param timeoutMs - 타임아웃
 */
export async function fetchUsitcDutyRate(
  hsCode: string,
  originCountry?: string,
  timeoutMs: number = 15000,
): Promise<HsCodeDutyRate | null> {
  try {
    // 6자리 이상의 HS Code를 USITC 포맷으로 변환
    const searchCode = formatHsCodeForUsitc(hsCode);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const url = `${USITC_API_BASE}/search?query=${encodeURIComponent(searchCode)}`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[POTAL USITC] API returned ${response.status}`);
      return null;
    }

    const results: UsitcSearchResult[] = await response.json();

    if (!results || results.length === 0) {
      console.warn(`[POTAL USITC] No results for ${searchCode}`);
      return null;
    }

    // 가장 구체적인 매칭을 찾기 (긴 HTS 코드 우선)
    const bestMatch = findBestMatch(results, hsCode);

    if (!bestMatch) {
      console.warn(`[POTAL USITC] No matching HTS entry for ${hsCode}`);
      return null;
    }

    // General rate 파싱
    const mfnRate = parseUsitcRate(bestMatch.general);

    if (mfnRate === null) {
      console.warn(`[POTAL USITC] Could not parse rate: "${bestMatch.general}" for ${bestMatch.htsno}`);
      return null;
    }

    // Special rate (FTA) 파싱 — 원산지가 있으면 FTA 적용 가능 여부 확인
    let ftaRate: number | undefined;
    if (originCountry && bestMatch.special) {
      ftaRate = parseSpecialRate(bestMatch.special, originCountry);
    }

    const cleanHtsNo = bestMatch.htsno.replace(/\./g, '');

    console.log(`[POTAL USITC] ${hsCode} → HTS ${bestMatch.htsno} = ${(mfnRate * 100).toFixed(1)}% (${bestMatch.description.substring(0, 50)})`);

    return {
      hsCode: cleanHtsNo,
      destinationCountry: 'US',
      originCountry,
      mfnRate,
      ftaRate,
      notes: `Source: USITC HTS | ${bestMatch.htsno} ${bestMatch.description.substring(0, 80)}`,
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('[POTAL USITC] Request timed out');
    } else {
      console.warn('[POTAL USITC] API error:', error.message);
    }
    return null;
  }
}

// ─── Helper Functions ──────────────────────────────

/**
 * HS Code를 USITC 검색 형식으로 변환
 * "640411" → "6404.11"
 * "6404110090" → "6404.11.00.90"
 */
function formatHsCodeForUsitc(hsCode: string): string {
  const digits = hsCode.replace(/\./g, '');

  if (digits.length <= 4) {
    return digits.substring(0, 2) + (digits.length > 2 ? '.' + digits.substring(2) : '');
  }
  if (digits.length <= 6) {
    return digits.substring(0, 4) + '.' + digits.substring(4);
  }
  if (digits.length <= 8) {
    return digits.substring(0, 4) + '.' + digits.substring(4, 6) + '.' + digits.substring(6);
  }
  return digits.substring(0, 4) + '.' + digits.substring(4, 6) + '.' + digits.substring(6, 8) + '.' + digits.substring(8);
}

/**
 * 검색 결과에서 가장 정확한 매칭 찾기
 * 구체적인 HTS 코드 (더 긴 것) 우선
 */
function findBestMatch(results: UsitcSearchResult[], targetHsCode: string): UsitcSearchResult | null {
  const targetDigits = targetHsCode.replace(/\./g, '');

  // HTS 번호 정규화 후 비교
  const scored = results
    .map(r => {
      const htsDigits = r.htsno.replace(/\./g, '');
      const matchLen = getMatchLength(targetDigits, htsDigits);
      const hasRate = r.general && r.general.trim() !== '' && r.indent >= 1;
      return { result: r, matchLen, hasRate, htsLen: htsDigits.length };
    })
    .filter(s => s.matchLen >= 4 && s.hasRate) // 최소 4자리(heading) 매칭
    .sort((a, b) => {
      // 매칭 길이 우선 → HTS 코드 길이 우선 (더 구체적)
      if (b.matchLen !== a.matchLen) return b.matchLen - a.matchLen;
      return b.htsLen - a.htsLen;
    });

  return scored.length > 0 ? scored[0].result : null;
}

/**
 * 두 코드의 앞에서부터 매칭 길이 계산
 */
function getMatchLength(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

/**
 * USITC general rate 문자열 파싱
 *
 * 형식:
 * - "Free" → 0
 * - "8.5%" → 0.085
 * - "12.5¢/kg + 2.5%" → 0.025 (ad valorem 부분)
 * - "$1.50/pr." → null (종량세, 변환 불가)
 * - "20%" → 0.20
 */
function parseUsitcRate(rateStr: string): number | null {
  if (!rateStr) return null;

  const clean = rateStr.trim().toLowerCase();

  // "Free" → 0%
  if (clean === 'free' || clean === 'free.') {
    return 0;
  }

  // 순수 ad valorem: "8.5%"
  const pureAdValorem = clean.match(/^(\d+(?:\.\d+)?)\s*%$/);
  if (pureAdValorem) {
    return parseFloat(pureAdValorem[1]) / 100;
  }

  // 복합세에서 ad valorem 부분 추출: "12.5¢/kg + 2.5%"
  const compoundAdValorem = clean.match(/(\d+(?:\.\d+)?)\s*%/);
  if (compoundAdValorem) {
    return parseFloat(compoundAdValorem[1]) / 100;
  }

  // 순수 종량세 ($, ¢ 등) — ad valorem 없음
  if (clean.includes('¢') || clean.includes('$') || clean.includes('/')) {
    // 종량세는 상품 가격에 따라 실효세율이 달라지므로 null
    return null;
  }

  return null;
}

/**
 * Special rate에서 원산지별 FTA 세율 파싱
 *
 * 형식: "Free (A,AU,BH,CA,CL,CO,D,E,IL,JO,KR,MA,MX,OM,P,PA,PE,SG)"
 * A = GSP, AU = Australia FTA, CA = NAFTA/USMCA, KR = KORUS, etc.
 *
 * USITC Special Rate Country Codes:
 * A/A+ = GSP (Generalized System of Preferences)
 * AU = Australia
 * BH = Bahrain
 * CA = Canada (USMCA)
 * CL = Chile
 * CO = Colombia
 * D = AGOA (African Growth and Opportunity Act)
 * E = CBI (Caribbean Basin Initiative)
 * IL = Israel
 * JO = Jordan
 * KR = Korea
 * MA = Morocco
 * MX = Mexico (USMCA)
 * OM = Oman
 * P = DR-CAFTA
 * PA = Panama
 * PE = Peru
 * SG = Singapore
 * JP = Japan (※ currently no comprehensive FTA)
 */
function parseSpecialRate(specialStr: string, originCountry: string): number | undefined {
  if (!specialStr) return undefined;

  // USITC special rate country code 매핑
  const countryToSpecialCode: Record<string, string[]> = {
    'AU': ['AU'],
    'BH': ['BH'],
    'CA': ['CA'],
    'CL': ['CL'],
    'CO': ['CO'],
    'IL': ['IL'],
    'JO': ['JO'],
    'KR': ['KR'],
    'MA': ['MA'],
    'MX': ['MX'],
    'OM': ['OM'],
    'PA': ['PA'],
    'PE': ['PE'],
    'SG': ['SG'],
    // GSP 대상국들 (일부)
    'TH': ['A', 'A+'],
    'IN': ['A', 'A+'],
    'PH': ['A', 'A+'],
    'ID': ['A', 'A+'],
    'BR': ['A', 'A+'],
    'VN': ['A', 'A+'],
  };

  const codes = countryToSpecialCode[originCountry.toUpperCase()];
  if (!codes) return undefined;

  // Special rate 파싱: "Free (A,AU,CA,...)" 또는 "2.5% (AU,CA)"
  // 여러 세율이 있을 수 있음: "Free (A,AU,BH,CA,...)\n2.5% (JP)"
  const parts = specialStr.split(/\n/);

  for (const part of parts) {
    const match = part.match(/^(.+?)\s*\(([^)]+)\)/);
    if (!match) continue;

    const rateStr = match[1].trim();
    const countryCodes = match[2].split(',').map(c => c.trim());

    // 이 원산지가 이 특혜세율에 해당하는지 확인
    if (codes.some(code => countryCodes.includes(code))) {
      if (rateStr.toLowerCase() === 'free') return 0;
      const rateMatch = rateStr.match(/(\d+(?:\.\d+)?)\s*%/);
      if (rateMatch) return parseFloat(rateMatch[1]) / 100;
    }
  }

  return undefined;
}
