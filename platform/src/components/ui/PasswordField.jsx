/**
 * PasswordField — password input with a live strength indicator.
 *
 * Strength is shown as a 4-segment meter plus the rules that are not yet
 * met, so the user knows exactly what to change. Colours are semantic:
 * red (weak) -> orange -> amber (fair) -> green (strong).
 */
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Eye, EyeOff, X } from '../AnimatedIcons';

const RULES = [
    { id: 'len', label: 'At least 10 characters', test: v => v.length >= 10 },
    { id: 'case', label: 'Upper and lower case', test: v => /[a-z]/.test(v) && /[A-Z]/.test(v) },
    { id: 'num', label: 'A number', test: v => /\d/.test(v) },
    { id: 'sym', label: 'A symbol', test: v => /[^A-Za-z0-9]/.test(v) },
];

/** 0-4 score with a label and a semantic colour. */
export function scorePassword(value) {
    if (!value) return { score: 0, label: 'Empty', tone: 'neutral' };

    let score = 0;
    if (value.length >= 10) score++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    if (value.length >= 16) score = Math.min(4, score + 1);

    const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const tones = ['danger', 'danger', 'warning', 'progress', 'success'];
    return { score, label: labels[score], tone: tones[score] };
}

const SEGMENT_COLOURS = {
    neutral: 'bg-gray-200 dark:bg-white/15',
    danger: 'bg-rose-500',
    warning: 'bg-amber-400',
    progress: 'bg-accent-500',
    success: 'bg-emerald-500',
};

const LABEL_COLOURS = {
    neutral: 'text-gray-400',
    danger: 'text-rose-600 dark:text-rose-400',
    warning: 'text-amber-600 dark:text-amber-400',
    progress: 'text-accent-600 dark:text-accent-400',
    success: 'text-emerald-600 dark:text-emerald-400',
};

export default function PasswordField({
    value,
    onChange,
    id = 'password',
    label = 'Password',
    placeholder = 'Create a strong password',
    showMeter = true,
    autoComplete = 'new-password',
    className = '',
}) {
    const [visible, setVisible] = useState(false);
    const { score, label: strengthLabel, tone } = useMemo(() => scorePassword(value), [value]);
    const met = RULES.map(r => ({ ...r, ok: r.test(value || '') }));

    return (
        <div className={className}>
            <label htmlFor={id} className="text-xs text-gray-500 mb-1 block">{label}</label>
            <div className="relative">
                <input
                    id={id}
                    type={visible ? 'text' : 'password'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    className="w-full field-fill rounded-full py-3 px-5 pr-12 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                />
                <button
                    type="button"
                    onClick={() => setVisible(v => !v)}
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                    {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>

            {showMeter && value?.length > 0 && (
                <div className="mt-2.5 space-y-2">
                    {/* 4-segment meter */}
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1.5 flex-1" role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={4} aria-label="Password strength">
                            {[0, 1, 2, 3].map(i => (
                                <motion.span
                                    key={i}
                                    className={`h-1.5 flex-1 rounded-full ${i < score ? SEGMENT_COLOURS[tone] : 'bg-gray-200 dark:bg-white/10'}`}
                                    initial={false}
                                    animate={{ opacity: i < score ? 1 : 0.6 }}
                                    transition={{ duration: 0.2 }}
                                />
                            ))}
                        </div>
                        <span className={`text-[11px] font-medium ${LABEL_COLOURS[tone]}`}>{strengthLabel}</span>
                        <span className="text-[11px] text-gray-400 tabular-nums">{value.length} chars</span>
                    </div>

                    {/* unmet rules */}
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                        {met.map(r => (
                            <li key={r.id} className={`flex items-center gap-1.5 text-[11px] ${r.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                                {r.ok
                                    ? <Check className="w-3 h-3 flex-shrink-0" />
                                    : <X className="w-3 h-3 flex-shrink-0" />}
                                {r.label}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
