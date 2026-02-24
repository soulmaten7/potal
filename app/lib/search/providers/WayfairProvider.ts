/**
 * WayfairProvider — Serper Google Shopping API 기반
 * Domestic provider. 배송: 1-7일, $35+ 무료배송
 */
import { SerperShoppingProvider, type ProviderCategory } from './SerperShoppingProvider';

export class WayfairProvider extends SerperShoppingProvider {
  readonly name = 'Wayfair';
  readonly type = 'domestic' as const;
  readonly storeKeyword = 'wayfair';
  readonly sourceFilter = /wayfair/i;
  readonly domain = 'wayfair.com';
  readonly searchUrlTemplate = 'https://www.wayfair.com/keyword.php?keyword={query}';
  readonly affiliateParamKey = 'affid';
  readonly affiliateEnvKey = 'WAYFAIR_AFFILIATE_ID';
  readonly defaultDeliveryDays = '1-7 Business Days';
  readonly defaultParsedDeliveryDays = 4;
  readonly defaultShippingPrice = 0;
  readonly categories: ProviderCategory[] = ['home', 'kitchen', 'baby', 'pet'];
  protected override usesPlusEncoding = true;
  // Wayfair 검색이 잘 동작하므로 사이트 검색 URL fallback 유지
  protected override useGoogleFallback = false;
}
