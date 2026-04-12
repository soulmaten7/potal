'use client';

/**
 * SearchableSelect — CW34 custom dropdown with search + Popular group.
 * Replaces native <select> for country/category/currency fields in the
 * playground ParamsPanel.
 */

import { useEffect, useMemo, useRef, useState } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  group?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus search input when opening
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const searchLower = search.toLowerCase().trim();

  const filtered = useMemo(() => {
    if (!searchLower) return options;
    return options.filter(
      o =>
        o.label.toLowerCase().includes(searchLower) ||
        o.value.toLowerCase().includes(searchLower),
    );
  }, [options, searchLower]);

  // Split into popular + rest for rendering
  const popularItems = filtered.filter(o => o.group === 'popular');
  const restItems = filtered.filter(o => o.group !== 'popular');
  const hasPopular = popularItems.length > 0 && !searchLower;

  const selectedLabel = options.find(o => o.value === value)?.label;

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={rootRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full px-3 py-2 pr-8 rounded-lg border border-slate-200 text-[13px] bg-white focus:outline-none focus:border-[#F59E0B] text-left truncate"
      >
        {selectedLabel || <span className="text-slate-400">{placeholder}</span>}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]">
          ▼
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-slate-100">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full px-2 py-1.5 rounded-md border border-slate-200 text-[12px] focus:outline-none focus:border-[#F59E0B]"
            />
          </div>

          {/* Options list */}
          <ul className="max-h-[300px] overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-[12px] text-slate-400">
                No matches.
              </li>
            )}

            {hasPopular && (
              <>
                <li className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                  Popular
                </li>
                {popularItems.map(o => (
                  <li key={`pop-${o.value}`}>
                    <button
                      type="button"
                      onClick={() => handleSelect(o.value)}
                      className={`w-full text-left px-3 py-2 text-[12px] hover:bg-slate-50 cursor-pointer truncate ${
                        o.value === value ? 'bg-amber-50 font-bold text-[#02122c]' : 'text-slate-700'
                      }`}
                    >
                      {o.label}
                    </button>
                  </li>
                ))}
                <li className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                  All Countries
                </li>
              </>
            )}

            {restItems.map(o => (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => handleSelect(o.value)}
                  className={`w-full text-left px-3 py-2 text-[12px] hover:bg-slate-50 cursor-pointer truncate ${
                    o.value === value ? 'bg-amber-50 font-bold text-[#02122c]' : 'text-slate-700'
                  }`}
                >
                  {o.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
