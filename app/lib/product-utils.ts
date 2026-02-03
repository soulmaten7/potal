/**
 * Domestic / International 지퍼 병합 (Strict Zipper Logic)
 * [Dom[0], Intl[0], Dom[1], Intl[1], ...] 순서로 교차 노출.
 * PC·모바일 동일 데이터 소스.
 */

export type ZipperSlot<T> = { item: T | null; type: 'domestic' | 'international' };

/**
 * domestic / international 리스트를 1:1로 교차 병합.
 * 한쪽이 먼저 소진되면 fillNull이 true일 때 빈 슬롯(null)을 넣어
 * 2열 그리드에서 왼쪽=Domestic, 오른쪽=International 순서를 유지.
 */
export function interleaveDomesticInternational<T>(
  domestic: T[],
  international: T[],
  options?: { fillNull?: boolean }
): ZipperSlot<T>[] {
  const fillNull = options?.fillNull ?? true;
  const out: ZipperSlot<T>[] = [];
  const maxLen = Math.max(domestic.length, international.length);

  for (let i = 0; i < maxLen; i++) {
    const dom = domestic[i] ?? null;
    const intl = international[i] ?? null;
    if (fillNull) {
      out.push({ item: dom, type: 'domestic' });
      out.push({ item: intl, type: 'international' });
    } else {
      if (dom !== null) out.push({ item: dom, type: 'domestic' });
      if (intl !== null) out.push({ item: intl, type: 'international' });
    }
  }

  return out;
}
