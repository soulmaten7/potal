/**
 * TemuProvider — Serper Google Shopping API 기반
 *
 * 기존 단독 구현 → SerperShoppingProvider 베이스 클래스 사용으로 리팩토링 (2026-02-24)
 * Global(International) provider. 중국→미국 직배송.
 * 배송: 7-15일, 무료배송 기본
 *
 * 기존 Apify Actor 방식은 Temu 403 차단으로 폐기 (2026-02-18~)
 * Serper organic 방식은 가격 미포함으로 부적합 (2026-02-24 확인)
 * → Serper Shopping + "temu" 키워드 방식으로 최종 전환 (2026-02-24)
 */
import { SerperShoppingProvider, type ProviderCategory } from './SerperShoppingProvider';

export class TemuProvider extends SerperShoppingProvider {
  readonly name = 'Temu';
  readonly type = 'global' as const;
  readonly storeKeyword = 'temu';
  readonly sourceFilter = /temu/i;
  readonly domain = 'temu.com';
  readonly searchUrlTemplate = 'https://www.temu.com/search_result.html?search_key={query}';
  readonly affiliateParamKey = 'aff_code';
  readonly affiliateEnvKey = 'TEMU_AFFILIATE_CODE';
  readonly defaultDeliveryDays = '7-15 Business Days';
  readonly defaultParsedDeliveryDays = 10;
  readonly defaultShippingPrice = 0;
  readonly categories: ProviderCategory[] = ['general'];
  protected override enableDirectUrl = true;
}
