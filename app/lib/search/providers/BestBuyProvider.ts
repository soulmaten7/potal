/**
 * BestBuyProvider — Serper Google Shopping API 기반
 *
 * 기존 RapidAPI 방식 → Serper 전환 (RapidAPI 500 에러, 2026-02-22)
 * Domestic provider. 배송: 3-7일, $35+ 무료배송
 * 멤버십: My Best Buy Plus ($49.99/yr), Total ($179.99/yr)
 */
import { SerperShoppingProvider, type ProviderCategory } from './SerperShoppingProvider';

export class BestBuyProvider extends SerperShoppingProvider {
  readonly name = 'Best Buy';
  readonly type = 'domestic' as const;
  readonly storeKeyword = 'bestbuy';
  readonly sourceFilter = /best\s*buy/i;
  readonly domain = 'bestbuy.com';
  readonly searchUrlTemplate = 'https://www.bestbuy.com/site/searchpage.jsp?st={query}';
  readonly affiliateParamKey = 'irclickid';
  readonly affiliateEnvKey = 'BESTBUY_AFFILIATE_ID';
  readonly defaultDeliveryDays = '3-7 Business Days';
  readonly defaultParsedDeliveryDays = 5;
  readonly defaultShippingPrice = 0;
  readonly categories: ProviderCategory[] = ['electronics', 'office', 'kitchen'];
  protected override enableDirectUrl = true;
}
