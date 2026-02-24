/**
 * SephoraProvider — Serper Google Shopping API 기반
 * Domestic provider. 배송: 3일, Beauty Insider(무료 가입) 무료배송
 */
import { SerperShoppingProvider, type ProviderCategory } from './SerperShoppingProvider';

export class SephoraProvider extends SerperShoppingProvider {
  readonly name = 'Sephora';
  readonly type = 'domestic' as const;
  readonly storeKeyword = 'sephora';
  readonly sourceFilter = /sephora/i;
  readonly domain = 'sephora.com';
  readonly searchUrlTemplate = 'https://www.sephora.com/search?keyword={query}';
  readonly affiliateParamKey = 'affid';
  readonly affiliateEnvKey = 'SEPHORA_AFFILIATE_ID';
  readonly defaultDeliveryDays = '3 Business Days';
  readonly defaultParsedDeliveryDays = 3;
  readonly defaultShippingPrice = 0;
  readonly categories: ProviderCategory[] = ['beauty'];
  protected override useGoogleFallback = false; // Sephora 검색 잘 동작
}
