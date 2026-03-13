/**
 * F071: International localized checkout.
 * F073: Local payment methods.
 * F074: Multi-currency support.
 * F075: Regional price localization.
 * F115: Multilingual checkout.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { convertCurrency } from '@/app/lib/cost-engine/exchange-rate';

const LOCAL_PAYMENT_METHODS: Record<string, { methods: string[]; popularMethod: string }> = {
  US: { methods: ['Credit Card', 'PayPal', 'Apple Pay', 'Google Pay', 'Affirm', 'Klarna'], popularMethod: 'Credit Card' },
  GB: { methods: ['Credit Card', 'PayPal', 'Apple Pay', 'Klarna', 'Open Banking'], popularMethod: 'Credit Card' },
  DE: { methods: ['PayPal', 'Klarna', 'SOFORT', 'Giropay', 'Credit Card', 'SEPA Direct Debit'], popularMethod: 'PayPal' },
  NL: { methods: ['iDEAL', 'Credit Card', 'PayPal', 'Klarna', 'Bancontact'], popularMethod: 'iDEAL' },
  FR: { methods: ['Credit Card', 'PayPal', 'Apple Pay', 'Carte Bancaire'], popularMethod: 'Carte Bancaire' },
  JP: { methods: ['Credit Card', 'Konbini', 'PayPay', 'LINE Pay', 'Bank Transfer'], popularMethod: 'Credit Card' },
  KR: { methods: ['Credit Card', 'KakaoPay', 'Naver Pay', 'Samsung Pay', 'Bank Transfer', 'Virtual Account'], popularMethod: 'Credit Card' },
  CN: { methods: ['Alipay', 'WeChat Pay', 'UnionPay', 'Credit Card'], popularMethod: 'Alipay' },
  BR: { methods: ['PIX', 'Boleto', 'Credit Card (installments)', 'Mercado Pago'], popularMethod: 'PIX' },
  IN: { methods: ['UPI', 'Paytm', 'Net Banking', 'Credit Card', 'Debit Card', 'Cash on Delivery'], popularMethod: 'UPI' },
  MX: { methods: ['OXXO', 'Credit Card', 'SPEI', 'Mercado Pago'], popularMethod: 'Credit Card' },
  SE: { methods: ['Swish', 'Klarna', 'Credit Card', 'Trustly'], popularMethod: 'Swish' },
  AU: { methods: ['Credit Card', 'PayPal', 'Afterpay', 'Apple Pay', 'BPAY'], popularMethod: 'Credit Card' },
  SG: { methods: ['Credit Card', 'PayNow', 'GrabPay', 'Apple Pay'], popularMethod: 'Credit Card' },
  AE: { methods: ['Credit Card', 'Apple Pay', 'Cash on Delivery', 'Tabby'], popularMethod: 'Credit Card' },
};

const COUNTRY_CURRENCIES: Record<string, string> = {
  US: 'USD', GB: 'GBP', EU: 'EUR', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR',
  JP: 'JPY', KR: 'KRW', CN: 'CNY', IN: 'INR', BR: 'BRL', MX: 'MXN', CA: 'CAD',
  AU: 'AUD', SE: 'SEK', NO: 'NOK', DK: 'DKK', CH: 'CHF', SG: 'SGD', HK: 'HKD',
  TH: 'THB', MY: 'MYR', ID: 'IDR', PH: 'PHP', VN: 'VND', TW: 'TWD', AE: 'AED',
  SA: 'SAR', TR: 'TRY', ZA: 'ZAR', PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON',
};

const CHECKOUT_LANGUAGES: Record<string, string> = {
  US: 'en', GB: 'en', DE: 'de', FR: 'fr', IT: 'it', ES: 'es', NL: 'nl', JP: 'ja',
  KR: 'ko', CN: 'zh', BR: 'pt', MX: 'es', IN: 'hi', SE: 'sv', NO: 'nb', DK: 'da',
  FI: 'fi', PL: 'pl', CZ: 'cs', HU: 'hu', RO: 'ro', TR: 'tr', TH: 'th', VN: 'vi',
  ID: 'id', MY: 'ms', AU: 'en', CA: 'en', SG: 'en', AE: 'ar', SA: 'ar',
};

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const country = typeof body.country === 'string' ? body.country.toUpperCase().trim() : '';
  const productPrice = typeof body.productPrice === 'number' ? body.productPrice : undefined;
  const sourceCurrency = typeof body.sourceCurrency === 'string' ? body.sourceCurrency.toUpperCase() : 'USD';

  if (!country || country.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, '"country" required.');

  const localCurrency = COUNTRY_CURRENCIES[country] || 'USD';
  const paymentMethods = LOCAL_PAYMENT_METHODS[country] || { methods: ['Credit Card', 'PayPal'], popularMethod: 'Credit Card' };
  const language = CHECKOUT_LANGUAGES[country] || 'en';

  let localPrice = null;
  let exchangeRate = null;
  if (productPrice && sourceCurrency !== localCurrency) {
    try {
      const conversion = await convertCurrency(productPrice, sourceCurrency, localCurrency);
      if (conversion) {
        localPrice = Math.round(conversion.convertedAmount * 100) / 100;
        exchangeRate = conversion.rate;
      }
    } catch { /* conversion failed */ }
  }

  return apiSuccess({
    country, language,
    currency: { local: localCurrency, source: sourceCurrency, exchangeRate, localPrice, sourcePrice: productPrice || null },
    paymentMethods: paymentMethods.methods,
    recommendedPaymentMethod: paymentMethods.popularMethod,
    checkout: {
      language,
      dateFormat: ['US'].includes(country) ? 'MM/DD/YYYY' : 'DD/MM/YYYY',
      addressFormat: ['JP', 'KR', 'CN'].includes(country) ? 'postal_first' : 'street_first',
      phonePrefix: country === 'US' ? '+1' : country === 'GB' ? '+44' : country === 'KR' ? '+82' : country === 'JP' ? '+81' : null,
    },
    taxDisplay: {
      showTaxInPrice: ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'JP', 'KR', 'AU', 'SG'].includes(country),
      taxLabel: ['AU', 'SG', 'CA', 'IN'].includes(country) ? 'GST' : ['JP'].includes(country) ? 'Consumption Tax' : 'VAT',
    },
  }, { sellerId: context.sellerId, plan: context.planId });
});

export async function GET() { return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { country: "KR", productPrice?: 100, sourceCurrency?: "USD" }'); }
