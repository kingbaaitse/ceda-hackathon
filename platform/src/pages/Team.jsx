/**
 * Team page — who builds the CEDA Innovation Hub.
 *
 * Oratory League is the official partner and the developer of the platform.
 * The layout follows the reference team page: cards that open into a full
 * profile with the long biography, highlights and contact details.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Mail, MapPin, Phone, Code, Linkedin, Instagram, Facebook,
    Sparkles, ArrowRight,
} from 'lucide-react';
import MarketingNav from '../components/marketing/MarketingNav';
import MarketingFooter from '../components/marketing/MarketingFooter';
import CursorFollower from '../components/CursorFollower';
import leatileImg from '../assets/img/team/leatile-king-baaitse.png';

const TEAM = [
    {
        id: 'leatile',
        name: 'Leatile King Baaitse',
        role: 'Board Chair & Founder, Oratory League',
        image: leatileImg,
        location: 'Gaborone, Botswana',
        email: 'king.baaitse@hmcp.online',
        phone: '+267 71 419 498',
        shortBio: 'Builds the technology and the product — and chairs the company delivering it.',
        fullBio: 'Leatile King Baaitse is Board Chair and Founder of Oratory League, the official partner and developer of the CEDA Innovation Hub. He designed and engineered the platform end to end: the guided submission wizard, the stage-gate workflow, the judge workspace, the row-level security model and the analytics that sit behind them.',
        fullBio2: 'His work spans full-stack engineering, cloud infrastructure and applied AI — the same stack that powers the Innovation Hub. The platform is built the way entrants experience it: autosaving drafts, offline sync, private attachments and a judging workflow that never lets a score move without written feedback.',
        fullBio3: 'Leatile holds a BSc (Hons) in Business Intelligence & Data Analytics and has spent his career turning complicated processes into software people can actually use. Outside the Innovation Hub, he leads Oratory League’s work in youth advocacy and educational technology across Southern Africa.',
        highlights: [
            'Board Chair & Founder — Oratory League',
            'Designed and engineered the Innovation Hub',
            'Full-stack: TypeScript, React, Node.js, PostgreSQL',
            'Cloud, AI systems and real-time infrastructure',
            'BSc (Hons) — Business Intelligence & Data Analytics',
        ],
        socials: {
            linkedin: 'https://linkedin.com/in/kingbaaitse',
            instagram: 'https://instagram.com/kingbaaitse',
            facebook: 'https://facebook.com/kingbaaitse',
        },
        featured: true,
    },
];

const SOCIALS = {
    linkedin: { icon: Linkedin, label: 'LinkedIn' },
    instagram: { icon: Instagram, label: 'Instagram' },
    facebook: { icon: Facebook, label: 'Facebook' },
};

function SocialLink({ type, url }) {
    const s = SOCIALS[type];
    if (!s || !url) return null;
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            className="w-9 h-9 rounded-full border border-gray-200 dark:border-white/12 flex items-center justify-center text-gray-500 dark:text-white/60 hover:text-accent-500 hover:border-accent-500/40 transition-colors"
        >
            <s.icon className="w-4 h-4" />
        </a>
    );
}

export default function Team({ onSignIn, onRegister }) {
    const [open, setOpen] = useState(null);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#0a0a0a] dark:text-white transition-colors duration-300">
            <CursorFollower />
            <MarketingNav
                links={[
                    { id: 'team', label: 'Team' },
                    { id: 'awards', label: 'Awards', href: '/gallery' },
                    { id: 'changelog', label: 'Changelog', href: '/changelog' },
                ]}
                onSignIn={onSignIn}
                onRegister={onRegister}
            />

            {/* ── Hero ── */}
            <section className="max-w-5xl mx-auto px-6 pt-32 pb-14 text-center">
                <motion.p
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-sm text-gray-500 dark:text-white/45"
                >
                    Oratory League · the official partner and developer
                </motion.p>
                <motion.h1
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.05 }}
                    className="mt-5 text-4xl sm:text-6xl font-semibold tracking-[-0.035em]"
                >
                    The team behind the Innovation Hub.
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="mt-5 text-lg text-gray-600 dark:text-white/55 mx-auto max-w-2xl"
                >
                    One company builds the platform, one agency runs the competition, and every
                    entrant gets a pipeline that works on a phone with a patchy signal.
                </motion.p>
            </section>

            {/* ── Cards ── */}
            <section className="max-w-5xl mx-auto px-6 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {TEAM.map((m, i) => (
                        <motion.button
                            key={m.id}
                            initial={{ opacity: 0, y: 22 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                            whileHover={{ y: -6 }}
                            onClick={() => setOpen(m)}
                            className="group relative text-left rounded-[28px] overflow-hidden border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-accent-500/40 transition-colors"
                        >
                            <div className="relative aspect-[4/5] sm:aspect-[16/11] overflow-hidden">
                                <img
                                    src={m.image}
                                    alt={m.name}
                                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6">
                                    <p className="text-white/70 text-xs">{m.role}</p>
                                    <h2 className="text-white text-2xl font-medium tracking-tight mt-1">{m.name}</h2>
                                    <p className="text-white/60 text-sm mt-2 max-w-sm">{m.shortBio}</p>
                                    <span className="inline-flex items-center gap-1.5 mt-4 text-xs text-white/80 group-hover:text-accent-300 transition-colors">
                                        Read the full profile <ArrowRight className="w-3.5 h-3.5" />
                                    </span>
                                </div>
                            </div>
                        </motion.button>
                    ))}

                    {/* growing team */}
                    <motion.div
                        initial={{ opacity: 0, y: 22 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="relative rounded-[28px] border border-dashed border-gray-300 dark:border-white/15 bg-white/40 dark:bg-white/[0.015] p-8 flex flex-col justify-center"
                    >
                        <div className="w-11 h-11 rounded-full bg-accent-500/12 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-accent-500" />
                        </div>
                        <h3 className="mt-5 text-lg font-medium">Growing the team</h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-white/50 max-w-sm">
                            We are adding a second member to the Innovation Hub team. Someone who
                            understands the entrant’s side of the pipeline — and Botswana’s
                            innovators — better than we do.
                        </p>
                        <p className="mt-4 text-xs text-gray-400 dark:text-white/35">
                            Enquiries → king.baaitse@hmcp.online
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ── Oratory League strip ── */}
            <section className="border-t border-gray-200 dark:border-white/5 bg-white dark:bg-white/[0.02]">
                <div className="max-w-5xl mx-auto px-6 py-16 flex flex-col sm:flex-row items-center justify-center gap-6 text-center sm:text-left">
                    <img src="/partners/oratory-league-logo.png" alt="Oratory League" className="h-14 w-auto max-w-[220px] object-contain dark:brightness-125" />
                    <p className="text-sm text-gray-600 dark:text-white/55 max-w-lg">
                        Oratory League designs, engineers and operates the CEDA Innovation Hub —
                        the product, the security model and the support behind every entrant.
                    </p>
                </div>
            </section>

            <MarketingFooter />

            {/* ── Profile modal ── */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end md:items-center justify-center"
                    >
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setOpen(null)} />
                        <motion.div
                            initial={{ y: 40, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 40, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative bg-white dark:bg-[#0a0a0a] w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-[2rem] md:rounded-[2rem] shadow-2xl scrollbar-hide"
                        >
                            <div className="relative h-[22rem] sm:h-[26rem] overflow-hidden">
                                <img src={open.image} alt={open.name} className="w-full h-full object-cover object-top" />
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />
                                <button
                                    onClick={() => setOpen(null)}
                                    aria-label="Close"
                                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/25 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 p-6">
                                    <p className="text-white/70 text-sm">{open.role}</p>
                                    <h2 className="text-white text-2xl sm:text-3xl font-medium tracking-tight mt-1">{open.name}</h2>
                                </div>
                            </div>

                            <div className="px-6 sm:px-8 py-6">
                                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-6 text-sm text-gray-500 dark:text-white/50">
                                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{open.location}</span>
                                    {open.email && (
                                        <a href={`mailto:${open.email}`} className="flex items-center gap-1.5 hover:text-accent-500 transition-colors">
                                            <Mail className="w-4 h-4" />{open.email}
                                        </a>
                                    )}
                                    {open.phone && (
                                        <a href={`tel:${open.phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 hover:text-accent-500 transition-colors">
                                            <Phone className="w-4 h-4" />{open.phone}
                                        </a>
                                    )}
                                </div>

                                <div className="space-y-4 mb-6">
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{open.fullBio}</p>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{open.fullBio2}</p>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{open.fullBio3}</p>
                                </div>

                                {open.highlights && (
                                    <div className="mb-7">
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                            <Code className="w-4 h-4 text-accent-500" /> Highlights
                                        </h3>
                                        <ul className="space-y-2">
                                            {open.highlights.map(h => (
                                                <li key={h} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-accent-500 flex-shrink-0" />
                                                    {h}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    {Object.entries(open.socials || {}).map(([k, url]) => (
                                        <SocialLink key={k} type={k} url={url} />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
