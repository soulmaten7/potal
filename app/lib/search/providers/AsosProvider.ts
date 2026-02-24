/**
 * AsosProvider — Serper Google Shopping API 기반
 * Global(International) provider. 영국→미국 배송.
 * 배송: 5-8일, $49.99+ 무료배송
 * 멤버십: ASOS Premier ($19.99/yr)
 */
import { SerperShoppingProvider, type ProviderCategory } from './SerperShoppingProvider';

export class AsosProvider extends SerperShoppingProvider {
  readonly name = 'ASOS';
  readonly type = 'global' as const;
  readonly storeKeyword = 'asos';
  readonly sourceFilter = /asos/i;
  readonly domain = 'asos.com';
  readonly searchUrlTemplate = 'https://www.asos.com/us/search/?q={query}';
  readonly affiliateParamKey = 'affid';
  readonly affiliateEnvKey = 'ASOS_AFFILIATE_ID';
  readonly defaultDeliveryDays = '5-8 Business Days';
  readonly defaultParsedDeliveryDays = 6;
  readonly defaultShippingPrice = 0;
  readonly categories: ProviderCategory[] = ['fashion'];
}
