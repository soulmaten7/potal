'use client';

import { useState } from 'react';
import type { EndpointDef } from '@/lib/playground/scenario-endpoints';

interface CodePanelProps {
  endpoint: EndpointDef | undefined;
  paramValues: Record<string, string>;
  apiKey: string;
  result: unknown;
}

type Lang = 'curl' | 'python' | 'node' | 'go';
type Tab = 'code' | 'example' | 'result';

const LANG_LABELS: Array<{ id: Lang; label: string }> = [
  { id: 'curl', label: 'cURL' },
  { id: 'python', label: 'Python' },
  { id: 'node', label: 'Node.js' },
  { id: 'go', label: 'Go' },
];

function buildBody(endpoint: EndpointDef, paramValues: Record<string, string>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const p of endpoint.params) {
    const val = paramValues[p.key] || p.defaultValue;
    if (!val) continue;
    body[p.key] = p.type === 'number' ? Number(val) : val;
  }
  return body;
}

function generateCode(
  lang: Lang,
  endpoint: EndpointDef,
  paramValues: Record<string, string>,
  apiKey: string,
): string {
  const body = buildBody(endpoint, paramValues);
  const bodyJson = JSON.stringify(body, null, 2);
  const key = apiKey || '$POTAL_API_KEY';
  const url = `https://potal.app${endpoint.path}`;

  switch (lang) {
    case 'curl':
      return `curl -X ${endpoint.method} ${url} \\
  -H "X-API-Key: ${key}" \\
  -H "Content-Type: application/json" \\
  -d '${bodyJson}'`;

    case 'python':
      return `import requests

response = requests.post(
    "${url}",
    headers={"X-API-Key": "${key}"},
    json=${bodyJson.replace(/"/g, '"').replace(/: true/g, ': True').replace(/: false/g, ': False').replace(/: null/g, ': None')},
)
print(response.json())`;

    case 'node':
      return `const res = await fetch("${url}", {
  method: "${endpoint.method}",
  headers: {
    "X-API-Key": "${key}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(${bodyJson}),
});
const data = await res.json();
console.log(data);`;

    case 'go':
      return `package main

import (
\t"bytes"
\t"encoding/json"
\t"fmt"
\t"net/http"
\t"io"
)

func main() {
\tbody, _ := json.Marshal(map[string]interface{}{${Object.entries(body).map(([k, v]) => `\n\t\t"${k}": ${JSON.stringify(v)}`).join(',')}${Object.keys(body).length > 0 ? ',\n\t' : ''}})
\treq, _ := http.NewRequest("${endpoint.method}", "${url}", bytes.NewBuffer(body))
\treq.Header.Set("X-API-Key", "${key}")
\treq.Header.Set("Content-Type", "application/json")
\tresp, _ := http.DefaultClient.Do(req)
\tdefer resp.Body.Close()
\tresBody, _ := io.ReadAll(resp.Body)
\tfmt.Println(string(resBody))
}`;

    default:
      return '';
  }
}

export function CodePanel({ endpoint, paramValues, apiKey, result }: CodePanelProps) {
  const [tab, setTab] = useState<Tab>('code');
  const [lang, setLang] = useState<Lang>('curl');
  const [copied, setCopied] = useState(false);

  if (!endpoint) {
    return (
      <div className="w-[480px] flex-none bg-white border-l border-slate-200 flex items-center justify-center text-slate-400 text-[13px]">
        Select an endpoint to see code.
      </div>
    );
  }

  const code = generateCode(lang, endpoint, paramValues, apiKey);
  const exampleJson = JSON.stringify(endpoint.exampleResponse, null, 2);
  const resultJson = result ? JSON.stringify(result, null, 2) : null;

  const handleCopy = async () => {
    const text = tab === 'code' ? code : tab === 'example' ? exampleJson : resultJson || '';
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  };

  return (
    <div className="w-[480px] flex-none bg-white border-l border-slate-200 flex flex-col overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {([
          { id: 'code', label: 'Code Snippets' },
          { id: 'example', label: 'Example Response' },
          { id: 'result', label: result ? '\u2713 Result' : 'Result' },
        ] as Array<{ id: Tab; label: string }>).map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-[12px] font-bold transition-colors ${
              tab === t.id
                ? 'text-[#02122c] border-b-2 border-[#F59E0B]'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Language selector (code tab only) */}
      {tab === 'code' && (
        <div className="flex gap-1.5 px-4 py-2 border-b border-slate-100">
          {LANG_LABELS.map(l => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLang(l.id)}
              className={`px-3 py-1.5 rounded text-[11px] font-bold transition-colors ${
                lang === l.id
                  ? 'bg-[#F59E0B] text-[#02122c]'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto bg-slate-50/50">
        <pre className="p-4 text-[12px] leading-relaxed font-mono text-slate-700 whitespace-pre-wrap break-all">
          {tab === 'code' && code}
          {tab === 'example' && exampleJson}
          {tab === 'result' && (resultJson || 'Click "\u25B6 Test Endpoint" to see results here.')}
        </pre>
      </div>

      {/* Copy button */}
      <div className="px-4 py-3 border-t border-slate-200 flex justify-end">
        <button
          type="button"
          onClick={handleCopy}
          className={`px-4 py-2 rounded-lg text-[12px] font-bold transition-colors ${
            copied
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {copied ? '\u2713 Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
