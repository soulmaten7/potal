'use client';

export function DisclaimerBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-6">
      <div className="flex gap-2">
        <span className="text-amber-600 text-lg leading-none mt-0.5">&#9888;</span>
        <div className="text-sm text-amber-800">{children}</div>
      </div>
    </div>
  );
}

export function UpdateDate({ date }: { date: string }) {
  return (
    <p className="text-xs text-slate-400 mt-8 border-t border-slate-100 pt-4">
      Last updated: {date}
    </p>
  );
}

export function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline underline-offset-2">
      {children} <span className="text-xs">&#8599;</span>
    </a>
  );
}
