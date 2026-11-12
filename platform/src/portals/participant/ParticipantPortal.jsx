/* ═══════════════════════════════════════════════════════════════
 *  CEDA Innovation Hub — Participant Portal (Phase 2)
 *  4-step submission wizard with autosave, team editor, SDG picker,
 *  media uploads, version history and the stage-gate feedback loop.
 * ═══════════════════════════════════════════════════════════════ */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PortalLayout from '../../components/PortalLayout';
import { RefreshButton } from '../../components/TopBar';
import AttachmentGrid from '../../components/AttachmentGrid';
import MediaUploader from '../../components/MediaUploader';
import MessageThread from '../../components/MessageThread';
import Select from '../../components/ui/Select';
import MultiSelect from '../../components/ui/MultiSelect';
import { SkeletonCard } from '../../components/ui/Skeleton';
import EmptyState from '../../components/EmptyState';
import emptyArt from '../../assets/img/illustrations/idea-process.svg';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { STAGE_LABELS, STAGE_COLORS } from '../../lib/pipeline';
import { useRubric } from '../../lib/rubric';
import { SDGS, TEAM_ROLES } from '../../lib/sdgs';
import { queueDraft, flushDrafts } from '../../lib/offline';
import { ButtonLoader, InlineLoader } from '../../components/Loader';
import { CheckCircle2, ChevronLeft, ChevronRight, FileEdit, History, LayoutDashboard, Lightbulb, MessageCircle, MessageSquareText, Plus, Send, Trash2, Users } from '../../components/AnimatedIcons';

const NAV = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'submission', label: 'My Submission', icon: FileEdit },
    { id: 'feedback', label: 'Feedback', icon: MessageSquareText },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
];

const TRAIL = ['submitted', 'compliance_review', 'screened_in', 'in_evaluation', 'selection', 'awarded'];
const STAGE_INDEX = (stage) => {
    if (stage === 'screened_out' || stage === 'not_selected') return TRAIL.length - 1;
    const i = TRAIL.indexOf(stage);
    return i === -1 ? 0 : i;
};
const STATUS_ICON = (stage) => {
    if (stage === 'awarded') return Award;
    if (stage === 'screened_out' || stage === 'not_selected') return AlertCircle;
    if (stage === 'draft') return FileEdit;
    return Clock;
};

const EMPTY_FORM = {
    title: '', description: '', stage_of_development: 'Idea',
    sdgs: [], team: [], attachments: [],
};

export default function ParticipantPortal() {
    const { user, profile, logout } = useAuth();
    const { toast } = useToast();
    const [tab, setTab] = useState('overview');
    const [submission, setSubmission] = useState(null);
    const [gateEvents, setGateEvents] = useState([]);
    const [evaluations, setEvaluations] = useState([]);
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fatal, setFatal] = useState('');

    const refresh = useCallback(async () => {
        const { data, error } = await supabase
            .from('ceda_submissions')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) { setFatal(error.message); setLoading(false); return; }
        const mine = data.find(s => s.owner_id === user.id) || null;
        setSubmission(mine);
        if (mine) {
            const [ge, ev, vs] = await Promise.all([
                supabase.from('ceda_gate_events').select('*').eq('submission_id', mine.id).order('created_at'),
                supabase.from('ceda_evaluations').select('*').eq('submission_id', mine.id).order('created_at', { ascending: false }),
                supabase.from('ceda_submission_versions').select('*').eq('submission_id', mine.id).order('version'),
            ]);
            setGateEvents(ge.data || []);
            setEvaluations(ev.data || []);
            setVersions(vs.data || []);
        } else {
            setGateEvents([]); setEvaluations([]); setVersions([]);
        }
        setLoading(false);
    }, [user.id]);

    useEffect(() => { refresh(); }, [refresh]);

    return (
        <PortalLayout
            navItems={NAV}
            activeTab={tab}
            onTabChange={setTab}
            userName={profile?.full_name || user.email}
            userRole={profile?.role || 'participant'}
            userId={user.id}
            onLogout={logout}
            headerActions={
                <RefreshButton onRefresh={refresh} />
            }
        >
            {loading ? (
                <div className="max-w-5xl space-y-4">
                    <SkeletonCard lines={4} />
                    <div className="grid grid-cols-3 gap-4"><SkeletonCard lines={1} /><SkeletonCard lines={1} /><SkeletonCard lines={1} /></div>
                </div>
            ) : fatal ? (
                <div className="card p-6 text-royal-600 text-sm">{fatal}</div>
            ) : (
                <>
                    {tab === 'overview' && <Overview submission={submission} gateEvents={gateEvents} evaluations={evaluations} onSubmitTab={() => setTab('submission')} />}
                    {tab === 'submission' && <SubmissionWizard submission={submission} onSaved={refresh} />}
                    {tab === 'feedback' && <Feedback gateEvents={gateEvents} evaluations={evaluations} versions={versions} submission={submission} />}
                    {tab === 'messages' && (
                        <div className="max-w-3xl">
                            <div className="card p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <MessageCircle className="w-4 h-4 text-accent-500" />
                                    <h3 className="text-gray-900 dark:text-white text-lg">Messages with CEDA</h3>
                                </div>
                                {submission
                                    ? <MessageThread submissionId={submission.id} role="participant" />
                                    : <p className="text-sm text-gray-400">Create a submission to start a conversation with CEDA.</p>}
                            </div>
                        </div>
                    )}
                </>
            )}
        </PortalLayout>
    );
}

