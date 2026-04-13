'use client';

import { useState } from 'react';
import { MATERIAL_OPTIONS, CATEGORY_OPTIONS, MATERIAL_TO_CATEGORIES } from '@/lib/playground/dropdown-options';
import { SearchableSelect } from './SearchableSelect';

interface HsCodeCalculatorProps {
  onResult: (hsCode: string) => void;
  onClose: () => void;
}

export function HsCodeCalculator({ onResult, onClose }: HsCodeCalculatorProps) {
  const [productName, setProductName] = useState('');
  const [material, setMaterial] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [processing, setProcessing] = useState('');
  const [composition, setComposition] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ hsCode: string; description: string; confidence: number } | null>(null);
  const [error, setError] = useState('');

  const filteredCategories = material && MATERIAL_TO_CATEGORIES[material]?.length
    ? CATEGORY_OPTIONS.filter(o => MATERIAL_TO_CATEGORIES[material].includes(o.value))
    : CATEGORY_OPTIONS;

  const handleClassify = async () => {
    if (!productName.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const body: Record<string, string> = { productName: productName.trim() };
      if (material) body.material = material;
      if (category) body.category = category;
      if (description) body.description = description;
      if (processing) body.processing = processing;
      if (composition) body.composition = composition;

      const res = await fetch('/api/v1/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success && data.data?.hsCode) {
        setResult({
          hsCode: data.data.hsCode,
          description: data.data.description || '',
          confidence: data.data.confidence || 0,
        });
      } else {
        setError(data.error?.message || 'Classification failed');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleUse = () => {
    if (result) {
      onResult(result.hsCode);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-[500px] mx-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="text-[16px] font-extrabold text-[#02122c]">HS Code Calculator</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {/* Fields */}
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-[12px] font-bold text-[#02122c] mb-1">Product Name</label>
            <input
              type="text"
              value={productName}
              onChange={e => setProductName(e.target.value)}
              placeholder="Cotton T-shirt"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:border-[#F59E0B]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-[#02122c] mb-1">Material</label>
            <SearchableSelect
              options={MATERIAL_OPTIONS}
              value={material}
              onChange={val => { setMaterial(val); setCategory(''); }}
              placeholder="Select material"
            />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-[#02122c] mb-1">Category</label>
            <SearchableSelect
              options={filteredCategories}
              value={category}
              onChange={setCategory}
              placeholder="Select category"
            />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-[#02122c] mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Function or intended use"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:border-[#F59E0B]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-[#02122c] mb-1">Processing</label>
              <input
                type="text"
                value={processing}
                onChange={e => setProcessing(e.target.value)}
                placeholder="knitted, dyed"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:border-[#F59E0B]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#02122c] mb-1">Composition</label>
              <input
                type="text"
                value={composition}
                onChange={e => setComposition(e.target.value)}
                placeholder="100% cotton"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:border-[#F59E0B]"
              />
            </div>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="mx-5 mb-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[14px] font-bold text-emerald-700 font-mono">{result.hsCode}</span>
                <span className="text-[11px] text-emerald-600 ml-2">({Math.round(result.confidence * 100)}%)</span>
              </div>
              <button
                type="button"
                onClick={handleUse}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[12px] font-bold hover:bg-emerald-600"
              >
                Use this code
              </button>
            </div>
            {result.description && (
              <p className="text-[11px] text-emerald-600 mt-1">{result.description}</p>
            )}
          </div>
        )}
        {error && (
          <div className="mx-5 mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-[12px] text-red-600">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px] text-slate-500 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleClassify}
            disabled={!productName.trim() || loading}
            className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-colors ${
              loading || !productName.trim()
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-[#F59E0B] text-[#02122c] hover:bg-[#e8930a]'
            }`}
          >
            {loading ? 'Classifying...' : 'Classify'}
          </button>
        </div>
      </div>
    </div>
  );
}
