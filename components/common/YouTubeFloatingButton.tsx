'use client';

/**
 * YouTube Floating Button — 우하단 고정 YouTube 가이드 버튼
 *
 * Crisp 채팅 위젯 자리를 대체.
 * 방문자가 POTAL 사용법을 영상으로 바로 볼 수 있도록 YouTube 채널로 연결.
 */

import { useState } from 'react';

export function YouTubeFloatingButton() {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const playlists = [
    { icon: '🎯', label: 'Quick Start', url: 'https://youtube.com/@POTAL-Official' },
    { icon: '🌍', label: 'Real Scenarios', url: 'https://youtube.com/@POTAL-Official' },
    { icon: '🔧', label: 'Features', url: 'https://youtube.com/@POTAL-Official' },
    { icon: '💻', label: 'Developers', url: 'https://youtube.com/@POTAL-Official' },
  ];

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
      {/* Expanded menu */}
      {isExpanded && (
        <div
          style={{
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            animation: 'fadeInUp 0.2s ease-out',
          }}
        >
          <div style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Video Guides
          </div>
          {playlists.map((p, i) => (
            <a
              key={i}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                borderRadius: 10,
                textDecoration: 'none',
                color: '#02122c',
                fontSize: 14,
                fontWeight: 600,
                transition: 'background 0.15s',
                background: 'transparent',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </a>
          ))}
          <a
            href="https://youtube.com/@POTAL-Official"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 10,
              background: '#FF0000',
              color: 'white',
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              marginTop: 4,
            }}
          >
            View All Videos →
          </a>
        </div>
      )}

      {/* Main floating button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Video Guides"
        style={{
          width: isHovered ? 'auto' : 56,
          height: 56,
          borderRadius: 28,
          border: 'none',
          background: isExpanded ? '#cc0000' : '#FF0000',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: isHovered ? '0 20px 0 16px' : '0',
          boxShadow: '0 4px 20px rgba(255, 0, 0, 0.3)',
          transition: 'all 0.25s ease',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        {isExpanded ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.5.6c-1 .3-1.7 1.1-2 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1 1 1.8 2 2.1 1.9.6 9.5.6 9.5.6s7.6 0 9.5-.6c1-.3 1.7-1.1 2-2.1.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>
        )}
        {isHovered && !isExpanded && (
          <span style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>Video Guides</span>
        )}
      </button>

      {/* CSS animation */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
