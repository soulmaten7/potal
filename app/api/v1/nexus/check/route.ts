/**
 * POTAL API v1 — /api/v1/nexus/check
 *
 * US sales tax economic nexus check across 50 states + DC.
 * Demo mode: X-Demo-Request: true (10 req/min/IP)
 *
 * POST /api/v1/nexus/check
 * Body: {
 *   sales: [{ state: "CA", amount: 450000, transactions?: 300 }, ...],
 *   measurementPeriod?: "last_12_months" | "previous_calendar_year" | "current_calendar_year"
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { checkNexus, type StateSale } from '@/lib/nexus/check-nexus';

interface NexusCheckRequest {
  sales?: Array<{ state?: unknown; amount?: unknown; transactions?: unknown }>;
  measurementPeriod?: string;
}

const handler = async (req: NextRequest, _ctx: ApiAuthContext): Promise<Response> => {
  try {
    let body: NexusCheckRequest;
    try {
      body = (await req.json()) as NexusCheckRequest;
    } catch {
      return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
    }

    if (!Array.isArray(body.sales) || body.sales.length === 0) {
      return apiError(
        ApiErrorCode.BAD_REQUEST,
        'sales array is required. Example: { "sales": [{ "state": "CA", "amount": 450000 }] }'
      );
    }

    if (body.sales.length > 51) {
      return apiError(ApiErrorCode.BAD_REQUEST, 'Maximum 51 state entries per request.');
    }

    // Normalize + validate each entry
    const sales: StateSale[] = [];
    for (const entry of body.sales) {
      if (!entry || typeof entry.state !== 'string') {
        return apiError(ApiErrorCode.BAD_REQUEST, 'Each sale entry must include a state code.');
      }
      const amount = Number(entry.amount);
      if (!Number.isFinite(amount) || amount < 0) {
        return apiError(
          ApiErrorCode.BAD_REQUEST,
          `Invalid amount for state ${entry.state}. Must be a non-negative number.`
        );
      }
      const transactions =
        entry.transactions !== undefined && entry.transactions !== null
          ? Number(entry.transactions)
          : undefined;
      if (transactions !== undefined && (!Number.isFinite(transactions) || transactions < 0)) {
        return apiError(
          ApiErrorCode.BAD_REQUEST,
          `Invalid transactions count for state ${entry.state}.`
        );
      }
      sales.push({ state: entry.state.trim().toUpperCase(), amount, transactions });
    }

    const result = checkNexus(sales);

    return apiSuccess({
      ...result,
      measurementPeriod: body.measurementPeriod || 'last_12_months',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return apiError(ApiErrorCode.INTERNAL_ERROR, `Nexus check failed: ${msg}`);
  }
};

export const POST = withApiAuth(handler);

export async function GET() {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST with JSON body: { "sales": [{ "state": "CA", "amount": 450000 }] }'
  );
}
