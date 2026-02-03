/**
 * 자동완성용 Mock 데이터 (PC/모바일 공통).
 * SearchInput(PC)와 SearchOverlay(모바일)에서 동일하게 사용.
 */
export const MOCK_SUGGESTIONS = [
  'Lego',
  'Lego Star Wars',
  'Lego Technic',
  'Camping',
  'Camping Chair',
  'Camping Tent',
  'Camera',
  'Samsung Galaxy',
  'Apple Watch',
  'Running Shoes',
  'Vitamin C',
  'Coffee Maker',
  'Bluetooth Speaker',
  'Yoga Mat',
  'Gaming Mouse',
  'Wireless Earbuds',
  'Laptop',
  'iPad',
  'Water Bottle',
];

const MAX_SUGGESTIONS = 8;

/**
 * 입력값이 2글자 이상일 때 풀에서 필터링. 대소문자 무시, 부분 일치(includes).
 */
export function filterSuggestions(input: string, pool: string[] = MOCK_SUGGESTIONS, max = MAX_SUGGESTIONS): string[] {
  const q = (input || '').trim().toLowerCase();
  if (q.length < 2) return [];
  return pool.filter((item) => item.toLowerCase().includes(q)).slice(0, max);
}
