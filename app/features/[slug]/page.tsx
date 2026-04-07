import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { FEATURES, CATEGORY_ICONS, getAllFeatureSlugs, getFeatureBySlug, type Feature } from '../features-data';
import { getGuideBySlug, type FieldSpec } from '../features-guides';
import CopyButton from './CopyButton';
import FeatureToolWidget from './FeatureToolWidget';

// ─── Static Generation ──────────────────────────────

export function generateStaticParams() {
  return getAllFeatureSlugs().map((slug) => ({ slug }));
}

// ─── SEO Metadata ───────────────────────────────────

type MetadataProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { slug } = await params;
  const feature = getFeatureBySlug(slug);
  if (!feature) return { title: 'Feature Not Found | POTAL' };

  const guide = getGuideBySlug(slug);
  const desc = guide?.detailedDescription || feature.description;
  const truncated = desc.length > 160 ? desc.slice(0, 157) + '...' : desc;

  return {
    title: `${feature.name} — Free Cross-Border Tool | POTAL`,
    description: truncated,
    openGraph: {
      title: `${feature.name} — Free Cross-Border Tool | POTAL`,
      description: truncated,
      type: 'article',
      url: `https://potal.app/features/${slug}`,
    },
  };
}

// ─── Page Component ─────────────────────────────────

type PageProps = { params: Promise<{ slug: string }> };

