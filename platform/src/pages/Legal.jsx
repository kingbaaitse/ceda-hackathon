/**
 * Legal pages - privacy, terms, data protection, accessibility.
 *
 * Public pages: they render for signed-out visitors and for signed-in users
 * alike, and they are plain reading pages with a table of contents.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Mail, ShieldCheck, Scale, Accessibility as AccessibilityIcon, FileText } from 'lucide-react';
import MarketingNav from '../components/marketing/MarketingNav';
import MarketingFooter from '../components/marketing/MarketingFooter';
import CursorFollower from '../components/CursorFollower';

const PAGES = {
    privacy: {
        title: 'Privacy Policy',
        intro: 'How the CEDA Innovation Hub collects, uses and protects your information, and the rights you hold over it.',
        updated: '12 November 2026',
        sections: [
            {
                h: 'What we collect',
                p: [
                    'Account details you give us: your name, email address, organisation or team name, and an optional profile photograph and biography.',
                    'Competition content: your innovation title and description, the SDGs you align to, your team members and their roles, and any documents or media you attach.',
                    'Assessment activity: the scores, written feedback, gate decisions and stage changes recorded during review.',
                    'Technical data: the device and browser you used, the pages you visited, and the IP address of each session — which is also how we let you see and revoke your own signed-in devices.',
                ],
            },
            {
                h: 'Why we collect it',
                p: [
                    'To run the competition: assess entries, write feedback, manage judging panels, and decide awards.',
                    'To keep the platform secure: verify who signed in, prevent abuse, and give you control over the devices holding your session.',
                    'To meet our legal duties to you and to CEDA: record who did what, and retain an audit trail of every decision.',
                ],
            },
            {
                h: 'Who can see your submission',
                p: [
                    'Your entry is visible to you, to CEDA administrators, and to the judges assigned to it. Nothing else.',
                    'Judges never see your name or your organisation while scoring — feedback is delivered to you anonymously.',
                    'An entry appears in the public awards gallery only after it has been awarded. Everything still in the pipeline stays private.',
                    'Your profile photograph, name and biography are visible to other signed-in participants and to CEDA, so that a team can be identified and contacted.',
                ],
            },
            {
                h: 'How long we keep it',
                p: [
                    'Competition entries and their assessment records are kept for as long as the competition and any appeal require, then archived under CEDA’s records policy.',
                    'Signed-out devices, expired sessions and delivery logs are purged on a short rolling cycle.',
                    'You can ask us to delete your account and its personal data at any time by writing to the address on this page.',
                ],
            },
            {
                h: 'Your rights',
                p: [
                    'Access and correction — view and update your profile at any time from Settings.',
                    'Deletion — ask for your account and personal data to be removed.',
                    'Objection and restriction — ask us to stop processing part of your data, or to limit how it is used.',
                    'Portability — ask for a copy of your data in a portable format.',
                    'Complaint — if you are not satisfied with our answer, you may complain to the relevant Botswana data protection authority.',
                ],
            },
            {
                h: 'Cookies and analytics',
                p: [
                    'The platform stores your session in your browser so you stay signed in. That is the only cookie-like storage it uses.',
                    'No advertising or third-party tracking scripts are embedded in the platform.',
                    'Aggregate counts shown on the public pages (entries awarded, goals covered) are computed from published entries only.',
                ],
            },
            {
                h: 'Third parties',
                p: [
                    'Email alerts are delivered by Resend, a transactional email provider, which processes the recipient address and message content on our behalf.',
                    'Hosting, database and file storage are provided by Supabase.',
                    'Neither is permitted to use your data for its own purposes.',
                ],
            },
            {
                h: 'Changes and contact',
                p: [
                    'If this policy changes materially we will say so in the platform and in the changelog before the change takes effect.',
                    'Questions, corrections or complaints: write to kingbaaitse@oratoryleague.xyz, or to CEDA directly.',
                ],
            },
        ],
    },
    terms: {
        title: 'Terms of Use',
        intro: 'The rules for using the CEDA Innovation Hub and entering the CEDA innovation competition.',
        updated: '12 November 2026',
        sections: [
            {
                h: 'Using the platform',
                p: [
                    'You need an account to submit. One account per entrant, and one submission per entrant.',
                    'You are responsible for what happens under your account: keep your password to yourself, and sign out devices you no longer use.',
                    'Do not attempt to reach entries, files or evaluations that have not been shared with you.',
                ],
            },
            {
                h: 'What you submit',
                p: [
                    'Everything you upload must be yours, or licensed to you. Do not submit other people’s work, confidential material, or anything you do not have the right to disclose.',
                    'You keep ownership of your submission. You grant CEDA and the assigned judges a licence to review, assess and publish it for the purposes of this competition.',
                    'An awarded entry may be published in the awards gallery with your name, organisation and profile photograph.',
                ],
            },
            {
                h: 'How entries are assessed',
                p: [
                    'Entries move through fixed stage gates: compliance, screening, evaluation, selection and award. No stage can be skipped.',
                    'Every gate decision comes with written feedback, and every score against the published rubric.',
                    'Weights for the rubric are set by CEDA and may be adjusted during the competition; scores are calculated against the weights in force at the time of scoring.',
                    'Judges are anonymous to entrants. If you believe a decision was made in error, write to CEDA within the published appeal window.',
                ],
            },
            {
                h: 'Feedback and revisions',
                p: [
                    'If CEDA returns your entry for revision, the feedback tells you what to change. You can edit and resubmit, and the previous version is kept so both sides can see what changed.',
                    'Submitted work must be your own. Anything generated or copied without disclosure will be removed and may lead to disqualification.',
                ],
            },
            {
                h: 'Fees, awards and eligibility',
                p: [
                    'There is no application fee.',
                    'Entrants must meet the published eligibility rules, including citizenship and age, and must provide the shareholding evidence where the entry type requires it.',
                    'Awards are made at CEDA’s discretion and are confirmed in writing.',
                ],
            },
            {
                h: 'Ending your participation',
                p: [
                    'You can withdraw your entry at any time before the award is announced. Write to kingbaaitse@oratoryleague.xyz.',
                    'CEDA may remove an entry that breaches these terms, that infringes someone else’s rights, or that is materially misleading.',
                ],
            },
            {
                h: 'Liability and governing law',
                p: [
                    'The platform is provided for the competition as-is. We are not liable for indirect losses arising from its use.',
                    'Nothing here limits rights you hold under Botswana’s Data Protection Act.',
                    'These terms are governed by the laws of Botswana.',
                ],
            },
            {
                h: 'Changes',
                p: [
                    'We may update these terms as the competition evolves. Material changes are announced in the platform and recorded in the changelog.',
                    'Continuing to use the platform after a change means you accept the updated terms.',
                ],
            },
        ],
    },
    'data-protection': {
        title: 'Data Protection',
        intro: 'The safeguards behind the Innovation Hub: where data lives, who can reach it, and how it is protected.',
        updated: '12 November 2026',
        sections: [
            {
                h: 'Where data lives',
                p: [
                    'All platform data is held in a single managed PostgreSQL project with row-level security on every table, plus an object-storage bucket for attachments.',
                    'Access to that project is limited to the service credentials this application uses. No human holds a database password.',
                ],
            },
            {
                h: 'Access is enforced in the database',
                p: [
                    'Access rules live in the database, not in the interface. A user who opens developer tools cannot read a submission that is not theirs.',
                    'Participants read their own entries and their own notifications. Judges read only the entries assigned to them. Administrators read what the competition needs and nothing more.',
                    'Storage objects follow the same rule, and are delivered through short-lived signed links rather than public URLs.',
                ],
            },
            {
                h: 'Audit trail',
                p: [
                    'Every gate decision, evaluation, judge assignment, stage change, message, session revocation and access to an attachment is written to an append-only audit log with the actor, the role and the time.',
                    'The trail can be filtered by action and actor and exported for review.',
                    'Revoking a device is itself an audited event.',
                ],
            },
            {
                h: 'Minimisation and separation',
                p: [
                    'Judges see the entry without the entrant’s identity. Identity is restored only when the feedback is delivered.',
                    'Internal notes between CEDA and the judging panel are kept separate from what the entrant can read.',
                    'The email provider receives a recipient address and a message. It receives nothing else.',
                ],
            },
            {
                h: 'Retention',
                p: [
                    'Entries and evaluations are retained for the competition period and any appeal, then archived under CEDA’s records schedule.',
                    'Session and delivery logs are kept on a short rolling cycle and purged automatically.',
                ],
            },
            {
                h: 'Your rights in practice',
                p: [
                    'You can see and correct your own profile, revoke any signed-in device, and ask for a copy or deletion of your data.',
                    'Requests: kingbaaitse@oratoryleague.xyz.',
                ],
            },
        ],
    },
    accessibility: {
        title: 'Accessibility',
        intro: 'What we have done so the Innovation Hub works for everyone, and how to tell us where it does not.',
        updated: '12 November 2026',
        sections: [
            {
                h: 'Our target',
                p: [
                    'The platform is built toward WCAG 2.2 Level AA. We are not claiming full conformance until an independent audit has been completed.',
                    'Botswana’s competition runs on shared phones and intermittent data, so the default experience is designed for a mid-range Android handset on a slow connection.',
                ],
            },
            {
                h: 'What is in place',
                p: [
                    'Every control is reachable by keyboard, with a visible focus ring, and dialogs close on Escape.',
                    'Menus and dropdowns are rendered outside the scroll container so they are never cut off, and they reposition as the page moves.',
                    'Colour is never the only signal: stages, severities and scores are labelled as well as coloured.',
                    'Status messages are announced to screen readers through live regions, and the loading state is labelled rather than decorative.',
                    'Text scales with the browser’s own font size, and the layout reflows to a single column on small screens.',
                    'Animations are reduced to a fade when the operating system requests reduced motion.',
                ],
            },
            {
                h: 'Known gaps',
                p: [
                    'The WebGL showcase on the awards gallery is decorative and has no text alternative; the entries it shows are listed below it in full.',
                    'The live score distribution is provided as a table for assistive technology in the administrator dashboard.',
                    'Long attachments are not yet converted to accessible text.',
                ],
            },
            {
                h: 'Tell us',
                p: [
                    'If something does not work for you, email kingbaaitse@oratoryleague.xyz with the page, the device and what happened.',
                    'Reports are treated as defects: we will confirm receipt, reproduce the issue, and tell you what we intend to change.',
                ],
            },
        ],
    },
};

const SLUGS = Object.keys(PAGES);

const ICONS = {
    privacy: ShieldCheck,
    terms: FileText,
    'data-protection': Scale,
    accessibility: AccessibilityIcon,
};

export default function Legal({ slug = 'privacy', onSignIn, onRegister }) {
    const [active, setActive] = useState(PAGES[slug] ? slug : 'privacy');
    const [openSection, setOpenSection] = useState(null);
    const page = PAGES[active];
    const Icon = ICONS[active] || FileText;

    /* keep the address bar in step with the document being read */
    useEffect(() => {
        const url = `/${active === 'data-protection' ? 'data-protection' : active}`;
        if (window.location.pathname !== url) window.history.replaceState({}, '', url);
    }, [active]);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#0a0a0a] dark:text-white transition-colors duration-300">
            <CursorFollower />
            <MarketingNav
                links={SLUGS.map(s => ({ id: s, label: PAGES[s].title.replace(' Policy', '').replace(' of Use', '').replace('Data Protection', 'Data') }))}
                onSignIn={onSignIn}
                onRegister={onRegister}
            />

            {/* ── Hero ── */}
            <section className="relative overflow-hidden">
                <div
                    className="absolute inset-0 opacity-80 dark:opacity-100"
                    style={{ background: 'radial-gradient(700px 380px at 50% 0%, rgba(242,101,34,0.16), transparent 70%)' }}
                />
                <div className="relative max-w-5xl mx-auto px-6 pt-32 pb-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent-500/12 mb-6">
                        <Icon className="w-5 h-5 text-accent-500" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-white/45">Legal · updated {page.updated}</p>
                    <h1 className="mt-4 text-4xl sm:text-6xl font-semibold tracking-[-0.035em]">{page.title}</h1>
                    <p className="mt-5 text-lg text-gray-600 dark:text-white/55 mx-auto max-w-2xl">{page.intro}</p>
                </div>
            </section>

            {/* ── Document switcher ── */}
            <section className="max-w-5xl mx-auto px-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {SLUGS.map(s => {
                        const I = ICONS[s];
                        const on = active === s;
                        return (
                            <button
                                key={s}
                                onClick={() => { setActive(s); setOpenSection(null); }}
                                className={`group rounded-3xl border p-5 text-left transition-all hover:-translate-y-0.5 ${on
                                    ? 'border-accent-500/50 bg-white dark:bg-white/[0.06] shadow-[0_18px_44px_-28px_rgba(242,101,34,0.6)]'
                                    : 'border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] hover:border-accent-500/30'}`}
                            >
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${on ? 'bg-accent-500 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/60 group-hover:text-accent-500'}`}>
                                    <I className="w-4 h-4" />
                                </div>
                                <p className={`mt-3 text-sm font-medium ${on ? 'text-accent-600 dark:text-accent-300' : 'text-gray-900 dark:text-white'}`}>
                                    {PAGES[s].title}
                                </p>
                                <p className="text-[11px] text-gray-400 dark:text-white/35 mt-1">
                                    {PAGES[s].sections.length} sections
                                </p>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* ── Document ── */}
            <section className="max-w-5xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* table of contents */}
                    <aside className="lg:col-span-3 hidden lg:block">
                        <div className="sticky top-28">
                            <p className="text-[10px] uppercase tracking-[0.16em] text-gray-400 dark:text-white/35">
                                On this page
                            </p>
                            <nav className="mt-4 space-y-1.5">
                                {page.sections.map(s => (
                                    <a
                                        key={s.h}
                                        href={`#${s.h.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                                        className="block text-sm text-gray-600 dark:text-white/50 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
                                    >
                                        {s.h}
                                    </a>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    {/* the sections */}
                    <div className="lg:col-span-9">
                        <div className="space-y-3">
                            {page.sections.map((s, i) => {
                                const id = s.h.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                                const open = openSection === id;
                                return (
                                    <motion.div
                                        key={s.h}
                                        id={id}
                                        initial={{ opacity: 0, y: 12 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: '-40px' }}
                                        transition={{ delay: Math.min(i, 5) * 0.03 }}
                                        className={`border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden scroll-mt-28 transition-[border-radius] duration-300 ${open ? 'rounded-3xl' : 'rounded-full'}`}
                                    >
                                        <button
                                            onClick={() => setOpenSection(open ? null : id)}
                                            aria-expanded={open}
                                            className="w-full flex items-center gap-3 px-5 sm:px-6 py-4 text-left hover:bg-gray-50/70 dark:hover:bg-white/[0.03] transition-colors"
                                        >
                                            <span className="w-7 h-7 rounded-full bg-accent-500/10 text-accent-600 dark:text-accent-300 text-[11px] font-mono flex items-center justify-center flex-shrink-0">
                                                {String(i + 1).padStart(2, '0')}
                                            </span>
                                            <span className="text-sm sm:text-base font-medium flex-1">{s.h}</span>
                                            <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                                        </button>
                                        <AnimatePresence initial={false}>
                                            {open && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-5 sm:px-6 pb-6 space-y-3">
                                                        {s.p.map((para, j) => (
                                                            <p key={j} className="text-gray-600 dark:text-gray-300 leading-relaxed">{para}</p>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div className="mt-10 rounded-3xl border border-accent-500/25 bg-accent-500/5 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-accent-500/15 flex items-center justify-center flex-shrink-0">
                                <Mail className="w-4 h-4 text-accent-500" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Questions about this document?</p>
                                <p className="text-sm text-gray-600 dark:text-white/55 mt-1">
                                    Write to{' '}
                                    <a href="mailto:kingbaaitse@oratoryleague.xyz" className="text-accent-600 dark:text-accent-400 hover:underline">
                                        kingbaaitse@oratoryleague.xyz
                                    </a>
                                    . We answer within two working days.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <MarketingFooter />
        </div>
    );
}
