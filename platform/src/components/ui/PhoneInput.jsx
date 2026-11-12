/**
 * PhoneInput — international number with a real flag picker.
 *
 * Same production approach as hmcp's InternationalPhoneInput: libphonenumber
 * (max metadata) gives every country and calling code, react-country-flag
 * renders real SVG flags. The dropdown is searchable; `onChange` always
 * receives a normalized E.164 number (e.g. "+26771234567").
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import CountryFlag from 'react-country-flag';
import { Check, ChevronDown, Search } from '../AnimatedIcons';
import {
    DEFAULT_PHONE_COUNTRY,
    getDefaultPhoneCountry,
    getPhoneCountries,
    normalizePhoneNumber,
    parsePhone,
} from '../../lib/phone';

const COUNTRY_OPTIONS = getPhoneCountries();

export default function PhoneInput({
    value = '',
    onChange,
    id,
    autoComplete = 'tel',
    placeholder = '71 234 567',
    className = '',
}) {
    const rootRef = useRef(null);
    const inputRef = useRef(null);
    const initial = value ? parsePhone(value, DEFAULT_PHONE_COUNTRY) : null;
    const [country, setCountry] = useState(initial?.country || getDefaultPhoneCountry() || DEFAULT_PHONE_COUNTRY);
    const [display, setDisplay] = useState(() => {
        if (!value || !initial) return '';
        // Compact national display: the pill on the left already carries the
        // calling code, so strip a duplicated "+267" from the stored value.
        const code = initial.countryCallingCode || '';
        let national = initial.formatNational();
        if (code) national = national.replace(new RegExp(`^[\\s(+]*\\+?${code}[\\s)\\-\\.]*`), '') || national;
        return national;
    });
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    /* Keep the country pill in sync with the stored number. */
    useEffect(() => {
        if (!value) return;
        const parsed = parsePhone(value, country)?.country;
        if (parsed && parsed !== country) setCountry(parsed);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    useEffect(() => {
        if (!value) setDisplay('');
    }, [value]);

    useEffect(() => {
        const onDoc = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) { setOpen(false); setQuery(''); }
        };
        const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); setQuery(''); } };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('touchstart', onDoc);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('touchstart', onDoc);
            document.removeEventListener('keydown', onKey);
        };
    }, []);

    const active = useMemo(
        () => COUNTRY_OPTIONS.find(c => c.code === country) || { code: country || DEFAULT_PHONE_COUNTRY, name: country, callingCode: '' },
        [country]
    );

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return COUNTRY_OPTIONS;
        return COUNTRY_OPTIONS.filter(c =>
            c.name.toLowerCase().includes(q)
            || c.code.toLowerCase().includes(q)
            || c.callingCode.toLowerCase().includes(q)
        );
    }, [query]);

    const pickCountry = (code) => {
        setCountry(code);
        setOpen(false);
        setQuery('');
        if (display) {
            const normalized = normalizePhoneNumber(display, code);
            if (normalized) {
                onChange?.(normalized);
                const parsed = parsePhone(normalized, code);
                setDisplay(parsed ? parsed.formatNational() : display);
            }
        }
        requestAnimationFrame(() => inputRef.current?.focus());
    };

    const handleInput = (e) => {
        const next = e.target.value;
        // Strip a duplicated leading calling code as the user types: the pill
        // already shows it, so "+267 77..." becomes "77..." live.
        const code = active.callingCode.replace('+', '');
        let cleaned = next;
        if (code) {
            const digits = cleaned.replace(/\D/g, '');
            if (digits.startsWith(code)) {
                cleaned = cleaned.replace(new RegExp(`^[\\s(+]*\\+?${code}[\\s)\\-\\.]*`), '') || digits.slice(code.length);
            }
        }
        setDisplay(cleaned);
        const normalized = normalizePhoneNumber(cleaned, country) || cleaned;
        onChange?.(normalized);
    };

    return (
        <div ref={rootRef} className={`flex items-center gap-2 ${className}`}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label="Select country"
                className="field-fill shrink-0 flex items-center gap-1.5 rounded-full pl-3 pr-2 py-2.5 text-sm text-gray-900 dark:text-white hover:opacity-80 transition-opacity"
            >
                <CountryFlag
                    countryCode={active.code}
                    svg
                    style={{ width: '1.25rem', height: '0.9rem', borderRadius: '0.2rem', flexShrink: 0 }}
                />
                <span className="text-xs text-gray-500 dark:text-white/60 whitespace-nowrap">{active.callingCode}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            <div className="flex-1 min-w-0 relative">
                <input
                    ref={inputRef}
                    id={id}
                    type="tel"
                    inputMode="tel"
                    autoComplete={autoComplete}
                    value={display}
                    onChange={handleInput}
                    placeholder={placeholder}
                    className="field-fill w-full rounded-full py-3 px-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                />

                {open && (
                    <div className="absolute left-0 top-full mt-1.5 z-50 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#111] shadow-xl">
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
                                    key={c.code}
                                    type="button"
                                    role="option"
                                    aria-selected={c.code === country}
                                    onClick={() => pickCountry(c.code)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-left transition-colors ${c.code === country
                                        ? 'bg-accent-500/10 text-accent-600 dark:text-accent-300'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                >
                                    <CountryFlag
                                        countryCode={c.code}
                                        svg
                                        style={{ width: '1.2rem', height: '0.85rem', borderRadius: '0.2rem', flexShrink: 0 }}
                                    />
                                    <span className="flex-1 truncate">{c.name}</span>
                                    <span className="text-xs text-gray-400">{c.callingCode}</span>
                                    {c.code === country && <Check className="w-3.5 h-3.5 text-accent-500" />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
