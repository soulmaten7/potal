import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-6">
        <span className="text-8xl font-black text-[#02122c]/10">404</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Page not found</h1>
      <p className="text-slate-500 text-sm mb-8 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="px-6 py-2.5 bg-[#02122c] text-white text-sm font-bold rounded-xl hover:bg-[#0a192f] transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/help"
          className="px-6 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors"
        >
          Help Center
        </Link>
      </div>
    </div>
  );
}
