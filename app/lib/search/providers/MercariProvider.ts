/**
 * MercariProvider — Serper Google Shopping API 기반
 * Domestic provider. 배송: 3-4일, 판매자별 상이
 */
import { SerperShoppingProvider, type ProviderCategory } from './SerperShoppingProvider';

export class MercariProvider extends SerperShoppingProvider {
  readonly name = 'Mercari';
  readonly type = 'domestic' as const;
  readonly storeKeyword = 'mercari';
  readonly sourceFilter = /mercari/i;
  readonly domain = 'mercari.com';
  readonly searchUrlTemplate = 'https://www.mercari.com/search/?keyword={query}';
  readonly affiliateParamKey = 'affid';
  readonly affiliateEnvKey = 'MERCARI_AFFILIATE_ID';
  readonly defaultDeliveryDays = '3-4 Business Days';
  readonly defaultParsedDeliveryDays = 4;
  readonly defaultShippingPrice = 0;
  readonly categories: ProviderCategory[] = ['general'];
  protected override enableDirectUrl = true;
}
