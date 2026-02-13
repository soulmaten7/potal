// components/common/LanguageModal.tsx
"use client";
import { Icons } from '../icons';

export function LanguageModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"><Icons.X className="w-6 h-6"/></button>
        <h2 className="text-xl font-bold text-[#02122c] mb-6">Region & Currency Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Region</label>
            <select className="w-full p-3 border border-slate-300 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-[#02122c] outline-none">
              <option value="US">🇺🇸 United States</option>
              <option disabled>🇰🇷 South Korea (Coming Soon)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Currency</label>
            <select className="w-full p-3 border border-slate-300 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-[#02122c] outline-none">
              <option value="USD">$ USD - US Dollar</option>
              <option disabled>₩ KRW - Korean Won (Coming Soon)</option>
            </select>
          </div>
        </div>

        <button onClick={onClose} className="w-full mt-8 bg-[#02122c] text-white font-bold py-3.5 rounded-xl hover:bg-[#1a2b4b] transition-colors">
          Save Settings
        </button>
      </div>
    </div>
  );
}