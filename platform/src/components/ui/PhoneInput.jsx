/**
 * PhoneInput — international number with a flag picker.
 *
 * The country list is a curated set with emoji flags and calling codes, so we
 * do not ship a heavy phone-parsing library. The dropdown is searchable and
 * renders through a portal so it is never clipped.
 */
import React, { useState, useRef, useEffect, useMemo, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Search } from '../AnimatedIcons';

/* Botswana first, then the countries CEDA entrants come from. */
export const COUNTRIES = [
    { code: 'BW', name: 'Botswana', dial: '+267' },
    { code: 'ZA', name: 'South Africa', dial: '+27' },
    { code: 'NA', name: 'Namibia', dial: '+264' },
    { code: 'ZW', name: 'Zimbabwe', dial: '+263' },
    { code: 'ZM', name: 'Zambia', dial: '+260' },
    { code: 'MZ', name: 'Mozambique', dial: '+258' },
    { code: 'TZ', name: 'Tanzania', dial: '+255' },
    { code: 'KE', name: 'Kenya', dial: '+254' },
    { code: 'UG', name: 'Uganda', dial: '+256' },
    { code: 'NG', name: 'Nigeria', dial: '+234' },
    { code: 'GH', name: 'Ghana', dial: '+233' },
    { code: 'GB', name: 'United Kingdom', dial: '+44' },
    { code: 'US', name: 'United States', dial: '+1' },
    { code: 'CA', name: 'Canada', dial: '+1' },
    { code: 'IN', name: 'India', dial: '+91' },
    { code: 'CN', name: 'China', dial: '+86' },
    { code: 'BR', name: 'Brazil', dial: '+55' },
    { code: 'PT', name: 'Portugal', dial: '+351' },
    { code: 'AU', name: 'Australia', dial: '+61' },
];

export const flagOf = (code) =>
    code ? code.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0))) : '';

const DEFAULT_COUNTRY = COUNTRIES[0];

export default function PhoneInput({
    value = '',
    onChange,
    country,
    onCountryChange,
    placeholder = '71 234 567',
    className = '',
    id,
    autoComplete = 'tel',
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [rect, setRect] = useState(null);
    const triggerRef = useRef(null);
    const listRef = useRef(null);

    const selected = useMemo(
        () => COUNTRIES.find(c => c.code === country) || DEFAULT_COUNTRY,
        [country]
    );

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return COUNTRIES;
        return COUNTRIES.filter(c =>
            c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q)
        );
    }, [query]);

    const place = useCallback(() => {
        const el = triggerRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        setRect({ left: Math.min(r.left, window.innerWidth - 300), top: r.bottom + 6, width: 300 });
    }, []);

    useLayoutEffect(() => { if (open) place(); }, [open, place]);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e) => {
            if (listRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open]);

    const pick = (c) => {
        onCountryChange?.(c.code);
        setOpen(false);
        setQuery('');
    };

    const menu = (
        <AnimatePresence>
            {open && rect && (
                <motion.div
                    ref={listRef}
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    style={{ position: 'fixed', left: rect.left, top: rect.top, width: rect.width, zIndex: 200 }}
                    className="rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#111] shadow-xl overflow-hidden"
                >
                    <div className="p-2 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <input
                            autoFocus
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search country"
                            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                        />
                    </div>
                    <div className="max-h-60 overflow-y-auto scrollbar-hide p-1.5">
                        {results.length === 0 && <p className="px-3 py-3 text-sm text-gray-400">No match</p>}
                        {results.map(c => (
                            <button
                                key={c.code + c.name}
                                type="button"
                                onClick={() => pick(c)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-left transition-colors ${c.code === selected.code
                                    ? 'bg-accent-500/10 text-accent-600 dark:text-accent-300'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                            >
                                <span className="text-base leading-none">{flagOf(c.code)}</span>
                                <span className="flex-1 truncate">{c.name}</span>
                                <span className="text-xs text-gray-400">{c.dial}</span>
                                {c.code === selected.code && <Check className="w-3.5 h-3.5 text-accent-500" />}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-label="Choose country"
                className="field-fill shrink-0 flex items-center gap-1.5 rounded-full pl-3 pr-2 py-2.5 text-sm text-gray-900 dark:text-white hover:opacity-80 transition-opacity"
            >
                <span className="text-base leading-none">{flagOf(selected.code)}</span>
                <span className="text-xs text-gray-500 dark:text-white/60">{selected.dial}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            <input
                id={id}
                type="tel"
                inputMode="tel"
                autoComplete={autoComplete}
                value={value}
                onChange={e => onChange?.(e.target.value)}
                placeholder={placeholder}
                className="field-fill flex-1 rounded-full py-3 px-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
            />

            {typeof document !== 'undefined' && createPortal(menu, document.body)}
        </div>
    );
}
