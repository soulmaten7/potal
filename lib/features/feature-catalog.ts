/**
 * Feature Catalog for CUSTOM Builder — CW25 Sprint 3
 *
 * Reads from app/features/features-data.ts and re-exports a category-grouped
 * structure for the CUSTOM builder's checkbox grid.
 *
 * 결정 11 (HOMEPAGE_REDESIGN_SPEC.md 560~576):
 *   - 140개 기능 전부 체크박스로 즉시 표시 (숨김/접기 없음)
 *   - 카테고리별 섹션 헤더
 *   - 검색 + ℹ️ 호버 설명
 */

import { FEATURES, type Feature, type FeatureCategory } from '@/app/features/features-data';

export interface CatalogEntry {
  id: string;
  slug: string;
  name: string;
  category: FeatureCategory;
  description: string;
  apiEndpoint: string | null;
  hasApi: boolean;
}

/**
 * All features converted to a lighter CatalogEntry type.
 * Sorted by category then by name.
 */
export const FEATURE_CATALOG: CatalogEntry[] = FEATURES.map((f: Feature) => ({
  id: f.id,
  slug: f.slug,
  name: f.name,
  category: f.category,
  description: f.description,
  apiEndpoint: f.apiEndpoint ?? null,
  hasApi: !!f.apiEndpoint,
})).sort((a, b) => {
  const catCmp = a.category.localeCompare(b.category);
  return catCmp !== 0 ? catCmp : a.name.localeCompare(b.name);
});

/** Category display order (matching HOMEPAGE_REDESIGN_SPEC.md 569) */
const CATEGORY_ORDER: FeatureCategory[] = [
  'Core',
  'Trade',
  'Tax',
  'Shipping',
  'Integration',
  'Platform',
  'Security',
  'Legal',
  'Web',
  'Support',
  'Business',
  'Marketing',
];

export interface CategoryGroup {
  category: FeatureCategory;
  label: string;
  features: CatalogEntry[];
}

/**
 * Group catalog entries by category in display order.
 */
export function getCategoryGroups(): CategoryGroup[] {
  const map = new Map<FeatureCategory, CatalogEntry[]>();
  for (const entry of FEATURE_CATALOG) {
    const arr = map.get(entry.category);
    if (arr) {
      arr.push(entry);
    } else {
      map.set(entry.category, [entry]);
    }
  }
  return CATEGORY_ORDER.filter(cat => map.has(cat)).map(cat => ({
    category: cat,
    label: cat,
    features: map.get(cat)!,
  }));
}

/**
 * Total count of features in the catalog.
 */
export const FEATURE_COUNT = FEATURE_CATALOG.length;
