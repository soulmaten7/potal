/**
 * POTAL API v1 — /api/v1/agent
 *
 * AI Agent integration endpoint.
 *
 * GET  /api/v1/agent         — Get tool definitions (OpenAI/Anthropic format)
 * POST /api/v1/agent         — Execute a tool call
 *
 * GET query params:
 *   ?format=openai (default) | anthropic
 *
 * POST body:
 *   { name: "potal_calculate_landed_cost", arguments: { ... } }
 *   OR
 *   { calls: [{ name: "...", arguments: {...} }, ...] }  // batch mode
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { getOpenAiTools, getAnthropicTools, executeToolCall } from '@/app/lib/agent-sdk';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

// ─── GET: Tool Definitions ──────────────────────────

export const GET = withApiAuth(async (req: NextRequest, _context: ApiAuthContext) => {
  const url = new URL(req.url);
  const format = url.searchParams.get('format') || 'openai';

  if (format === 'anthropic') {
    return apiSuccess({
      format: 'anthropic',
      tools: getAnthropicTools(),
    });
  }

  return apiSuccess({
    format: 'openai',
    tools: getOpenAiTools(),
  });
});

// ─── POST: Execute Tool Call(s) ─────────────────────

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  // Batch mode: { calls: [...] }
  if (Array.isArray(body.calls)) {
    if (body.calls.length > 10) {
      return apiError(ApiErrorCode.BAD_REQUEST, 'Maximum 10 tool calls per batch.');
    }

    const results = [];
    for (const call of body.calls) {
      if (!call || typeof call !== 'object' || !call.name) {
        results.push({ success: false, error: 'Invalid tool call format.' });
        continue;
      }
      try {
        const result = await executeToolCall(
          { name: String(call.name), arguments: (call.arguments || {}) as Record<string, unknown> },
          context.sellerId
        );
        results.push(result);
      } catch (err) {
        console.error('[agent] Batch tool call error:', err instanceof Error ? err.message : err);
        results.push({ success: false, error: 'Tool execution failed.' });
      }
    }

    return apiSuccess({ results }, {
      sellerId: context.sellerId,
      plan: context.planId,
      mode: 'batch',
      callCount: body.calls.length,
    });
  }

  // Single mode: { name: "...", arguments: {...} }
  const name = typeof body.name === 'string' ? body.name : '';
  if (!name) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Provide "name" (tool name) and "arguments" (tool parameters). Or use batch mode: { calls: [...] }');
  }

  const args = (body.arguments && typeof body.arguments === 'object')
    ? body.arguments as Record<string, unknown>
    : {};

  let result;
  try {
    result = await executeToolCall({ name, arguments: args }, context.sellerId);
  } catch (err) {
    console.error('[agent] Tool execution error:', err instanceof Error ? err.message : err);
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Tool execution failed. Please try again.');
  }

  if (!result.success) {
    return apiError(ApiErrorCode.BAD_REQUEST, result.error || 'Tool execution failed.');
  }

  return apiSuccess(result.data, {
    sellerId: context.sellerId,
    plan: context.planId,
    tool: name,
  });
});
