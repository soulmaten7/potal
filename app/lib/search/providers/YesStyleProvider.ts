/**
 * YesStyleProvider — Serper Google Shopping API 기반
 * Global(International) provider. 홍콩→미국 배송.
 * 배송: 7-14일, K-뷰티/아시아 패션
 */
import { SerperShoppingProvider, type ProviderCategory } from './SerperShoppingProvider';

export class YesStyleProvider extends SerperShoppingProvider {
  readonly name = 'YesStyle';
  readonly type = 'global' as const;
  readonly storeKeyword = 'yesstyle';
  readonly sourceFilter = /yes\s*style/i;
  readonly domain = 'yesstyle.com';
  readonly searchUrlTemplate = 'https://www.yesstyle.com/en/search?q={query}';
  readonly affiliateParamKey = 'affid';
  readonly affiliateEnvKey = 'YESSTYLE_AFFILIATE_ID';
  readonly defaultDeliveryDays = '7-14 Business Days';
  readonly defaultParsedDeliveryDays = 10;
  readonly defaultShippingPrice = 0;
  readonly categories: ProviderCategory[] = ['beauty', 'fashion'];
}
