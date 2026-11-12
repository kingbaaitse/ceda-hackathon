/**
 * BentoFeatures — the capability grid, built as a bento.
 *
 * Deliberately not a row of equal cards: one large panel carries the
 * version-history story with a live diff, and the smaller panels each show
 * the real interface of the feature they describe.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Layers, MessageCircle, Sparkles, ShieldCheck, FileText, ArrowUpRight } from 'lucide-react';

const Item = ({ className = '', delay = 0, children }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ y: -4 }}
        className={`group relative overflow-hidden rounded-[28px] border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-7 transition-colors hover:border-accent-500/40 ${className}`}
    >
        {children}
    </motion.div>
);

const Label = ({ children }) => (
    <p className="text-[10px] uppercase tracking-[0.16em] text-gray-400 dark:text-white/35">{children}</p>
);

export default function BentoFeatures() {
    return (
        <section id="features" className="border-t border-gray-200 bg-white dark:border-white/5 dark:bg-white/[0.02]">
            <div className="max-w-6xl mx-auto px-6 py-20">
                <div className="text-center mx-auto max-w-3xl">
                    <h2 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em]">
                        Everything the pipeline needs.
                    </h2>
                    <p className="mt-4 text-gray-600 dark:text-white/55 text-lg">
                        Not a list of features — the working parts of a competition, shown as they work.
                    </p>
                </div>

                <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* ── large: version history ── */}
                    <Item className="lg:col-span-7 lg:row-span-2" delay={0}>
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-accent-500" />
                            <Label>Version history</Label>
                        </div>
                        <h3 className="mt-4 text-xl font-medium text-gray-900 dark:text-white">
                            Every resubmission keeps the previous entry
                        </h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-white/55 max-w-md">
                            When a revision is sent back, the platform snapshots the entry as it was.
                            Both sides can see exactly what changed, and why.
                        </p>

                        {/* live diff */}
                        <div className="mt-7 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02] p-4 font-mono text-[11px] leading-relaxed">
                            <div className="flex items-center justify-between text-gray-400 dark:text-white/35">
                                <span>v1 · first submission</span>
                                <span>09 Nov</span>
                            </div>
                            <div className="mt-2 text-gray-500 dark:text-white/45 line-through decoration-rose-400/60">
                                Cold storage for smallholder farmers.
                            </div>
                            <div className="mt-3 flex items-center justify-between text-gray-400 dark:text-white/35">
                                <span>v2 · after feedback</span>
                                <span>11 Nov</span>
                            </div>
                            <div className="mt-2 text-emerald-700 dark:text-emerald-300">
                                Solar cold-chain, P1,850 per cooperative per month.
                            </div>
                            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent-500/10 px-2.5 py-1 text-[10px] text-accent-600 dark:text-accent-400">
                                <ShieldCheck className="w-3 h-3" /> revision snapshot recorded
                            </div>
                        </div>
                    </Item>

                    {/* ── media ── */}
                    <Item className="lg:col-span-5" delay={0.06}>
                        <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-accent-500" />
                            <Label>Media & documents</Label>
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                            Logos, photos and decks, kept private
                        </h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-white/55">
                            Short-lived signed links, readable only by you, CEDA and your judges.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2">
                            {['logo.png', 'product-shot.jpg', 'pitch-deck.pdf'].map((f, i) => (
                                <motion.span
                                    key={f}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 + i * 0.07 }}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 py-1.5 text-[11px] text-gray-600 dark:text-white/55"
                                >
                                    <FileText className="w-3 h-3" /> {f}
                                </motion.span>
                            ))}
                        </div>
                    </Item>

                    {/* ── conversation ── */}
                    <Item className="lg:col-span-5" delay={0.12}>
                        <div className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-accent-500" />
                            <Label>One conversation</Label>
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                            Ask CEDA anything about your entry
                        </h3>
                        <div className="mt-5 space-y-2.5">
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.25 }}
                                className="max-w-[85%] rounded-2xl rounded-bl-md bg-gray-100 dark:bg-white/10 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200"
                            >
                                Is a PDF pitch deck required?
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.35 }}
                                className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-accent-500 px-3.5 py-2 text-xs text-white"
                            >
                                The deck is optional, the logo is not.
                            </motion.div>
                        </div>
                    </Item>

                    {/* ── audit ── */}
                    <Item className="lg:col-span-12" delay={0.18}>
                        <div className="flex flex-wrap items-center justify-between gap-6">
                            <div className="max-w-md">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-accent-500" />
                                    <Label>Audit trail</Label>
                                </div>
                                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                                    Every gate, score and assignment is on the record
                                </h3>
                                <p className="mt-2 text-sm text-gray-600 dark:text-white/55">
                                    Who did what, and when — exportable for review.
                                </p>
                            </div>

                            <div className="flex-1 min-w-[280px]">
                                <div className="space-y-2.5">
                                    {[
                                        ['Kgosi Admin', 'moved to evaluation', 'bg-accent-500'],
                                        ['Naledi Judge', 'scored 86/100', 'bg-emerald-500'],
                                        ['CEDA system', 'notified the entrant', 'bg-sky-500'],
                                    ].map(([who, what, dot], i) => (
                                        <motion.div
                                            key={who}
                                            initial={{ opacity: 0, x: 14 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.2 + i * 0.08 }}
                                            className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02] px-3.5 py-2.5"
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                                            <span className="text-xs text-gray-900 dark:text-gray-100">{who}</span>
                                            <span className="text-xs text-gray-400 dark:text-white/35">·</span>
                                            <span className="text-xs text-gray-500 dark:text-white/50">{what}</span>
                                            <span className="ml-auto text-[10px] font-mono text-gray-300 dark:text-white/25">0{i + 1}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Item>
                </div>
            </div>
        </section>
    );
}
