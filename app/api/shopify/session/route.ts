import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

/**
 * Shopify Session Token Verification Endpoint
 *
 * Verifies the JWT session token provided by Shopify App Bridge.
 * Used for embedded app authentication instead of traditional OAuth.
 *
 * POST /api/shopify/session
 * Headers: Authorization: Bearer <session_token>
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing session token' },
        { status: 401 }
      );
    }

    const sessionToken = authHeader.replace('Bearer ', '');
    const decoded = verifyShopifySessionToken(sessionToken);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid session token' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      shop: decoded.dest,
      iss: decoded.iss,
      sub: decoded.sub,
    });
  } catch (error) {
    console.error('[Shopify Session] Verification error:', error);
    return NextResponse.json(
      { error: 'Session verification failed' },
      { status: 500 }
    );
  }
}

/**
 * Verify Shopify session token (JWT).
 *
 * Shopify session tokens are JWTs signed with the app's secret key.
 * Claims: iss (shop admin URL), dest (shop URL), aud (client_id),
 *         sub (user ID), exp, nbf, iat, jti, sid
 */
function verifyShopifySessionToken(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

    // Verify algorithm
    if (header.alg !== 'HS256') return null;

    // Verify audience (should be our client_id)
    const clientId = process.env.SHOPIFY_API_KEY || '2fa34ed65342ffb7fac08dd916f470b8';
    if (payload.aud !== clientId) return null;

    // Verify expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;

    // Verify signature with SHOPIFY_API_SECRET
    const secret = process.env.SHOPIFY_API_SECRET;
    if (secret) {
      const signatureInput = `${parts[0]}.${parts[1]}`;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(signatureInput)
        .digest('base64url');

      if (parts[2] !== expectedSignature) {
        console.warn('[Shopify Session] Signature mismatch');
        return null;
      }
    }

    return payload;
  } catch (error) {
    console.error('[Shopify Session] Token parse error:', error);
    return null;
  }
}
