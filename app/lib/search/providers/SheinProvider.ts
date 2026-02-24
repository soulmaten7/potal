/**
 * SheinProvider — Serper Google Shopping API 기반
 *
 * 기존 RapidAPI 방식 → Serper 전환 (RapidAPI 500 에러, 2026-02-22)
 * Global(International) provider. 중국→미국 직배송.
 * 배송: 9-12일, $29-49+ 무료배송
 * 멤버십: S-Club
 */
import { SerperShoppingProvider, type ProviderCategory } from './SerperShoppingProvider';

export class SheinProvider extends SerperShoppingProvider {
  readonly name = 'Shein';
  readonly type = 'global' as const;
  readonly storeKeyword = 'shein';
  readonly sourceFilter = /shein/i;
  readonly domain = 'shein.com';
  readonly searchUrlTemplate = 'https://us.shein.com/pdsearch/{query}/';
  readonly affiliateParamKey = 'ref';
  readonly affiliateEnvKey = 'SHEIN_AFFILIATE_ID';
  readonly defaultDeliveryDays = '9-12 Business Days';
  readonly defaultParsedDeliveryDays = 10;
  readonly defaultShippingPrice = 0;
  readonly categories: ProviderCategory[] = ['fashion'];
  protected override useGoogleFallback = true; // Google fallback이 실제 상품페이지 찾아줌
}