export default async function FeatureGuidePage({ params }: PageProps) {
  const { slug } = await params;
  const feature = getFeatureBySlug(slug);
  if (!feature) notFound();

  const guide = getGuideBySlug(slug);
  const icon = CATEGORY_ICONS[feature.category];
  const description = guide?.detailedDescription || feature.description;
  const steps = guide?.howToUse || [];
  const requiredFields: FieldSpec[] = guide?.requiredFields || [];
  const accuracyTips = guide?.accuracyTips || [];
  const commonMistakes = guide?.commonMistakes || [];
  const requiredCount = requiredFields.filter(f => f.required).length;
  const totalFields = requiredFields.length;
  const related = (guide?.relatedFeatures || [])
    .map(s => FEATURES.find(f => f.slug === s))
    .filter((f): f is Feature => !!f)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Back link */}
        <Link
          href="/features"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#02122c] transition-colors mb-8"
        >
          <span aria-hidden="true">&larr;</span> Back to Features
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{icon}</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#02122c]">{feature.name}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700">Active</span>
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-600">{feature.category}</span>
            {feature.priority === 'MUST' && (
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700">MUST</span>
            )}
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700">FREE</span>
          </div>
        </div>

        {/* What it does */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-[#02122c] mb-3">What it does</h2>
          <p className="text-slate-600 leading-relaxed">{description}</p>
        </section>

        {/* Required Fields for 100% Accuracy */}
        {requiredFields.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-[#02122c]">Required Fields for 100% Accuracy</h2>
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700">
                {requiredCount} required / {totalFields} total
              </span>
            </div>

            {/* Field Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-2.5 font-bold text-slate-500 text-xs uppercase">Field</th>
                      <th className="text-left px-4 py-2.5 font-bold text-slate-500 text-xs uppercase">Type</th>
                      <th className="text-center px-4 py-2.5 font-bold text-slate-500 text-xs uppercase">Required</th>
                      <th className="text-left px-4 py-2.5 font-bold text-slate-500 text-xs uppercase hidden sm:table-cell">Description</th>
                      <th className="text-left px-4 py-2.5 font-bold text-slate-500 text-xs uppercase hidden md:table-cell">Example</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requiredFields.map((field) => (
                      <tr key={field.name} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5">
                          <code className="text-xs font-mono font-bold text-[#02122c] bg-slate-100 px-1.5 py-0.5 rounded">{field.name}</code>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{field.type}</td>
                        <td className="px-4 py-2.5 text-center">
                          {field.required ? (
                            <span className="inline-block w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs font-bold leading-5 text-center">!</span>
                          ) : (
                            <span className="text-xs text-slate-400">opt</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-600 hidden sm:table-cell">
                          {field.description}
                          {field.tip && <span className="block text-[11px] text-amber-600 mt-0.5">{field.tip}</span>}
                        </td>
                        <td className="px-4 py-2.5 hidden md:table-cell">
                          <code className="text-[11px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">{field.example}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Accuracy Tips */}
            {accuracyTips.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                <h3 className="text-sm font-bold text-emerald-800 mb-2">Tips for Best Accuracy</h3>
                <ul className="space-y-1.5">
                  {accuracyTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-emerald-700">
                      <span className="text-emerald-500 mt-0.5 flex-shrink-0">&#10003;</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Common Mistakes */}
            {commonMistakes.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-red-800 mb-2">Common Mistakes</h3>
                <ul className="space-y-1.5">
                  {commonMistakes.map((mistake, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-red-700">
                      <span className="text-red-400 mt-0.5 flex-shrink-0">&#10007;</span>
                      <span>{mistake}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* How to use it */}
        {steps.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-[#02122c] mb-4">How to use it</h2>
            <div className="space-y-4">
              {steps.map((s) => (
                <div key={s.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#02122c] text-white flex items-center justify-center text-sm font-bold">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#02122c] text-sm">{s.title}</h3>
                    <p className="text-slate-500 text-sm mt-0.5">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* API Reference */}
        {(guide?.apiEndpoint || feature.apiEndpoint) && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-[#02122c] mb-4">API Reference</h2>

            <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
              <div className="flex items-center gap-2 mb-1">
                {guide?.apiMethod && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded bg-indigo-100 text-indigo-700">{guide.apiMethod}</span>
                )}
                <code className="text-sm font-mono text-[#02122c] font-bold">{guide?.apiEndpoint || feature.apiEndpoint}</code>
              </div>
            </div>

            {guide?.requestExample && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-500">Request</span>
                  <CopyButton text={guide.requestExample} />
                </div>
                <pre className="bg-[#0a1628] text-slate-300 rounded-xl p-4 overflow-x-auto text-xs leading-relaxed">
                  <code>{guide.requestExample}</code>
                </pre>
              </div>
            )}

            {guide?.responseExample && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-500">Response</span>
                  <CopyButton text={guide.responseExample} />
                </div>
                <pre className="bg-[#0a1628] text-emerald-300 rounded-xl p-4 overflow-x-auto text-xs leading-relaxed">
                  <code>{guide.responseExample}</code>
                </pre>
              </div>
            )}

            {guide?.curlExample && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-500">cURL</span>
                  <CopyButton text={guide.curlExample} />
                </div>
                <pre className="bg-[#0a1628] text-amber-300 rounded-xl p-4 overflow-x-auto text-xs leading-relaxed">
                  <code>{guide.curlExample}</code>
                </pre>
              </div>
            )}
          </section>
        )}

        {/* Related Features */}
        {related.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-[#02122c] mb-4">Related Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/features/${r.slug}`}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:border-[#F59E0B] hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{CATEGORY_ICONS[r.category]}</span>
                    <span className="text-sm font-bold text-[#02122c]">{r.name}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{r.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Try it live */}
        <FeatureToolWidget slug={slug} />

        {/* Having issues? */}
        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-[#02122c] mb-4">Having issues?</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/community/new?feature=${feature.id}&type=bug`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-bold hover:bg-red-100 transition-colors"
            >
              <span>🐛</span> Report a Bug
            </Link>
            <Link
              href={`/community/new?feature=${feature.id}&type=question`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm font-bold hover:bg-blue-100 transition-colors"
            >
              <span>❓</span> Ask a Question
            </Link>
            <Link
              href={`/community/new?feature=${feature.id}&type=suggestion`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-sm font-bold hover:bg-amber-100 transition-colors"
            >
              <span>💡</span> Suggest Improvement
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
