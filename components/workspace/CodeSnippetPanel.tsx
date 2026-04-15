'use client';

import { useState, useEffect, useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

// ─── Target / Client definitions (RapidAPI pattern: 12 targets × 3-5 clients = 50+ combos) ───

const TARGETS = [
  { id: 'shell',      label: 'Shell',      clients: [{ id: 'curl', label: 'cURL' }, { id: 'httpie', label: 'HTTPie' }, { id: 'wget', label: 'Wget' }], syntax: 'bash' },
  { id: 'javascript', label: 'JavaScript', clients: [{ id: 'fetch', label: 'Fetch' }, { id: 'xhr', label: 'XMLHttpRequest' }, { id: 'jquery', label: 'jQuery' }, { id: 'axios', label: 'Axios' }], syntax: 'javascript' },
  { id: 'node',       label: 'Node.js',    clients: [{ id: 'fetch', label: 'Fetch' }, { id: 'native', label: 'HTTP' }, { id: 'axios', label: 'Axios' }, { id: 'request', label: 'Request' }, { id: 'unirest', label: 'Unirest' }], syntax: 'javascript' },
  { id: 'python',     label: 'Python',     clients: [{ id: 'requests', label: 'Requests' }, { id: 'python3', label: 'http.client' }], syntax: 'python' },
  { id: 'java',       label: 'Java',       clients: [{ id: 'okhttp', label: 'OkHttp' }, { id: 'unirest', label: 'Unirest' }, { id: 'asynchttp', label: 'AsyncHttp' }, { id: 'nethttp', label: 'NetHttp' }], syntax: 'java' },
  { id: 'php',        label: 'PHP',        clients: [{ id: 'curl', label: 'cURL' }, { id: 'http1', label: 'HTTP v1' }, { id: 'http2', label: 'HTTP v2' }], syntax: 'php' },
  { id: 'go',         label: 'Go',         clients: [{ id: 'native', label: 'NewRequest' }], syntax: 'go' },
  { id: 'ruby',       label: 'Ruby',       clients: [{ id: 'native', label: 'Net::HTTP' }], syntax: 'ruby' },
  { id: 'csharp',     label: 'C#',         clients: [{ id: 'restsharp', label: 'RestSharp' }, { id: 'httpclient', label: 'HttpClient' }], syntax: 'csharp' },
  { id: 'kotlin',     label: 'Kotlin',     clients: [{ id: 'okhttp', label: 'OkHttp' }], syntax: 'kotlin' },
  { id: 'swift',      label: 'Swift',      clients: [{ id: 'nsurlsession', label: 'URLSession' }], syntax: 'swift' },
  { id: 'c',          label: 'C',          clients: [{ id: 'libcurl', label: 'libcurl' }], syntax: 'c' },
] as const;

type TabId = 'code' | 'example' | 'results';

interface Props {
  endpointPath: string;
  method: string;
  params: Record<string, unknown>;
  result?: Record<string, unknown> | null;
}

// ─── httpsnippet-based generation (async, client-side) ───

async function generateSnippet(
  targetId: string, clientId: string,
  path: string, method: string, params: Record<string, unknown>
): Promise<string> {
  try {
    // Server-side generation via /api/v1/snippet (httpsnippet needs Node.js)
    const res = await fetch('/api/v1/snippet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target: targetId, client: clientId,
        method, url: `https://www.potal.app${path}`, params,
      }),
    });
    const { code } = await res.json();
    return code || '// No snippet generated';
  } catch (e) {
    return `// Error: ${e instanceof Error ? e.message : 'snippet generation failed'}`;
  }
}

// ─── Component ───

