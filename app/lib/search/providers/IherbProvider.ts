/**
 * IherbProvider — Serper Google Shopping API 기반
 * Domestic provider (미국 창고 배송). 배송: 2+ days, $30+ 무료배송
 */
import { SerperShoppingProvider, type ProviderCategory } from './SerperShoppingProvider';

export class IherbProvider extends SerperShoppingProvider {
  readonly name = 'iHerb';
  readonly type = 'domestic' as const;
  readonly storeKeyword = 'iherb';
  readonly sourceFilter = /iherb/i;
  readonly domain = 'iherb.com';
  readonly searchUrlTemplate = 'https://www.iherb.com/search?kw={query}';
  readonly affiliateParamKey = 'affid';
  readonly affiliateEnvKey = 'IHERB_AFFILIATE_ID';
  readonly defaultDeliveryDays = '2-5 Business Days';
  readonly defaultParsedDeliveryDays = 3;
  readonly defaultShippingPrice = 0;
  readonly categories: ProviderCategory[] = ['health', 'beauty'];
  protected override enableDirectUrl = true;
}
