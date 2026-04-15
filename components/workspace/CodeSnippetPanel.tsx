'use client';

import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

// ─── Language definitions ───

const LANGUAGES = [
  { id: 'curl', label: 'cURL', syntax: 'bash' },
  { id: 'python', label: 'Python', syntax: 'python' },
  { id: 'node', label: 'Node.js', syntax: 'javascript' },
  { id: 'php', label: 'PHP', syntax: 'php' },
  { id: 'go', label: 'Go', syntax: 'go' },
  { id: 'ruby', label: 'Ruby', syntax: 'ruby' },
  { id: 'java', label: 'Java', syntax: 'java' },
] as const;

type TabId = 'code' | 'example' | 'results';

interface Props {
  endpointPath: string;
  method: string;
  params: Record<string, unknown>;
  result?: Record<string, unknown> | null;
}

// ─── Code generator (CW31 renderWorkflowCode pattern, generalized) ───

function generateSnippet(langId: string, path: string, method: string, params: Record<string, unknown>): string {
  const url = `https://www.potal.app${path}`;
  const body = JSON.stringify(params, null, 2);
  const hasBody = Object.keys(params).length > 0;
  const bodyStr = hasBody ? body : '{}';

  switch (langId) {
    case 'curl':
      return `curl -X ${method} \\\n  "${url}" \\\n  -H "X-API-Key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${bodyStr}'`;
    case 'python':
      return `import requests\n\nresponse = requests.post(\n    "${url}",\n    headers={"X-API-Key": "YOUR_API_KEY"},\n    json=${bodyStr.replace(/"/g, "'").replace(/null/g, "None").replace(/true/g, "True").replace(/false/g, "False")}\n)\n\ndata = response.json()\nprint(data)`;
    case 'node':
      return `const response = await fetch("${url}", {\n  method: "${method}",\n  headers: {\n    "X-API-Key": "YOUR_API_KEY",\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify(${bodyStr}),\n});\n\nconst data = await response.json();\nconsole.log(data);`;
    case 'php':
      return `<?php\n\n$response = Http::withHeaders([\n    'X-API-Key' => 'YOUR_API_KEY',\n])->post('${url}', ${bodyStr.replace(/"/g, "'")});\n\n$data = $response->json();\nprint_r($data);`;
    case 'go':
      return `package main\n\nimport (\n\t"bytes"\n\t"fmt"\n\t"io"\n\t"net/http"\n)\n\nfunc main() {\n\tbody := []byte(\`${bodyStr}\`)\n\treq, _ := http.NewRequest("${method}", "${url}", bytes.NewBuffer(body))\n\treq.Header.Set("X-API-Key", "YOUR_API_KEY")\n\treq.Header.Set("Content-Type", "application/json")\n\n\tresp, _ := http.DefaultClient.Do(req)\n\tdefer resp.Body.Close()\n\tdata, _ := io.ReadAll(resp.Body)\n\tfmt.Println(string(data))\n}`;
    case 'ruby':
      return `require "net/http"\nrequire "json"\nrequire "uri"\n\nuri = URI("${url}")\nhttp = Net::HTTP.new(uri.host, uri.port)\nhttp.use_ssl = true\n\nreq = Net::HTTP::Post.new(uri)\nreq["X-API-Key"] = "YOUR_API_KEY"\nreq["Content-Type"] = "application/json"\nreq.body = '${bodyStr}'\n\nres = http.request(req)\nputs JSON.parse(res.body)`;
    case 'java':
      return `var client = HttpClient.newHttpClient();\nvar request = HttpRequest.newBuilder()\n    .uri(URI.create("${url}"))\n    .header("X-API-Key", "YOUR_API_KEY")\n    .header("Content-Type", "application/json")\n    .POST(HttpRequest.BodyPublishers.ofString(\n        ${JSON.stringify(bodyStr)}\n    ))\n    .build();\n\nvar response = client.send(request,\n    HttpResponse.BodyHandlers.ofString());\nSystem.out.println(response.body());`;
    default:
      return '';
  }
}

// ─── Component ───

