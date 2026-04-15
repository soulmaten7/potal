'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const LANGUAGES = [
  { id: 'curl', label: 'curl', syntax: 'bash' },
  { id: 'Python', label: 'Python', syntax: 'python' },
  { id: 'Node.js', label: 'Node.js', syntax: 'javascript' },
  { id: 'PHP', label: 'PHP', syntax: 'php' },
  { id: 'Go', label: 'Go', syntax: 'go' },
  { id: 'Ruby', label: 'Ruby', syntax: 'ruby' },
  { id: 'Java', label: 'Java', syntax: 'java' },
] as const;

interface Props {
  endpointPath: string;
  method: string;
  params: Record<string, unknown>;
}

function generateSnippet(langId: string, path: string, method: string, params: Record<string, unknown>): string {
  const url = `https://www.potal.app${path}`;
  const body = JSON.stringify(params, null, 2);

  switch (langId) {
    case 'curl':
      return `curl -X ${method} \\\n  ${url} \\\n  -H "X-API-Key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${body}'`;
    case 'Python':
      return `import requests\n\nresponse = requests.post(\n    "${url}",\n    headers={\n        "X-API-Key": "YOUR_API_KEY"\n    },\n    json=${body.replace(/"/g, "'").replace(/null/g, "None").replace(/true/g, "True").replace(/false/g, "False")}\n)\n\nprint(response.json())`;
    case 'Node.js':
      return `const response = await fetch(\n  "${url}",\n  {\n    method: "${method}",\n    headers: {\n      "X-API-Key": "YOUR_API_KEY",\n      "Content-Type": "application/json"\n    },\n    body: JSON.stringify(${body})\n  }\n);\n\nconst data = await response.json();\nconsole.log(data);`;
    case 'PHP':
      return `<?php\n$response = Http::withHeaders([\n    'X-API-Key' => 'YOUR_API_KEY'\n])->post(\n    '${url}',\n    ${body.replace(/"/g, "'")}\n);\n\n$data = $response->json();`;
    case 'Go':
      return `package main\n\nimport (\n    "bytes"\n    "fmt"\n    "net/http"\n    "io"\n)\n\nfunc main() {\n    body := []byte(\`${body}\`)\n    req, _ := http.NewRequest(\n        "${method}",\n        "${url}",\n        bytes.NewBuffer(body),\n    )\n    req.Header.Set("X-API-Key", "YOUR_API_KEY")\n    req.Header.Set("Content-Type", "application/json")\n\n    resp, _ := http.DefaultClient.Do(req)\n    defer resp.Body.Close()\n    data, _ := io.ReadAll(resp.Body)\n    fmt.Println(string(data))\n}`;
    case 'Ruby':
      return `require 'net/http'\nrequire 'json'\nrequire 'uri'\n\nuri = URI("${url}")\nhttp = Net::HTTP.new(uri.host, uri.port)\nhttp.use_ssl = true\n\nreq = Net::HTTP::Post.new(uri)\nreq['X-API-Key'] = 'YOUR_API_KEY'\nreq['Content-Type'] = 'application/json'\nreq.body = ${body}.to_json\n\nres = http.request(req)\nputs JSON.parse(res.body)`;
    case 'Java':
      return `import java.net.http.*;\nimport java.net.URI;\n\nvar client = HttpClient.newHttpClient();\nvar request = HttpRequest.newBuilder()\n    .uri(URI.create("${url}"))\n    .header("X-API-Key", "YOUR_API_KEY")\n    .header("Content-Type", "application/json")\n    .POST(HttpRequest.BodyPublishers\n        .ofString(${JSON.stringify(body)}))\n    .build();\n\nvar response = client.send(\n    request,\n    HttpResponse.BodyHandlers.ofString()\n);\nSystem.out.println(response.body());`;
    default:
      return '';
  }
}

export function CodeSnippetPanel({ endpointPath, method, params }: Props) {
  const [langId, setLangId] = useState('curl');
  const [copied, setCopied] = useState(false);
  const lang = LANGUAGES.find(l => l.id === langId) || LANGUAGES[0];
  const snippet = generateSnippet(langId, endpointPath, method, params);

  const copy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border-l border-slate-200 bg-[#1e1e2e] text-slate-100 flex flex-col w-full min-w-0">
      {/* Language tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-700/50 overflow-x-auto flex-shrink-0">
        {LANGUAGES.map(l => (
          <button
            key={l.id}
            onClick={() => setLangId(l.id)}
            className={`text-xs px-2.5 py-1 rounded whitespace-nowrap transition-colors ${langId === l.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
            {l.label}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={copy} className="text-xs px-2.5 py-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 whitespace-nowrap">
          {copied ? '\u2713 Copied' : 'Copy'}
        </button>
      </div>

      {/* Code with syntax highlighting */}
      <div className="flex-1 overflow-auto min-w-0">
        <SyntaxHighlighter
          language={lang.syntax}
          style={oneDark}
          showLineNumbers
          lineNumberStyle={{ color: '#4a4a5a', fontSize: 11, minWidth: '2em', paddingRight: 12 }}
          customStyle={{ margin: 0, padding: 16, background: 'transparent', fontSize: 12, lineHeight: 1.6 }}
          wrapLongLines
        >
          {snippet}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
