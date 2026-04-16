import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Reusable breadcrumb navigation — RapidAPI-style location indicator.
 * Each segment is clickable (except the last, which is the current page).
 *
 * Usage:
 *   <Breadcrumb items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Guides', href: '/guides' },
 *     { label: 'Customs Filing Guide' },
 *   ]} />
 */
interface BreadcrumbProps {
  items: BreadcrumbItem[];
  /** 'light' for white backgrounds, 'dark' for dark backgrounds */
  variant?: 'light' | 'dark';
}

export function Breadcrumb({ items, variant = 'light' }: BreadcrumbProps) {
  if (!items.length) return null;

  const isDark = variant === 'dark';
  const sepColor = isDark ? 'text-white/30' : 'text-slate-300';
  const linkColor = isDark ? 'text-white/50 hover:text-white/80' : 'text-slate-400 hover:text-blue-600';
  const activeColor = isDark ? 'text-white/90 font-medium' : 'text-slate-600 font-medium';

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-1.5 text-[13px] mb-4 ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className={sepColor}>/</span>}
            {isLast || !item.href ? (
              <span className={activeColor}>{item.label}</span>
            ) : (
              <Link href={item.href} className={`${linkColor} transition-colors`}>
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
