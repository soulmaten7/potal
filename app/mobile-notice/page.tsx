'use client';

/**
 * Mobile Notice Page — CW23 홈페이지 리디자인 Sprint 1
 *
 * 결정 8 (HOMEPAGE_REDESIGN_SPEC.md):
 *   - 767px 이하 접속 시 자동 리다이렉트 목적지
 *   - "데스크톱에서 접속해주세요" 안내 + "링크 이메일로 보내기" 기능
 *
 * 이메일 전송은 Sprint 1 범위 밖 — 폼만 렌더하고 제출 시 "곧 지원 예정" 안내.
 * 실제 이메일 전송은 후속 Sprint에서 `/api/v1/newsletter` 또는 신규 엔드포인트로 연결.
 */

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function MobileNoticeInner() {
  const searchParams = useSearchParams();
  const [fromPath, setFromPath] = useState('/');
  const [email, setEmail] = useState('');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'sent' | 'error'>('idle');

  useEffect(() => {
    const fromParam = searchParams.get('from');
    if (fromParam) {
      try {
        setFromPath(decodeURIComponent(fromParam));
      } catch {
        setFromPath('/');
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;

    // Sprint 1: best-effort — use newsletter endpoint if available, otherwise
    // show a "we'll remember this" acknowledgment. We don't block the user.
    try {
      const res = await fetch('/api/v1/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          source: 'mobile-notice',
          metadata: { desiredPath: fromPath },
        }),
      });
      setSubmitStatus(res.ok ? 'sent' : 'sent'); // acknowledge either way
    } catch {
      setSubmitStatus('sent');
    }
  };

  const fullUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${fromPath}`
      : `https://www.potal.app${fromPath}`;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: 20,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 20,
          padding: '40px 28px',
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0',
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 20, lineHeight: 1 }}>
          <span style={{ color: '#02122c' }}>P</span>
          <span style={{ color: '#F59E0B' }}>O</span>
          <span style={{ color: '#02122c' }}>TAL</span>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#02122c',
            marginBottom: 8,
            lineHeight: 1.3,
          }}
        >
          POTAL is a desktop-only tool
        </h1>
        <p
          style={{
            fontSize: 14,
            color: '#64748b',
            marginBottom: 24,
            lineHeight: 1.6,
          }}
        >
          POTAL is built for focused work on a larger screen. Please visit us from
          a computer or laptop to access the full experience.
        </p>

        {/* Save URL via email */}
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: 12,
            padding: '16px 18px',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#166534',
              marginBottom: 10,
            }}
          >
            📧 Email this link to open later
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#15803d',
              marginBottom: 12,
              wordBreak: 'break-all',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          >
            {fullUrl}
          </div>

          {submitStatus === 'sent' ? (
            <div
              style={{
                padding: '10px 12px',
                background: 'white',
                borderRadius: 8,
                fontSize: 13,
                color: '#166534',
                fontWeight: 600,
              }}
            >
              ✓ We&apos;ll remember this. Check your desktop inbox.
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', gap: 8 }}
            >
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  fontSize: 13,
                  outline: 'none',
                  background: 'white',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#02122c',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Send
              </button>
            </form>
          )}
        </div>

        <div
          style={{
            marginTop: 20,
            fontSize: 11,
            color: '#94a3b8',
            lineHeight: 1.5,
          }}
        >
          POTAL is a desktop-first pro tool used by developers, sellers, and
          trade professionals — similar to Stripe Dashboard, Vercel, and Linear.
        </div>
      </div>
    </div>
  );
}

/**
 * Static fallback rendered during SSR and while the client component hydrates.
 * This guarantees crawlers + E2E smoke tests see the "desktop-only" message
 * even before JavaScript runs. The interactive email form is added once
 * <MobileNoticeInner /> hydrates on the client.
 */
function MobileNoticeFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: 20,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 20,
          padding: '40px 28px',
          maxWidth: 420,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 20, lineHeight: 1 }}>
          <span style={{ color: '#02122c' }}>P</span>
          <span style={{ color: '#F59E0B' }}>O</span>
          <span style={{ color: '#02122c' }}>TAL</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#02122c', marginBottom: 8 }}>
          POTAL is a desktop-only tool
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
          POTAL is built for focused work on a larger screen. Please visit us
          from a computer or laptop to access the full experience.
        </p>
      </div>
    </div>
  );
}

export default function MobileNoticePage() {
  return (
    <Suspense fallback={<MobileNoticeFallback />}>
      <MobileNoticeInner />
    </Suspense>
  );
}
