'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('potal-cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('potal-cookie-consent', 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem('potal-cookie-consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: '#02122c',
      color: 'white',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      flexWrap: 'wrap',
      fontSize: 14,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
    }}>
      <span style={{ maxWidth: 600 }}>
        We use essential cookies and analytics to improve your experience.{' '}
        <Link
          href="/legal/cookie-policy"
          style={{ color: '#F59E0B', textDecoration: 'underline' }}
        >
          Cookie Policy
        </Link>
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={decline}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.3)',
            background: 'transparent',
            color: 'white',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Decline
        </button>
        <button
          onClick={accept}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: 'none',
            background: '#F59E0B',
            color: '#02122c',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
