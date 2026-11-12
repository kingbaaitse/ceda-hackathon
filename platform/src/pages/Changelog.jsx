/**
 * Changelog — the full record of what changed in the platform, by release.
 * Read by CEDA administrators and reviewers; the same content lives in
 * CHANGELOG.md at the repository root.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GitCommitVertical,
    ChevronDown,
    History,
    ShieldCheck,
    Layers,
    Bell,
    Gauge,
} from 'lucide-react';
import Logo from '../components/Logo';
import MarketingNav from '../components/marketing/MarketingNav';
import MarketingFooter from '../components/marketing/MarketingFooter';

const RELEASES = [
    {
        version: '1.0.2',
        date: '2026-11-12',
        title: 'Round two polish',
        summary: 'A production-grade international phone picker, loaders inside every image and thumbnail, deep links that resolve on the deployed site, and a tidier milestone trail.',
        groups: [
            {
                icon: Layers,
                title: 'Interface',
                items: [
                    'The phone picker is now the production-grade international input: every country in the world, real rendered flags, a searchable list, and numbers saved in the standard international format automatically.',
                    'Profile pictures, submission images and media thumbnails show the CEDA loader while they load, so a slow image never looks like an empty page.',
                    'The milestone trail connects each circle by its outline instead of stopping short, and completed stages are tinted green with a tick.',
                    'The team profile carries the real social accounts — LinkedIn, Instagram and X — with the same marks used across the wider brand.',
                    'Deep links to the marketing pages, such as the changelog and the team page, now resolve on the deployed site instead of returning 404.',
                    'The contact email in the footer is corrected.',
                ],
            },
        ],
    },
    {
        version: '1.0.1',
        date: '2026-11-12',
        title: 'Phase 3 polish',
        summary: 'A calmer, faster portal: animated icons, a real notification centre, a collapsible search, clearer refresh states and a Settings panel that controls the theme.',
        groups: [
            {
                icon: Layers,
                title: 'Interface',
                items: [
                    'Every icon in the signed-in portal now responds to hover and to a tap, and the notification bell keeps ringing while something is unread.',
                    'The top-bar search rests as a circle and expands only when it is opened or typed into, giving the header back its space.',
                    'The refresh control reports its own state: a calm spinner while loading, a green tick when the view is current, and a red mark when a refresh fails.',
                    'Loading buttons across the portal grey out and show the CEDA mark instead of text dots, and no screen uses an ellipsis as a placeholder.',
                    'Full-screen loading now covers every portal while its data arrives, not only the dashboard.',
                    'The Settings panel is fully working, and the light and dark theme switch now lives there instead of the top bar.',
                    'Phone numbers use a flag picker with a searchable country list, matching the rest of the sign-up experience.',
                ],
            },
            {
                icon: Bell,
                title: 'Notifications',
                items: [
                    'The notification panel is frosted rather than flat: the page behind it stays visible through a heavy blur.',
                    'Unread items are tinted and marked, read items fade back, and the badge, the panel and the bell all agree on what is unread.',
                    'A short, soft chime plays when a new notification arrives while the portal is open.',
                    'Mark all read clears the badge and the panel in one step.',
                ],
            },
        ],
    },
    {
        version: '1.0.0',
        date: '2026-11-11',
        title: 'Phase 3 — Trust, insight and reach',
        summary: 'Audit trail, participant–admin conversations, judge calibration, live analytics, email alerts, an offline-capable PWA and a public awards gallery.',
        groups: [
            {
                icon: ShieldCheck,
                title: 'Trust & security',
                items: [
                    'Immutable audit trail of every gate decision, evaluation, judge assignment, stage change, message and session revocation — filterable by action and actor, exportable to CSV.',
                    'Active sessions panel in Settings: every device signed in to the account, one-click revoke, or sign out every other device. Revocation is enforced server-side (the session is rejected on its next request) and recorded in the audit trail.',
                    'Row-level security on every table: ownership, judge-assignment scope and admin access are enforced in the database, never in the UI.',
                    'Private storage bucket with short-lived signed URLs; attachments are readable only by the owner, CEDA, assigned judges and — for awarded entries — the public gallery.',
                    'Password strength meter with a live character count and the exact rules still unmet.',
                ],
            },
            {
                icon: History,
                title: 'Partner & showcase',
                items: [
                    'CEDA and Oratory League presented as the two sides of the project: CEDA owns the competition and the pipeline, Oratory League is the official partner and the developer behind the platform.',
                    'The landing page leads with a live interactive preview and carries the awarded work as a draggable, infinitely tiled showcase, a parallax strip of the winners, and the competition window as a daily status strip.',
                    'Every showcase component is the original Obsidian UI build, pulled from their public registry and kept in sync by a script.',
                    'Public pages follow the reader’s theme — light or dark — instead of forcing dark.',
                ],
            },
            {
                icon: Bell,
                title: 'Communication',
                items: [
                    'Realtime in-app notifications with an unread badge, delivered to the participant, judge or administrator affected by each event.',
                    'Email alerts through a database-triggered mail worker (Resend), with a per-user opt-in, a branded template stored in the database and a delivery log for auditing.',
                    'Message threads on every submission with per-message visibility: participant + judges, judges only, or admins only.',
                ],
            },
            {
                icon: Gauge,
                title: 'Insight & fairness',
                items: [
                    'Admin dashboard opening with a “Needs attention” queue: awaiting screening, no judge assigned, evaluation outstanding, ready for the award decision, revision requested but not resubmitted, and unanswered participant messages.',
                    'Live analytics: SDG alignment spread, score distribution banded by quality, per-criterion averages, gate turnaround, and written insights derived from the data.',
                    'Judge calibration against anonymous panel aggregates — the panel average and per-criterion spread, never a peer identity or peer feedback.',
                    'Rubric weights are configuration, not code: CEDA admins tune them in the portal and judges score against the live weighting on a 0–100 scale.',
                ],
            },
        ],
    },
    {
        version: '0.9.0',
        date: '2026-11-11',
        title: 'Phase 2 — The full innovation pipeline',
        summary: 'Attachments and media, a guided submission wizard with autosave, version history, notifications and the weighted rubric.',
        groups: [
            {
                icon: Layers,
                title: 'Submission experience',
                items: [
                    'Four-step submission wizard: the idea, alignment and team, media and documents, review and submit — with continuous autosave.',
                    'Team member editor with the role set from the guidelines (UX, UI, Developer, Business Analyst, Technical Analyst).',
                    'SDG multi-select, stage-of-development picker, and logo, product shot and pitch-deck uploads.',
                    'Version history: each resubmission snapshots the previous entry, so CEDA and the entrant can both see what changed between rounds.',
                    'Offline drafts: edits made without a signal are queued on the device and synced automatically on reconnect.',
                ],
            },
            {
                icon: GitCommitVertical,
                title: 'Workflow',
                items: [
                    'Gate transitions with required written feedback, and a revision loop that returns an entry to the participant with clear guidance.',
                    'Judge assignment, and judges who see only the submissions assigned to them.',
                    'Weighted rubric scoring with per-criterion feedback delivered anonymously to the participant.',
                    'Public awards gallery for entries that reached the award gate.',
                ],
            },
        ],
    },
    {
        version: '0.8.0',
        date: '2026-11-11',
        title: 'Phase 1 — The platform',
        summary: 'Authentication, the four role portals, the stage-gated workflow, evaluations and reporting.',
        groups: [
            {
                icon: History,
                title: 'Foundation',
                items: [
                    'Authentication with participant, judge and administrator roles, each with its own portal.',
                    'Stage-gated workflow: draft → submitted → compliance review → screened in → evaluation → selection → award.',
                    'Submissions, evaluations and gate events stored in PostgreSQL with row-level security throughout.',
                    'Pipeline reporting: stage volume, conversion and evaluation averages.',
                    'CEDA brand system: orange, royal and gold palette, Elms Sans typography, glass panels and a floating-pill shell.',
                ],
            },
        ],
    },
];

export default function Changelog({ onBack }) {
    const [openRelease, setOpenRelease] = useState(RELEASES[0].version);
    const [openGroups, setOpenGroups] = useState({});

    const toggleGroup = (key) => setOpenGroups(g => ({ ...g, [key]: !g[key] }));

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#0a0a0a] dark:text-white transition-colors duration-300">
            <MarketingNav
                links={[
                    { id: 'changelog', label: 'Changelog' },
                    { id: 'awards', label: 'Awards', href: '/gallery' },
                ]}
                onSignIn={onBack}
                onRegister={onBack}
            />

            <main className="max-w-4xl mx-auto px-6 pt-32 pb-20">
                <div className="flex items-center gap-2 text-accent-600 dark:text-accent-400 text-xs uppercase tracking-[0.18em]">
                    <GitCommitVertical className="w-3.5 h-3.5" /> Changelog
                </div>
                <h1 className="mt-5 text-4xl sm:text-5xl font-semibold tracking-[-0.03em]">What changed, and when</h1>
                <p className="mt-4 text-gray-600 dark:text-white/55 max-w-2xl">
                    Every release of the CEDA Innovation Hub, newest first. Open a release to read
                    what it changed and why it matters.
                </p>

                {/* ── Timeline ── */}
                <div className="mt-14 relative">
                    {/* the rail */}
                    <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gray-200 dark:bg-white/10" />

                    <div className="space-y-6">
                        {RELEASES.map((rel, ri) => {
                            const open = openRelease === rel.version;
                            return (
                                <motion.section
                                    key={rel.version}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-80px' }}
                                    transition={{ duration: 0.4 }}
                                    className="relative pl-14"
                                >
                                    {/* node */}
                                    <span className={`absolute left-0 top-1 w-10 h-10 rounded-full border-4 border-gray-50 dark:border-[#0a0a0a] flex items-center justify-center text-[10px] font-mono ${open ? 'bg-accent-500 text-white' : 'bg-white dark:bg-white/10 text-gray-500 dark:text-white/50'}`}>
                                        {ri + 1}
                                    </span>

                                    <button
                                        onClick={() => setOpenRelease(open ? '' : rel.version)}
                                        className="w-full text-left group rounded-none"
                                        aria-expanded={open}
                                    >
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${open ? 'bg-accent-500/15 text-accent-600 dark:text-accent-300' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/60'}`}>
                                                v{rel.version}
                                            </span>
                                            <span className="text-xs text-gray-400 dark:text-white/35">{rel.date}</span>
                                            <ChevronDown
                                                className={`w-4 h-4 text-gray-400 ml-auto transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                                            />
                                        </div>
                                        <h2 className="mt-3 text-2xl font-medium tracking-tight group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
                                            {rel.title}
                                        </h2>
                                        <p className="mt-1.5 text-gray-600 dark:text-white/55 max-w-2xl">{rel.summary}</p>
                                    </button>

                                    <AnimatePresence initial={false}>
                                        {open && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                                className="overflow-hidden"
                                            >
                                                <div className="mt-6 space-y-3">
                                                    {rel.groups.map((g, gi) => {
                                                        const key = `${rel.version}-${g.title}`;
                                                        const gOpen = openGroups[key] !== false;
                                                        return (
                                                            <div key={g.title} className="rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden">
                                                                <button
                                                                    onClick={() => toggleGroup(key)}
                                                                    aria-expanded={gOpen}
                                                                    className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
                                                                >
                                                                    <div className="w-8 h-8 rounded-full bg-accent-500/12 flex items-center justify-center flex-shrink-0">
                                                                        <g.icon className="w-4 h-4 text-accent-500" />
                                                                    </div>
                                                                    <span className="text-sm font-medium">{g.title}</span>
                                                                    <span className="text-[11px] text-gray-400 dark:text-white/35">{g.items.length}</span>
                                                                    <ChevronDown className={`w-4 h-4 text-gray-400 ml-auto transition-transform duration-300 ${gOpen ? 'rotate-180' : ''}`} />
                                                                </button>
                                                                <AnimatePresence initial={false}>
                                                                    {gOpen && (
                                                                        <motion.ul
                                                                            initial={{ height: 0, opacity: 0 }}
                                                                            animate={{ height: 'auto', opacity: 1 }}
                                                                            exit={{ height: 0, opacity: 0 }}
                                                                            transition={{ duration: 0.28 }}
                                                                            className="overflow-hidden px-5 pb-5 space-y-2"
                                                                        >
                                                                            {g.items.map((item, ii) => (
                                                                                <li key={ii} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                                                                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-accent-500 flex-shrink-0" />
                                                                                    <span className="leading-relaxed">{item}</span>
                                                                                </li>
                                                                            ))}
                                                                        </motion.ul>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.section>
                            );
                        })}
                    </div>
                </div>
            </main>

            <MarketingFooter />
        </div>
    );
}
