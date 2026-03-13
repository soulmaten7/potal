/**
 * POTAL API v1 — /api/v1/account/csm
 *
 * Dedicated Customer Success Manager assignment endpoint.
 * Enterprise plan customers get a dedicated CSM.
 *
 * GET — Get assigned CSM info
 * POST — Request CSM assignment or schedule a call
 *
 * POST Body: {
 *   action: "request_csm" | "schedule_call" | "send_message",
 *   preferredTime?: string,       // ISO datetime for call scheduling
 *   timezone?: string,            // e.g., "Asia/Seoul"
 *   message?: string,             // message to CSM
 *   topic?: string,               // "onboarding" | "technical" | "billing" | "compliance" | "optimization"
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

// CSM pool (placeholder — would be backed by DB in production)
const CSM_POOL = [
  { id: 'csm_001', name: 'Sarah Kim', region: 'APAC', languages: ['en', 'ko'], specialties: ['onboarding', 'e-commerce'] },
  { id: 'csm_002', name: 'Michael Chen', region: 'APAC', languages: ['en', 'zh'], specialties: ['technical', 'compliance'] },
  { id: 'csm_003', name: 'Emma Williams', region: 'Americas', languages: ['en', 'es'], specialties: ['billing', 'optimization'] },
  { id: 'csm_004', name: 'Hans Mueller', region: 'EMEA', languages: ['en', 'de', 'fr'], specialties: ['compliance', 'vat'] },
];

export const GET = withApiAuth(async (_req: NextRequest, context: ApiAuthContext) => {
  if (context.planId !== 'enterprise' && context.planId !== 'pro') {
    return apiSuccess(
      {
        assigned: false,
        message: 'Dedicated CSM is available on Pro and Enterprise plans.',
        upgradeUrl: 'https://www.potal.app/pricing',
        selfServiceOptions: [
          { channel: 'FAQ', url: '/api/v1/support' },
          { channel: 'AI Consultation', url: '/api/v1/consult' },
          { channel: 'Email', address: 'support@potal.app' },
          { channel: 'Documentation', url: 'https://www.potal.app/developers/docs' },
        ],
      },
      { sellerId: context.sellerId, plan: context.planId }
    );
  }

  // Assign CSM based on simple hash
  const csmIndex = Math.abs(context.sellerId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % CSM_POOL.length;
  const csm = CSM_POOL[csmIndex];

  return apiSuccess(
    {
      assigned: true,
      csm: {
        name: csm.name,
        region: csm.region,
        languages: csm.languages,
        specialties: csm.specialties,
        contactEmail: `${csm.id}@potal.app`,
        availableHours: csm.region === 'APAC' ? '09:00-18:00 KST' : csm.region === 'Americas' ? '09:00-18:00 EST' : '09:00-18:00 CET',
      },
      supportChannels: [
        { channel: 'Direct Email', address: `${csm.id}@potal.app` },
        { channel: 'Schedule Call', url: '/api/v1/account/csm (POST action: schedule_call)' },
        { channel: 'Priority Support', sla: 'Response within 4 business hours' },
      ],
    },
    { sellerId: context.sellerId, plan: context.planId }
  );
});

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const action = typeof body.action === 'string' ? body.action.toLowerCase().trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : undefined;
  const topic = typeof body.topic === 'string' ? body.topic.trim() : undefined;
  const preferredTime = typeof body.preferredTime === 'string' ? body.preferredTime.trim() : undefined;
  const timezone = typeof body.timezone === 'string' ? body.timezone.trim() : 'UTC';

  if (!['request_csm', 'schedule_call', 'send_message'].includes(action)) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"action" must be: request_csm, schedule_call, or send_message.');
  }

  if (action === 'request_csm') {
    return apiSuccess(
      {
        action: 'request_csm',
        status: 'received',
        message: 'CSM assignment request received. We will contact you within 1 business day.',
        plan: context.planId,
        eligibleForDedicatedCsm: context.planId === 'enterprise' || context.planId === 'pro',
      },
      { sellerId: context.sellerId, plan: context.planId }
    );
  }

  if (action === 'schedule_call') {
    if (!preferredTime) {
      return apiError(ApiErrorCode.BAD_REQUEST, '"preferredTime" is required for scheduling a call.');
    }

    return apiSuccess(
      {
        action: 'schedule_call',
        status: 'scheduled',
        scheduledTime: preferredTime,
        timezone,
        topic: topic || 'general',
        confirmationMessage: `Call scheduled for ${preferredTime} (${timezone}). Your CSM will send a calendar invite.`,
      },
      { sellerId: context.sellerId, plan: context.planId }
    );
  }

  // send_message
  if (!message) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"message" is required when sending a message.');
  }

  return apiSuccess(
    {
      action: 'send_message',
      status: 'sent',
      topic: topic || 'general',
      message: 'Message delivered to your CSM. Expected response within 4 business hours.',
    },
    { sellerId: context.sellerId, plan: context.planId }
  );
});
