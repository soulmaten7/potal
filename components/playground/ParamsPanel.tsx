'use client';

import { useState } from 'react';
import type { EndpointDef } from '@/lib/playground/scenario-endpoints';
import { CATEGORY_OPTIONS, MATERIAL_TO_CATEGORIES, COUNTRY_OPTIONS } from '@/lib/playground/dropdown-options';
import { SearchableSelect } from './SearchableSelect';
import { HsCodeCalculator } from './HsCodeCalculator';

const WEIGHT_UNITS = ['g', 'kg', 'lb', 'oz', 'mm', 'cm', 'ml', 'L'] as const;
const PRICE_CURRENCIES = ['USD', 'EUR', 'GBP', 'KRW', 'JPY', 'CNY', 'CAD', 'AUD'] as const;

interface ParamsPanelProps {
  endpoint: EndpointDef | undefined;
  apiKey: string;
  onApiKeyChange: (v: string) => void;
  paramValues: Record<string, string>;
  onParamChange: (key: string, val: string) => void;
  onTest: () => void;
  loading: boolean;
  isLoggedIn?: boolean;
  keyPrefix?: string | null;
  keyLoading?: boolean;
  result?: unknown;
  endpointId?: string;
}

export function ParamsPanel({
  endpoint,
  apiKey,
  onApiKeyChange,
  paramValues,
  onParamChange,
  onTest,
  loading,
  isLoggedIn = false,
  keyPrefix = null,
  keyLoading = false,
  result,
  endpointId,
}: ParamsPanelProps) {
  const [showHsCalc, setShowHsCalc] = useState(false);
  const [weightUnit, setWeightUnit] = useState<string>('g');
  const [priceCurrency, setPriceCurrency] = useState<string>(
    endpoint?.params.find(p => p.key === 'currency')?.defaultValue || 'USD'
  );

  if (!endpoint) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-[14px]">
        Select an endpoint from the sidebar.
      </div>
    );
  }

  const canTest = endpoint.params
    .filter(p => p.required)
    .every(p => paramValues[p.key]?.trim());

  // Composite field helpers
  const handleWeightChange = (numStr: string) => {
    onParamChange('weight_spec', numStr ? `${numStr}${weightUnit}` : '');
  };
  const handleWeightUnitChange = (unit: string) => {
    setWeightUnit(unit);
    const num = paramValues.weight_spec?.replace(/[^0-9.]/g, '') || '';
    if (num) onParamChange('weight_spec', `${num}${unit}`);
  };
  const handlePriceChange = (numStr: string) => {
    onParamChange('price', numStr);
    // Always sync currency to a separate key for the API
    onParamChange('currency', priceCurrency);
  };
  const handlePriceCurrencyChange = (cur: string) => {
    setPriceCurrency(cur);
    onParamChange('currency', cur);
  };

  const weightNumValue = paramValues.weight_spec?.replace(/[^0-9.]/g, '') || '';

  // Routes builder state for Compare Countries
  type RouteRow = { destination: string; shipping: string; currency: string };
  const parseRoutes = (): RouteRow[] => {
    try {
      const parsed = JSON.parse(paramValues.routes || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((r: Record<string, unknown>) => ({
          destination: String(r.destination || ''),
          shipping: String(r.shipping ?? ''),
          currency: String(r.currency || priceCurrency || 'USD'),
        }));
      }
    } catch { /* ignore */ }
    return [{ destination: '', shipping: '', currency: priceCurrency || 'USD' }];
  };

  const syncRoutes = (rows: RouteRow[]) => {
    // Keep all rows (including empty) for UI rendering; API-side filters empties
    const serialized = rows.map(r => ({
      destination: r.destination,
      shipping: r.shipping ? Number(r.shipping) : 0,
      currency: r.currency || 'USD',
    }));
    onParamChange('routes', JSON.stringify(serialized));
  };

  const updateRoute = (idx: number, field: keyof RouteRow, val: string) => {
    const rows = parseRoutes();
    rows[idx] = { ...rows[idx], [field]: val };
    syncRoutes(rows);
  };

  const addRoute = () => {
    const rows = parseRoutes();
    if (rows.length < 5) {
      rows.push({ destination: '', shipping: '', currency: priceCurrency || 'USD' });
      syncRoutes(rows);
    }
  };

  const removeRoute = (idx: number) => {
    const rows = parseRoutes();
    if (rows.length > 1) {
      rows.splice(idx, 1);
      syncRoutes(rows);
    }
  };

  return (
    <div className="flex-1 min-w-0 border-r border-slate-200 flex flex-col">
      {/* Endpoint header + inline Test button */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-mono bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">
            {endpoint.method}
          </span>
          <span className="text-[14px] font-mono text-slate-600">{endpoint.path}</span>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-extrabold text-[#02122c]">{endpoint.name}</h2>
          <button
            type="button"
            onClick={onTest}
            disabled={!canTest || loading}
            className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-colors ${
              loading
                ? 'bg-slate-300 text-white cursor-wait'
                : !canTest
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#F59E0B] text-[#02122c] hover:bg-[#e8930a] cursor-pointer'
            }`}
          >
            {loading ? 'Testing...' : '▶ Test'}
          </button>
        </div>
        <p className="text-[13px] text-slate-500 mt-1">{endpoint.description}</p>
      </div>

      {/* API Key + Params — natural height, no scroll */}
      <div>
        {/* API Key */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
            API Key
            <span className="ml-2 text-slate-400 font-normal normal-case">(or leave blank for demo mode)</span>
          </label>
          <input
            type="text"
            value={apiKey}
            onChange={e => onApiKeyChange(e.target.value)}
            placeholder={
              keyLoading
                ? 'Loading your API key...'
                : keyPrefix
                  ? `You have an active key (${keyPrefix}...). Paste your full key here.`
                  : isLoggedIn
                    ? 'No API key yet — create one in Dashboard'
                    : 'pk_live_your_api_key (or leave blank for demo mode)'
            }
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] font-mono focus:outline-none focus:border-[#F59E0B] bg-white"
          />
          {isLoggedIn && !keyPrefix && !keyLoading && (
            <a
              href="/dashboard/api-keys"
              className="inline-block mt-1.5 text-[11px] text-[#F59E0B] hover:underline font-semibold"
            >
              Create API Key in Dashboard →
            </a>
          )}
        </div>

        {/* Params */}
        <div className="px-6 py-4 pb-16 space-y-4">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            Parameters
          </div>
          {endpoint.params
            .filter(p => !(p.key === 'currency' && endpoint.params.some(pp => pp.key === 'price')))
            .map(p => (
            <div key={p.key}>
              <label className="flex items-center gap-1.5 text-[12px] font-bold text-[#02122c] mb-1">
                {p.label}
                <span className="text-[10px] font-mono text-slate-400 ml-auto">{p.type}</span>
              </label>
              {p.description && (
                <p className="text-[10px] text-slate-400 mb-1.5">{p.description}</p>
              )}

              {/* Composite: weight_spec = number + unit select */}
              {p.key === 'weight_spec' ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={weightNumValue}
                    onChange={e => handleWeightChange(e.target.value)}
                    placeholder="150"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:border-[#F59E0B]"
                  />
                  <select
                    value={weightUnit}
                    onChange={e => handleWeightUnitChange(e.target.value)}
                    className="w-[72px] px-2 py-2 rounded-lg border border-slate-200 text-[13px] bg-white focus:outline-none focus:border-[#F59E0B]"
                  >
                    {WEIGHT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

              /* Composite: price = number + currency select (all endpoints with price field) */
              ) : p.key === 'price' ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={paramValues.price || ''}
                    onChange={e => handlePriceChange(e.target.value)}
                    placeholder={p.placeholder || '85'}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:border-[#F59E0B]"
                  />
                  <select
                    value={priceCurrency}
                    onChange={e => handlePriceCurrencyChange(e.target.value)}
                    className="w-[80px] px-2 py-2 rounded-lg border border-slate-200 text-[13px] bg-white focus:outline-none focus:border-[#F59E0B]"
                  >
                    {PRICE_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

              /* Routes builder: dynamic destination rows */
              ) : p.key === 'routes' ? (
                <div className="space-y-3">
                  {parseRoutes().map((row, idx) => (
                    <div key={idx} className="flex flex-wrap gap-2 items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex-1 min-w-[140px]">
                        <SearchableSelect
                          options={COUNTRY_OPTIONS}
                          value={row.destination}
                          onChange={val => updateRoute(idx, 'destination', val)}
                          placeholder="Country"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Shipping</span>
                        <input
                          type="number"
                          value={row.shipping}
                          onChange={e => updateRoute(idx, 'shipping', e.target.value)}
                          placeholder="0"
                          className="w-[72px] px-2 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:border-[#F59E0B] bg-white"
                        />
                        <select
                          value={row.currency}
                          onChange={e => updateRoute(idx, 'currency', e.target.value)}
                          className="w-[68px] px-1 py-2 rounded-lg border border-slate-200 text-[12px] bg-white focus:outline-none focus:border-[#F59E0B]"
                        >
                          {PRICE_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      {parseRoutes().length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRoute(idx)}
                          className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-red-500 hover:bg-red-50 text-[14px]"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {parseRoutes().length < 5 && (
                    <button
                      type="button"
                      onClick={addRoute}
                      className="text-[12px] font-bold text-[#F59E0B] hover:text-[#e8930a] mt-1"
                    >
                      + Add Destination
                    </button>
                  )}
                </div>

              ) : p.type === 'select' && p.options ? (
                <SearchableSelect
                  options={(() => {
                    // CW34: filter category options based on selected material
                    if ((p.key === 'productCategory' || p.key === 'category') && paramValues.material) {
                      const allowed = MATERIAL_TO_CATEGORIES[paramValues.material];
                      if (allowed && allowed.length > 0) {
                        return CATEGORY_OPTIONS.filter(o => allowed.includes(o.value));
                      }
                    }
                    return p.options as Array<{ value: string; label: string; group?: string }>;
                  })()}
                  value={paramValues[p.key] || p.defaultValue || ''}
                  onChange={val => onParamChange(p.key, val)}
                  placeholder={p.placeholder || 'Select…'}
                />
              ) : (
                <div className={p.key === 'hsCode' ? 'flex gap-2' : ''}>
                  <input
                    type={p.type === 'number' ? 'number' : 'text'}
                    value={paramValues[p.key] || ''}
                    onChange={e => onParamChange(p.key, e.target.value)}
                    placeholder={p.placeholder}
                    className={`${p.key === 'hsCode' ? 'flex-1' : 'w-full'} px-3 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:border-[#F59E0B]`}
                  />
                  {p.key === 'hsCode' && (
                    <button
                      type="button"
                      onClick={() => setShowHsCalc(true)}
                      className="px-3 py-1.5 rounded-lg border border-blue-200 text-[12px] font-bold text-blue-600 hover:bg-blue-50 whitespace-nowrap"
                    >
                      HS Code Calculator
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Compare Countries 결과 카드 */}
          {(() => {
            if (endpointId !== 'compare' || !result) return null;
            const r = result as Record<string, unknown>;
            if (!r.success || !r.data) return null;
            return <CompareResultCards data={r.data as CompareData} />;
          })()}
        </div>
      </div>

      {/* HS Code Calculator modal */}
      {showHsCalc && (
        <HsCodeCalculator
          onResult={hsCode => onParamChange('hsCode', hsCode)}
          onClose={() => setShowHsCalc(false)}
        />
      )}
    </div>
  );
}

// ═══ Compare Countries Result Cards ═══

interface CompareRoute {
  destination: string;
  shipping: number;
  totalLandedCost: number;
  duty: number;
  tax: number;
  fees: number;
  insurance?: number;
  dutyRate?: number;
  vatRate?: number;
  vatLabel?: string;
  entryType?: string;
  deMinimisApplied?: boolean;
  dutyThresholdUsd?: number;
  hsCode: string;
  hsCodePrecision?: string;
  hs10Code?: string | null;
  breakdown?: Array<{ label: string; amount: number; note?: string }>;
  localCurrency?: { totalLandedCost: number; exchangeRate: number; currency: string } | null;
  ftaApplied?: { hasFta: boolean; ftaName?: string; ftaCode?: string; preferentialMultiplier?: number } | null;
  source: string;
}

interface CompareData {
  origin: string;
  routes: CompareRoute[];
  cheapest_route_index: number;
  savings_vs_most_expensive: number;
}

function CompareResultCards({ data }: { data: CompareData }) {
  const { routes, cheapest_route_index, savings_vs_most_expensive } = data;
  const sorted = [...routes].sort((a, b) => a.totalLandedCost - b.totalLandedCost);
  const mostExpensiveIdx = routes.reduce((mx, r, i) => r.totalLandedCost > routes[mx].totalLandedCost ? i : mx, 0);

  const getCountryLabel = (code: string) => {
    const opt = COUNTRY_OPTIONS.find(o => o.value === code);
    return opt ? opt.label : code;
  };

  return (
    <div className="mt-6 pt-5 border-t border-slate-200">
      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-3">Results</div>

      {savings_vs_most_expensive > 0 && routes.length > 1 && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[12px] text-emerald-700 font-medium">
          You save <span className="font-bold">${savings_vs_most_expensive.toFixed(2)}</span> by shipping to{' '}
          <span className="font-bold">{routes[cheapest_route_index]?.destination}</span> instead of{' '}
          <span className="font-bold">{routes[mostExpensiveIdx]?.destination}</span>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map((route) => {
          const origIdx = routes.indexOf(route);
          const isCheapest = origIdx === cheapest_route_index && routes.length > 1;
          const isMostExpensive = origIdx === mostExpensiveIdx && routes.length > 1 && mostExpensiveIdx !== cheapest_route_index;
          const cardBorder = isCheapest
            ? 'border-emerald-300 bg-emerald-50/30'
            : isMostExpensive ? 'border-red-200 bg-red-50/20' : 'border-slate-200 bg-white';

          return (
            <div key={route.destination} className={`rounded-lg border p-4 ${cardBorder}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-bold text-[#02122c]">{getCountryLabel(route.destination)}</span>
                {isCheapest && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Cheapest</span>}
                {isMostExpensive && <span className="text-[10px] font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full">Most Expensive</span>}
              </div>

              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-[20px] font-extrabold text-[#02122c]">${route.totalLandedCost.toFixed(2)}</span>
                {route.localCurrency && (
                  <span className="text-[13px] text-slate-500">
                    ({route.localCurrency.currency} {route.localCurrency.totalLandedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                  </span>
                )}
              </div>

              {route.breakdown && route.breakdown.length > 0 && (
                <div className="mb-3 space-y-1">
                  {route.breakdown.map((item, i) => (
                    <div key={i} className="flex items-center text-[12px]">
                      <span className="text-slate-600 flex-1">{item.label}</span>
                      <span className="font-mono text-[#02122c] font-medium w-[70px] text-right">${item.amount.toFixed(2)}</span>
                      {item.note && <span className="text-[10px] text-slate-400 ml-2 w-[120px] truncate">{item.note}</span>}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-500">
                <div>HS: <span className="font-mono font-medium text-slate-700">{route.hs10Code || route.hsCode}</span>
                  {route.hsCodePrecision && <span className="ml-1 text-slate-400">({route.hsCodePrecision})</span>}
                </div>
                {route.ftaApplied?.hasFta && (
                  <div>FTA: <span className="font-medium text-emerald-600">{route.ftaApplied.ftaCode || route.ftaApplied.ftaName}</span>
                    {route.ftaApplied.preferentialMultiplier === 0 ? ' (duty-free)'
                      : route.ftaApplied.preferentialMultiplier !== undefined ? ` (${((1 - route.ftaApplied.preferentialMultiplier) * 100).toFixed(0)}% reduction)` : ''}
                  </div>
                )}
                <div>
                  {route.entryType && <>Entry: {route.entryType}</>}
                  {route.dutyThresholdUsd !== undefined && route.dutyThresholdUsd > 0 && (
                    <> | De minimis: ≤${route.dutyThresholdUsd}{route.deMinimisApplied ? ' (applied)' : ''}</>
                  )}
                </div>
                {route.localCurrency && (
                  <div>Rate: {route.localCurrency.currency} 1 = ${(1 / route.localCurrency.exchangeRate).toFixed(4)} USD</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
