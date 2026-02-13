// app/legal/[slug]/page.tsx
import { notFound } from 'next/navigation';

const LEGAL_DOCS = {
  'terms': { title: 'Terms of Service', content: 'Terms content goes here...' },
  'privacy': { title: 'Privacy Policy', content: 'Privacy Policy content goes here...' },
  'cookie': { title: 'Cookie Policy', content: 'Cookie Policy content goes here...' },
  'privacy-settings': { title: 'Privacy Settings', content: 'Privacy Settings toggle goes here...' },
};

export default function LegalPage({ params }: { params: { slug: string } }) {
  const doc = LEGAL_DOCS[params.slug as keyof typeof LEGAL_DOCS];

  if (!doc) {
    notFound();
  }

  return (
    <div className="max-w-[800px] mx-auto px-6 py-16">
      <h1 className="text-3xl font-extrabold text-[#02122c] mb-8">{doc.title}</h1>
      <div className="prose prose-slate max-w-none">
        <p className="text-slate-600 leading-relaxed whitespace-pre-line">
          {doc.content}
          {/* [TODO] 실제 법적 고지 내용(HTML)을 여기에 렌더링 */}
        </p>
      </div>
    </div>
  );
}