'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const LEVELS = [
  {
    name: 'Bronze',
    title: 'HS Classification Specialist',
    color: '#CD7F32',
    icon: '🥉',
    requirements: ['Complete Getting Started track', 'Classify 20 products correctly', 'Pass HS Classification exam (80%+)'],
    examTopics: ['6-digit HS Code structure', 'GRI rules of interpretation', 'Section & Chapter notes', 'Material-based classification'],
    examDuration: '30 minutes',
    questions: 25,
  },
  {
    name: 'Silver',
    title: 'Trade Compliance Professional',
    color: '#C0C0C0',
    icon: '🥈',
    requirements: ['Hold Bronze certification', 'Complete Advanced Compliance track', 'Pass Full Compliance exam (85%+)', '50+ successful calculations'],
    examTopics: ['Denied party screening', 'FTA utilization', 'De minimis rules', 'Country restrictions', 'Export controls (ECCN)', 'Customs documentation'],
    examDuration: '45 minutes',
    questions: 40,
  },
  {
    name: 'Gold',
    title: 'Enterprise Integration Architect',
    color: '#FFD700',
    icon: '🥇',
    requirements: ['Hold Silver certification', 'Complete API Integration track', 'Pass Enterprise Integration exam (90%+)', 'Implement 1 live integration'],
    examTopics: ['REST API design patterns', 'Webhook implementation', 'Batch processing optimization', 'White-label configuration', 'SSO & team management', 'Rate limit strategies', 'Error handling & retry logic', 'Performance benchmarking'],
    examDuration: '60 minutes',
    questions: 50,
  },
];

export default function CertificationPage() {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>CERTIFICATION</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Certification Program</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, marginBottom: 36 }}>Validate your trade compliance expertise with POTAL certifications.</p>

        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 20, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👤</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Your Certifications</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>No certifications earned yet. Start with Bronze!</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {LEVELS.map((level, i) => {
            const isSelected = selectedLevel === i;
            return (
              <div key={level.name} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, border: isSelected ? `2px solid ${level.color}` : '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                <button onClick={() => setSelectedLevel(isSelected ? null : i)}
                  style={{ width: '100%', padding: '24px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', border: `3px solid ${level.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0, background: `${level.color}15` }}>{level.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: level.color, marginBottom: 2 }}>{level.name}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{level.title}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{level.questions} questions · {level.examDuration}</div>
                  </div>
                  <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.3)', transform: isSelected ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
                </button>
                {isSelected && (
                  <div style={{ padding: '0 24px 24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <h4 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 10 }}>Requirements</h4>
                        {level.requirements.map((r, j) => <div key={j} style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'flex', alignItems: 'flex-start', gap: 6 }}><span style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>☐</span> {r}</div>)}
                      </div>
                      <div>
                        <h4 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 10 }}>Exam Topics</h4>
                        {level.examTopics.map((t, j) => <div key={j} style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>• {t}</div>)}
                      </div>
                    </div>
                    <button style={{ marginTop: 16, padding: '12px 32px', borderRadius: 10, border: 'none', background: level.color, color: '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Start Exam</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
