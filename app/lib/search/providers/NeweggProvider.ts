/**
 * NeweggProvider — Serper Google Shopping API 기반
 * Domestic provider. 배송: 1-5일, $25+ 많은 상품 무료배송
 */
import { SerperShoppingProvider, type ProviderCategory } from './SerperShoppingProvider';

export class NeweggProvider extends SerperShoppingProvider {
  readonly name = 'Newegg';
  readonly type = 'domestic' as const;
  readonly storeKeyword = 'newegg';
  readonly sourceFilter = /newegg/i;
  readonly domain = 'newegg.com';
  readonly searchUrlTemplate = 'https://www.newegg.com/p/pl?d={query}';
  readonly affiliateParamKey = 'affid';
  readonly affiliateEnvKey = 'NEWEGG_AFFILIATE_ID';
  readonly defaultDeliveryDays = '1-5 Business Days';
  readonly defaultParsedDeliveryDays = 3;
  readonly defaultShippingPrice = 0;
  readonly categories: ProviderCategory[] = ['electronics', 'office'];
  protected override enableDirectUrl = true;
}
