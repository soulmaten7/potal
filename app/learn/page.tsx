'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const bg = '#0a1e3d';
const accent = '#E8640A';

const TRACKS = [
  {
    id: 'beginner',
    icon: '🚀',
    title: 'Getting Started',
    level: 'Beginner',
    description: 'Set up your account, get your API key, and make your first landed cost calculation.',
    lessons: 5,
    duration: '30 min',
    topics: ['Account setup', 'API key generation', 'First API call', 'Widget installation', 'Understanding results'],
  },
  {
    id: 'intermediate',
    icon: '⚡',
    title: 'API Integration',
    level: 'Intermediate',
    description: 'Deep dive into the REST API, batch processing, webhooks, and error handling.',
    lessons: 8,
    duration: '1.5 hrs',
    topics: ['REST API endpoints', 'Authentication', 'Batch classification', 'Webhooks', 'Rate limits', 'Error handling', 'SDK usage', 'Testing'],
  },
  {
    id: 'advanced',
    icon: '🛡️',
    title: 'Advanced Compliance',
    level: 'Advanced',
    description: 'Master trade compliance: sanctions screening, FTA optimization, customs documentation.',
    lessons: 10,
    duration: '3 hrs',
    topics: ['Denied party screening', 'FTA detection', 'Origin determination', 'Export controls', 'Customs docs', 'DDP vs DDU', 'Safeguard duties', 'Audit trails', 'White-label', 'Enterprise setup'],
  },
];

const RESOURCES = [
  { title: 'API Quick Start Guide', href: '/developers/quickstart', tag: 'GUIDE' },
  { title: 'Full API Documentation', href: '/developers/docs', tag: 'DOCS' },
  { title: 'Widget Playground', href: '/developers/playground', tag: 'TOOL' },
  { title: 'HS Code Lookup Tool', href: '/tools/hs-lookup', tag: 'TOOL' },
  { title: 'Batch Classification', href: '/tools/batch', tag: 'TOOL' },
  { title: 'Certification Program', href: '/certification', tag: 'CERT' },
];

export default function LearnPage() {
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>LEARNING</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Learning Hub</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, marginBottom: 36 }}>Master POTAL through structured learning tracks — from first API call to enterprise compliance.</p>

        {/* Learning Tracks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 40 }}>
          {TRACKS.map(track => {
            const isExpanded = expandedTrack === track.id;
            return (
              <div key={track.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, border: isExpanded ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                <button onClick={() => setExpandedTrack(isExpanded ? null : track.id)}
                  style={{ width: '100%', padding: '20px 24px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 32 }}>{track.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 18, fontWeight: 700 }}>{track.title}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: track.level === 'Beginner' ? 'rgba(74,222,128,0.15)' : track.level === 'Intermediate' ? 'rgba(96,165,250,0.15)' : 'rgba(168,85,247,0.15)', color: track.level === 'Beginner' ? '#4ade80' : track.level === 'Intermediate' ? '#60a5fa' : '#a855f7' }}>{track.level}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{track.description}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{track.lessons} lessons</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{track.duration}</div>
                  </div>
                </button>
                {/* Progress bar */}
                <div style={{ padding: '0 24px 4px' }}>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)' }}>
                    <div style={{ height: '100%', width: '0%', borderRadius: 2, background: accent }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>0% complete</div>
                </div>
                {isExpanded && (
                  <div style={{ padding: '12px 24px 20px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 10 }}>Topics Covered</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {track.topics.map((topic, i) => (
                        <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: 'rgba(255,255,255,0.25)' }}>○</span> {topic}
                        </div>
                      ))}
                    </div>
                    <button style={{ marginTop: 14, padding: '10px 24px', borderRadius: 8, border: 'none', background: accent, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Start Track</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Resources */}
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Recommended Resources</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {RESOURCES.map(r => (
              <Link key={r.href} href={r.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', color: '#fff', fontSize: 14, fontWeight: 500 }}>
                <span>{r.title}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(232,100,10,0.2)', color: accent }}>{r.tag}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
