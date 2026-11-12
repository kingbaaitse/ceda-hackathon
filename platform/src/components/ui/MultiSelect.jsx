/**
 * MultiSelect — tag-style picker with animated chips, a free-text option
 * and a max-selection guard. The menu is portalled and fixed-positioned so
 * it is never clipped by a card or scroll area.
 */
import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, X } from '../AnimatedIcons';

export default function MultiSelect({
    value = [],
    onChange,
    options = [],
    placeholder = 'Select',
    max = null,
    className = '',
    allowOther = false,
    compact = false,
}) {
    const [open, setOpen] = useState(false);
    const [otherMode, setOtherMode] = useState(false);
    const [otherText, setOtherText] = useState('');
    const [rect, setRect] = useState(null);
    const triggerRef = useRef(null);
    const menuRef = useRef(null);

    const toggle = (val) => {
        if (value.includes(val)) {
            onChange(value.filter(v => v !== val));
        } else {
            if (max && value.length >= max) return;
            onChange([...value, val]);
        }
    };

    const addOther = () => {
        const t = otherText.trim();
        if (t && !value.includes(t) && (!max || value.length < max)) {
            onChange([...value, t]);
        }
        setOtherText('');
        setOtherMode(false);
    };

    const place = useCallback(() => {
        const el = triggerRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const estimated = Math.min(300, Math.max(180, options.length * 36 + 60));
        const openUp = r.bottom + estimated > window.innerHeight && r.top > estimated;
        setRect({
            left: Math.min(Math.max(8, r.left), window.innerWidth - r.width - 8),
            width: r.width,
            top: openUp ? undefined : r.bottom + 6,
            bottom: openUp ? window.innerHeight - r.top + 6 : undefined,
            maxHeight: Math.min(300, openUp ? r.top - 16 : window.innerHeight - r.bottom - 16),
        });
    }, [options.length]);

    useLayoutEffect(() => { if (open) place(); }, [open, place]);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e) => {
            if (menuRef.current?.contains(e.target)) return;
            if (triggerRef.current?.contains(e.target)) return;
            setOpen(false);
            setOtherMode(false);
        };
        const onScroll = () => place();
        document.addEventListener('mousedown', onDoc);
        window.addEventListener('scroll', onScroll, true);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            window.removeEventListener('scroll', onScroll, true);
        };
    }, [open, place]);

    const chips = value.map(v => options.find(o => o.value === v) || { value: v, label: v, custom: true });
    const atMax = max && value.length >= max;

    const menu = (
        <AnimatePresence>
            {open && rect && (
                <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        position: 'fixed',
                        left: rect.left,
                        top: rect.top,
                        bottom: rect.bottom,
                        width: rect.width,
                        maxHeight: rect.maxHeight,
                        zIndex: 200,
                    }}
                    className="overflow-y-auto scrollbar-hide bg-white dark:bg-[#111] border border-gray-100 dark:border-white/10 rounded-2xl shadow-xl"
                >
                    <div className="p-1.5 space-y-0.5">
                        {options.map(o => {
                            const isOn = value.includes(o.value);
                            return (
                                <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => toggle(o.value)}
                                    className={`
                                        w-full flex items-center justify-between gap-3
                                        px-3 py-2 rounded-xl text-sm text-left
                                        transition-colors
                                        ${isOn
                                            ? 'bg-accent-500/10 text-accent-600 dark:text-accent-400'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}
                                        ${atMax && !isOn ? 'opacity-40' : ''}
                                    `}
                                >
                                    <span>
                                        {o.label}
                                        {o.hint && <span className="block text-xs text-gray-400">{o.hint}</span>}
                                    </span>
                                    {isOn && <Check className="w-3.5 h-3.5 text-accent-500 flex-shrink-0" />}
                                </button>
                            );
                        })}
                        {allowOther && !otherMode && (
                            <button
                                type="button"
                                onClick={() => setOtherMode(true)}
                                className="w-full text-left px-3 py-2 rounded-xl text-sm text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-500/5"
                            >
                                + Add custom
                            </button>
                        )}
                        {allowOther && otherMode && (
                            <div className="p-2 flex gap-2">
                                <input
                                    autoFocus
                                    value={otherText}
                                    onChange={e => setOtherText(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOther(); } }}
                                    placeholder="Type and press Enter"
                                    className="flex-1 rounded-full field-fill py-2 px-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                                />
                                <button type="button" onClick={addOther} className="text-xs text-accent-600 px-2">Add</button>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className={`relative ${className}`}>
            <button
                ref={triggerRef}
                type="button"
                disabled={atMax && !open}
                onClick={() => setOpen(v => !v)}
                className={`
                    w-full min-h-[46px] flex flex-wrap items-center gap-1.5 text-left
                    field-fill rounded-2xl px-3 py-2
                    transition-all duration-150
                    ${atMax ? 'cursor-default' : 'cursor-pointer'}
                `}
            >
                {chips.length === 0 && (
                    <span className="text-sm text-gray-400">{placeholder}</span>
                )}
                {chips.map(c => (
                    <motion.span
                        key={c.value}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-accent-500/10 text-accent-600 dark:text-accent-400 ${compact ? '' : 'text-xs'}`}
                        onClick={(e) => { e.stopPropagation(); toggle(c.value); }}
                    >
                        {c.label}
                        <X className="w-3 h-3 opacity-60 hover:opacity-100" />
                    </motion.span>
                ))}
                {!atMax && (
                    <motion.span animate={{ rotate: open ? 180 : 0 }} className="ml-auto flex-shrink-0">
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    </motion.span>
                )}
            </button>

            {typeof document !== 'undefined' && createPortal(menu, document.body)}
        </div>
    );
}
