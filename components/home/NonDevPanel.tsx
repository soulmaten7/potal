'use client';

/**
 * NonDevPanel — CW24 Sprint 2 (left 50%)
 *
 * 결정 4 (HOMEPAGE_REDESIGN_SPEC.md 248~257):
 *   - 시나리오별 인터랙티브 데모 폼
 *   - Calculate → /api/demo/scenario POST
 *   - 결과 카드 (HS code / Restriction / Landed cost breakdown)
 *   - 각 입력/결과 필드 옆에 [📋] 버튼 → CodeCopyModal
 *   - Sprint 2 에서는 로그인 게이트 없음 (Sprint 5 에서 추가)
 */

import { useState } from 'react';
import { getMockResult, type MockResult } from '@/lib/scenarios/mock-results';
import { COUNTRY_DATA } from '@/app/lib/cost-engine/country-data';
import { useFeatureGate } from '@/lib/auth/feature-gate';
import LoginRequiredModal from '@/components/modals/LoginRequiredModal';
import CodeCopyModal from './CodeCopyModal';
import PartnerLinkSlot from './PartnerLinkSlot';
import MultiCountryPicker from './MultiCountryPicker';

export type NonDevInputValue = string | number | string[];

export interface NonDevPanelProps {
  scenarioId: string;
  /** CW31: lifted state so DevPanel code snippets see the same inputs. */
  inputs?: Record<string, NonDevInputValue>;
  onInputsChange?: (next: Record<string, NonDevInputValue>) => void;
}

interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect';
  placeholder?: string;
  defaultValue?: string | number;
  options?: Array<{ value: string; label: string }>;
  unit?: string;
  /** CW31-HF1: cap for multiselect fields */
  max?: number;
}

// CW31 "Honest Reset": full ISO3166-1 alpha-2 country list (240 countries)
// derived from COUNTRY_DATA. Matches whatever the real cost engine supports —
// no more "I can only test 10 countries" limitation.
const COUNTRY_OPTIONS = Object.values(COUNTRY_DATA)
  .map(c => ({ value: c.code, label: c.name }))
  .sort((a, b) => a.label.localeCompare(b.label));

// CW30-HF2: empty placeholder option for country/select dropdowns
const COUNTRY_OPTIONS_WITH_PLACEHOLDER = [
  { value: '', label: 'Select country…' },
  ...COUNTRY_OPTIONS,
];

// CW30-HF2: all defaultValue removed. Users start from an empty form and type
// their own inputs — no need to clear pre-filled values first. Placeholders
// provide illustrative hints only.
const SCENARIO_FIELDS: Record<string, FieldDef[]> = {
  seller: [
    { key: 'product', label: 'Product', type: 'text', placeholder: 'e.g. Handmade leather wallet' },
    { key: 'from', label: 'From', type: 'select', options: COUNTRY_OPTIONS_WITH_PLACEHOLDER },
    { key: 'to', label: 'To', type: 'select', options: COUNTRY_OPTIONS_WITH_PLACEHOLDER },
    { key: 'value', label: 'Declared value', type: 'number', placeholder: '45', unit: 'USD' },
  ],
  d2c: [
    { key: 'product', label: 'Product', type: 'text', placeholder: 'e.g. Organic cotton T-shirt' },
    { key: 'from', label: 'From', type: 'select', options: COUNTRY_OPTIONS_WITH_PLACEHOLDER },
    { key: 'to', label: 'To', type: 'select', options: COUNTRY_OPTIONS_WITH_PLACEHOLDER },
    { key: 'value', label: 'Unit value', type: 'number', placeholder: '28', unit: 'USD' },
    { key: 'quantity', label: 'Quantity', type: 'number', placeholder: '500', unit: 'units' },
  ],
  importer: [
    { key: 'product', label: 'Product', type: 'text', placeholder: 'e.g. Industrial centrifugal pumps' },
    { key: 'from', label: 'From', type: 'select', options: COUNTRY_OPTIONS_WITH_PLACEHOLDER },
    { key: 'to', label: 'To', type: 'select', options: COUNTRY_OPTIONS_WITH_PLACEHOLDER },
    { key: 'value', label: 'Shipment value', type: 'number', placeholder: '85000', unit: 'USD' },
    {
      key: 'container',
      label: 'Container',
      type: 'select',
      options: [
        { value: '', label: 'Select container…' },
        { value: '20ft', label: '20ft' },
        { value: '40ft', label: '40ft' },
        { value: '40hc', label: '40ft HC' },
      ],
    },
  ],
  exporter: [
    { key: 'product', label: 'Product', type: 'text', placeholder: 'e.g. Lithium-ion battery cells' },
    { key: 'from', label: 'From', type: 'select', options: COUNTRY_OPTIONS_WITH_PLACEHOLDER },
    { key: 'to', label: 'To', type: 'select', options: COUNTRY_OPTIONS_WITH_PLACEHOLDER },
    { key: 'value', label: 'Shipment value', type: 'number', placeholder: '250000', unit: 'USD' },
  ],
  forwarder: [
    { key: 'product', label: 'Product type', type: 'text', placeholder: 'e.g. Cotton T-shirts (batch)' },
    { key: 'from', label: 'Origin', type: 'select', options: COUNTRY_OPTIONS_WITH_PLACEHOLDER },
    {
      key: 'destinations',
      label: 'Destinations (max 5)',
      type: 'multiselect',
      options: COUNTRY_OPTIONS,
      max: 5,
      unit: 'countries',
    },
    { key: 'value', label: 'Value per shipment', type: 'number', placeholder: '12000', unit: 'USD' },
  ],
};