export function CodeSnippetPanel({ endpointPath, method, params, result }: Props) {
  const [langId, setLangId] = useState('curl');
  const [activeTab, setActiveTab] = useState<TabId>('code');
  const [copied, setCopied] = useState(false);

  const lang = LANGUAGES.find(l => l.id === langId) || LANGUAGES[0];
  const snippet = generateSnippet(langId, endpointPath, method, params);

  // Auto-switch to Results when result arrives
  useEffect(() => {
    if (result) setActiveTab('results');
  }, [result]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border-l border-slate-200 bg-white flex flex-col w-full min-w-0">
      {/* Top tabs: Code Snippets / Example Response / Results */}
      <div className="flex border-b border-slate-200 bg-slate-50 flex-shrink-0">
        {([
          { id: 'code' as TabId, label: 'Code Snippets' },
          { id: 'example' as TabId, label: 'Example Response' },
          { id: 'results' as TabId, label: 'Results', badge: result ? true : false },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-[13px] font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            {tab.badge && <span className="ml-1.5 w-2 h-2 rounded-full bg-emerald-500 inline-block" />}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'code' && (
        <div className="flex flex-col flex-1 min-w-0">
          {/* Language selector */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-100 overflow-x-auto flex-shrink-0">
            <span className="text-[11px] text-slate-400 font-semibold mr-2 whitespace-nowrap">Target:</span>
            {LANGUAGES.map(l => (
              <button
                key={l.id}
                onClick={() => setLangId(l.id)}
                className={`text-[13px] px-3 py-1 rounded transition-colors whitespace-nowrap ${
                  langId === l.id ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {l.label}
              </button>
            ))}
            <div className="flex-1" />
            <button
              onClick={() => copy(snippet)}
              className="text-[12px] px-3 py-1 rounded text-slate-500 hover:bg-slate-100 whitespace-nowrap"
            >
              {copied ? '\u2713 Copied' : 'Copy'}
            </button>
          </div>

          {/* Code with syntax highlighting */}
          <div className="flex-1 overflow-auto min-w-0">
            <SyntaxHighlighter
              language={lang.syntax}
              style={oneLight}
              showLineNumbers
              lineNumberStyle={{ color: '#c0c0c0', fontSize: 12, minWidth: '2.5em', paddingRight: 16 }}
              customStyle={{ margin: 0, padding: 16, background: '#fafafa', fontSize: 13, lineHeight: 1.7, border: 'none' }}
              wrapLongLines
            >
              {snippet}
            </SyntaxHighlighter>
          </div>
        </div>
      )}

      {activeTab === 'example' && (
        <div className="flex-1 overflow-auto p-4">
          <p className="text-[13px] text-slate-500 mb-3">Example response for <code className="text-blue-600">{endpointPath}</code>:</p>
          <SyntaxHighlighter
            language="json"
            style={oneLight}
            showLineNumbers
            lineNumberStyle={{ color: '#c0c0c0', fontSize: 12 }}
            customStyle={{ margin: 0, padding: 16, background: '#fafafa', fontSize: 13, lineHeight: 1.6, borderRadius: 8, border: '1px solid #e5e7eb' }}
          >
            {`{\n  "success": true,\n  "data": {\n    "...": "Run the endpoint to see actual response"\n  },\n  "_metadata": {\n    "disclaimer": "For informational use only.",\n    "apiVersion": "v1",\n    "responseGeneratedAt": "${new Date().toISOString()}"\n  }\n}`}
          </SyntaxHighlighter>
        </div>
      )}

      {activeTab === 'results' && (
        <div className="flex-1 overflow-auto p-4">
          {result ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[12px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">200 OK</span>
                <button onClick={() => copy(JSON.stringify(result, null, 2))} className="text-[12px] text-slate-400 hover:text-slate-600">Copy JSON</button>
              </div>
              <SyntaxHighlighter
                language="json"
                style={oneLight}
                showLineNumbers
                lineNumberStyle={{ color: '#c0c0c0', fontSize: 12 }}
                customStyle={{ margin: 0, padding: 16, background: '#fafafa', fontSize: 13, lineHeight: 1.6, borderRadius: 8, border: '1px solid #e5e7eb' }}
              >
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
