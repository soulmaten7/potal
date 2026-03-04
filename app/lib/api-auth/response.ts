/**
 * POTAL API Response Helpers
 *
 * Standardized response format for all /api/v1/* endpoints.
 *
 * Success: { success: true, data: {...}, meta: { requestId, processingMs } }
 * Error:   { success: false, error: { code, message, details? } }
 */

export enum ApiErrorCode {
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  PLAN_LIMIT_EXCEEDED = 'PLAN_LIMIT_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

const ERROR_STATUS_MAP: Record<ApiErrorCode, number> = {
  [ApiErrorCode.BAD_REQUEST]: 400,
  [ApiErrorCode.UNAUTHORIZED]: 401,
  [ApiErrorCode.FORBIDDEN]: 403,
  [ApiErrorCode.NOT_FOUND]: 404,
  [ApiErrorCode.RATE_LIMITED]: 429,
  [ApiErrorCode.PLAN_LIMIT_EXCEEDED]: 429,
  [ApiErrorCode.INTERNAL_ERROR]: 500,
};

/**
 * Create a standardized success response.
 */
export function apiSuccess(data: unknown, meta?: Record<string, unknown>): Response {
  return Response.json(
    {
      success: true,
      data,
      meta: {
        ...meta,
        timestamp: new Date().toISOString(),
      },
    },
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Create a standardized error response.
 */
export function apiError(
  code: ApiErrorCode,
  message: string,
  details?: unknown
): Response {
  const status = ERROR_STATUS_MAP[code] || 500;
  return Response.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
