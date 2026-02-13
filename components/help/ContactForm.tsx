"use client";

import React, { useState, useEffect } from 'react';
import { Icons } from '../icons';

export function ContactForm({ initialTopic }: { initialTopic: string }) {
  const [topic, setTopic] = useState(initialTopic);
  
  // URL이 바뀌거나 새로 들어왔을 때 토픽 동기화
  useEffect(() => {
    setTopic(initialTopic);
  }, [initialTopic]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Message sent! We will contact you shortly.");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100 flex flex-col gap-6">
      
      {/* Topic Selection (Auto-Selected) */}
      <div>
        <label className="block text-sm font-bold text-[#02122c] mb-2">Topic</label>
        <div className="relative">
          <select 
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
          <input type="text" placeholder="Your Name" className="w-full h-14 px-4 rounded-xl border border-slate-200 outline-none focus:border-[#02122c] focus:ring-1 focus:ring-[#02122c] bg-slate-50" required />
        </div>
        <div>
          <label className="block text-sm font-bold text-[#02122c] mb-2">Email</label>
          <input type="email" placeholder="email@example.com" className="w-full h-14 px-4 rounded-xl border border-slate-200 outline-none focus:border-[#02122c] focus:ring-1 focus:ring-[#02122c] bg-slate-50" required />
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-bold text-[#02122c] mb-2">Message</label>
        <textarea 
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