/**
 * Slider — custom range control in the CEDA design language.
 *
 * The native <input type="range"> stays on top (transparent) so pointer drag,
 * keyboard arrows and screen readers work natively; the visible track, fill
 * and thumb are drawn from state so we control the look completely.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function Slider({
    value,
    onChange,
    min = 0,
    max = 10,
    step = 1,
    label,
    hint,
    format = (v) => v,
    marks = null,
    tone = 'accent',   // accent | gold
    className = '',
    showBubble = true,
}) {
    const [dragging, setDragging] = useState(false);
    const [focused, setFocused] = useState(false);
    const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;

    const fill = tone === 'gold'
        ? 'bg-[#FAA61A]'
        : 'bg-accent-500';

    return (
        <div className={className}>
            {(label || hint) && (
                <div className="flex items-baseline justify-between gap-3 mb-3">
                    {label && <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>}
                    {hint && <span className="text-[11px] text-gray-400">{hint}</span>}
                </div>
            )}

            <div className="flex items-center gap-4">
                {/* Track */}
                <div className="relative flex-1 h-6 flex items-center">
                    <div className="absolute inset-x-0 h-2 rounded-full bg-[#e8e6e0] dark:bg-white/10" />
                    <motion.div
                        className={`absolute left-0 h-2 rounded-full ${fill}`}
                        animate={{ width: `${pct}%` }}
                        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                        style={{ boxShadow: '0 2px 10px -2px rgba(242,101,34,0.45)' }}
                    />
                    {/* Thumb */}
                    <motion.div
                        className="absolute w-[18px] h-[18px] rounded-full bg-white dark:bg-[#1b1b1b] border-[3px] border-[#F26522] shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
                        animate={{ left: `${pct}%`, scale: dragging ? 1.25 : 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        style={{ x: '-50%' }}
                    >
                        {showBubble && (dragging || focused) && (
                            <motion.span
                                initial={{ opacity: 0, y: 4, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full bg-gray-900 dark:bg-white text-[11px] font-medium whitespace-nowrap shadow-lg"
                            >
                                {format(value)}
                            </motion.span>
                        )}
                    </motion.div>

                    {/* Native input on top (invisible but fully interactive) */}
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={value}
                        aria-label={typeof label === 'string' ? label : undefined}
                        onChange={e => onChange(Number(e.target.value))}
                        onPointerDown={() => setDragging(true)}
                        onPointerUp={() => setDragging(false)}
                        onBlur={() => { setDragging(false); setFocused(false); }}
                        onFocus={() => setFocused(true)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>

                {/* Value readout */}
                <span className="w-14 text-right text-sm font-medium tabular-nums text-gray-900 dark:text-white">
                    {format(value)}
                </span>
            </div>

            {/* Tick marks */}
            {marks && (
                <div className="relative mt-2 h-4">
                    {marks.map(m => (
                        <span
                            key={m.value}
                            className="absolute -translate-x-1/2 text-[10px] text-gray-400"
                            style={{ left: `${((m.value - min) / (max - min)) * 100}%` }}
                        >
                            {m.label}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
