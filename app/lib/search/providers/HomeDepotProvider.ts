/**
 * HomeDepotProvider — Serper Google Shopping API 기반
 * Domestic provider. 배송: 3-7일, $45+ 무료배송
 */
import { SerperShoppingProvider, type ProviderCategory } from './SerperShoppingProvider';

export class HomeDepotProvider extends SerperShoppingProvider {
  readonly name = 'Home Depot';
  readonly type = 'domestic' as const;
  readonly storeKeyword = 'home depot';
  readonly sourceFilter = /home\s*depot/i;
  readonly domain = 'homedepot.com';
  readonly searchUrlTemplate = 'https://www.homedepot.com/s/{query}';
  readonly affiliateParamKey = 'affid';
  readonly affiliateEnvKey = 'HOMEDEPOT_AFFILIATE_ID';
  readonly defaultDeliveryDays = '3-7 Business Days';
  readonly defaultParsedDeliveryDays = 5;
  readonly defaultShippingPrice = 0;
  readonly categories: ProviderCategory[] = ['home_improvement', 'home', 'kitchen', 'automotive'];
  protected override usesPlusEncoding = true;
  protected override enableDirectUrl = true;
  protected override useGoogleFallback = true; // WAF 차단 우회
}
