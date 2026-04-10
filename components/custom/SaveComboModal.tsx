'use client';

/**
 * SaveComboModal — CW26 Sprint 4
 *
 * "Save this combo" 클릭 시 이름/설명 입력 모달.
 * role="dialog", aria-modal, ESC/바깥클릭/X 닫기.
 */

import { useEffect, useRef, useState } from 'react';

interface SaveComboModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => Promise<void>;
  featureCount: number;
}

export default function SaveComboModal({ open, onClose, onSave, featureCount }: SaveComboModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName('');
    setDescription('');
    setError('');
    setSaving(false);
    setTimeout(() => inputRef.current?.focus(), 100);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = orig;
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await onSave(name.trim(), description.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setSaving(false);
    }
  };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-combo-title"
        className="w-full max-w-[440px] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 id="save-combo-title" className="text-[16px] font-extrabold text-[#02122c]">
            Save your combination
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <span aria-hidden="true" className="text-[16px]">×</span>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="text-[12px] text-slate-500">{featureCount} feature{featureCount !== 1 ? 's' : ''} selected</div>

          <div>
            <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Name *</label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Etsy export setup"
              maxLength={100}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-[14px] focus:outline-none focus:border-[#F59E0B]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Description (optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What is this combo for?"
              rows={2}
              maxLength={300}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:border-[#F59E0B] resize-none"
            />
          </div>

          {error && <div className="text-[12px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold text-slate-600 hover:bg-slate-200">Cancel</button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim() || saving}
            className={`px-5 py-2 rounded-lg text-[13px] font-bold transition-colors ${
              !name.trim() || saving
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-[#02122c] text-white hover:bg-[#0a1e3d]'
            }`}
          >
            {saving ? 'Saving…' : 'Save combo'}
          </button>
        </div>
      </div>
    </div>
  );
}
