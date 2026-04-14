'use client';

export interface EndpointItem {
  id: string;
  label: string;
  method: 'POST' | 'GET';
  path: string;
  group: 'compute' | 'screening' | 'guides';
}

export const ENDPOINTS: EndpointItem[] = [
  // Compute
  { id: 'classify', label: 'Classify Product', method: 'POST', path: '/api/v1/classify', group: 'compute' },
  { id: 'calculate', label: 'Calculate Landed Cost', method: 'POST', path: '/api/v1/calculate', group: 'compute' },
  { id: 'apply-fta', label: 'Apply FTA / RoO', method: 'POST', path: '/api/v1/roo/evaluate', group: 'compute' },
  { id: 'check-restrictions', label: 'Check Restrictions', method: 'POST', path: '/api/v1/restrictions', group: 'compute' },
  { id: 'compare', label: 'Compare Countries', method: 'POST', path: '/api/v1/countries/compare', group: 'compute' },
  { id: 'generate-document', label: 'Generate Document', method: 'POST', path: '/api/v1/customs-docs/generate', group: 'compute' },
  // Screening
  { id: 'screen-parties', label: 'Screen Parties', method: 'POST', path: '/api/v1/screening', group: 'screening' },
  { id: 'eccn-lookup', label: 'ECCN Lookup', method: 'POST', path: '/api/v1/classify/eccn', group: 'screening' },
  // Guides (links, not API)
  { id: 'customs-filing', label: 'Customs Filing Guide', method: 'GET', path: '/guides/customs-filing', group: 'guides' },
  { id: 'incoterms', label: 'Incoterms 2020', method: 'GET', path: '/guides/incoterms-2020', group: 'guides' },
  { id: 'section-301', label: 'Section 301 Tariffs', method: 'GET', path: '/guides/section-301', group: 'guides' },
  { id: 'anti-dumping', label: 'Anti-Dumping & CVD', method: 'GET', path: '/guides/anti-dumping', group: 'guides' },
];

const GROUP_LABELS = { compute: 'Compute', screening: 'Screening', guides: 'Guides' };
const GROUP_ICONS = { compute: '\uD83D\uDEE0\uFE0F', screening: '\uD83D\uDD0D', guides: '\uD83D\uDCDA' };
const METHOD_COLORS = { POST: 'text-green-600 bg-green-50', GET: 'text-blue-600 bg-blue-50' };

interface Props {
  selected: string;
  onSelect: (id: string) => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function EndpointSidebar({ selected, onSelect, collapsed, onToggle }: Props) {
  const groups = ['compute', 'screening', 'guides'] as const;

  if (collapsed) {
    return (
      <div className="w-12 border-r border-slate-200 bg-slate-50 flex flex-col items-center pt-4">
        <button onClick={onToggle} className="text-slate-400 hover:text-slate-600 mb-4 text-lg">&#9776;</button>
        {groups.map(g => (
          <div key={g} className="text-lg mb-3" title={GROUP_LABELS[g]}>{GROUP_ICONS[g]}</div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-64 border-r border-slate-200 bg-slate-50 overflow-y-auto flex-shrink-0">
      <div className="p-3 border-b border-slate-200 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">API Endpoints</span>
        {onToggle && <button onClick={onToggle} className="text-slate-400 hover:text-slate-600 text-sm">&#9776;</button>}
      </div>
      {groups.map(g => (
        <div key={g} className="py-2">
          <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {GROUP_ICONS[g]} {GROUP_LABELS[g]}
          </div>
          {ENDPOINTS.filter(e => e.group === g).map(e => (
            <button
              key={e.id}
              onClick={() => onSelect(e.id)}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                selected === e.id ? 'bg-blue-100 text-blue-800 font-medium' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${METHOD_COLORS[e.method]}`}>{e.method}</span>
              <span className="truncate">{e.label}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