/* ─── Overview ───────────────────────────────────────────────── */
function Overview({ submission, gateEvents, evaluations, onSubmitTab }) {
    const stage = submission?.stage || 'draft';
    const idx = STAGE_INDEX(stage);
    const Icon = STATUS_ICON(stage);

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="card p-8">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-accent-50 dark:bg-accent-500/10 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-accent-500" />
                        </div>
                        <div>
                            <h1 className="text-gray-900 dark:text-white text-2xl tracking-tight">
                                {submission ? submission.title : 'No submission yet'}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                {submission ? `Last updated ${new Date(submission.updated_at).toLocaleString()}` : 'Create your submission to enter the pipeline.'}
                            </p>
                        </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs ${STAGE_COLORS[stage]}`}>{STAGE_LABELS[stage]}</span>
                </div>

                <div className="mt-8 flex items-center overflow-x-auto pb-2">
                    {TRAIL.map((s, i) => (
                        <React.Fragment key={s}>
                            <div className="flex flex-col items-center flex-shrink-0">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.05 }}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${i < idx ? 'bg-emerald-500 border-emerald-500' : i === idx ? 'border-accent-500 bg-accent-50 dark:bg-accent-500/10' : 'border-gray-200 dark:border-white/10'}`}
                                >
                                    {i < idx && <CheckCircle2 className="w-4 h-4 text-white" />}
                                    {i === idx && <div className="w-2.5 h-2.5 rounded-full bg-accent-500" />}
                                </motion.div>
                                <span className={`text-[10px] mt-1.5 text-center w-20 ${i <= idx ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400'}`}>{STAGE_LABELS[s]}</span>
                            </div>
                            {i < TRAIL.length - 1 && <div className={`h-0.5 w-10 flex-shrink-0 mx-1 mb-5 ${i < idx ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-white/10'}`} />}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card p-5"><p className="text-xs text-gray-400">Gate feedback received</p><p className="text-3xl text-gray-900 dark:text-white mt-1">{gateEvents.length}</p></div>
                <div className="card p-5"><p className="text-xs text-gray-400">Judge evaluations</p><p className="text-3xl text-gray-900 dark:text-white mt-1">{evaluations.length}</p></div>
                <div className="card p-5"><p className="text-xs text-gray-400">Average score</p><p className="text-3xl text-gray-900 dark:text-white mt-1">{evaluations.length ? `${Math.round(evaluations.reduce((a, e) => a + Number(e.total), 0) / evaluations.length)}/100` : '—'}</p></div>
            </div>

            {!submission && (
                <EmptyState
                    art={emptyArt}
                    title="Your entry starts here"
                    body="Create a submission and we will guide you through the idea, your team, your media and a final review before anything is sent."
                    action={
                        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={onSubmitTab} className="btn-accent">
                            <Lightbulb className="w-4 h-4" /> Start your submission
                        </motion.button>
                    }
                />
            )}
        </div>
    );
}

/* ─── Submission Wizard ──────────────────────────────────────── */
const STEPS = ['The Idea', 'Alignment & Team', 'Media & Documents', 'Review & Submit'];

