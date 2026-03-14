import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      {/* Large 404 with brand colors */}
      <div className="mb-8 relative">
        <span className="text-[140px] sm:text-[180px] font-black leading-none select-none" style={{ color: 'rgba(2,18,44,0.05)' }}>
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div>
            <span className="text-5xl font-extrabold tracking-tight">
              <span className="text-[#02122c]">P</span>
              <span className="text-[#F59E0B]">O</span>
              <span className="text-[#02122c]">TAL</span>
            </span>
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-3">
        This page doesn&apos;t exist
      </h1>
      <p className="text-slate-500 text-sm mb-8 max-w-md leading-relaxed">
        Looks like you&apos;ve crossed a border we don&apos;t have data for yet.
        Let&apos;s get you back to calculating duties.
      </p>

      <div className="flex gap-3 flex-wrap justify-center">
        <Link
          href="/"
          className="px-6 py-2.5 bg-[#02122c] text-white text-sm font-bold rounded-xl hover:bg-[#0a2540] transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/developers"
          className="px-6 py-2.5 bg-[#F59E0B] text-[#02122c] text-sm font-bold rounded-xl hover:bg-[#e8930a] transition-colors"
        >
          Try the API
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
