/**
 * LowesProvider — Serper Google Shopping API 기반
 * Domestic provider. 배송: 1-4일, $45+ 무료배송
 */
import { SerperShoppingProvider, type ProviderCategory } from './SerperShoppingProvider';

export class LowesProvider extends SerperShoppingProvider {
  readonly name = "Lowe's";
  readonly type = 'domestic' as const;
  readonly storeKeyword = 'lowes';
  readonly sourceFilter = /lowe/i;
  readonly domain = 'lowes.com';
  readonly searchUrlTemplate = 'https://www.lowes.com/search?searchTerm={query}';
  readonly affiliateParamKey = 'affid';
  readonly affiliateEnvKey = 'LOWES_AFFILIATE_ID';
  readonly defaultDeliveryDays = '1-4 Business Days';
  readonly defaultParsedDeliveryDays = 3;
  readonly defaultShippingPrice = 0;
  readonly categories: ProviderCategory[] = ['home_improvement', 'home', 'kitchen', 'automotive'];
  protected override usesPlusEncoding = true;
  protected override enableDirectUrl = true;
  protected override useGoogleFallback = true; // WAF 차단 우회
}
