"use client";

import React, { useState } from 'react';
import { Icons } from '@/components/icons';

const CONTACT_TYPES = [
  { id: 'general', label: 'General Inquiry', icon: '💬' },
  { id: 'partner', label: 'Partnership / API', icon: '🤝' },
  { id: 'bug', label: 'Bug Report', icon: '🐛' },
  { id: 'feedback', label: 'Product Feedback', icon: '💡' },
];

export default function ContactPage() {
  const [type, setType] = useState('general');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, name, email, message }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-2xl font-extrabold text-[#02122c] mb-3">Message Sent</h2>
          <p className="text-slate-500 mb-8">Thank you for reaching out. We'll get back to you within 24 hours.</p>
          <a href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-[#02122c] text-white font-bold rounded-xl hover:bg-[#F59E0B] transition-colors">
            <Icons.ArrowRight className="w-4 h-4 rotate-180" /> Back to POTAL
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-20">
      {/* Hero */}
      <section className="bg-[#02122c] text-white pt-32 pb-16">
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">Contact Us</h1>
          <p className="text-slate-300 text-lg">Have a question, partnership idea, or feedback? We'd love to hear from you.</p>
        </div>
      </section>

      {/* Form */}
      <section className="max-w-[640px] mx-auto px-6 -mt-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 space-y-6">
          {/* Type Selector */}
          <div>
            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 block">Inquiry Type</label>
            <div className="grid grid-cols-2 gap-2">
              {CONTACT_TYPES.map(ct => (
                <button
                  key={ct.id}
                  type="button"
                  onClick={() => setType(ct.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    type === ct.id
                      ? 'border-[#02122c] bg-[#02122c]/5 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-lg mr-2">{ct.icon}</span>
                  <span className="text-sm font-bold text-[#02122c]">{ct.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[#02122c] font-medium focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 focus:border-[#F59E0B]"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[#02122c] font-medium focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 focus:border-[#F59E0B]"
            />
          </div>

          {/* Message */}
          <div>
            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
              rows={5}
              placeholder="Tell us what's on your mind..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[#02122c] font-medium resize-none focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 focus:border-[#F59E0B]"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 text-center bg-red-50 rounded-xl px-4 py-2">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={sending}
            className="w-full py-3.5 bg-[#02122c] hover:bg-[#F59E0B] text-white font-bold rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : 'Send Message'} {!sending && <Icons.ArrowRight className="w-4 h-4" />}
          </button>

          <p className="text-xs text-slate-400 text-center">
            By submitting, you agree to our <a href="/legal/privacy" className="underline hover:text-[#02122c]">Privacy Policy</a>.
          </p>
        </form>
      </section>
    </div>
  );
}
