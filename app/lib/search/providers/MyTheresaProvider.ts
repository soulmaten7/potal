/**
 * MyTheresaProvider — Serper Google Shopping API 기반
 * Global(International) provider. 독일→미국 배송 (DHL/FedEx).
 * 배송: 1-3일, $300-500+ 무료배송, 럭셔리 패션
 */
import { SerperShoppingProvider, type ProviderCategory } from './SerperShoppingProvider';

export class MyTheresaProvider extends SerperShoppingProvider {
  readonly name = 'MyTheresa';
  readonly type = 'global' as const;
  readonly storeKeyword = 'mytheresa';
  readonly sourceFilter = /mytheresa/i;
  readonly domain = 'mytheresa.com';
  readonly searchUrlTemplate = 'https://www.mytheresa.com/en-us/catalogsearch/result/?q={query}';
  readonly affiliateParamKey = 'affid';
  readonly affiliateEnvKey = 'MYTHERESA_AFFILIATE_ID';
  readonly defaultDeliveryDays = '1-3 Business Days';
  readonly defaultParsedDeliveryDays = 2;
  readonly defaultShippingPrice = 0;
  readonly categories: ProviderCategory[] = ['fashion'];
}
