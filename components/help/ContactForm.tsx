"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../icons';

export function ContactForm({ initialTopic }: { initialTopic: string }) {
  const [topic, setTopic] = useState(initialTopic);
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // URL이 바뀌거나 새로 들어왔을 때 토픽 동기화
  useEffect(() => {
    setTopic(initialTopic);
  }, [initialTopic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);
    try {
      await fetch(`https://formsubmit.co/ajax/${encodeURIComponent('contact@potal.app')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          topic: formData.get('topic'),
          name: formData.get('name'),
          email: formData.get('email'),
          message: formData.get('message'),
          _subject: `POTAL Contact: ${formData.get('topic')}`,
        }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100 text-center">
        <div className="text-4xl mb-4">&#10003;</div>
        <h3 className="text-xl font-bold text-[#02122c] mb-2">Message Sent!</h3>
        <p className="text-slate-500">We will reply within 24 hours to your email.</p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100 flex flex-col gap-6">
      
      {/* Topic Selection (Auto-Selected) */}
      <div>
        <label className="block text-sm font-bold text-[#02122c] mb-2">Topic</label>
        <div className="relative">
          <select
            name="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full h-14 pl-4 pr-10 rounded-xl border border-slate-200 outline-none focus:border-[#02122c] focus:ring-1 focus:ring-[#02122c] appearance-none bg-slate-50 text-slate-700 font-bold"
          >
            <option value="general">General Inquiry</option>
            <option value="partner">Selling on POTAL (Partnership)</option>
            <option value="ads">Advertising Inquiry</option>
            <option value="order">Order Issue (Delivery, Refund)</option>
            <option value="tech">Technical Support</option>
          </select>
          <Icons.ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Name & Email (Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-[#02122c] mb-2">Name</label>
          <input type="text" name="name" placeholder="Your Name" className="w-full h-14 px-4 rounded-xl border border-slate-200 outline-none focus:border-[#02122c] focus:ring-1 focus:ring-[#02122c] bg-slate-50" required />
        </div>
        <div>
          <label className="block text-sm font-bold text-[#02122c] mb-2">Email</label>
          <input type="email" name="email" placeholder="email@example.com" className="w-full h-14 px-4 rounded-xl border border-slate-200 outline-none focus:border-[#02122c] focus:ring-1 focus:ring-[#02122c] bg-slate-50" required />
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-bold text-[#02122c] mb-2">Message</label>
        <textarea
          name="message"
          rows={5}
          placeholder="How can we help you?"
          className="w-full p-4 rounded-xl border border-slate-200 outline-none focus:border-[#02122c] focus:ring-1 focus:ring-[#02122c] resize-none bg-slate-50"
          required
        ></textarea>
      </div>

      {/* Submit Button */}
      <button type="submit" className="w-full h-14 bg-[#02122c] text-white font-extrabold text-lg rounded-xl hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 mt-2">
        Send Message <Icons.ArrowRight className="w-5 h-5" />
      </button>

      <p className="text-center text-xs text-slate-400">
        Replies will be sent from <span className="font-bold text-[#02122c]">contact@potal.app</span>
      </p>
    </form>
  );
}