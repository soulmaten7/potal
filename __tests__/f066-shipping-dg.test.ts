/**
 * F066: Dangerous Goods Shipping Tests
 */
import { checkDangerousGoods, CARRIER_RULES } from '../app/lib/shipping/dangerous-goods';

describe('F066 Dangerous Goods Shipping', () => {
  test('lithium battery (850760) → UN3481 Class 9', () => {
    const r = checkDangerousGoods('850760');
    expect(r.isDangerous).toBe(true);
    expect(r.unMapping?.unNumber).toBe('UN3481');
    expect(r.unMapping?.hazardClass).toBe('9');
  });

  test('USPS rejects all DG internationally', () => {
    const r = checkDangerousGoods('850760');
    expect(r.rejectedCarriers).toContain('usps');
    const usps = CARRIER_RULES.find(c => c.carrier === 'usps');
    expect(usps?.acceptsClasses).toHaveLength(0);
  });

  test('non-DG item (610910 cotton t-shirt) → not dangerous', () => {
    const r = checkDangerousGoods('610910');
    expect(r.isDangerous).toBe(false);
    expect(r.unMapping).toBeNull();
    expect(r.acceptingCarriers.length).toBe(CARRIER_RULES.length);
  });
});
