/**
 * EtsyProvider — Serper Google Shopping API 기반
 * Domestic provider. 배송: 판매자별 상이 (1-3+ days)
 */
import { SerperShoppingProvider, type ProviderCategory } from './SerperShoppingProvider';

export class EtsyProvider extends SerperShoppingProvider {
  readonly name = 'Etsy';
  readonly type = 'domestic' as const;
  readonly storeKeyword = 'etsy';
  readonly sourceFilter = /etsy/i;
  readonly domain = 'etsy.com';
  readonly searchUrlTemplate = 'https://www.etsy.com/search?q={query}';
  readonly affiliateParamKey = 'affid';
  readonly affiliateEnvKey = 'ETSY_AFFILIATE_ID';
  readonly defaultDeliveryDays = '1-3+ Business Days';
  readonly defaultParsedDeliveryDays = 3;
  readonly defaultShippingPrice = 0;
  readonly categories: ProviderCategory[] = ['general'];
  protected override usesPlusEncoding = true;
  protected override enableDirectUrl = true;
  protected override useGoogleFallback = true;
  // Etsy는 /market/ (카테고리)가 아닌 /listing/ (상품) 페이지만 검색
  protected override siteSearchPath = 'listing/';
}
