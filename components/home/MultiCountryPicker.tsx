'use client';

/**
 * MultiCountryPicker — CW31-HF1
 *
 * Multi-select country dropdown with:
 *   - Searchable checkbox list
 *   - Selected tag chips (with × to remove)
 *   - Max selection cap (disables further checkboxes when reached)
 *   - Keyboard + click support
 *
 * Used by the forwarder scenario's "Destinations" field so users can pick
 * up to 5 destinations in a single calculation.
 */

import { useMemo, useRef, useState, useEffect } from 'react';

export interface CountryOption {
  value: string;
  label: string;
}

export interface MultiCountryPickerProps {
  selected: string[];
  options: CountryOption[];
  max: number;
  onChange: (next: string[]) => void;
  placeholder?: string;
}

export default function MultiCountryPicker({
  selected,
  options,
  max,
  onChange,
  placeholder = 'Select up to 5 destinations…',
}: MultiCountryPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

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

  const searchLower = search.toLowerCase().trim();
  const filtered = useMemo(() => {
    if (!searchLower) return options;
    return options.filter(
      o =>
        o.label.toLowerCase().includes(searchLower) ||
        o.value.toLowerCase().includes(searchLower)
    );
  }, [options, searchLower]);

  const selectedSet = new Set(selected);
  const atCap = selected.length >= max;

  const toggle = (value: string) => {
    if (selectedSet.has(value)) {
      onChange(selected.filter(v => v !== value));
    } else if (!atCap) {
      onChange([...selected, value]);
    }
  };

  const removeChip = (value: string) => {
    onChange(selected.filter(v => v !== value));
  };

  const labelFor = (code: string) =>
    options.find(o => o.value === code)?.label || code;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full min-h-[38px] px-3 py-2 rounded-lg border border-slate-200 bg-white text-left text-[13px] focus:outline-none focus:border-[#F59E0B] flex items-center gap-1.5 flex-wrap"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected.length === 0 ? (
          <span className="text-slate-400">{placeholder}</span>
        ) : (
          selected.map(code => (
            <span
              key={code}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-[#02122c] text-[11px] font-bold"
            >
              {code}
              <span
                role="button"
                tabIndex={0}
                onClick={e => {
                  e.stopPropagation();
                  removeChip(code);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    removeChip(code);
                  }
                }}
                aria-label={`Remove ${labelFor(code)}`}
                className="text-slate-500 hover:text-red-600 cursor-pointer"
              >
                ×
              </span>
            </span>
          ))
        )}
        <span className="ml-auto text-slate-400 text-[11px]">
          {selected.length}/{max}
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg flex flex-col">
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search countries…"
              className="w-full px-2 py-1.5 rounded-md border border-slate-200 text-[12px] focus:outline-none focus:border-[#F59E0B]"
              autoFocus
            />
          </div>
          <ul role="listbox" className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-[12px] text-slate-400">
                No countries match.
              </li>
            )}
            {filtered.map(opt => {
              const checked = selectedSet.has(opt.value);
              const disabled = !checked && atCap;
              return (
                <li key={opt.value}>
                  <label
                    className={`flex items-center gap-2 px-3 py-2 text-[12px] ${
                      disabled
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-slate-700 cursor-pointer hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggle(opt.value)}
                      className="w-3.5 h-3.5 accent-[#F59E0B]"
                    />
                    <span className="font-mono text-[11px] text-slate-500 w-6">
                      {opt.value}
                    </span>
                    <span className="flex-1 truncate">{opt.label}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          {atCap && (
            <div className="px-3 py-1.5 text-[11px] text-amber-700 border-t border-slate-100 bg-amber-50">
              Max {max} destinations reached. Remove one to add another.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
