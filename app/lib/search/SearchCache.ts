/**
 * POTAL SearchCache — In-Memory 검색 결과 캐시
 *
 * 동일 쿼리 중복 API 호출 방지.
 * - TTL: 5분 (검색 결과가 빠르게 변하지 않으므로)
 * - 최대 50개 항목 (메모리 제한)
 * - LRU 방식 (오래된 항목부터 제거)
 *
 * 캐시 키: `${query}|${page}|${market}|${zipcode}` (정규화됨)
 */

import type { SearchResult } from './types';

interface CacheEntry {
  result: SearchResult;
  timestamp: number;
  hitCount: number;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5분
const MAX_ENTRIES = 50;

class SearchCache {
  private cache = new Map<string, CacheEntry>();
  private ttl: number;

  constructor(ttl = DEFAULT_TTL) {
    this.ttl = ttl;
  }

  /** 캐시 키 생성 (쿼리 정규화) */
  static buildKey(query: string, page: number, market: string, zipcode?: string): string {
    const normalizedQuery = query.trim().toLowerCase();
    return `${normalizedQuery}|${page}|${market}|${zipcode || ''}`;
  }

  /** 캐시에서 결과 조회 */
  get(key: string): SearchResult | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // TTL 초과 → 자동 삭제
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    entry.hitCount++;
    return entry.result;
  }

  /** 결과를 캐시에 저장 */
  set(key: string, result: SearchResult): void {
    // 최대 항목 초과 시 가장 오래된 항목 제거 (LRU)
    if (this.cache.size >= MAX_ENTRIES) {
      this.evictOldest();
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      hitCount: 0,
    });
  }

  /** 캐시 통계 */
  getStats(): { size: number; maxSize: number; ttlMs: number } {
    return {
      size: this.cache.size,
      maxSize: MAX_ENTRIES,
      ttlMs: this.ttl,
    };
  }

  /** 만료된 항목 정리 */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    return cleaned;
  }

  /** 캐시 전체 초기화 */
  clear(): void {
    this.cache.clear();
  }

  /** LRU: 가장 오래된 항목 제거 */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

// ─── Singleton ──────────────────────────────────────
let searchCache: SearchCache | null = null;

export function getSearchCache(): SearchCache {
  if (!searchCache) searchCache = new SearchCache();
  return searchCache;
}

export { SearchCache };
