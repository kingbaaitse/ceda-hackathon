/**
 * Public landing page.
 *
 * Composition follows the ReactDrops reference: a light editorial page with a
 * live interactive preview in the hero, pill CTAs, generous rhythm and a dark
 * closing band. Everything carries CEDA's brand and the semantic colour scale
 * (grey = inactive, blue = with CEDA, orange = moving, amber = decision due,
 * green = awarded, red = out).
 */
import React, { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowRight, Sparkles, Trophy, Handshake, ChevronRight,
    ShieldCheck, MessageCircle, Scale, Layers, Zap,
} from 'lucide-react';
import Logo from '../components/Logo';
import MarketingNav from '../components/marketing/MarketingNav';
import MarketingFooter from '../components/marketing/MarketingFooter';
import PipelineSection from '../components/marketing/PipelineSection';
import BentoFeatures from '../components/marketing/BentoFeatures';
import CursorFollower from '../components/CursorFollower';
import { FlipText } from '@/components/block/flip-text';
import stepRegister from '../assets/img/illustrations/profile.svg';
import stepSubmit from '../assets/img/illustrations/upload.svg';
import stepFeedback from '../assets/img/illustrations/feedback.svg';
import { DraggableMarquee } from '@/components/block/draggable-marquee';
import { SplitShowcase } from '@/components/block/split-showcase';
import { ParallaxSlider } from '@/components/block/parallax-slider';
import { TextStream } from '@/components/block/text-stream';
import { StatusBars, fillStatusDays } from '@/components/block/status-bars';
import { SEMANTIC, stageTone } from '../lib/semantics';
import { supabase } from '../lib/supabase';
import { getAttachmentUrls } from '../lib/storage';
import cedaLogo from '../assets/img/ceda-full-logo-icon.png';

const VPrism = lazy(() => import('@/components/block/v-prism').then(m => ({ default: m.VPrism })));
/* the hero carries three.js + r3f, so it loads only on this page */
const Hero = lazy(() => import('../components/Hero'));

const DARK_PRESET = {
    ambientLight: 0.015, pointLights: 0.05, spotIntensity: 1.0, rainbowGlow: 2.5,
    bloom: 0.5, roughness: 0, ior: 1.5, thickness: 0.9,
    background: '#000000', prismTint: '#ffffff',
};

const PIPELINE = [
    { key: 'draft', label: 'Draft', detail: 'A four-step wizard that saves as you type.' },
    { key: 'compliance_review', label: 'Compliance', detail: 'Eligibility and completeness, verified by CEDA.' },
    { key: 'screened_in', label: 'Screening', detail: 'First-pass gate, always with written feedback.' },
    { key: 'in_evaluation', label: 'Evaluation', detail: 'Judges score a weighted rubric, anonymously.' },
    { key: 'selection', label: 'Selection', detail: 'The committee shortlists and deliberates.' },
    { key: 'awarded', label: 'Award', detail: 'Approved, funded and published in the gallery.' },
];

const STEPS = [
    { n: '01', title: 'Register', body: 'Create an account as an individual or a team. Your progress is saved from the first keystroke.', art: stepRegister },
    { n: '02', title: 'Submit', body: 'Describe the innovation, add your team and attach your logo, photos and pitch deck.', art: stepSubmit },
    { n: '03', title: 'Get feedback', body: 'Follow every stage in real time, read the written feedback, and answer questions in one thread.', art: stepFeedback },
];

const REASONS = [
    { icon: Zap, title: 'Built for the entrant', body: 'Autosaving drafts, offline sync and phone-first screens, because a dropped connection should never cost you an entry.' },
    { icon: ShieldCheck, title: 'Private by default', body: 'Row-level security in the database: only you, CEDA and your assigned judges can read your submission.' },
    { icon: Scale, title: 'Fair, calibrated scoring', body: 'Weights are set by CEDA, judges score against them, and calibration uses anonymous panel aggregates only.' },
];

