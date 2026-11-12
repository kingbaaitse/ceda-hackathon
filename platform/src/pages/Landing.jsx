/**
 * Public landing page - deliberately compact.
 *
 * The product is the portal; this page only has to explain it and get the
 * visitor into the right place. Colour here carries meaning: the pipeline
 * stages use the semantic scale (grey not started, blue with CEDA, orange
 * moving, amber a decision is due, green awarded, red out).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Award, Sparkles, Trophy, Handshake } from 'lucide-react';
import Logo from '../components/Logo';
import { FlipText } from '@/components/block/flip-text';
import { DraggableMarquee } from '@/components/block/draggable-marquee';
import { SplitShowcase } from '@/components/block/split-showcase';
import { ParallaxSlider } from '@/components/block/parallax-slider';
import { TextStream } from '@/components/block/text-stream';
import { StatusBars, fillStatusDays } from '@/components/block/status-bars';
import { SEMANTIC, stageTone } from '../lib/semantics';
import { supabase } from '../lib/supabase';
import { getAttachmentUrls } from '../lib/storage';
import cedaLogo from '../assets/img/ceda-full-logo-icon.png';

const PIPELINE = [
    { key: 'draft', label: 'Draft', detail: 'Guided submission with autosave' },
    { key: 'compliance_review', label: 'Compliance', detail: 'Eligibility and completeness' },
    { key: 'screened_in', label: 'Screening', detail: 'First-pass gate with written feedback' },
    { key: 'in_evaluation', label: 'Evaluation', detail: 'Judges score the weighted rubric' },
    { key: 'selection', label: 'Selection', detail: 'Committee shortlist' },
    { key: 'awarded', label: 'Award', detail: 'Approved and published' },
];

const FEATURES = [
    { title: 'Guided submission', body: 'A four-step wizard with autosave, team roles and media uploads.' },
    { title: 'Private by default', body: 'Only you, CEDA and your assigned judges can read your entry.' },
    { title: 'Feedback at every gate', body: 'Written feedback at each stage, plus a message thread for questions.' },
    { title: 'Weighted, calibrated scoring', body: 'CEDA tunes the rubric; judges see only anonymous panel aggregates.' },
];

export default function Landing({ onSignIn, onRegister }) {
    const [awarded, setAwarded] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mediaUrls, setMediaUrls] = useState({});

    useEffect(() => {
        supabase
            .from('ceda_submissions')
            .select('id, title, sdgs, stage_of_development, updated_at, attachments')
            .eq('stage', 'awarded')
            .then(async ({ data }) => {
                setAwarded(data || []);
                setLoading(false);
                const paths = (data || []).flatMap(s => (s.attachments || []).filter(a => a.kind === 'image').map(a => a.path));
                if (paths.length) setMediaUrls(await getAttachmentUrls(paths));
            });
    }, []);

    const goals = useMemo(() => {
        const set = new Set();
        awarded.forEach(a => (a.sdgs || []).forEach(g => set.add(g)));
        return set.size;
    }, [awarded]);

    /* slides for the parallax slider: the awarded work itself */
    const slides = useMemo(() => awarded.map(a => {
        const img = (a.attachments || []).find(x => x.kind === 'image');
        return { title: a.title, image: img ? mediaUrls[img.path] : null, focus: '50% 50%' };
    }).filter(s => s.image), [awarded, mediaUrls]);

    /* the competition window (9-12 Nov) - the days submissions were open */
    const windowDays = useMemo(() => {
        const days = fillStatusDays('2026-11-09', '2026-11-12', []);
        return days.length ? days : null;
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white dark">
            <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0a]/85 backdrop-blur-xl">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Logo className="w-8 h-8" />
                        <span className="text-sm tracking-tight">CEDA Innovation Hub</span>
                    </div>
                    <nav className="flex items-center gap-2">
                        <a href="#pipeline" className="hidden sm:block px-3 py-2 text-sm text-white/60 hover:text-white transition-colors">The pipeline</a>
                        <a href="#awards" className="hidden sm:block px-3 py-2 text-sm text-white/60 hover:text-white transition-colors">Awards</a>
                        <a href="#partner" className="hidden sm:block px-3 py-2 text-sm text-white/60 hover:text-white transition-colors">Partner</a>
                        <a href="/changelog" className="hidden sm:block px-3 py-2 text-sm text-white/60 hover:text-white transition-colors">Changelog</a>
                        <button onClick={onSignIn} className="px-4 py-2 rounded-full text-sm text-white/80 hover:bg-white/10 transition-colors">Sign in</button>
                        <button onClick={onRegister} className="px-4 py-2 rounded-full text-sm bg-accent-500 text-white hover:bg-accent-600 transition-colors">Register</button>
                    </nav>
                </div>
            </header>

            {/* Hero */}
            <section className="relative overflow-hidden">
                <div
                    className="absolute inset-0 opacity-70"
                    style={{ background: 'radial-gradient(700px 380px at 18% 0%, rgba(242,101,34,0.28), transparent 70%)' }}
                />
                <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16">
                    <div className="flex items-center gap-2 text-accent-400 text-xs uppercase tracking-[0.18em]">
                        <Sparkles className="w-3.5 h-3.5" /> Citizen Entrepreneurial Development Agency
                    </div>

                    <h1 className="mt-6 text-5xl sm:text-7xl leading-[1.05] tracking-tight max-w-4xl">
                        From idea to <FlipText className="text-accent-400">award</FlipText>
                        <span className="block text-accent-400">on one platform.</span>
                    </h1>

                    <p className="mt-7 text-white/60 text-lg leading-relaxed max-w-2xl">
                        Submit your innovation, follow it through every CEDA stage gate, and get
                        structured feedback at each one — screening, evaluation, selection and award.
                    </p>

                    <div className="mt-9 flex flex-wrap items-center gap-3">
                        <button onClick={onRegister} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-accent-500 text-white hover:bg-accent-600 transition-colors">
                            Start your submission <ArrowRight className="w-4 h-4" />
                        </button>
                        <a href="#pipeline" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/15 text-white/80 hover:border-white/30 hover:text-white transition-colors">
                            See how it works
                        </a>
                    </div>

                    <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
                        <Counter label="Pipeline stages" value={PIPELINE.length} tone="info" />
                        <Counter label="Awarded" value={loading ? '—' : awarded.length} tone="success" />
                        <Counter label="SDGs covered" value={loading ? '—' : goals} tone="progress" />
                        <Counter label="Feedback per entry" value="4+" tone="warning" />
                    </div>
                </div>
            </section>

            {/* Pipeline */}
            <section id="pipeline" className="max-w-6xl mx-auto px-6 py-16">
                <h2 className="text-3xl tracking-tight">One submission. Every gate.</h2>
                <p className="text-white/50 mt-3 max-w-xl">
                    No entry skips a stage, and no stage moves without written feedback for the entrant.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                    {PIPELINE.map((s, i) => {
                        const tone = SEMANTIC[stageTone(s.key)];
                        return (
                            <motion.div
                                key={s.key}
                                initial={{ opacity: 0, y: 14 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{ delay: i * 0.05, duration: 0.4 }}
                                className="rounded-3xl border border-white/10 p-5 relative overflow-hidden"
                            >
                                <span className={`absolute left-0 top-0 bottom-0 w-1 ${tone.bar}`} />
                                <div className="flex items-center gap-2 pl-2">
                                    <span className={`w-2 h-2 rounded-full ${tone.dot}`} />
                                    <p className="text-sm text-white/90">{s.label}</p>
                                </div>
                                <p className="text-sm text-white/50 mt-2 pl-2">{s.detail}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </section>

            {/* Features */}
            <section className="border-y border-white/5 bg-white/[0.02]">
                <div className="max-w-6xl mx-auto px-6 py-16">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {FEATURES.map(f => (
                            <div key={f.title} className="rounded-3xl border border-white/10 p-5">
                                <h3 className="text-white">{f.title}</h3>
                                <p className="text-sm text-white/50 mt-2 leading-relaxed">{f.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Awards */}
            <section id="awards" className="max-w-6xl mx-auto px-6 py-16">
                <div className="flex items-center gap-2 text-accent-400 text-xs uppercase tracking-[0.18em]">
                    <Trophy className="w-3.5 h-3.5" /> Awards gallery
                </div>
                <h2 className="mt-4 text-3xl tracking-tight">The work that passed every gate</h2>
                <p className="text-white/50 mt-3 max-w-xl">
                    Awarded entries are published openly. Everything still in the pipeline stays private.
                </p>
                {awarded.length > 0 ? (
                    <>
                        <div className="mt-6 flex items-center gap-6">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 flex-shrink-0">Awarded</span>
                            <div className="flex-1 min-w-0">
                                <DraggableMarquee
                                    items={awarded.map(a => ({
                                        id: a.id,
                                        src: '',
                                        alt: a.title,
                                        width: 320,
                                        height: 200,
                                        title: a.title,
                                    }))}
                                    speed={0.5}
                                    repeatCount={2}
                                    renderItem={(item) => (
                                        <span className="px-3 py-1.5 rounded-full text-xs bg-white/5 text-white/60 whitespace-nowrap">
                                            {item.title}
                                        </span>
                                    )}
                                />
                            </div>
                        </div>

                        {slides.length > 0 && (
                            <div className="mt-12">
                                <ParallaxSlider
                                    slides={slides}
                                    eyebrow="Awarded work"
                                    title="Drag through the winners"
                                    description="Every entry here cleared every gate."
                                    orientation="landscape"
                                    className="text-white"
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <p className="text-white/40 text-sm mt-6">No entries awarded yet — the first winners will appear here.</p>
                )}
            </section>

            {/* Partner */}
            <section id="partner" className="border-y border-white/5 bg-white/[0.02]">
                <div className="max-w-6xl mx-auto px-6 py-16">
                    <div className="flex items-center gap-2 text-accent-400 text-xs uppercase tracking-[0.18em]">
                        <Handshake className="w-3.5 h-3.5" /> Who builds this
                    </div>
                    <h2 className="mt-4 text-3xl tracking-tight">CEDA and Oratory League</h2>
                    <p className="text-white/50 mt-3 max-w-xl">
                        CEDA owns the competition and the pipeline. Oratory League is the official
                        partner and the developer behind the platform.
                    </p>

                    <div className="mt-10">
                        <SplitShowcase
                            items={[
                                {
                                    id: 'ceda',
                                    title: 'CEDA',
                                    tag: 'The competition',
                                    description: 'Runs the innovation competition end to end: eligibility, screening, the judging panel and the award.',
                                    icon: <img src={cedaLogo} alt="CEDA" className="h-10 w-10 object-contain" />,
                                },
                                {
                                    id: 'oratory-league',
                                    title: 'Oratory League',
                                    tag: 'Official partner & developer',
                                    description: 'Designs and engineers the Innovation Hub: the submission wizard, the judging workflow, the security model and the analytics.',
                                    icon: <img src="/partners/oratory-league-logo.png" alt="Oratory League" className="h-9 w-auto max-w-[150px] object-contain object-left" />,
                                },
                            ]}
                            className="text-left"
                        />
                    </div>

                    {windowDays && (
                        <div className="mt-12">
                            <StatusBars label="Submission window" days={windowDays} maxDays={windowDays.length} compact />
                            <p className="text-[11px] text-white/35 mt-3">
                                The competition ran 9–12 November 2026; submissions are open every day of the window.
                            </p>
                        </div>
                    )}

                    <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                        <div className="lg:col-span-2">
                            <h3 className="text-white text-lg">Every gate, in order</h3>
                            <p className="text-white/45 text-sm mt-2">
                                Screening, evaluation, selection and award — each one with written feedback.
                            </p>
                        </div>
                        <TextStream
                            items={['Screening', 'Evaluation', 'Selection', 'Award']}
                            prefix="The pipeline"
                            height="220px"
                            fontSize="1.75rem"
                            className="text-white"
                        />
                    </div>
                </div>
            </section>

            <footer className="border-t border-white/5">
                <div className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Logo className="w-7 h-7" />
                        <div>
                            <p className="text-sm">CEDA Innovation Hub</p>
                            <p className="text-[11px] text-white/35">Citizen Entrepreneurial Development Agency · Botswana</p>
                        </div>
                    </div>
                    <p className="text-[11px] text-white/30">
                        Submissions and evaluations handled in line with Botswana's Data Protection Act. ·{' '}
                        <a href="/changelog" className="hover:text-white/60 underline underline-offset-2">Changelog</a>
                    </p>
                </div>
            </footer>
        </div>
    );
}

function Counter({ label, value, tone = 'info' }) {
    const t = SEMANTIC[tone];
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
                <p className="text-[11px] text-white/45">{label}</p>
            </div>
            <p className={`text-2xl mt-1 ${t.text}`}>{value}</p>
        </div>
    );
}
