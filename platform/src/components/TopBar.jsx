/**
 * TopBar controls: a collapsible search, a refresh button with honest
 * states, and the notification bell.
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, RefreshCw, Search, X } from './AnimatedIcons';

/* ── Search: a circle button until you focus it or type ─────────── */
export function TopSearch({ value, onChange, placeholder = 'Search' }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (open) ref.current?.focus();
    }, [open]);

    return (
        <div className="hidden md:flex items-center">
            <AnimatePresence initial={false} mode="popLayout">
                {open ? (
                    <motion.div
                        key="field"
                        initial={{ width: 40, opacity: 0 }}
                        animate={{ width: 240, opacity: 1 }}
                        exit={{ width: 40, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                        className="flex items-center gap-2 field-fill rounded-full pl-3 pr-2 py-1.5 overflow-hidden"
                    >
                        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <input
                            ref={ref}
                            type="text"
                            placeholder={placeholder}
                            value={value}
                            onChange={e => onChange(e.target.value)}
                            onBlur={() => { if (!value) setOpen(false); }}
                            className="bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 outline-none w-full"
                        />
                        {value && (
                            <button
                                onMouseDown={e => e.preventDefault()}
                                onClick={() => { onChange(''); }}
                                aria-label="Clear search"
                                className="p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <motion.button
                        key="button"
                        initial={{ width: 40, opacity: 0 }}
                        animate={{ width: 40, opacity: 1 }}
                        exit={{ width: 40, opacity: 0 }}
                        onClick={() => setOpen(true)}
                        aria-label="Search"
                        className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-white/60 dark:hover:bg-white/5 transition-colors"
                    >
                        <Search className="w-4 h-4" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ── Refresh: idle / spinning / done / failed ──────────────────── */
export function RefreshButton({ onRefresh, className = '' }) {
    const [state, setState] = useState('idle'); // idle | loading | done | error

    const run = async () => {
        if (state === 'loading') return;
        setState('loading');
        try {
            await onRefresh?.();
            setState('done');
            setTimeout(() => setState('idle'), 1600);
        } catch {
            setState('error');
            setTimeout(() => setState('idle'), 2200);
        }
    };

    const tones = {
        idle: 'text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5',
        loading: 'text-accent-500 bg-accent-500/10',
        done: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
        error: 'text-rose-600 dark:text-rose-400 bg-rose-500/10',
    };

    return (
        <button
            onClick={run}
            title={state === 'error' ? 'Could not refresh' : 'Refresh'}
            aria-label="Refresh"
            className={`p-2 rounded-full transition-colors ${tones[state]} ${className}`}
        >
            <motion.span
                animate={state === 'loading' ? { rotate: 360 } : { rotate: 0 }}
                transition={state === 'loading' ? { repeat: Infinity, duration: 0.9, ease: 'linear' } : { duration: 0.25 }}
                className="block"
            >
                {state === 'done'
                    ? <Check className="w-4 h-4" />
                    : state === 'error'
                        ? <X className="w-4 h-4" />
                        : <RefreshCw className="w-4 h-4" />}
            </motion.span>
        </button>
    );
}

/* ── Notification sound (generated, no asset to host) ──────────── */
let audioCtx = null;
export function playNotificationSound() {
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        audioCtx = audioCtx || new Ctx();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime;
        // two soft notes, like a chime
        [[880, 0], [1174.66, 0.09]].forEach(([freq, delay]) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(0.09, now + delay + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.28);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + 0.3);
        });
    } catch {
        /* audio is a nicety, never a blocker */
    }
}
