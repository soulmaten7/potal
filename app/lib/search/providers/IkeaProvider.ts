/**
 * IkeaProvider — Serper Google Shopping API 기반
 * Domestic provider. 배송: 1-14일 (상품 크기별 상이), IKEA Family $50+ 무료
 */
import { SerperShoppingProvider, type ProviderCategory } from './SerperShoppingProvider';

export class IkeaProvider extends SerperShoppingProvider {
  readonly name = 'IKEA';
  readonly type = 'domestic' as const;
  readonly storeKeyword = 'ikea';
  readonly sourceFilter = /ikea/i;
  readonly domain = 'ikea.com';
  readonly searchUrlTemplate = 'https://www.ikea.com/us/en/search/?q={query}';
  readonly affiliateParamKey = 'affid';
  readonly affiliateEnvKey = 'IKEA_AFFILIATE_ID';
  readonly defaultDeliveryDays = '1-14 Business Days';
  readonly defaultParsedDeliveryDays = 7;
  readonly defaultShippingPrice = 0;
  readonly categories: ProviderCategory[] = ['home', 'kitchen', 'office', 'baby'];
}
