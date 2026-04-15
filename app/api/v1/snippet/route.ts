/**
 * CW38: Server-side code snippet generation via httpsnippet.
 * httpsnippet uses Node.js fs/http modules — must run server-side.
 */
import { NextRequest, NextResponse } from 'next/server';
import { HTTPSnippet } from 'httpsnippet';

export async function POST(req: NextRequest) {
  try {
    const { target, client, method, url, params } = await req.json();

    const snippet = new HTTPSnippet({
      method: (method || 'POST').toUpperCase(),
      url: url || 'https://www.potal.app/api/v1/classify',
      httpVersion: 'HTTP/1.1',
      headers: [
        { name: 'X-API-Key', value: 'YOUR_API_KEY' },
        { name: 'Content-Type', value: 'application/json' },
      ],
      postData: {
        mimeType: 'application/json',
        text: JSON.stringify(params || {}, null, 2),
      },
    });

    const result = snippet.convert(target || 'shell', client || 'curl');
    const code = typeof result === 'string' ? result : Array.isArray(result) ? result[0] : String(result ?? '');

    return NextResponse.json({ code });
  } catch (e) {
    return NextResponse.json({ code: `// Error: ${e instanceof Error ? e.message : 'generation failed'}` });
  }
}