export function CodeSnippetPanel({ endpointPath, method, params, result }: Props) {
  const [targetId, setTargetId] = useState('shell');
  const [clientId, setClientId] = useState('curl');
  const [activeTab, setActiveTab] = useState<TabId>('code');
  const [copied, setCopied] = useState(false);
  const [snippet, setSnippet] = useState('// Select a target and client');

  const target = TARGETS.find(t => t.id === targetId) || TARGETS[0];
  const clients = target.clients;

  // Reset client when target changes
  useEffect(() => { setClientId(clients[0].id); }, [targetId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate snippet on change (debounced)
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      generateSnippet(targetId, clientId, endpointPath, method, params).then(s => {
        if (!cancelled) setSnippet(s);
      });
    }, 150);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [targetId, clientId, endpointPath, method, params]);

  // Auto-switch to Results
  useEffect(() => { if (result) setActiveTab('results'); }, [result]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalCombos = useMemo(() => TARGETS.reduce((s, t) => s + t.clients.length, 0), []);

  return (
    <div className="border-l border-slate-200 bg-white flex flex-col w-full min-w-0">
      {/* Top tabs: Code Snippets / Example Responses / Results */}
      <div className="flex border-b border-slate-200 bg-slate-50 flex-shrink-0">
        {([
          { id: 'code' as TabId, label: 'Code Snippets' },
          { id: 'example' as TabId, label: 'Example Responses' },
          { id: 'results' as TabId, label: 'Results', badge: !!result },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-[13px] font-semibold border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            {tab.badge && <span className="ml-1.5 w-2 h-2 rounded-full bg-emerald-500 inline-block" />}
          </button>
        ))}
      </div>

      {/* ═══ Code Snippets ═══ */}
      {activeTab === 'code' && (
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-100 flex-shrink-0 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-semibold">Target</span>
              <select value={targetId} onChange={e => setTargetId(e.target.value)} className="text-[13px] px-2 py-1 rounded border border-slate-200 bg-white text-slate-700">
                {TARGETS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-semibold">Client</span>
              <select value={clientId} onChange={e => setClientId(e.target.value)} className="text-[13px] px-2 py-1 rounded border border-slate-200 bg-white text-slate-700">
                {clients.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="flex-1" />
            <span className="text-[10px] text-slate-300">{totalCombos} combos</span>
            <button onClick={() => copy(snippet)} className="text-[12px] px-3 py-1 rounded text-slate-500 hover:bg-slate-100 whitespace-nowrap">
              {copied ? '\u2713 Copied' : 'Copy'}
            </button>
          </div>
          <div className="flex-1 overflow-auto min-w-0">
            <SyntaxHighlighter language={target.syntax} style={oneLight} showLineNumbers
              lineNumberStyle={{ color: '#c0c0c0', fontSize: 12, minWidth: '2.5em', paddingRight: 16 }}
              customStyle={{ margin: 0, padding: 16, background: '#fafafa', fontSize: 13, lineHeight: 1.7, border: 'none' }}
              wrapLongLines>
              {snippet}
            </SyntaxHighlighter>
          </div>
        </div>
      )}

      {/* ═══ Example Responses ═══ */}
      {activeTab === 'example' && (
        <div className="flex-1 overflow-auto p-4">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-semibold">Status</span>
              <select className="text-[13px] px-2 py-1 rounded border border-slate-200 bg-white"><option>200</option><option>400</option><option>401</option><option>500</option></select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-semibold">Media Type</span>
              <select className="text-[13px] px-2 py-1 rounded border border-slate-200 bg-white"><option>application/json</option></select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-semibold">Example</span>
              <select className="text-[13px] px-2 py-1 rounded border border-slate-200 bg-white"><option>Success</option><option>Validation Error</option><option>Unauthorized</option></select>
            </div>
          </div>
          <SyntaxHighlighter language="json" style={oneLight} showLineNumbers
            lineNumberStyle={{ color: '#c0c0c0', fontSize: 12 }}
            customStyle={{ margin: 0, padding: 16, background: '#fafafa', fontSize: 13, lineHeight: 1.6, borderRadius: 8, border: '1px solid #e5e7eb' }}>
            {`{\n  "success": true,\n  "data": {\n    "hsCode": "610910",\n    "description": "T-shirts, singlets and other vests, knitted, of cotton",\n    "confidence": 0.94,\n    "alternatives": [\n      { "hsCode": "610990", "confidence": 0.72 },\n      { "hsCode": "611020", "confidence": 0.41 }\n    ],\n    "rulingMatch": { "rulingId": "H305865", "source": "cbp_cross", "confidenceScore": 0.9 }\n  },\n  "_metadata": {\n    "disclaimer": "For informational use only.",\n    "apiVersion": "v1",\n    "responseGeneratedAt": "${new Date().toISOString()}"\n  }\n}`}
          </SyntaxHighlighter>
        </div>
      )}

      {/* ═══ Results ═══ */}
      {activeTab === 'results' && (
        <div className="flex-1 overflow-auto p-4">
          {result ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[12px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">200 OK</span>
                <span className="text-[11px] text-slate-400">application/json</span>
                <div className="flex-1" />
                <button onClick={() => copy(JSON.stringify(result, null, 2))} className="text-[12px] text-slate-400 hover:text-slate-600">Copy JSON</button>
              </div>
              <SyntaxHighlighter language="json" style={oneLight} showLineNumbers
                lineNumberStyle={{ color: '#c0c0c0', fontSize: 12 }}
                customStyle={{ margin: 0, padding: 16, background: '#fafafa', fontSize: 13, lineHeight: 1.6, borderRadius: 8, border: '1px solid #e5e7eb' }}>
                {JSON.stringify(result, null, 2)}
              </SyntaxHighlighter>
            </>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <div className="text-3xl mb-3">&#9654;</div>
              <p className="text-[14px] font-medium">No results yet</p>
              <p className="text-[12px] mt-1">Click Run to see the API response here</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
