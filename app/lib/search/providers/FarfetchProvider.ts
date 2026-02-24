/**
 * FarfetchProvider — Serper Google Shopping API 기반
 * Global(International) provider. 유럽 부티크→미국 배송.
 * 배송: 2-5일, Access 멤버 무료배송
 */
import { SerperShoppingProvider, type ProviderCategory } from './SerperShoppingProvider';

export class FarfetchProvider extends SerperShoppingProvider {
  readonly name = 'Farfetch';
  readonly type = 'global' as const;
  readonly storeKeyword = 'farfetch';
  readonly sourceFilter = /farfetch/i;
  readonly domain = 'farfetch.com';
  readonly searchUrlTemplate = 'https://www.farfetch.com/shopping/search/items.aspx?q={query}';
  readonly affiliateParamKey = 'affid';
  readonly affiliateEnvKey = 'FARFETCH_AFFILIATE_ID';
  readonly defaultDeliveryDays = '2-5 Business Days';
  readonly defaultParsedDeliveryDays = 3;
  readonly defaultShippingPrice = 0;
  readonly categories: ProviderCategory[] = ['fashion'];
}
