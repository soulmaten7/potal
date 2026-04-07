import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const DST_RATES: Record<string, { rate: number; threshold?: string; name: string }> = {
  FR: { rate: 3, threshold: '€750M global / €25M France', name: 'Taxe sur les services numériques' },
  GB: { rate: 2, threshold: '£500M global / £25M UK', name: 'Digital Services Tax' },
  IT: { rate: 3, threshold: '€750M global / €5.5M Italy', name: 'Imposta sui servizi digitali' },
  ES: { rate: 3, threshold: '€750M global / €3M Spain', name: 'Impuesto sobre Determinados Servicios Digitales' },
  AT: { rate: 5, threshold: '€750M global / €25M Austria', name: 'Digitalsteuer' },
  TR: { rate: 7.5, threshold: '€750M global / TRY 20M Turkey', name: 'Digital Hizmet Vergisi' },
  IN: { rate: 2, threshold: 'INR 2Cr India revenue', name: 'Equalisation Levy' },
  KR: { rate: 0, name: 'No DST (under OECD Pillar One discussion)' },
  CA: { rate: 3, threshold: 'CAD 20M Canada / €750M global', name: 'Digital Services Tax' },
};

const handler = async (req: NextRequest, _ctx: ApiAuthContext): Promise<Response> => {
  try {
    const body = await req.json().catch(() => ({}));
    const { serviceType, revenue, sellerCountry, buyerCountry } = body as Record<string, string | number>;

    if (!buyerCountry) {
      return apiError(ApiErrorCode.BAD_REQUEST, 'buyerCountry is required.');
    }

    const country = String(buyerCountry).toUpperCase();
    const dst = DST_RATES[country];
    const revenueNum = typeof revenue === 'number' ? revenue : parseFloat(String(revenue)) || 0;

    if (!dst || dst.rate === 0) {
      return apiSuccess({
        buyerCountry: country,
        sellerCountry: sellerCountry ? String(sellerCountry).toUpperCase() : undefined,
        serviceType: serviceType || 'digital_advertising',
        dstApplicable: false,
        rate: 0,
        taxAmount: 0,
        note: dst?.name || 'No Digital Services Tax in this jurisdiction.',
      });
    }

    const taxAmount = revenueNum > 0 ? Math.round(revenueNum * dst.rate) / 100 : 0;

    return apiSuccess({
      buyerCountry: country,
      sellerCountry: sellerCountry ? String(sellerCountry).toUpperCase() : undefined,
      serviceType: serviceType || 'digital_advertising',
      dstApplicable: true,
      taxName: dst.name,
      rate: dst.rate,
      rateFormatted: `${dst.rate}%`,
      revenue: revenueNum,
      taxAmount,
      threshold: dst.threshold || 'N/A',
    });
  } catch (err) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, `DST calculation failed: ${err instanceof Error ? err.message : String(err)}`);
  }
};

export const POST = withApiAuth(handler);