const FEATURES = [
    { icon: Layers, title: 'Media & documents', body: 'Logos, product shots and pitch decks, served through short-lived signed links.' },
    { icon: MessageCircle, title: 'One conversation', body: 'Ask CEDA anything about your entry, with visibility you control for internal notes.' },
    { icon: Sparkles, title: 'Version history', body: 'Every resubmission keeps a snapshot, so both sides can see what changed between rounds.' },
    { icon: ShieldCheck, title: 'Audit trail', body: 'Every gate, score and assignment is recorded with who did it and when.' },
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

    const slides = useMemo(() => awarded.map(a => {
        const img = (a.attachments || []).find(x => x.kind === 'image');
        return { title: a.title, image: img ? mediaUrls[img.path] : null, focus: '50% 50%' };
    }).filter(s => s.image), [awarded, mediaUrls]);

    const windowDays = useMemo(() => {
        const days = fillStatusDays('2026-11-09', '2026-11-12', []);
        return days.length ? days : null;
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#0a0a0a] dark:text-white transition-colors duration-300">
            <CursorFollower />
            {/* ── Nav ── */}
            <MarketingNav
                links={[
                    { id: 'pipeline', label: 'Pipeline' },
                    { id: 'features', label: 'In the box' },
                    { id: 'awards', label: 'Awards' },
                    { id: 'partner', label: 'Partner' },
                    { id: 'team', label: 'Team', href: '/team' },
                    { id: 'changelog', label: 'Changelog', href: '/changelog' },
                ]}
                onSignIn={onSignIn}
                onRegister={onRegister}
            />

            {/* ── Hero: orbit ── */}
            <Suspense fallback={<div className="h-[560px]" />}>
                <Hero
                    eyebrow="Citizen Entrepreneurial Development Agency · Botswana"
                    title="From idea to"
                    accent={<FlipText className="text-accent-600 dark:text-accent-400">award</FlipText>}
                    body="Submit your innovation, follow it through every CEDA stage gate, and get structured feedback at each one — screening, evaluation, selection and award."
                    ctaPrimary="Start your submission"
                    ctaSecondary="Sign in"
                    onPrimary={onRegister}
                    onSecondary={onSignIn}
                    counters={
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
                            <Counter label="Pipeline stages" value={PIPELINE.length} tone="info" />
                            <Counter label="Awarded" value={loading ? '—' : awarded.length} tone="success" />
                            <Counter label="SDGs covered" value={loading ? '—' : goals} tone="progress" />
                            <Counter label="Feedback per entry" value="4+" tone="warning" />
                        </div>
                    }
                    preview={
                        <Suspense fallback={<div className="h-full w-full flex items-center justify-center text-white/30 text-sm">Loading the preview…</div>}>
                            <VPrism settings={DARK_PRESET} />
                        </Suspense>
                    }
                />
            </Suspense>

            <PipelineSection />

            {/* ── Getting started ── */}
            <section className="border-t border-gray-200 bg-white dark:border-white/5 dark:bg-white/[0.02]">
                <div className="max-w-6xl mx-auto px-6 py-20">
                    <SectionHead
                        eyebrow="Getting started"
                        title="Three steps from idea to feedback."
                        body="Nothing to install, nothing to print, no application fee."
                    />
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {STEPS.map((s, i) => (
                            <motion.div
                                key={s.n}
                                initial={{ opacity: 0, y: 14 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{ delay: i * 0.06, duration: 0.4 }}
                                className="rounded-3xl border border-gray-200 dark:border-white/10 p-7"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <span className="font-mono text-xs text-accent-600 dark:text-accent-400">{s.n}</span>
                                    <img src={s.art} alt="" aria-hidden="true" className="w-20 h-20 opacity-90 -mt-3 -mr-2" />
                                </div>
                                <h3 className="mt-3 text-lg font-medium">{s.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-white/50 mt-2 leading-relaxed">{s.body}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Why ── */}
            <section className="border-t border-gray-200 dark:border-white/5">
                <div className="max-w-6xl mx-auto px-6 py-20">
                    <SectionHead
                        eyebrow="Why it works"
                        title="Good looking. Good to work with. Good for the entrant."
                        body="Every capability exists because a participant, judge or administrator needed it."
                    />
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {REASONS.map((r, i) => (
                            <motion.div
                                key={r.title}
                                initial={{ opacity: 0, y: 14 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{ delay: i * 0.06, duration: 0.4 }}
                                className="rounded-3xl border border-gray-200 dark:border-white/10 p-7"
                            >
                                <div className="w-10 h-10 rounded-full bg-accent-500/12 flex items-center justify-center">
                                    <r.icon className="w-4.5 h-4.5 w-5 h-5 text-accent-500" />
                                </div>
                                <h3 className="mt-4 text-lg font-medium">{r.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-white/50 mt-2 leading-relaxed">{r.body}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <BentoFeatures />

            {/* ── Awards ── */}
            <section id="awards" className="border-t border-gray-200 dark:border-white/5">
                <div className="max-w-6xl mx-auto px-6 py-20 text-center">
                    <h2 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] mx-auto max-w-3xl">
                        The work that passed every gate.
                    </h2>
                    <p className="mt-4 text-gray-600 dark:text-white/55 text-lg mx-auto max-w-2xl">
                        Awarded entries are published openly. Everything still in the pipeline stays private.
                    </p>

                    {awarded.length > 0 ? (
                        <>
                            {slides.length > 0 && (
                                <div className="mt-12">
                                    <ParallaxSlider
                                        slides={slides}
                                        eyebrow="Awarded work"
                                        title="Drag through the winners"
                                        description="Every entry here cleared every gate."
                                        orientation="landscape"
                                        className="text-gray-900 dark:text-white"
                                    />
                                </div>
                            )}
                            <div className="mt-10 flex items-center gap-6 pb-10">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 dark:text-white/30 flex-shrink-0">Awarded</span>
                                <div className="flex-1 min-w-0">
                                    <DraggableMarquee
                                        items={awarded.map(a => ({
                                            id: a.id, src: '', alt: a.title, width: 320, height: 200, title: a.title,
                                        }))}
                                        speed={0.5}
                                        repeatCount={2}
                                        className="py-2"
                                        renderItem={(item) => (
                                            <span className="px-3.5 py-2 rounded-full text-xs bg-black/[0.05] dark:bg-white/5 text-gray-700 dark:text-white/60 whitespace-nowrap leading-5">
                                                {item.title}
                                            </span>
                                        )}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className="mt-8 text-gray-500 dark:text-white/40">No entries awarded yet — the first winners will appear here.</p>
                    )}
                </div>
            </section>

            {/* ── Partner ── */}
            <section id="partner" className="border-t border-gray-200 bg-white dark:border-white/5 dark:bg-white/[0.02]">
                <div className="max-w-6xl mx-auto px-6 py-20 text-center">
                    <h2 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] mx-auto max-w-3xl">
                        CEDA and Oratory League.
                    </h2>
                    <p className="mt-4 text-gray-600 dark:text-white/55 text-lg mx-auto max-w-2xl">
                        CEDA owns the competition and the pipeline. Oratory League is the official
                        partner and the developer behind the platform.
                    </p>

                    <div className="mt-12">
                        <SplitShowcase
                            items={[
                                {
                                    id: 'ceda',
                                    title: 'CEDA',
                                    tag: 'The competition',
                                    description: 'Runs the innovation competition end to end: eligibility, screening, the judging panel and the award.',
                                    icon: <img src={cedaLogo} alt="CEDA" className="h-24 w-24 object-contain" />,
                                },
                                {
                                    id: 'oratory-league',
                                    title: 'Oratory League',
                                    tag: 'Official partner & developer',
                                    description: 'Designs and engineers the Innovation Hub: the submission wizard, the judging workflow, the security model and the analytics.',
                                    icon: <img src="/partners/oratory-league-logo.png" alt="Oratory League" className="h-20 w-auto max-w-[320px] object-contain object-left" />,
                                },
                            ]}
                            className="text-left"
                        />
                    </div>

                    <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                        <div className="lg:col-span-2">
                            <h3 className="text-2xl font-semibold tracking-tight">Every gate, in order</h3>
                            <p className="text-gray-600 dark:text-white/50 mt-2 max-w-lg">
                                Screening, evaluation, selection and award — each one with written feedback
                                the entrant can act on.
                            </p>
                            {windowDays && (
                                <div className="mt-8">
                                    <StatusBars label="Submission window" days={windowDays} maxDays={windowDays.length} compact />
                                    <p className="text-[11px] text-gray-400 dark:text-white/35 mt-3">
                                        The competition ran 9–12 November 2026; submissions are open every day of the window.
                                    </p>
                                </div>
                            )}
                        </div>
                        <TextStream
                            items={['Screening', 'Evaluation', 'Selection', 'Award']}
                            prefix="The pipeline"
                            height="240px"
                            fontSize="1.75rem"
                            className="text-gray-900 dark:text-white"
                        />
                    </div>
                </div>
            </section>

            {/* ── Closing band ── */}
            <section className="bg-[#12080a] text-white">
                <div className="max-w-3xl mx-auto px-6 py-24 text-center">
                    <h2 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em]">
                        Your next innovation starts with{' '}
                        <span className="font-serif-italic text-accent-300">one entry.</span>
                    </h2>
                    <p className="mt-5 text-white/60 text-lg">
                        Submit once. Follow it through every gate. Know exactly where you stand.
                    </p>
                    <div className="mt-9 flex flex-wrap justify-center gap-3">
                        <button onClick={onRegister} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-accent-500 text-white hover:bg-accent-600 transition-colors">
                            Create an account <ArrowRight className="w-4 h-4" />
                        </button>
                        <button onClick={onSignIn} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/20 text-white/85 hover:border-white/40 transition-colors">
                            Sign in
                        </button>
                    </div>
                </div>
            </section>

            <MarketingFooter />
        </div>
    );
}

/* ── small pieces ─────────────────────────────────────────────── */
function SectionHead({ eyebrow, title, body, center = true }) {
    return (
        <div className={center ? 'text-center mx-auto max-w-3xl' : 'max-w-3xl'}>
            {eyebrow && (
                <p className="text-sm text-gray-400 dark:text-white/40">{eyebrow}</p>
            )}
            <h2 className={`${eyebrow ? 'mt-3 ' : ''}text-4xl sm:text-5xl font-semibold tracking-[-0.03em]`}>{title}</h2>
            {body && <p className="mt-4 text-gray-600 dark:text-white/55 text-lg">{body}</p>}
        </div>
    );
}

function Counter({ label, value, tone = 'info' }) {
    const t = SEMANTIC[tone];
    return (
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
                <p className="text-[11px] text-gray-500 dark:text-white/45">{label}</p>
            </div>
            <p className={`text-2xl mt-1 font-medium ${t.text}`}>{value}</p>
        </div>
    );
}
