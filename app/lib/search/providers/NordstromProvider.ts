/**
 * NordstromProvider — Serper Google Shopping API 기반
 * Domestic provider. 배송: 3-6일, 항상 무료배송 (no minimum)
 */
import { SerperShoppingProvider, type ProviderCategory } from './SerperShoppingProvider';

export class NordstromProvider extends SerperShoppingProvider {
  readonly name = 'Nordstrom';
  readonly type = 'domestic' as const;
  readonly storeKeyword = 'nordstrom';
  readonly sourceFilter = /nordstrom/i;
  readonly domain = 'nordstrom.com';
  readonly searchUrlTemplate = 'https://www.nordstrom.com/sr?origin=keywordsearch&keyword={query}';
  readonly affiliateParamKey = 'affid';
  readonly affiliateEnvKey = 'NORDSTROM_AFFILIATE_ID';
  readonly defaultDeliveryDays = '3-6 Business Days';
  readonly defaultParsedDeliveryDays = 4;
  readonly defaultShippingPrice = 0; // 항상 무료
  readonly categories: ProviderCategory[] = ['fashion', 'beauty'];
  protected override enableDirectUrl = true;
}
