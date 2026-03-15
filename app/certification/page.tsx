'use client';

import { useState } from 'react';

const levels = [
  {
    name: 'POTAL Certified Associate',
    description: 'Foundational knowledge of cross-border trade compliance, HS classification basics, and POTAL API usage.',
    topics: ['HS Code fundamentals', 'Landed cost components', 'API integration basics', 'Widget installation'],
    color: 'bg-blue-100 text-blue-700',
  },
  {
    name: 'POTAL Certified Professional',
    description: 'Advanced compliance, FTA optimization, multi-country tax strategies, and enterprise integration patterns.',
    topics: ['FTA utilization', 'Rules of Origin', 'Trade remedies (AD/CVD)', 'Batch processing & webhooks', 'Multi-country strategies'],
    color: 'bg-purple-100 text-purple-700',
  },
  {
    name: 'POTAL Certified Expert',
    description: 'Expert-level mastery of global trade compliance, data architecture, and AI-driven classification systems.',
    topics: ['AI classification pipeline', 'Regulatory RAG systems', 'Custom integrations', 'Enterprise architecture', 'Compliance auditing'],
    color: 'bg-amber-100 text-amber-700',
  },
];

export default function CertificationPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      const res = await fetch('/api/v1/certification/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || 'Something went wrong.');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Network error. Please try again.');
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">POTAL Certification Program</h1>
      <p className="text-gray-600 mb-10">
        Validate your expertise in cross-border trade compliance and POTAL platform mastery.
      </p>

      {/* Certification Levels */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Certification Levels</h2>
        <div className="space-y-6">
          {levels.map((level) => (
            <div key={level.name} className="border rounded-lg p-6 bg-white">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${level.color}`}>
                  {level.name}
                </span>
              </div>
              <p className="text-gray-600 mb-4">{level.description}</p>
              <div className="flex flex-wrap gap-2">
                {level.topics.map((t) => (
                  <span key={t} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Why Get Certified?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Career Growth', desc: 'Stand out in the growing cross-border commerce industry.' },
            { title: 'Partner Badge', desc: 'Display your certification on your company profile.' },
            { title: 'Early Access', desc: 'Certified members get early access to new features and beta programs.' },
          ].map((b) => (
            <div key={b.title} className="border rounded-lg p-5 bg-white">
              <h3 className="font-semibold text-gray-900 mb-1">{b.title}</h3>
              <p className="text-sm text-gray-500">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Waitlist */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">Join the Waitlist</h2>
        <p className="text-blue-100 mb-6">
          The certification program is launching soon. Be the first to know when enrollment opens.
        </p>
        {submitted ? (
          <div className="bg-white/10 rounded-lg p-4">
            <p className="font-medium">You are on the list! We will notify you when the program launches.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 px-4 py-2 rounded-lg text-gray-900 placeholder-gray-400"
            />
            <button
              type="submit"
              className="bg-white text-blue-700 px-6 py-2 rounded-lg font-medium hover:bg-blue-50"
            >
              Join Waitlist
            </button>
          </form>
        )}
        {error && <p className="text-red-200 mt-2 text-sm">{error}</p>}
      </section>
    </div>
  );
}
