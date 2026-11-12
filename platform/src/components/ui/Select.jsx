/**
 * Select — custom dropdown in our design system.
 *
 * The menu renders through a portal with fixed positioning, so it is never
 * clipped by a card, a scroll area or the portal shell (a native
 * absolutely-positioned menu is cut off by any overflow:hidden ancestor).
 */
import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown } from '../AnimatedIcons';

export default function Select({
    value,
    onChange,
    options = [],          // [{ value, label, hint? }] or ['string']
    placeholder = 'Select',
    className = '',
    triggerClassName = '',
    disabled = false,
    label = null,
    menuWidth = 'match',   // 'match' | number
}) {
    const [open, setOpen] = useState(false);
    const [rect, setRect] = useState(null);
    const triggerRef = useRef(null);
    const menuRef = useRef(null);

    const normalised = options.map(o =>
        typeof o === 'string' ? { value: o, label: o.replace(/_/g, ' ') } : o
    );
    const selected = normalised.find(o => o.value === value);

    const place = useCallback(() => {
        const el = triggerRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const width = menuWidth === 'match' ? r.width : menuWidth;
        const estimated = Math.min(280, Math.max(180, normalised.length * 38 + 16));
        const openUp = r.bottom + estimated > window.innerHeight && r.top > estimated;
        setRect({
            left: Math.min(Math.max(8, r.left), window.innerWidth - width - 8),
            width,
            top: openUp ? undefined : r.bottom + 6,
            bottom: openUp ? window.innerHeight - r.top + 6 : undefined,
            maxHeight: Math.min(280, openUp ? r.top - 16 : window.innerHeight - r.bottom - 16),
        });
    }, [normalised.length, menuWidth]);

    useLayoutEffect(() => {
        if (open) place();
    }, [open, place]);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e) => {
            if (menuRef.current?.contains(e.target)) return;
            if (triggerRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        const onScroll = () => place();
        const onResize = () => setOpen(false);
        document.addEventListener('mousedown', onDoc);
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onResize);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onResize);
        };
    }, [open, place]);

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
                        {normalised.length === 0 && (
                            <div className="px-3 py-3 text-sm text-gray-400">No options</div>
                        )}
                        {normalised.map(o => {
                            const isSelected = o.value === value;
                            return (
                                <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => { onChange(o.value); setOpen(false); }}
                                    className={`
                                        w-full flex items-center justify-between gap-3
                                        px-3 py-2.5 rounded-xl text-sm text-left
                                        transition-colors
                                        ${isSelected
                                            ? 'bg-accent-500/10 text-accent-600 dark:text-accent-400'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}
                                    `}
                                >
                                    <span>
                                        {o.label}
                                        {o.hint && <span className="block text-xs text-gray-400">{o.hint}</span>}
                                    </span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-accent-500 flex-shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className={`relative ${className}`}>
            {label && <label className="text-xs text-gray-500 mb-1 block">{label}</label>}
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={() => setOpen(v => !v)}
                className={`
                    w-full flex items-center justify-between gap-2
                    field-fill
                    rounded-full px-4 py-2.5 text-sm text-left
                    text-gray-900 dark:text-white
                    outline-none
                    transition-all duration-150
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${triggerClassName}
                `}
            >
                <span className={selected ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
                    {selected ? selected.label : placeholder}
                </span>
                <motion.div
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="flex-shrink-0"
                >
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                </motion.div>
            </button>

            {typeof document !== 'undefined' && createPortal(menu, document.body)}
        </div>
    );
}