function SubmissionWizard({ submission, onSaved }) {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const rubric = useRubric();
    const editable = !submission || submission.stage === 'draft';

    const [step, setStep] = useState(0);
    const [form, setForm] = useState(() => submission ? {
        title: submission.title,
        description: submission.description,
        stage_of_development: submission.stage_of_development || 'Idea',
        sdgs: submission.sdgs || [],
        team: submission.team_members || [],
        attachments: submission.attachments || [],
    } : EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [lastSaved, setLastSaved] = useState(null);
    const [queued, setQueued] = useState(false);

    const saveTimer = useRef(null);
    const subId = submission?.id || null;

    /* Form -> row payload. The DB column is team_members; the wizard calls it team. */
    const toRow = (data) => ({
        title: data.title,
        description: data.description,
        stage_of_development: data.stage_of_development,
        sdgs: data.sdgs || [],
        attachments: data.attachments || [],
        team_members: data.team || [],
    });

    /* Autosave (draft only, debounced) */
    const persist = useCallback(async (data, { silent = true } = {}) => {
        setSaving(true);
        try {
            const row = toRow(data);
            if (subId) {
                const { error: err } = await supabase.from('ceda_submissions')
                    .update({ ...row, updated_at: new Date().toISOString() }).eq('id', subId);
                if (err) throw err;
            } else {
                const { data: created, error: err } = await supabase.from('ceda_submissions').insert({
                    owner_id: user.id,
                    owner_name: profile?.full_name || user.email,
                    entry_type: (row.team_members.length || profile?.org_name) ? 'team' : 'individual',
                    ...row,
                }).select('id').single();
                if (err) throw err;
                subIdRef.current = created.id;
                onSaved();
            }
            setLastSaved(new Date());
            setQueued(false);
            if (!silent) toast('Draft saved', 'success');
        } catch (e) {
            // No signal: park the draft locally and sync when back online.
            const id = currentSubId();
            if (id && !navigator.onLine) {
                queueDraft(id, row);
                setQueued(true);
                toast('Offline — your changes are saved on this device and will sync automatically.', 'info', 5000);
            } else if (!silent) {
                setError(e.message || 'Could not save.');
            }
        } finally {
            setSaving(false);
        }
    }, [subId, user.id, profile, onSaved, toast]); // eslint-disable-line react-hooks/exhaustive-deps

    const subIdRef = useRef(null);
    const currentSubId = () => subId || subIdRef.current;

    /* Sync any drafts parked while offline */
    useEffect(() => {
        const sync = async () => {
            const synced = await flushDrafts(supabase);
            if (synced.length) {
                setQueued(false);
                toast('Back online — your offline changes were synced.', 'success');
                onSaved();
            }
        };
        window.addEventListener('online', sync);
        if (navigator.onLine) sync();
        return () => window.removeEventListener('online', sync);
    }, [onSaved, toast]);

    const queueSave = (data) => {
        if (!subId && !subIdRef.current) return; // nothing to save into yet
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => persist(data), 2500);
    };

    const set = (k) => (e) => {
        const v = e?.target ? e.target.value : e;
        setForm(f => {
            const next = { ...f, [k]: v };
            queueSave(next);
            return next;
        });
    };

    /* Attachments + team mutate arrays directly */
    const setArray = (k, arr) => {
        setForm(f => {
            const next = { ...f, [k]: arr };
            queueSave(next);
            return next;
        });
    };

    const validateStep = (s) => {
        if (s === 0) {
            if (!form.title.trim()) return 'Give your innovation a title.';
            if (form.description.trim().length < 50) return 'Describe your solution in at least 50 characters.';
        }
        if (s === 1 && form.team.length > 0) {
            if (form.team.some(m => !m.name?.trim())) return 'Every team member needs a name.';
        }
        return '';
    };

    const next = async () => {
        const v = validateStep(step);
        if (v) { setError(v); return; }
        setError('');
        // First transition creates the draft row so uploads/SDGs have an id
        if (step === 0 && !currentSubId()) await persist(form, { silent: false });
        else await persist(form, { silent: true });
        setStep(s => Math.min(s + 1, 3));
    };

    const handleSubmitForReview = async () => {
        const v = STEPS.reduce((acc, _, i) => acc || validateStep(i), '');
        if (v) { setError(v); toast(v, 'error'); return; }
        setSubmitting(true); setError('');
        try {
            const id = currentSubId();
            // Snapshot a version when this is a revision (was reviewed before)
            if (id && submission?.stage === 'draft') {
                const { count } = await supabase.from('ceda_gate_events').select('*', { count: 'exact', head: true }).eq('submission_id', id);
                if (count > 0) {
                    const { count: vCount } = await supabase.from('ceda_submission_versions').select('*', { count: 'exact', head: true }).eq('submission_id', id);
                    await supabase.from('ceda_submission_versions').insert({
                        submission_id: id,
                        version: (vCount || 0) + 1,
                        data: { title: submission.title, description: submission.description, sdgs: submission.sdgs, team_members: submission.team_members, attachments: submission.attachments },
                        note: 'Revision snapshot before resubmission',
                    });
                }
            }
            const row = toRow(form);
            if (id) {
                const { error: err } = await supabase.from('ceda_submissions').update({
                    ...row, stage: 'submitted', updated_at: new Date().toISOString(),
                }).eq('id', id);
                if (err) throw err;
            } else {
                const { error: err } = await supabase.from('ceda_submissions').insert({
                    owner_id: user.id,
                    owner_name: profile?.full_name || user.email,
                    entry_type: (row.team_members.length || profile?.org_name) ? 'team' : 'individual',
                    stage: 'submitted',
                    ...row,
                });
                if (err) throw err;
            }
            toast('Submitted for review — good luck!', 'success');
            onSaved();
        } catch (e) {
            setError(e.message || 'Could not submit.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!editable) return <LockedView submission={submission} />;

    return (
        <div className="max-w-3xl">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
                {STEPS.map((s, i) => (
                    <React.Fragment key={s}>
                        <button
                            type="button"
                            onClick={() => i < step && setStep(i)}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs whitespace-nowrap transition-colors ${i === step ? 'bg-accent-500 text-white' : i < step ? 'bg-accent-50 dark:bg-accent-500/10 text-accent-600 dark:text-accent-400' : 'text-gray-400'}`}
                        >
                            {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${i === step ? 'border-white/60' : 'border-gray-300'}`}>{i + 1}</span>}
                            {s}
                        </button>
                        {i < STEPS.length - 1 && <div className={`h-px w-4 flex-shrink-0 ${i < step ? 'bg-accent-400' : 'bg-gray-200 dark:bg-white/10'}`} />}
                    </React.Fragment>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                    {step === 0 && <StepIdea form={form} set={set} />}
                    {step === 1 && <StepTeam form={form} set={set} setArray={setArray} />}
                    {step === 2 && (
                        <div className="card p-8">
                            <h3 className="text-gray-900 dark:text-white text-lg mb-1">Media & documents</h3>
                            <p className="text-xs text-gray-400 mb-4">Logos, product photos, pitch decks, technical drawings. Visible only to CEDA and your assigned judges.</p>
                            <MediaUploader
                                ownerId={user.id}
                                submissionId={currentSubId()}
                                attachments={form.attachments}
                                onChange={(arr) => setArray('attachments', arr)}
                            />
                        </div>
                    )}
                    {step === 3 && <StepReview form={form} submission={submission} rubric={rubric} />}
                </motion.div>
            </AnimatePresence>

            {error && <p className="text-royal-600 dark:text-royal-400 text-sm px-2 mt-4">{error}</p>}
            <div className="flex items-center justify-between mt-6">
                <button type="button" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="btn-secondary !py-2.5 !px-5 !text-sm disabled:opacity-40">
                    <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <div className="flex items-center gap-3">
                    {queued && <span className="text-[11px] text-amber-600 dark:text-amber-400">Saved offline — will sync</span>}
                    {lastSaved && step > 0 && !queued && <span className="text-[11px] text-gray-400">Saved {lastSaved.toLocaleTimeString()}</span>}
                    {saving && <InlineLoader size={14} />}
                    {step < 3 ? (
                        <button type="button" onClick={next} disabled={saving} className="btn-accent !py-2.5 !px-5 !text-sm">
                            Continue <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button type="button" onClick={handleSubmitForReview} disabled={submitting} className="btn-accent !py-2.5 !px-5 !text-sm">
                            {submitting ? <ButtonLoader /> : <Send className="w-4 h-4" />}
                            Submit for review
                        </button>
                    )}
                </div>
            </div>
            <p className="text-xs text-gray-400 px-1 mt-3">Submitting locks your entry and starts the stage-gated review. One submission per participant.</p>
        </div>
    );
}

/* Wizard steps */
const Field = ({ label, children, hint }) => (
    <div>
        <label className="text-xs text-gray-400 uppercase tracking-wide">{label}</label>
        <div className="mt-2">{children}</div>
        {hint && <p className="text-[11px] text-gray-400 mt-1.5">{hint}</p>}
    </div>
);

function StepIdea({ form, set }) {
    return (
        <div className="card p-8 space-y-5">
            <Field label="Idea title">
                <input value={form.title} onChange={set('title')} placeholder="Give your innovation a name"
                    className="w-full rounded-full field-fill py-3.5 px-5 text-sm text-gray-900 dark:text-white placeholder-gray-400" />
            </Field>
            <Field label="Description" hint="Problem, solution, how it works. Judges score what they can picture.">
                <textarea value={form.description} onChange={set('description')} rows={7} placeholder="Describe the problem, your solution, and how it works"
                    className="w-full field-fill py-3.5 px-5 text-sm text-gray-900 dark:text-white placeholder-gray-400" />
            </Field>
            <Field label="Stage of development">
                <Select value={form.stage_of_development} onChange={set('stage_of_development')}
                    options={['Idea', 'Prototype', 'MVP', 'Live product']} />
            </Field>
        </div>
    );
}

function StepTeam({ form, set, setArray }) {
    const team = form.team || [];
    const addMember = () => setArray('team', [...team, { name: '', roles: [] }]);
    const setMember = (i, patch) => setArray('team', team.map((m, j) => j === i ? { ...m, ...patch } : m));
    const removeMember = (i) => setArray('team', team.filter((_, j) => j !== i));

    return (
        <div className="space-y-5">
            <div className="card p-8 space-y-5">
                <Field label="SDG alignment" hint="Pick the goals your innovation advances.">
                    <MultiSelect value={form.sdgs || []} onChange={setArray.bind(null, 'sdgs')} options={SDGS} placeholder="Select SDGs" max={4} />
                </Field>
            </div>
            <div className="card p-8 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-gray-900 dark:text-white text-lg">Team members</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Roles mirror the guidelines: UX, UI, Developer, Business & Technical Analyst.</p>
                    </div>
                    <button type="button" onClick={addMember} className="btn-secondary !py-2 !px-4 !text-xs">
                        <Plus className="w-3.5 h-3.5" /> Add member
                    </button>
                </div>
                {team.length === 0 && (
                    <div className="flex items-center gap-3 text-sm text-gray-400 py-4">
                        <Users className="w-4 h-4" /> Applying as an individual — add team members if you're entering as a team.
                    </div>
                )}
                {team.map((m, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-gray-100 dark:border-white/10 p-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <input value={m.name} onChange={e => setMember(i, { name: e.target.value })} placeholder={`Member ${i + 1} full name`}
                                className="flex-1 rounded-full field-fill py-2.5 px-4 text-sm text-gray-900 dark:text-white placeholder-gray-400" />
                            <button type="button" onClick={() => removeMember(i)} className="p-2 rounded-full text-gray-400 hover:text-royal-600 hover:bg-royal-50 dark:hover:bg-royal-500/10">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <MultiSelect compact value={m.roles || []} onChange={(roles) => setMember(i, { roles })} options={TEAM_ROLES} placeholder="Assign roles" max={2} />
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

function StepReview({ form, submission, rubric }) {
    const rows = [
        ['Title', form.title],
        ['Stage', form.stage_of_development],
        ['SDGs', (form.sdgs || []).join(', ') || '—'],
        ['Team', form.team?.length ? form.team.map(m => `${m.name} (${(m.roles || []).join(' / ')})`).join('; ') : 'Individual'],
        ['Attachments', `${form.attachments?.length || 0} file(s)`],
        ['Entry type', form.team?.length || submission?.org_name ? 'Team' : 'Individual'],
    ];
    return (
        <div className="card p-8 space-y-5">
            <h3 className="text-gray-900 dark:text-white text-lg">Review & submit</h3>
            <div className="space-y-2">
                {rows.map(([k, v]) => (
                    <div key={k} className="flex gap-4 text-sm">
                        <span className="text-gray-400 w-28 flex-shrink-0">{k}</span>
                        <span className="text-gray-900 dark:text-white min-w-0">{v || '—'}</span>
                    </div>
                ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-white/5 pt-4">
                On submission, your entry is scored against CEDA's weighted rubric
                {rubric ? ` (${rubric.map(r => r.label).join(', ')})` : ''} through screening, evaluation, selection and award gates.
            </p>
        </div>
    );
}

/* Locked (submitted) view */
function LockedView({ submission, versions, rubric }) {
    return (
        <div className="max-w-3xl space-y-5">
            <div className="card p-8">
                <div className="flex items-center gap-2 text-accent-600 dark:text-accent-400 text-sm mb-4">
                    <LockIcon /> Locked — in the evaluation pipeline. CEDA can send it back for revision at any gate.
                </div>
                <h2 className="text-xl text-gray-900 dark:text-white">{submission.title}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap mt-3">{submission.description}</p>
                {(submission.sdgs?.length || 0) > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                        {submission.sdgs.map(s => (
                            <span key={s} className="px-2.5 py-1 rounded-full text-xs bg-accent-500/10 text-accent-600 dark:text-accent-400">{s}</span>
                        ))}
                    </div>
                )}
                {submission.attachments?.length > 0 && (
                    <div className="mt-6">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Attachments</p>
                        <AttachmentGrid attachments={submission.attachments} />
                    </div>
                )}
            </div>
            {versions?.length > 0 && <VersionHistory versions={versions} />}
        </div>
    );
}

function VersionHistory({ versions }) {
    return (
        <div className="card p-6">
            <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-gray-400" />
                <h3 className="text-gray-900 dark:text-white text-lg">Revision history</h3>
            </div>
            <div className="space-y-2">
                {versions.map(v => (
                    <div key={v.id} className="flex items-center gap-3 text-sm">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs">v{v.version}</span>
                        <span className="text-gray-500 dark:text-gray-400 truncate flex-1">{v.note}</span>
                        <span className="text-[11px] text-gray-400">{new Date(v.created_at).toLocaleDateString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

const LockIcon = () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
);

/* ─── Feedback ───────────────────────────────────────────────── */
function Feedback({ gateEvents, evaluations, versions, submission }) {
    const rubric = useRubric();
    if (gateEvents.length === 0 && evaluations.length === 0 && (versions?.length || 0) === 0) {
        return (
            <div className="card p-10 max-w-3xl text-center">
                <MessageSquareText className="w-8 h-8 text-gray-300 dark:text-white/20 mx-auto" />
                <p className="text-gray-400 mt-3">Feedback appears here at every stage gate.</p>
            </div>
        );
    }
    return (
        <div className="max-w-3xl space-y-6">
            {versions?.length > 0 && <VersionHistory versions={versions} />}
            {gateEvents.length > 0 && (
                <div className="card p-6">
                    <h3 className="text-gray-900 dark:text-white text-lg mb-4">Stage-gate feedback</h3>
                    <div className="space-y-4">
                        {gateEvents.map(e => (
                            <motion.div key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
                                <div className={`w-2 rounded-full flex-shrink-0 ${e.decision === 'failed' ? 'bg-rose-400' : e.decision === 'revise_requested' ? 'bg-amber-400' : 'bg-accent-500'}`} />
                                <div className="min-w-0">
                                    <p className="text-sm text-gray-900 dark:text-white capitalize">{e.gate} — <span className="text-gray-500 dark:text-gray-400">{e.decision.replace(/_/g, ' ')}</span></p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{e.feedback}</p>
                                    <p className="text-[11px] text-gray-400 mt-1">{new Date(e.created_at).toLocaleString()}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
            {evaluations.length > 0 && (
                <div className="card p-6">
                    <h3 className="text-gray-900 dark:text-white text-lg mb-4">Judge evaluations</h3>
                    <div className="space-y-5">
                        {evaluations.map(ev => (
                            <div key={ev.id} className="border border-gray-100 dark:border-white/5 rounded-2xl p-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Anonymous judge</p>
                                    <span className="text-accent-600 dark:text-accent-400 text-lg">{Math.round(ev.total)}/100</span>
                                </div>
                                <div className="mt-3 space-y-2">
                                    {(rubric || []).map(c => (
                                        <div key={c.key} className="flex items-center gap-3">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 w-44 flex-shrink-0">{c.label}</span>
                                            <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-white/5">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${(ev.scores?.[c.key] || 0) * 10}%` }}
                                                    className="h-full rounded-full bg-accent-500" />
                                            </div>
                                            <span className="text-xs text-gray-600 dark:text-gray-300 w-14 text-right">
                                                {ev.scores?.[c.key] ?? '—'} <span className="text-gray-400">×{Math.round(c.weight * 100)}%</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {ev.feedback && (
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 border-t border-gray-100 dark:border-white/5 pt-3">“{ev.feedback}”</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
