/**
 * MetricBars — segmented meters for the dashboard.
 *
 * Not a port of any Obsidian component: this is our own semantic meter.
 * Each bar's colour comes from the semantic scale, so a bar always means the
 * same thing (green = healthy, amber = attention, orange = in progress,
 * red = blocked).
 */
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export default function MetricBars({
    items = [],
    className = '',
    barClassName = '',
}) {
    const reduced = useReducedMotion();

    return (
        <div className={`space-y-3 ${className}`}>
            {items.map((it, i) => {
                const pct = Math.max(0, Math.min(100, it.value ?? 0));
                return (
                    <div key={it.id ?? it.label ?? i}>
                        {it.label && (
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-gray-500 dark:text-gray-400">{it.label}</span>
                                <span className="text-gray-700 dark:text-gray-200 tabular-nums">
                                    {it.display ?? `${Math.round(pct)}%`}
                                </span>
                            </div>
                        )}
                        <div className={`flex gap-1 h-2.5 ${barClassName}`}>
                            {Array.from({ length: it.segments ?? 16 }).map((_, s) => {
                                const on = (s / (it.segments ?? 16)) * 100 < pct;
                                return (
                                    <motion.span
                                        key={s}
                                        className={`flex-1 rounded-full ${on ? (it.color || 'bg-accent-500') : 'bg-gray-200 dark:bg-white/10'}`}
                                        initial={reduced ? false : { scaleX: 0.2, opacity: 0 }}
                                        whileInView={{ scaleX: 1, opacity: 1 }}
                                        viewport={{ once: true, margin: '-40px' }}
                                        transition={{ delay: reduced ? 0 : s * 0.03, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                        style={{ transformOrigin: 'left' }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
