/**
 * PipelineSection — the six stages as one connected rail.
 *
 * Each stage carries an illustration, the moment it happens, and what the
 * entrant actually gets back at that gate. The rail is drawn behind the
 * nodes and fills as the section scrolls into view.
 */
import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

import draftArt from '../../assets/img/illustrations/idea-process.svg';
import complianceArt from '../../assets/img/illustrations/secure.svg';
import screeningArt from '../../assets/img/illustrations/judging.svg';
import evaluationArt from '../../assets/img/illustrations/review.svg';
import selectionArt from '../../assets/img/illustrations/decision.svg';
import awardArt from '../../assets/img/illustrations/winner.svg';

const STAGES = [
    {
        key: 'draft', label: 'Draft', n: '01', tone: 'neutral',
        art: draftArt,
        when: 'While you write',
        copy: 'A four-step wizard with autosave. Close the tab, lose signal, come back — your words are still there.',
        gets: 'An autosaved draft you can finish later.',
    },
    {
        key: 'compliance', label: 'Compliance', n: '02', tone: 'info',
        art: complianceArt,
        when: 'Within a day of submitting',
        copy: 'CEDA verifies eligibility and completeness before anything enters the pipeline.',
        gets: 'A confirmation that the entry is eligible.',
    },
    {
        key: 'screening', label: 'Screening', n: '03', tone: 'progress',
        art: screeningArt,
        when: 'First gate',
        copy: 'A first-pass reviewer reads the entry against the published criteria.',
        gets: 'Written screening feedback, in your portal.',
    },
    {
        key: 'evaluation', label: 'Evaluation', n: '04', tone: 'progress',
        art: evaluationArt,
        when: 'The judging panel',
        copy: 'Assigned judges score the weighted rubric. You never see who scored you.',
        gets: 'A score and per-criterion comments.',
    },
    {
        key: 'selection', label: 'Selection', n: '05', tone: 'warning',
        art: selectionArt,
        when: 'The committee',
        copy: 'The committee reads the anonymised evaluations and shortlists.',
        gets: 'A decision, with the reasoning behind it.',
    },
    {
        key: 'award', label: 'Award', n: '06', tone: 'success',
        art: awardArt,
        when: 'The award',
        copy: 'Approved entries are funded, published in the awards gallery and kept there for everyone to see.',
        gets: 'An award, and a public profile for the work.',
    },
];

const TONE = {
    neutral: { ring: 'border-gray-200 dark:border-white/10', text: 'text-gray-500 dark:text-white/45', bar: 'bg-gray-300 dark:bg-white/20', glow: 'rgba(120,113,108,0.25)' },
    info: { ring: 'border-sky-200 dark:border-sky-400/25', text: 'text-sky-700 dark:text-sky-300', bar: 'bg-sky-500', glow: 'rgba(14,165,233,0.3)' },
    progress: { ring: 'border-accent-200 dark:border-accent-400/25', text: 'text-accent-700 dark:text-accent-300', bar: 'bg-accent-500', glow: 'rgba(242,101,34,0.32)' },
    warning: { ring: 'border-amber-200 dark:border-amber-400/25', text: 'text-amber-700 dark:text-amber-300', bar: 'bg-amber-400', glow: 'rgba(245,158,11,0.3)' },
    success: { ring: 'border-emerald-200 dark:border-emerald-400/25', text: 'text-emerald-700 dark:text-emerald-300', bar: 'bg-emerald-500', glow: 'rgba(16,185,129,0.3)' },
};

export default function PipelineSection() {
    const railRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: railRef, offset: ['start 0.85', 'end 0.45'] });
    const fill = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

    return (
        <section id="pipeline" className="border-t border-gray-200 dark:border-white/5">
            <div className="max-w-6xl mx-auto px-6 py-20">
                <div className="text-center mx-auto max-w-3xl">
                    <h2 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em]">
                        One submission. Every gate.
                    </h2>
                    <p className="mt-4 text-gray-600 dark:text-white/55 text-lg">
                        Six stages, and at each one you get something back — never a black hole.
                    </p>
                </div>

                <div ref={railRef} className="relative mt-16">
                    {/* the rail */}
                    <div className="hidden lg:block absolute left-0 right-0 top-[38px] h-px bg-gray-200 dark:bg-white/10" />
                    <motion.div
                        className="hidden lg:block absolute left-0 top-[38px] h-px bg-gradient-to-r from-sky-400 via-accent-500 to-emerald-500"
                        style={{ width: fill }}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-4">
                        {STAGES.map((s, i) => {
                            const t = TONE[s.tone];
                            return (
                                <motion.div
                                    key={s.key}
                                    initial={{ opacity: 0, y: 18 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-80px' }}
                                    transition={{ delay: i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                    className="group relative text-center lg:text-center h-full flex flex-col"
                                >
                                    {/* node */}
                                    <div className="relative mx-auto w-[76px] h-[76px]">
                                        <div
                                            className="absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                            style={{ background: t.glow }}
                                        />
                                        <div className={`relative w-full h-full rounded-full border bg-white dark:bg-[#0f0f0f] flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-105 ${t.ring}`}>
                                            <img src={s.art} alt="" aria-hidden="true" className="w-[52px] h-[52px] object-contain" />
                                        </div>
                                        <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-mono bg-white dark:bg-[#0f0f0f] ${t.text}`}>
                                            {s.n}
                                        </span>
                                    </div>

                                    <p className="mt-6 text-sm font-medium text-gray-900 dark:text-white">{s.label}</p>
                                    <p className={`mt-1 text-[11px] uppercase tracking-[0.12em] ${t.text}`}>{s.when}</p>
                                    <p className="mt-3 text-sm text-gray-600 dark:text-white/55 leading-relaxed">{s.copy}</p>

                                    <div className={`mt-4 rounded-2xl border ${t.ring} bg-white/60 dark:bg-white/[0.03] p-3 text-left mt-auto`}>
                                        <p className="text-[10px] uppercase tracking-[0.12em] text-gray-400 dark:text-white/35">You receive</p>
                                        <p className="mt-1 text-xs text-gray-700 dark:text-gray-200 leading-relaxed">{s.gets}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
