'use client';

/**
 * CodeCopyModal — CW24 Sprint 2
 *
 * 3가지 복사 옵션 팝업 (결정 4 / HOMEPAGE_REDESIGN_SPEC.md 251~256):
 *   1. 🧩 Embed — iframe one-liner
 *   2. 💻 API — cURL / Python / Node
 *   3. 🔗 Link — shareable URL
 *
 * Accessibility:
 *   - role="dialog", aria-modal="true", aria-labelledby
 *   - ESC closes
 *   - Outside click closes
 *   - X button closes
 *
 * 로그인 게이트는 Sprint 5 (CW27) 에서 추가. 현재는 모달만 열린다.
 */

import { useEffect, useRef, useState } from 'react';

export interface CodeCopyModalProps {
  open: boolean;
  onClose: () => void;
  scenarioId: string;
  fieldType: 'input' | 'result';
  fieldKey: string;
  fieldValue?: string | number;
  inputs?: Record<string, string | number | undefined>;
}

type Tab = 'embed' | 'api' | 'link';
type ApiLang = 'curl' | 'python' | 'node';

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'embed', label: 'Embed', icon: '🧩' },
  { id: 'api', label: 'API', icon: '💻' },
  { id: 'link', label: 'Link', icon: '🔗' },
];

function buildEmbedCode(scenarioId: string, inputs: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(inputs)) {
    if (v !== undefined && v !== '') params.set(k, String(v));
  }
  const qs = params.toString();
  const src = `https://widget.potal.app/${scenarioId}${qs ? '?' + qs : ''}`;
  return `<iframe
  src="${src}"
  width="100%"
  height="520"
  frameborder="0"
  title="POTAL landed cost widget"
></iframe>`;
}

function buildApiCurl(scenarioId: string, inputs: Record<string, string | number | undefined>): string {
  const body = JSON.stringify({ scenarioId, inputs }, null, 2);
  return `curl -X POST https://api.potal.app/v1/demo/scenario \\
  -H "Content-Type: application/json" \\
  -d '${body}'`;
}

function buildApiPython(scenarioId: string, inputs: Record<string, string | number | undefined>): string {
  const body = JSON.stringify({ scenarioId, inputs }, null, 4);
  return `import requests

r = requests.post(
    "https://api.potal.app/v1/demo/scenario",
    json=${body.replace(/\n/g, '\n    ')},
)
print(r.json())`;
}

function buildApiNode(scenarioId: string, inputs: Record<string, string | number | undefined>): string {
  const body = JSON.stringify({ scenarioId, inputs }, null, 2);
  return `const res = await fetch('https://api.potal.app/v1/demo/scenario', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(${body}),
});
console.log(await res.json());`;
}

function buildShareLink(scenarioId: string, inputs: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams({ type: scenarioId });
  for (const [k, v] of Object.entries(inputs)) {
    if (v !== undefined && v !== '') params.set(k, String(v));
  }
  return `https://www.potal.app/?${params.toString()}`;
}

export default function CodeCopyModal({
  open,
  onClose,
  scenarioId,
  fieldType: _fieldType,
  fieldKey,
  fieldValue: _fieldValue,
  inputs = {},
}: CodeCopyModalProps) {
  const [tab, setTab] = useState<Tab>('embed');
  const [apiLang, setApiLang] = useState<ApiLang>('curl');
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // ESC + focus management
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    // Lock body scroll
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = original;
    };
  }, [open, onClose]);

  // Reset copied flag when modal opens or tab changes
  useEffect(() => {
    setCopied(false);
  }, [tab, apiLang, open]);

  if (!open) return null;

  const embedCode = buildEmbedCode(scenarioId, inputs);
  const apiCode =
    apiLang === 'curl'
      ? buildApiCurl(scenarioId, inputs)
      : apiLang === 'python'
        ? buildApiPython(scenarioId, inputs)
        : buildApiNode(scenarioId, inputs);
  const shareLink = buildShareLink(scenarioId, inputs);

  const currentContent = tab === 'embed' ? embedCode : tab === 'api' ? apiCode : shareLink;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="code-copy-title"
        className="w-full max-w-[720px] max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 id="code-copy-title" className="text-[18px] font-extrabold text-[#02122c] leading-none mb-1">
              Copy this for {fieldKey}
            </h2>
            <p className="text-[12px] text-slate-500">
              Use the code anywhere — your store, your server, or share with a teammate.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <span aria-hidden="true" className="text-[18px] leading-none">×</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-slate-200">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-selected={tab === t.id}
              role="tab"
              className={`px-4 py-2.5 text-[13px] font-bold rounded-t-lg transition-colors ${
                tab === t.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span aria-hidden="true" className="mr-1.5">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-6 py-5">
          {tab === 'embed' && (
            <>
              <p className="text-[13px] text-slate-600 mb-3 leading-relaxed">
                Paste this single <code className="px-1.5 py-0.5 bg-slate-100 rounded text-[12px]">&lt;iframe&gt;</code> into your store&apos;s product page HTML.
                Works on Shopify, WooCommerce, Squarespace, and any site that allows HTML.
              </p>
            </>
          )}

          {tab === 'api' && (
            <>
              <div className="flex gap-1 mb-3">
                {(['curl', 'python', 'node'] as ApiLang[]).map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setApiLang(lang)}
                    className={`px-3 py-1.5 text-[12px] font-bold rounded-md transition-colors ${
                      apiLang === lang
                        ? 'bg-[#F59E0B] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lang === 'curl' ? 'cURL' : lang === 'python' ? 'Python' : 'Node.js'}
                  </button>
                ))}
              </div>
              <p className="text-[12px] text-slate-500 mb-3 leading-relaxed">
                Call the POTAL API directly from your server or script.
              </p>
            </>
          )}

          {tab === 'link' && (
            <p className="text-[13px] text-slate-600 mb-3 leading-relaxed">
              Share this URL with a teammate or your developer. Opening the link
              prefills the demo with the same inputs you&apos;re seeing now.
            </p>
          )}

          <pre className="bg-[#0a1628] text-slate-100 rounded-xl p-4 overflow-auto text-[12px] leading-relaxed font-mono whitespace-pre-wrap break-all max-h-[320px]">
            {currentContent}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <span className="text-[11px] text-slate-500">
            {tab === 'embed'
              ? 'HTML snippet'
              : tab === 'api'
                ? `${apiLang} request`
                : 'Shareable URL'}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className={`px-5 py-2.5 rounded-lg text-[13px] font-bold transition-colors ${
              copied
                ? 'bg-emerald-500 text-white'
                : 'bg-[#02122c] text-white hover:bg-[#0a1e3d]'
            }`}
          >
            {copied ? '✓ Copied!' : '📋 Copy to clipboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