const SCENARIO_TITLES: Record<string, { title: string; question: string }> = {
  seller: {
    title: 'Online Seller demo',
    question: 'How much margin am I keeping?',
  },
  d2c: {
    title: 'D2C Brand demo',
    question: 'Which country gets me the best landed cost?',
  },
  importer: {
    title: 'Importer demo',
    question: 'What is my full container cost in KRW?',
  },
  exporter: {
    title: 'Exporter demo',
    question: 'What will my buyer actually pay?',
  },
  forwarder: {
    title: 'Forwarder / 3PL demo',
    question: 'Can I calculate on behalf of my clients at scale?',
  },
};

interface ModalState {
  open: boolean;
  fieldType: 'input' | 'result';
  fieldKey: string;
  fieldValue?: string | number;
}

function fmtCurrency(n: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: n >= 1000 ? 0 : 2,
  }).format(n);
}

function CopyBadge({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Copy code for this field"
      className="flex-none w-7 h-7 flex items-center justify-center rounded-md bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-[#F59E0B] transition-colors"
      title="Copy this as code"
    >
      <span aria-hidden="true" className="text-[12px]">📋</span>
    </button>
  );
}

export default function NonDevPanel({
  scenarioId,
  inputs: inputsProp,
  onInputsChange,
}: NonDevPanelProps) {
  const fields = SCENARIO_FIELDS[scenarioId] || [];
  const meta = SCENARIO_TITLES[scenarioId] || {
    title: 'Demo',
    question: 'Try POTAL live.',
  };

  // CW31: if parent lifted state, use it. Otherwise fall back to local state
  // (preserves standalone usage if another page mounts NonDevPanel directly).
  const [localInputs, setLocalInputs] = useState<Record<string, NonDevInputValue>>(() => {
    const init: Record<string, NonDevInputValue> = {};
    for (const f of fields) {
      if (f.type === 'multiselect') init[f.key] = [];
      else init[f.key] = f.defaultValue !== undefined ? f.defaultValue : '';
    }
    return init;
  });
  const inputs = inputsProp && Object.keys(inputsProp).length > 0 ? inputsProp : localInputs;
  const setInputs = (
    updater: (prev: Record<string, NonDevInputValue>) => Record<string, NonDevInputValue>
  ) => {
    const next = updater(inputs);
    if (onInputsChange) onInputsChange(next);
    else setLocalInputs(next);
  };
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MockResult | null>(null);
  const [source, setSource] = useState<'mock' | 'live' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({
    open: false,
    fieldType: 'input',
    fieldKey: '',
  });
  const { requireLogin, loginRequired, closeLoginRequired, featureLabel } = useFeatureGate();

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/demo/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId, inputs }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Demo failed');
      }
      setResult(json.data.result as MockResult);
      setSource(json.data.source as 'mock' | 'live');
    } catch {
      // Never break the UI — fall back to the bundled mock for this scenario.
      const fallback = getMockResult(scenarioId);
      if (fallback) {
        setResult(fallback);
        setSource('mock');
      } else {
        setError('Demo temporarily unavailable. Please try again in a moment.');
      }
    } finally {
      setLoading(false);
    }
  };

  const openCopyModal = (fieldType: 'input' | 'result', fieldKey: string, fieldValue?: string | number) => {
    if (!requireLogin('code copy')) return;
    setModal({ open: true, fieldType, fieldKey, fieldValue });
  };

  const closeModal = () => setModal(m => ({ ...m, open: false }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[18px]" aria-hidden="true">📊</span>
          <h3 className="text-[16px] font-extrabold text-[#02122c]">
            {meta.title}
          </h3>
        </div>
        <p className="text-[12px] italic text-slate-500 leading-relaxed">
          &ldquo;{meta.question}&rdquo;
        </p>
      </div>

      {/* Inputs */}
      <div className="px-6 py-5 space-y-3">
        {fields.map(f => (
          <div key={f.key} className="flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                {f.label}
              </label>
              {f.type === 'multiselect' ? (
                <MultiCountryPicker
                  selected={Array.isArray(inputs[f.key]) ? (inputs[f.key] as string[]) : []}
                  options={f.options || []}
                  max={f.max ?? 5}
                  onChange={next => setInputs(v => ({ ...v, [f.key]: next }))}
                />
              ) : f.type === 'select' ? (
                <select
                  value={typeof inputs[f.key] === 'string' || typeof inputs[f.key] === 'number' ? String(inputs[f.key]) : ''}
                  onChange={e => setInputs(v => ({ ...v, [f.key]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] bg-white focus:outline-none focus:border-[#F59E0B]"
                >
                  {(f.options || []).map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <div className="relative">
                  <input
                    type={f.type}
                    value={typeof inputs[f.key] === 'string' || typeof inputs[f.key] === 'number' ? String(inputs[f.key]) : ''}
                    onChange={e =>
                      setInputs(v => ({
                        ...v,
                        [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value,
                      }))
                    }
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:border-[#F59E0B]"
                  />
                  {f.unit && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-semibold pointer-events-none">
                      {f.unit}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="pt-5">
              <CopyBadge onClick={() => {
                const v = inputs[f.key];
                const display = Array.isArray(v) ? v.join(',') : v;
                openCopyModal('input', f.key, display);
              }} />
            </div>
          </div>
        ))}

        {(() => {
          // CW30-HF2: Calculate 버튼 활성화 조건 — 모든 필드 채워져야 활성
          // CW31-HF1: multiselect 는 배열 길이 > 0 로 판정
          const allFilled = fields.every(f => {
            const v = inputs[f.key];
            if (f.type === 'multiselect') return Array.isArray(v) && v.length > 0;
            return v !== undefined && v !== '' && v !== null;
          });
          const disabled = loading || !allFilled;
          return (
            <button
              type="button"
              onClick={handleCalculate}
              disabled={disabled}
              className={`w-full mt-2 py-3 rounded-lg font-bold text-[14px] transition-colors ${
                loading
                  ? 'bg-slate-300 text-white cursor-wait'
                  : !allFilled
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#02122c] text-white hover:bg-[#0a1e3d]'
              }`}
            >
              {loading ? 'Calculating…' : 'Calculate landed cost'}
            </button>
          );
        })()}

        {error && (
          <div className="mt-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-[12px] text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="px-6 pb-6 border-t border-slate-100 pt-4 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Result {source === 'mock' ? '· Demo data' : ''}
            </div>
            <CopyBadge onClick={() => openCopyModal('result', 'total', result.landedCost.total)} />
          </div>

          {/* HS code */}
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-[11px] text-slate-500">HS Code</div>
              <div className="text-[13px] font-bold font-mono text-[#02122c]">
                {result.hsCode}
              </div>
              <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                {result.hsDescription}
              </div>
            </div>
            <CopyBadge onClick={() => openCopyModal('result', 'hs_code', result.hsCode)} />
          </div>

          {/* Restriction */}
          <div className="flex items-center justify-between py-2 border-t border-slate-200">
            <div>
              <div className="text-[11px] text-slate-500">Restriction</div>
              <div
                className={`text-[13px] font-bold ${
                  result.restriction.blocked ? 'text-red-600' : 'text-emerald-600'
                }`}
              >
                {result.restriction.blocked ? '❌ Blocked' : '✓ Allowed'}
              </div>
              <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                {result.restriction.summary}
              </div>
              {result.restriction.license && (
                <div className="text-[11px] text-amber-700 leading-tight mt-0.5">
                  ⚠️ {result.restriction.license}
                </div>
              )}
            </div>
            <CopyBadge onClick={() => openCopyModal('result', 'restriction', result.restriction.summary)} />
          </div>

          {/* Landed cost breakdown */}
          <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-[11px] text-slate-500 mb-2 font-bold uppercase tracking-wide">
              Landed cost breakdown
            </div>
            <dl className="space-y-1.5 text-[12px]">
              <div className="flex justify-between">
                <dt className="text-slate-600">Product value</dt>
                <dd className="font-mono">{fmtCurrency(result.landedCost.productValue, result.landedCost.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">
                  Duty ({(result.landedCost.dutyRate * 100).toFixed(1)}%)
                </dt>
                <dd className="font-mono">{fmtCurrency(result.landedCost.duty, result.landedCost.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Taxes</dt>
                <dd className="font-mono">{fmtCurrency(result.landedCost.taxes, result.landedCost.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Shipping</dt>
                <dd className="font-mono">{fmtCurrency(result.landedCost.shipping, result.landedCost.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Fees</dt>
                <dd className="font-mono">{fmtCurrency(result.landedCost.fees, result.landedCost.currency)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                <dt className="font-bold text-[#02122c]">Total landed cost</dt>
                <dd className="font-mono font-extrabold text-[14px] text-[#02122c]">
                  {fmtCurrency(result.landedCost.total, result.landedCost.currency)}
                </dd>
              </div>
            </dl>

            {result.extras && Object.keys(result.extras).length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                {Object.entries(result.extras).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[11px] text-slate-500">
                    <span className="capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-mono">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CW31-HF1: forwarder destination comparison table */}
          {result.comparisonRows && result.comparisonRows.length > 0 && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-[11px] text-slate-500 mb-3 font-bold uppercase tracking-wide">
                Destination comparison ({result.comparisonRows.length} routes)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="pb-2 font-bold">Destination</th>
                      <th className="pb-2 font-bold text-right">Duty</th>
                      <th className="pb-2 font-bold text-right">FTA</th>
                      <th className="pb-2 font-bold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...result.comparisonRows]
                      .sort((a, b) => a.total - b.total)
                      .map((row, idx) => (
                        <tr
                          key={row.destination}
                          className={`border-t border-slate-100 ${
                            idx === 0 ? 'bg-emerald-50/50' : ''
                          }`}
                        >
                          <td className="py-2 font-bold">
                            {idx === 0 && (
                              <span className="text-emerald-600 mr-1">★</span>
                            )}
                            {row.destination}
                          </td>
                          <td className="py-2 text-right font-mono">
                            {fmtCurrency(row.duty, 'USD')}
                          </td>
                          <td className="py-2 text-right text-[11px] text-slate-500">
                            {row.ftaName || '—'}
                          </td>
                          <td
                            className={`py-2 text-right font-mono font-bold ${
                              idx === 0 ? 'text-emerald-700' : 'text-[#02122c]'
                            }`}
                          >
                            {fmtCurrency(row.total, 'USD')}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="text-[11px] text-slate-400 mt-2">
                ★ Cheapest route highlighted
              </div>
            </div>
          )}

          {result.notes.length > 0 && (
            <ul className="mt-3 space-y-1 text-[11px] text-slate-500">
              {result.notes.map((n, i) => (
                <li key={i} className="flex gap-1.5">
                  <span aria-hidden="true" className="text-slate-400">·</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          )}

          {/* CW28-S6: Partner link slot — only when result is shown (natural extension of calculation) */}
          <PartnerLinkSlot />
        </div>
      )}

      <CodeCopyModal
        open={modal.open}
        onClose={closeModal}
        scenarioId={scenarioId}
        fieldType={modal.fieldType}
        fieldKey={modal.fieldKey}
        fieldValue={modal.fieldValue}
        inputs={inputs}
      />

      <LoginRequiredModal
        open={loginRequired}
        onClose={closeLoginRequired}
        featureLabel={featureLabel}
      />
    </div>
  );
}
