'use client';

import { useState } from 'react';

const LANGUAGES = ['curl', 'Python', 'Node.js', 'PHP', 'Go', 'Ruby', 'Java'] as const;

interface Props {
  endpointPath: string;
  method: string;
  params: Record<string, unknown>;
}

function generateSnippet(lang: string, path: string, method: string, params: Record<string, unknown>): string {
  const url = `https://www.potal.app${path}`;
  const body = JSON.stringify(params, null, 2);

  switch (lang) {
    case 'curl':
      return `curl -X ${method} ${url} \\\n  -H "X-API-Key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${body}'`;
    case 'Python':
      return `import requests\n\nresponse = requests.${method.toLowerCase()}(\n    "${url}",\n    headers={"X-API-Key": "YOUR_API_KEY"},\n    json=${body.replace(/"/g, "'").replace(/null/g, "None").replace(/true/g, "True").replace(/false/g, "False")}\n)\nprint(response.json())`;
    case 'Node.js':
      return `const response = await fetch("${url}", {\n  method: "${method}",\n  headers: {\n    "X-API-Key": "YOUR_API_KEY",\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify(${body})\n});\nconst data = await response.json();\nconsole.log(data);`;
    case 'PHP':
      return `$response = Http::withHeaders([\n    'X-API-Key' => 'YOUR_API_KEY'\n])->${method.toLowerCase()}('${url}', ${body.replace(/"/g, "'")});\n\n$data = $response->json();`;
    case 'Go':
      return `resp, err := http.Post("${url}", "application/json", bytes.NewBuffer([]byte(\`${body}\`)))\nif err != nil { log.Fatal(err) }\ndefer resp.Body.Close()`;
    case 'Ruby':
      return `require 'net/http'\nrequire 'json'\n\nuri = URI("${url}")\nhttp = Net::HTTP.new(uri.host, uri.port)\nhttp.use_ssl = true\nreq = Net::HTTP::Post.new(uri)\nreq['X-API-Key'] = 'YOUR_API_KEY'\nreq.body = ${body}.to_json\nres = http.request(req)\nputs JSON.parse(res.body)`;
    case 'Java':
      return `HttpClient client = HttpClient.newHttpClient();\nHttpRequest request = HttpRequest.newBuilder()\n    .uri(URI.create("${url}"))\n    .header("X-API-Key", "YOUR_API_KEY")\n    .header("Content-Type", "application/json")\n    .POST(BodyPublishers.ofString("${body.replace(/"/g, '\\"')}"))\n    .build();\nHttpResponse<String> response = client.send(request, BodyHandlers.ofString());`;
    default:
      return '';
  }
}

export function CodeSnippetPanel({ endpointPath, method, params }: Props) {
  const [lang, setLang] = useState<string>('curl');
  const [copied, setCopied] = useState(false);
  const snippet = generateSnippet(lang, endpointPath, method, params);

  const copy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border-l border-slate-200 bg-slate-900 text-slate-100 flex flex-col w-80 flex-shrink-0">
      <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-700 overflow-x-auto">
        {LANGUAGES.map(l => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`text-xs px-2 py-1 rounded whitespace-nowrap ${lang === l ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-3">
        <pre className="text-xs font-mono whitespace-pre-wrap break-all leading-relaxed">{snippet}</pre>
      </div>
      <div className="p-2 border-t border-slate-700">
        <button onClick={copy} className="w-full text-xs py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300">
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>
    </div>
  );
}
