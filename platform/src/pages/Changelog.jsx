/**
 * Changelog — the full record of what changed in the platform, by release.
 * Read by CEDA administrators and reviewers; the same content lives in
 * CHANGELOG.md at the repository root.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, GitCommitVertical, Sparkles, ShieldCheck, Layers, Bell, Gauge } from 'lucide-react';
import Logo from '../components/Logo';
import MarketingNav from '../components/marketing/MarketingNav';
import MarketingFooter from '../components/marketing/MarketingFooter';

const RELEASES = [
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
                icon: Sparkles,
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
                icon: Sparkles,
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
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#0a0a0a] dark:text-gray-900 dark:text-white">
            <MarketingNav
                links={[
                    { id: 'changelog', label: 'Changelog' },
                    { id: 'awards', label: 'Awards', href: '/gallery' },
                ]}
                onSignIn={onBack}
                onRegister={onBack}
            />

            <main className="max-w-4xl mx-auto px-6 py-16">
                <div className="flex items-center gap-2 text-accent-400 text-xs uppercase tracking-[0.18em]">
                    <GitCommitVertical className="w-3.5 h-3.5" /> Changelog
                </div>
                <h1 className="mt-5 text-4xl sm:text-5xl tracking-tight">What changed, and when</h1>
                <p className="mt-4 text-gray-900/55 dark:text-gray-900 dark:text-white/55 max-w-2xl">
                    Every release of the CEDA Innovation Hub, newest first — what was added,
                    why it matters for the competition, and what it means for the entrant.
                </p>

                <div className="mt-14 space-y-16">
                    {RELEASES.map((rel, ri) => (
                        <motion.section
                            key={rel.version}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="flex items-baseline gap-4">
                                <span className="px-3 py-1 rounded-full text-xs bg-accent-500/15 text-accent-600 dark:text-accent-300 font-medium">
                                    v{rel.version}
                                </span>
                                <span className="text-xs text-gray-900/35 dark:text-gray-900 dark:text-white/35">{rel.date}</span>
                            </div>
                            <h2 className="mt-4 text-2xl tracking-tight">{rel.title}</h2>
                            <p className="mt-2 text-gray-900/55 dark:text-gray-900 dark:text-white/55 max-w-2xl">{rel.summary}</p>

                            <div className="mt-8 space-y-6">
                                {rel.groups.map(g => (
                                    <div key={g.title} className="rounded-3xl border border-gray-200 dark:border-white/10 p-6">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-accent-500/12 flex items-center justify-center">
                                                <g.icon className="w-4 h-4 text-accent-400" />
                                            </div>
                                            <h3 className="text-gray-900 dark:text-white">{g.title}</h3>
                                        </div>
                                        <ul className="mt-4 space-y-2.5">
                                            {g.items.map((item, i) => (
                                                <li key={i} className="flex gap-2.5 text-sm text-gray-900/60 dark:text-gray-900 dark:text-white/60">
                                                    <span className="mt-[7px] w-1 h-1 rounded-full bg-accent-500 flex-shrink-0" />
                                                    <span className="leading-relaxed">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </motion.section>
                    ))}
                </div>

                <MarketingFooter />
            </main>
        </div>
    );
}
