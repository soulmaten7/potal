"use client";

import React from 'react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-[400px] rounded-3xl p-8 shadow-2xl relative text-center animate-scaleIn">
        
        {/* Illustration (Simple Icon Placeholder) */}
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🔔</span>
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-2">Get deals, tips, and alerts</h2>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          Now you've signed in, stay one step ahead with POTAL's AI price drops and shipping updates.
        </p>

        <div className="space-y-3">
          <button onClick={onClose} className="w-full py-3 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/30">
            Yes, please
          </button>
          <button onClick={onClose} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
            Maybe later
          </button>
        </div>

        <p className="mt-6 text-[10px] text-gray-400">
          You can unsubscribe anytime in your Profile.
        </p>
      </div>
    </div>
  );
}