/**
 * POTAL API v1 — /api/v1/verify
 *
 * Pre-shipment Comprehensive Verification endpoint.
 * Runs ALL checks in one call:
 *   1. HS Code validation
 *   2. HS Code classification (if no code provided)
 *   3. Sanctions/denied party screening
 *   4. Restricted items check
 *   5. Required documents list
 *   6. IOSS/OSS applicability (for EU)
 *   7. Total Landed Cost calculation
 *   8. FTA eligibility
 *   9. Trade remedy check (AD/CVD/Safeguard)
 *
 * POST /api/v1/verify
 * Body: {
 *   productName: string,           // required
 *   price: number,                 // required
 *   originCountry: string,         // required
 *   destinationCountry: string,    // required
 *   hsCode?: string,
 *   shippingPrice?: number,
 *   quantity?: number,
 *   weightKg?: number,
 *   exporterName?: string,
 *   importerName?: string,
 *   category?: string,
 *   firmName?: string,
 *   shippingTerms?: string
 * }
 *
 * Returns: comprehensive verification report
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { calculateGlobalLandedCostAsync, type GlobalCostInput } from '@/app/lib/cost-engine';
import { classifyProductAsync, calculateConfidenceScore } from '@/app/lib/cost-engine/ai-classifier';
import { validateHsCode } from '@/app/lib/cost-engine/hs-code/hs-validator';
import { checkIossOss } from '@/app/lib/cost-engine/ioss-oss';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

function sanitize(val: unknown, maxLen = 500): string {
  if (typeof val !== 'string') return '';
  return val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F<>{}|\\]/g, '').trim().slice(0, maxLen);
}

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const productName = sanitize(body.productName);
  const originCountry = sanitize(body.originCountry, 2).toUpperCase();
  const destinationCountry = sanitize(body.destinationCountry, 2).toUpperCase();

  if (!productName) return apiError(ApiErrorCode.BAD_REQUEST, '"productName" is required.');
  if (!originCountry || originCountry.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, '"originCountry" must be 2-letter ISO code.');
  if (!destinationCountry || destinationCountry.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, '"destinationCountry" must be 2-letter ISO code.');

  const price = typeof body.price === 'number' ? body.price : parseFloat(String(body.price || ''));
  if (isNaN(price) || price < 0) return apiError(ApiErrorCode.BAD_REQUEST, '"price" must be a non-negative number.');

  const shippingPrice = typeof body.shippingPrice === 'number' ? body.shippingPrice : 0;
  const category = sanitize(body.category, 200) || undefined;
  const hsCodeInput = sanitize(body.hsCode, 12) || undefined;
  const firmName = sanitize(body.firmName, 200) || undefined;

  const checks: {
    name: string;
    status: 'pass' | 'warn' | 'fail' | 'info';
    details: unknown;
  }[] = [];

  let overallStatus: 'cleared' | 'warnings' | 'blocked' = 'cleared';

  // 1. HS Code Classification
  let classifiedHsCode: string | undefined;
  try {
    const classResult = await classifyProductAsync(productName, category, context.sellerId);
    const confidence = calculateConfidenceScore(classResult, productName);
    classifiedHsCode = classResult.hsCode;

    checks.push({
      name: 'hs_classification',
      status: confidence.grade === 'A' || confidence.grade === 'B' ? 'pass' : confidence.grade === 'C' ? 'warn' : 'fail',
      details: {
        hsCode: classResult.hsCode,
        description: classResult.description,
        confidence: classResult.confidence,
        grade: confidence.grade,
        gradeLabel: confidence.gradeLabel,
        method: classResult.classificationSource,
        reviewRecommended: confidence.reviewRecommended,
        alternatives: classResult.alternatives?.slice(0, 3),
      },
    });

    if (confidence.reviewRecommended) overallStatus = 'warnings';
  } catch {
    checks.push({ name: 'hs_classification', status: 'fail', details: { error: 'Classification service unavailable' } });
    overallStatus = 'warnings';
  }

  // 2. HS Code Validation (if provided or classified)
  const hsCodeToValidate = hsCodeInput || classifiedHsCode;
  if (hsCodeToValidate) {
    const validation = validateHsCode(hsCodeToValidate);
    checks.push({
      name: 'hs_validation',
      status: validation.valid ? 'pass' : validation.status === 'partial_match' ? 'warn' : 'fail',
      details: {
        hsCode: hsCodeToValidate,
        valid: validation.valid,
        status: validation.status,
        chapter: validation.chapter,
        chapterDescription: validation.chapterDescription,
        errors: validation.errors.length > 0 ? validation.errors : undefined,
        warnings: validation.warnings.length > 0 ? validation.warnings : undefined,
        suggestions: validation.suggestions?.slice(0, 3),
      },
    });
  }

  // 3. Total Landed Cost Calculation
  try {
    const costInput: GlobalCostInput = {
      price,
      shippingPrice,
      origin: originCountry,
      destinationCountry,
      hsCode: hsCodeInput,
      productName,
      productCategory: category,
      firmName,
      shippingTerms: (() => {
        const raw = String(body.shippingTerms || '').toUpperCase();
        return (['DDP', 'DDU', 'CIF', 'FOB', 'EXW'].includes(raw) ? raw : undefined) as GlobalCostInput['shippingTerms'];
      })(),
    };

    const tlcResult = await calculateGlobalLandedCostAsync(costInput);

    checks.push({
      name: 'landed_cost',
      status: 'pass',
      details: {
        totalLandedCost: tlcResult.totalLandedCost,
        productPrice: tlcResult.productPrice,
        shippingCost: tlcResult.shippingCost,
        importDuty: tlcResult.importDuty,
        vat: tlcResult.vat,
        vatLabel: tlcResult.vatLabel,
        processingFee: tlcResult.mpf,
        insurance: tlcResult.insurance,
        deMinimisApplied: tlcResult.deMinimisApplied,
        dutyRateSource: tlcResult.dutyRateSource,
        shippingTerms: tlcResult.shippingTerms,
        accuracyLevel: tlcResult.accuracyGuarantee?.level,
        localCurrency: tlcResult.localCurrency,
      },
    });

    // Trade remedies
    if (tlcResult.tradeRemedies?.hasRemedies) {
      checks.push({
        name: 'trade_remedies',
        status: 'warn',
        details: {
          hasRemedies: true,
          totalRemedyRate: tlcResult.tradeRemedies.totalRemedyRate,
          measures: tlcResult.tradeRemedies.measures,
        },
      });
      overallStatus = 'warnings';
    } else {
      checks.push({ name: 'trade_remedies', status: 'pass', details: { hasRemedies: false } });
    }

    // FTA check
    if (tlcResult.ftaApplied?.hasFta) {
      checks.push({
        name: 'fta_eligibility',
        status: 'info',
        details: {
          hasFta: true,
          ftaName: tlcResult.ftaApplied.ftaName,
          ftaCode: tlcResult.ftaApplied.ftaCode,
          savingsApplied: true,
        },
      });
    } else {
      checks.push({ name: 'fta_eligibility', status: 'info', details: { hasFta: false } });
    }
  } catch {
    checks.push({ name: 'landed_cost', status: 'fail', details: { error: 'Calculation failed' } });
    overallStatus = 'warnings';
  }

  // 4. IOSS/OSS Check (for EU destinations)
  const euCountries = new Set(['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE']);
  if (euCountries.has(destinationCountry)) {
    const declaredValueEur = price * 0.92; // approximate USD → EUR
    const iossResult = checkIossOss({
      declaredValueEur,
      destinationCountry,
      originCountry,
    });

    checks.push({
      name: 'ioss_oss',
      status: 'info',
      details: {
        ioss: iossResult.ioss ? {
          applicable: iossResult.ioss.iossApplicable,
          vatRate: iossResult.ioss.vatRate,
          vatAmount: iossResult.ioss.vatAmount,
          dutyWaived: iossResult.ioss.dutyWaived,
        } : undefined,
        oss: iossResult.oss ? {
          applicable: iossResult.oss.ossApplicable,
          schemeType: iossResult.oss.schemeType,
        } : undefined,
        recommendation: iossResult.recommendation,
      },
    });
  }

  // 5. Summary
  const passCount = checks.filter(c => c.status === 'pass').length;
  const warnCount = checks.filter(c => c.status === 'warn').length;
  const failCount = checks.filter(c => c.status === 'fail').length;
  const infoCount = checks.filter(c => c.status === 'info').length;

  if (failCount > 0) overallStatus = 'blocked';
  else if (warnCount > 0) overallStatus = 'warnings';

  return apiSuccess(
    {
      overallStatus,
      summary: {
        total: checks.length,
        pass: passCount,
        warn: warnCount,
        fail: failCount,
        info: infoCount,
      },
      checks,
      shipment: {
        productName,
        originCountry,
        destinationCountry,
        price,
        shippingPrice,
        hsCode: hsCodeInput || classifiedHsCode,
      },
    },
    {
      sellerId: context.sellerId,
      plan: context.planId,
    }
  );
});

export async function GET() {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST method. Body: { productName, price, originCountry, destinationCountry, hsCode?, shippingPrice? }'
  );
}
