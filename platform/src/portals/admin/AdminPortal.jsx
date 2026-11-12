/* ═══════════════════════════════════════════════════════════════
 *  CEDA Innovation Hub — Admin Portal (Phase 2)
 *  Pipeline (gate transitions with required feedback, judge
 *  assignment, realtime updates, search) · Users (role management
 *  via Select) · Rubric (DB-driven weights) · Reports (+CSV export)
 * ═══════════════════════════════════════════════════════════════ */
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import PortalLayout from '../../components/PortalLayout';
import { RefreshButton } from '../../components/TopBar';
import ModalSheet from '../../components/ui/ModalSheet';
import Select from '../../components/ui/Select';
import Slider from '../../components/ui/Slider';
import MessageThread from '../../components/MessageThread';
import MetricBars from '../../components/MetricBars';
import EmptyState from '../../components/EmptyState';
import emptyArt from '../../assets/img/illustrations/flow.svg';
import { SEMANTIC, stageTone, scoreTone, criterionTone, ratioTone, severityTone } from '../../lib/semantics';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { STAGES, STAGE_LABELS, STAGE_COLORS, GATE_ACTIONS } from '../../lib/pipeline';
import { useRubric, normalizeWeights } from '../../lib/rubric';
import { ButtonLoader, InlineLoader } from '../../components/Loader';
import { ChevronDown, ChevronRight, Download, GitBranch, LayoutDashboard, Lightbulb, Mail, MessageCircle, ScrollText, Send, SlidersHorizontal, TrendingUp, TriangleAlert, UserPlus, Users as UsersIcon } from '../../components/AnimatedIcons';

const NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pipeline', label: 'Pipeline', icon: GitBranch },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'users', label: 'Users', icon: UsersIcon },
    { id: 'rubric', label: 'Rubric Weights', icon: SlidersHorizontal },
    { id: 'audit', label: 'Audit Trail', icon: ScrollText },
];

export default function AdminPortal() {
    const { user, profile, logout } = useAuth();
    const { toast } = useToast();
    const [tab, setTab] = useState('dashboard');
    const [search, setSearch] = useState('');
    const [submissions, setSubmissions] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [evaluations, setEvaluations] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fatal, setFatal] = useState('');
    const [gateModal, setGateModal] = useState(null); // {submission, actions}
    const [assignModal, setAssignModal] = useState(null); // submission
    const [messageModal, setMessageModal] = useState(null); // submission
    const [messages, setMessages] = useState([]);
    const [audit, setAudit] = useState([]);
    const [gateEvents, setGateEvents] = useState([]);
    const [emailLog, setEmailLog] = useState([]);

    const loadEmailLog = useCallback(async () => {
        const { data } = await supabase.from('ceda_email_log').select('*').order('created_at', { ascending: false }).limit(50);
        setEmailLog(data || []);
    }, []);

    const loadMessages = useCallback(async () => {
        const { data } = await supabase.from('ceda_messages').select('*').order('created_at', { ascending: false });
        setMessages(data || []);
    }, []);

    const loadAudit = useCallback(async () => {
        const { data } = await supabase.from('ceda_audit_log').select('*').order('created_at', { ascending: false }).limit(300);
        setAudit(data || []);
    }, []);

    const loadGateEvents = useCallback(async () => {
        const { data } = await supabase.from('ceda_gate_events').select('*').order('created_at');
        setGateEvents(data || []);
    }, []);

    const refresh = useCallback(async () => {
        const [subs, profs, evs, asg] = await Promise.all([
            supabase.from('ceda_submissions').select('*').order('created_at', { ascending: false }),
            supabase.from('ceda_profiles').select('*').order('created_at', { ascending: false }),
            supabase.from('ceda_evaluations').select('*'),
            supabase.from('ceda_judge_assignments').select('*'),
        ]);
        if (subs.error) { setFatal(subs.error.message); setLoading(false); return; }
        setSubmissions(subs.data || []);
        setProfiles(profs.data || []);
        setEvaluations(evs.data || []);
        setAssignments(asg.data || []);
        setLoading(false);
    }, []);

    useEffect(() => { refresh(); }, [refresh]);
    useEffect(() => { loadMessages(); loadAudit(); loadGateEvents(); loadEmailLog(); }, [loadMessages, loadAudit, loadGateEvents, loadEmailLog]);

    const messageCounts = messages.reduce((m, msg) => {
        m[msg.submission_id] = (m[msg.submission_id] || 0) + 1;
        return m;
    }, {});

    /* Realtime pipeline: gate moves & new submissions appear live */
    useEffect(() => {
        const channel = supabase
            .channel('ceda-admin-pipeline')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ceda_submissions' }, () => refresh())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [refresh]);

    const filtered = submissions.filter(s => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (s.title || '').toLowerCase().includes(q)
            || (s.owner_name || '').toLowerCase().includes(q)
            || (s.stage || '').includes(q);
    });

    return (
        <PortalLayout
            portalName="CEDA Innovation Hub"
            navItems={NAV}
            activeTab={tab}
            onTabChange={setTab}
            userName={profile?.full_name || user.email}
            userRole="Administrator"
            userId={user.id}
            onSearch={setSearch}
            onLogout={logout}
            headerActions={
                <RefreshButton onRefresh={refresh} />
            }
        >
            {loading ? (
                <div className="max-w-5xl space-y-4">
                    <SkeletonCard lines={3} />
                    <SkeletonCard lines={3} />
                </div>
            ) : fatal ? (
                <div className="card p-6 text-royal-600 text-sm">{fatal}</div>
            ) : (
                <>
                    {tab === 'pipeline' && <Pipeline submissions={filtered} allCount={submissions.length} search={search} evaluations={evaluations} assignments={assignments} profiles={profiles} onGate={setGateModal} onAssign={setAssignModal} onMessage={setMessageModal} messageCounts={messageCounts} />}
                    {tab === 'messages' && <MessagesTab submissions={submissions} messages={messages} onOpen={setMessageModal} />}
                    {tab === 'users' && <Users profiles={profiles} onRefresh={refresh} />}
                    {tab === 'rubric' && <RubricEditor />}
                    {tab === 'dashboard' && <Dashboard submissions={submissions} profiles={profiles} evaluations={evaluations} gateEvents={gateEvents} emailLog={emailLog} messages={messages} assignments={assignments} onNavigate={(t, sub) => { setTab(t); if (sub && t === 'messages') setMessageModal(sub); }} />}
                    {tab === 'reports' && <Reports submissions={submissions} profiles={profiles} evaluations={evaluations} gateEvents={gateEvents} emailLog={emailLog} />}
                    {tab === 'audit' && <AuditTrail rows={audit} profiles={profiles} submissions={submissions} />}
                </>
            )}

            {/* Gate action dialog */}
            {gateModal && (
                <GateModal
                    key={gateModal.submission.id}
                    data={gateModal}
                    onClose={() => setGateModal(null)}
                    onDone={() => { setGateModal(null); refresh(); }}
                />
            )}

            {/* Judge assignment dialog */}
            {assignModal && (
                <AssignModal
                    key={assignModal.id}
                    submission={assignModal}
                    profiles={profiles}
                    assignments={assignments}
                    onClose={() => setAssignModal(null)}
                    onDone={() => { setAssignModal(null); refresh(); }}
                />
            )}

            {/* Message thread dialog */}
            {messageModal && (
                <ModalSheet
                    open
                    onClose={() => setMessageModal(null)}
                    title={messageModal.title}
                    subtitle="Conversation with the participant"
                    maxWidth="max-w-lg"
                >
                    <MessageThread submissionId={messageModal.id} role="admin" onPosted={loadMessages} />
                </ModalSheet>
            )}
        </PortalLayout>
    );
}

/* ─── Pipeline ───────────────────────────────────────────────── */
function Pipeline({ submissions, allCount, search, evaluations, assignments, profiles, onGate, onAssign, onMessage, messageCounts }) {
    const evBySub = new Map(evaluations.map(e => [e.submission_id, e]));
    const asgBySub = new Map(assignments.map(a => [a.submission_id, a]));
    const judges = profiles.filter(p => p.role === 'judge');

    if (allCount === 0) {
        return (
            <div className="card max-w-2xl mx-auto">
                <EmptyState
                    art={emptyArt}
                    title="The pipeline is empty"
                    body="When entrants submit, they appear here with their stage, their attachments and the feedback waiting to be written."
                />
            </div>
        );
    }

    return (
        <div className="max-w-5xl space-y-4">
            <p className="text-xs text-gray-400 px-1">
                Every gate transition requires written feedback. Judges only ever see submissions assigned to them. Updates arrive live.
            </p>
            {submissions.map(s => {
                const actions = GATE_ACTIONS[s.stage] || [];
                const ev = evBySub.get(s.id);
                const asg = asgBySub.get(s.id);
                const judge = profiles.find(p => p.id === asg?.judge_id);
                return (
                    <motion.div key={s.id} className="card p-5">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="min-w-0">
                                <h3 className="text-gray-900 dark:text-white text-lg truncate">{s.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{s.description?.slice(0, 120)}</p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <span className={`px-2.5 py-1 rounded-full text-[11px] ${STAGE_COLORS[s.stage]}`}>{STAGE_LABELS[s.stage]}</span>
                                    <span className="text-[11px] text-gray-400 capitalize">{s.entry_type} · {s.owner_name}</span>
                                    {judge && <span className="text-[11px] text-accent-500">· Judge: {judge.full_name}</span>}
                                    {ev && <span className="text-[11px] text-gray-500 dark:text-gray-400">· Score {Math.round(ev.total)}/100</span>}
                                    {(s.sdgs || []).slice(0, 2).map(g => (
                                        <span key={g} className="px-2 py-0.5 rounded-full text-[10px] bg-accent-500/10 text-accent-600 dark:text-accent-400">{g}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                                <button onClick={() => onMessage(s)} className="btn-secondary !py-2 !px-4 !text-xs">
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    Messages
                                    {messageCounts?.[s.id] > 0 && (
                                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-accent-500 text-white text-[10px]">
                                            {messageCounts[s.id]}
                                        </span>
                                    )}
                                </button>
                                {s.stage === 'screened_in' && (
                                    <button onClick={() => onAssign(s)} className="btn-secondary !py-2 !px-4 !text-xs">
                                        <UserPlus className="w-3.5 h-3.5" />
                                        {asg ? 'Change judge' : 'Assign judge'}
                                    </button>
                                )}
                                <button
                                    onClick={() => onGate({ submission: s, actions })}
                                    disabled={actions.length === 0}
                                    className="btn-primary !py-2 !px-4 !text-xs disabled:opacity-40"
                                >
                                    Gate action {actions.length > 0 && <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
            {submissions.length === 0 && (
                <div className="card p-8 text-center text-sm text-gray-400">No submissions match “{search}”.</div>
            )}
            {judges.length === 0 && allCount > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 px-1">
                    No users with the judge role yet — promote a user in the Users tab before assigning evaluations.
                </p>
            )}
        </div>
    );
}

/* ─── Gate Modal ─────────────────────────────────────────────── */
function GateModal({ data, onClose, onDone }) {
    const { submission, actions } = data;
    const { toast } = useToast();
    const [decision, setDecision] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    const handleExecute = async () => {
        if (!decision) return;
        if (!feedback.trim()) { setError('Written feedback is required — the participant must know why.'); return; }
        setSending(true); setError('');
        try {
            const { error: err1 } = await supabase.from('ceda_gate_events').insert({
                submission_id: submission.id,
                gate: decision.gate,
                decision: decision.decision,
                feedback,
            });
            if (err1) throw err1;
            const { error: err2 } = await supabase
                .from('ceda_submissions')
                .update({ stage: decision.to, updated_at: new Date().toISOString() })
                .eq('id', submission.id);
            if (err2) throw err2;
            toast(`Gate applied — moved to ${STAGE_LABELS[decision.to]}`, 'success');
            onDone();
        } catch (err) {
            setError(err.message || 'Could not apply gate action.');
            setSending(false);
        }
    };

    const sendBack = async () => {
        if (!feedback.trim()) { setError('Written feedback is required — the participant must know what to revise.'); return; }
        setSending(true); setError('');
        try {
            await supabase.from('ceda_gate_events').insert({
                submission_id: submission.id,
                gate: 'revision',
                decision: 'revise_requested',
                feedback,
            });
            await supabase.from('ceda_submissions')
                .update({ stage: 'draft', updated_at: new Date().toISOString() })
                .eq('id', submission.id);
            toast('Sent back for revision', 'info');
            onDone();
        } catch (err) {
            setError(err.message || 'Could not send back.');
            setSending(false);
        }
    };

    return (
        <ModalSheet
            open
            onClose={onClose}
            title={submission.title}
            subtitle={`Current stage: ${STAGE_LABELS[submission.stage]} · gate actions require written feedback`}
            footer={
                <div className="flex justify-between gap-2">
                    <button className="btn-secondary !py-2.5 !px-4 !text-xs" onClick={sendBack} disabled={sending}>
                        <Send className="w-3.5 h-3.5 rotate-180" /> Send back for revision
                    </button>
                    <button
                        className="btn-accent !py-2.5 !px-4 !text-xs"
                        onClick={handleExecute}
                        disabled={sending || !decision}
                    >
                        {sending ? <ButtonLoader /> : null}
                        Apply
                    </button>
                </div>
            }
        >
            <div className="space-y-4">
                {actions.length === 0 && (
                    <p className="text-sm text-gray-400">No gate actions from this stage.</p>
                )}
                {actions.map(a => (
                    <button
                        key={a.label}
                        onClick={() => setDecision(a)}
                        className={`w-full text-left px-4 py-3 rounded-2xl border text-sm transition-colors ${decision?.label === a.label
                            ? 'border-accent-500 bg-accent-50 dark:bg-accent-500/10 text-accent-600 dark:text-accent-400'
                            : 'border-gray-100 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:border-gray-300'
                            }`}
                    >
                        {a.label}
                    </button>
                ))}

                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Gate feedback (required)</p>
                    <textarea
                        value={feedback}
                        onChange={e => { setFeedback(e.target.value); setError(''); }}
                        rows={3}
                        placeholder="What the participant will see at this gate"
                        className="w-full field-fill py-3.5 px-5 text-sm text-gray-900 dark:text-white placeholder-gray-400"
                    />
                </div>

                {error && <p className="text-royal-600 dark:text-royal-400 text-sm">{error}</p>}
            </div>
        </ModalSheet>
    );
}

/* ─── Assign Judge Modal ─────────────────────────────────────── */
function AssignModal({ submission, profiles, assignments, onClose, onDone }) {
    const { toast } = useToast();
    const judges = profiles.filter(p => p.role === 'judge');
    const existing = assignments.find(a => a.submission_id === submission.id);
    const [judgeId, setJudgeId] = useState(existing?.judge_id || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleAssign = async () => {
        if (!judgeId) { setError('Choose a judge.'); return; }
        setSaving(true); setError('');
        try {
            if (existing) {
                const { error: err } = await supabase
                    .from('ceda_judge_assignments')
                    .update({ judge_id: judgeId })
                    .eq('id', existing.id);
                if (err) throw err;
            } else {
                const { error: err } = await supabase
                    .from('ceda_judge_assignments')
                    .insert({ submission_id: submission.id, judge_id: judgeId });
                if (err) throw err;
            }
            toast('Judge assigned — they have been notified', 'success');
            onDone();
        } catch (err) {
            setError(err.message || 'Could not assign.');
            setSaving(false);
        }
    };

    return (
        <ModalSheet
            open
            onClose={onClose}
            title="Assign judge"
            subtitle={submission.title}
            maxWidth="max-w-md"
            footer={
                <div className="flex justify-end gap-2">
                    <button className="btn-secondary !py-2.5 !px-5 !text-sm" onClick={onClose}>Cancel</button>
                    <button className="btn-accent !py-2.5 !px-5 !text-sm" onClick={handleAssign} disabled={saving}>
                        {saving ? <ButtonLoader /> : null} Assign
                    </button>
                </div>
            }
        >
            <div className="space-y-4">
                <Select
                    label="Judge"
                    value={judgeId}
                    onChange={setJudgeId}
                    placeholder="Select a judge"
                    options={judges.map(j => ({ value: j.id, label: j.full_name || j.email }))}
                />
                {judges.length === 0 && (
                    <p className="text-sm text-gray-400">No judges yet — promote a user in the Users tab first.</p>
                )}
                {existing && (
                    <p className="text-xs text-gray-400">
                        Reassigning removes the previous judge's access and notifies the new one.
                    </p>
                )}
                {error && <p className="text-royal-600 dark:text-royal-400 text-sm">{error}</p>}
            </div>
        </ModalSheet>
    );
}

/* ─── Messages Tab ───────────────────────────────────────────── */
function MessagesTab({ submissions, messages, onOpen }) {
    const bySub = messages.reduce((m, msg) => {
        (m[msg.submission_id] = m[msg.submission_id] || []).push(msg);
        return m;
    }, {});
    const threads = Object.entries(bySub)
        .map(([id, list]) => ({
            submission: submissions.find(s => s.id === id),
            list: list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
        }))
        .filter(t => t.submission)
        .sort((a, b) => new Date(b.list[0].created_at) - new Date(a.list[0].created_at));

    return (
        <div className="max-w-4xl space-y-4">
            <p className="text-xs text-gray-400 px-1">
                Every participant conversation, newest first. Visibility is controlled per message
                (participant, judges only, admins only).
            </p>
            {threads.length === 0 && (
                <div className="card p-10 text-center">
                    <MessageCircle className="w-8 h-8 text-gray-300 dark:text-white/20 mx-auto" />
                    <p className="text-gray-400 mt-3">No participant messages yet.</p>
                </div>
            )}
            {threads.map(({ submission, list }) => {
                const last = list[0];
                return (
                    <motion.button
                        key={submission.id}
                        whileHover={{ y: -2 }}
                        onClick={() => onOpen(submission)}
                        className="card p-5 w-full text-left"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <h3 className="text-gray-900 dark:text-white text-base truncate">{submission.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{last.body}</p>
                                <p className="text-[11px] text-gray-400 mt-2">
                                    {last.author_role} · {new Date(last.created_at).toLocaleString()} · {list.length} message{list.length === 1 ? '' : 's'}
                                </p>
                            </div>
                            {last.visibility !== 'participant' && (
                                <span className="text-[10px] px-2 py-1 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 flex-shrink-0">
                                    {last.visibility} only
                                </span>
                            )}
                        </div>
                    </motion.button>
                );
            })}
        </div>
    );
}

/* ─── Audit Trail ────────────────────────────────────────────── */
function AuditTrail({ rows, profiles, submissions }) {
    const [action, setAction] = useState('all');
    const [actor, setActor] = useState('all');
    const { toast } = useToast();

    const actions = [...new Set(rows.map(r => r.action))].sort();
    const actors = [...new Set(rows.map(r => r.actor_id).filter(Boolean))];

    const visible = rows.filter(r =>
        (action === 'all' || r.action === action)
        && (actor === 'all' || r.actor_id === actor)
    );

    const exportCsv = () => {
        if (!visible.length) return;
        const header = ['created_at', 'actor', 'role', 'action', 'entity', 'submission', 'detail'];
        const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const lines = [header.join(',')].concat(visible.map(r => {
            const p = profiles.find(x => x.id === r.actor_id);
            const s = submissions.find(x => x.id === r.submission_id);
            return [
                r.created_at, p?.full_name || r.actor_id || 'system', r.actor_role, r.action,
                r.entity_type, s?.title || '', JSON.stringify(r.detail || {}),
            ].map(esc).join(',');
        }));
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ceda-audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast('Audit trail exported', 'success');
    };

    return (
        <div className="max-w-5xl space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-xs text-gray-400 px-1">
                    Who did what, when — every gate move, evaluation, assignment and stage change.
                </p>
                <button onClick={exportCsv} className="btn-secondary !py-2 !px-4 !text-xs" disabled={!visible.length}>
                    <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
            </div>

            <div className="flex gap-3 flex-wrap">
                <Select
                    className="w-56"
                    value={action}
                    onChange={setAction}
                    options={[{ value: 'all', label: 'All actions' }, ...actions.map(a => ({ value: a, label: a }))]}
                    placeholder="Filter by action"
                />
                <Select
                    className="w-56"
                    value={actor}
                    onChange={setActor}
                    options={[{ value: 'all', label: 'All actors' }, ...actors.map(id => ({
                        value: id,
                        label: profiles.find(p => p.id === id)?.full_name || id.slice(0, 8),
                    }))]}
                    placeholder="Filter by actor"
                />
            </div>

            <div className="card p-2">
                {visible.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-8">No audit entries match this filter.</p>
                )}
                {visible.map(r => {
                    const p = profiles.find(x => x.id === r.actor_id);
                    const s = submissions.find(x => x.id === r.submission_id);
                    return (
                        <div key={r.id} className="flex items-start gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5">
                            <span className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${r.action.startsWith('stage') ? 'bg-accent-500' : r.action.startsWith('evaluation') ? 'bg-sky-400' : r.action.startsWith('judge') ? 'bg-violet-400' : 'bg-gray-300'}`} />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-gray-900 dark:text-white">
                                    <span className="font-medium">{p?.full_name || r.actor_role || 'system'}</span>
                                    <span className="text-gray-400"> · </span>
                                    <span className="text-accent-600 dark:text-accent-400">{r.action}</span>
                                </p>
                                {s && <p className="text-xs text-gray-400 mt-0.5 truncate">{s.title}</p>}
                                {r.detail?.feedback && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">“{r.detail.feedback}”</p>}
                                {r.detail?.from && <p className="text-xs text-gray-400 mt-0.5">{r.detail.from} → {r.detail.to}</p>}
                            </div>
                            <span className="text-[11px] text-gray-400 flex-shrink-0">{new Date(r.created_at).toLocaleString()}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── Users ──────────────────────────────────────────────────── */
function Users({ profiles, onRefresh }) {
    const { toast } = useToast();
    const [search, setSearch] = useState('');
    const [busy, setBusy] = useState(null);
    const [error, setError] = useState('');

    const setRole = async (p, role) => {
        setBusy(p.id); setError('');
        const { error: err } = await supabase.from('ceda_profiles').update({ role }).eq('id', p.id);
        if (err) setError(err.message);
        else toast(`${p.full_name} is now ${role}`, 'success');
        setBusy(null);
        if (!err) onRefresh();
    };

    const visible = profiles.filter(p =>
        !search.trim()
        || (p.full_name || '').toLowerCase().includes(search.toLowerCase())
        || (p.email || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-4xl space-y-4">
            <p className="text-xs text-gray-400 px-1">Roles drive access: participants see only their own submissions, judges see assigned ones, admins see everything.</p>
            <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter users"
                className="w-full max-w-xs rounded-full field-fill py-2.5 px-4 text-sm text-gray-900 dark:text-white placeholder-gray-400"
            />
            {visible.map(p => (
                <div key={p.id} className="card p-5 flex items-center justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                        <p className="text-gray-900 dark:text-white text-sm truncate">{p.full_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{p.email}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{p.org_name || 'Individual'}</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 rounded-full p-1 flex-shrink-0">
                        {['participant', 'judge', 'admin'].map(r => (
                            <button
                                key={r}
                                onClick={() => p.role !== r && setRole(p, r)}
                                disabled={busy === p.id}
                                className={`px-3.5 py-1.5 rounded-full text-xs capitalize transition-colors ${p.role === r
                                    ? 'bg-accent-500 text-white'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                    }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
            {error && <p className="text-royal-600 text-sm">{error}</p>}
        </div>
    );
}

/* ─── Rubric Weights Editor ──────────────────────────────────── */
function RubricEditor() {
    const { toast } = useToast();
    const rubric = useRubric();
    const [rows, setRows] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => { if (rubric && !rows) setRows(rubric.map(r => ({ ...r }))); }, [rubric, rows]);

    if (!rows) {
        return <div className="max-w-3xl"><SkeletonCard lines={5} /></div>;
    }

    const sum = rows.reduce((a, r) => a + Number(r.weight) || 0, 0);

    const update = (i, weight) => setRows(rs => rs.map((r, j) => j === i ? { ...r, weight } : r));

    const save = async () => {
        setSaving(true);
        try {
            const normalized = normalizeWeights(rows);
            for (const r of normalized) {
                const { error } = await supabase.from('ceda_rubric').update({ weight: r.weight }).eq('key', r.key);
                if (error) throw error;
            }
            setRows(normalized.map(r => ({ ...r })));
            toast('Rubric weights saved — judges now score /100 with these weights', 'success');
        } catch (e) {
            toast(e.message || 'Could not save weights (needs the phase 2 SQL applied).', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-3xl space-y-5">
            <div className="card p-8 space-y-5">
                <div>
                    <h3 className="text-gray-900 dark:text-white text-lg">Rubric weights</h3>
                    <p className="text-xs text-gray-400 mt-1">
                        Weights are normalized to 100% on save. Judges still score each criterion 0–10;
                        the weighted total shown to participants is on a 0–100 scale.
                    </p>
                </div>
                {rows.map((r, i) => (
                    <Slider
                        key={r.key}
                        label={r.label}
                        value={Number(r.weight)}
                        onChange={v => update(i, v)}
                        min={0}
                        max={1}
                        step={0.05}
                        format={v => `${Math.round(v * 100)}%`}
                        tone="gold"
                    />
                ))}
                <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-4">
                    <span className={`text-sm ${Math.abs(sum - 1) < 0.01 ? 'text-gray-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        Sum: {Math.round(sum * 100)}% {Math.abs(sum - 1) >= 0.01 && '(normalized to 100% on save)'}
                    </span>
                    <button className="btn-accent !py-2.5 !px-5 !text-sm" onClick={save} disabled={saving}>
                        {saving ? <ButtonLoader /> : null} Save weights
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Dashboard (shell + insights + analytics) ────────────────── */
function Dashboard({ submissions, profiles, evaluations, gateEvents, emailLog, messages, assignments, onNavigate }) {
    const { toast } = useToast();
    const byStage = {};
    STAGES.forEach(s => { byStage[s] = 0; });
    submissions.forEach(s => { byStage[s.stage] = (byStage[s.stage] || 0) + 1; });

    const evaluated = evaluations.filter(e => submissions.some(s => s.id === e.submission_id));
    const avg = evaluated.length
        ? Math.round(evaluated.reduce((a, e) => a + Number(e.total), 0) / evaluated.length)
        : null;
    const total = submissions.length || 1;
    const inFlight = byStage.submitted + byStage.compliance_review + byStage.screened_in + byStage.in_evaluation;
    const participants = profiles.filter(p => p.role === 'participant').length;
    const teams = submissions.filter(s => s.entry_type === 'team').length;

    /* criterion averages -> weakest/strongest insight */
    const critAgg = {};
    evaluated.forEach(e => Object.entries(e.scores || {}).forEach(([k, v]) => {
        critAgg[k] = critAgg[k] ? critAgg[k] + Number(v) : Number(v);
    }));
    const critRows = Object.entries(critAgg)
        .map(([k, sum]) => ({ key: k, avg: sum / evaluated.length }))
        .sort((a, b) => b.avg - a.avg);

    /* SDG spread */
    const sdgCounts = {};
    submissions.forEach(s => (s.sdgs || []).forEach(g => { sdgCounts[g] = (sdgCounts[g] || 0) + 1; }));
    const sdgRows = Object.entries(sdgCounts).sort((a, b) => b[1] - a[1]);
    const sdgMax = Math.max(1, ...sdgRows.map(r => r[1]));

    /* auto-generated insights */
    const insights = [];
    if (critRows.length) {
        insights.push({
            tone: 'warn',
            text: `${cap(critRows[critRows.length - 1].key)} is the weakest criterion (${critRows[critRows.length - 1].avg.toFixed(1)}/10) and ${cap(critRows[0].key)} the strongest (${critRows[0].avg.toFixed(1)}/10).`,
        });
    }
    if (submissions.length) {
        const conversion = Math.round(((byStage.awarded + byStage.selection) / total) * 100);
        insights.push({ tone: 'info', text: `${conversion}% of submissions have reached final selection or award.` });
    }
    if (sdgRows.length) {
        insights.push({ tone: 'info', text: `${sdgRows[0][0]} is the most represented goal (${sdgRows[0][1]} submission${sdgRows[0][1] === 1 ? '' : 's'}).` });
    }
    const failed = (gateEvents || []).filter(e => e.decision === 'failed').length;
    const revise = (gateEvents || []).filter(e => e.decision === 'revise_requested').length;
    if (revise) insights.push({ tone: 'warn', text: `${revise} revision request${revise === 1 ? '' : 's'} issued — ${failed} outright rejection${failed === 1 ? '' : 's'}.` });

    /* ── Triage: what needs an admin decision today ── */
    const triage = [];
    const evBySub = new Map(evaluations.map(e => [e.submission_id, e]));
    const asgBySub = new Set(assignments.map(a => a.submission_id));

    submissions.forEach(s => {
        if (['submitted', 'compliance_review'].includes(s.stage)) {
            triage.push({ id: `screen-${s.id}`, severity: 'high', title: 'Awaiting screening', detail: s.title, action: 'Open the screening gate', tab: 'pipeline', submission: s });
        }
        if (s.stage === 'screened_in' && !asgBySub.has(s.id)) {
            triage.push({ id: `assign-${s.id}`, severity: 'high', title: 'No judge assigned', detail: s.title, action: 'Assign an evaluator', tab: 'pipeline', submission: s });
        }
        if (s.stage === 'in_evaluation' && !evBySub.has(s.id)) {
            triage.push({ id: `eval-${s.id}`, severity: 'high', title: 'Evaluation outstanding', detail: s.title, action: 'Chase the assigned judge', tab: 'pipeline', submission: s });
        }
        if (s.stage === 'selection') {
            triage.push({ id: `award-${s.id}`, severity: 'high', title: 'Ready for the award decision', detail: s.title, action: 'Open the award gate', tab: 'pipeline', submission: s });
        }
        if (s.stage === 'draft') {
            const lastRevise = (gateEvents || [])
                .filter(e => e.submission_id === s.id && e.decision === 'revise_requested')
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
            if (lastRevise) {
                triage.push({ id: `revise-${s.id}`, severity: 'medium', title: 'Revision requested — awaiting resubmission', detail: s.title, action: 'Review the feedback sent', tab: 'pipeline', submission: s });
            }
        }
    });

    /* participant messages with no admin reply after them */
    (messages || []).forEach(m => {
        const later = (messages || []).find(x => x.submission_id === m.submission_id && x.author_role === 'admin' && new Date(x.created_at) > new Date(m.created_at));
        if (m.author_role === 'participant' && !later) {
            const s = submissions.find(x => x.id === m.submission_id);
            triage.push({ id: `msg-${m.id}`, severity: 'medium', title: 'Participant message unanswered', detail: s?.title || 'Submission', action: 'Reply to the participant', tab: 'messages', submission: s });
        }
    });

    const failedEmails = (emailLog || []).filter(e => e.status === 'failed').length;
    if (failedEmails) {
        triage.push({ id: 'email-failures', severity: 'low', title: `${failedEmails} email delivery failure${failedEmails === 1 ? '' : 's'}`, detail: 'Check the provider and the recipient address', action: 'Open email delivery', tab: 'dashboard' });
    }

    const severityOrder = { high: 0, medium: 1, low: 2 };
    triage.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    const exportCsv = () => {
        if (!submissions.length) return;
        const headers = ['title', 'owner_name', 'entry_type', 'stage', 'sdgs', 'team', 'score_total', 'attachments', 'created_at'];
        const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const lines = [headers.join(',')].concat(submissions.map(s => {
            const ev = evaluated.find(e => e.submission_id === s.id);
            return [
                s.title, s.owner_name, s.entry_type, s.stage,
                (s.sdgs || []).join('; '),
                (s.team_members || []).map(m => m.name).join('; '),
                ev ? ev.total : '', (s.attachments || []).length, s.created_at,
            ].map(esc).join(',');
        }));
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ceda-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast('CSV exported', 'success');
    };

    return (
        <div className="max-w-6xl space-y-6">
            {/* ── Triage queue ── */}
            <div className="card p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                        <TriangleAlert className="w-4 h-4 text-accent-500" />
                        <h3 className="text-gray-900 dark:text-white text-base">Needs attention</h3>
                        {triage.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-accent-500/15 text-accent-600 dark:text-accent-400 text-[11px] font-medium">
                                {triage.length}
                            </span>
                        )}
                    </div>
                </div>

                {triage.length === 0 ? (
                    <p className="text-sm text-gray-400">Nothing is waiting on you. The pipeline is moving.</p>
                ) : (
                    <div className="space-y-2">
                        {triage.map(item => (
                            <button
                                key={item.id}
                                onClick={() => onNavigate?.(item.tab, item.submission)}
                                className="w-full flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-left px-4 py-3 rounded-2xl border border-gray-100 dark:border-white/10 hover:border-accent-500/40 hover:bg-accent-500/5 transition-colors"
                            >
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${SEMANTIC[severityTone(item.severity)].dot}`} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-gray-900 dark:text-white">{item.title}</p>
                                    <p className="text-xs text-gray-400 truncate">{item.detail}</p>
                                </div>
                                <span className="text-xs text-accent-600 dark:text-accent-400 flex-shrink-0">{item.action}</span>
                                <ChevronRight className="w-4 h-4 text-gray-300 hidden sm:block flex-shrink-0" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Shell: KPI strip ── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <Kpi label="Participants" value={participants} sub={`${teams} team entr${teams === 1 ? 'y' : 'ies'}`} tone="info" />
                <Kpi label="Submissions" value={submissions.length} sub={`${Math.round((teams / total) * 100)}% team`} tone="info" />
                <Kpi label="In flight" value={inFlight} sub="awaiting a gate" tone={inFlight > 0 ? 'warning' : 'neutral'} />
                <Kpi label="Avg score" value={avg != null ? `${avg}/100` : '—'} sub={`${evaluated.length} evaluated`} tone={scoreTone(avg)} />
                <Kpi label="Awarded" value={byStage.awarded} sub="public in gallery" tone={byStage.awarded ? 'success' : 'neutral'} className="col-span-2 sm:col-span-1" />
            </div>

            {/* ── Insights ── */}
            {insights.length > 0 && (
                <div className="card p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-4 h-4 text-accent-500" />
                        <h3 className="text-gray-900 dark:text-white text-base">What the pipeline is telling you</h3>
                    </div>
                    <div className="space-y-2">
                        {insights.map((ins, i) => (
                            <div key={i} className="flex items-start gap-2.5 text-sm">
                                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${SEMANTIC[ins.tone === 'warn' ? 'warning' : 'info'].dot}`} />
                                <span className="text-gray-600 dark:text-gray-300">{ins.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Funnel */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-900 dark:text-white text-lg">Pipeline funnel</h3>
                        <button onClick={exportCsv} className="btn-secondary !py-2 !px-4 !text-xs" disabled={!submissions.length}>
                            <Download className="w-3.5 h-3.5" /> Export CSV
                        </button>
                    </div>
                    <div className="space-y-3">
                        {STAGES.filter(s => byStage[s] > 0 || ['submitted', 'screened_in', 'in_evaluation', 'awarded'].includes(s)).map(s => {
                            const tone = SEMANTIC[stageTone(s)];
                            return (
                                <div key={s} className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 w-36 flex-shrink-0 flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
                                        {STAGE_LABELS[s]}
                                    </span>
                                    <div className="flex-1 h-4 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(byStage[s] / total) * 100}%` }}
                                            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                                            className={`h-full rounded-full ${tone.bar}`}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-600 dark:text-gray-300 w-6 text-right">{byStage[s]}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* SDG spread */}
                <div className="card p-6">
                    <div className="flex items-center gap-2 mb-4">
                        
                        <h3 className="text-gray-900 dark:text-white text-lg">SDG alignment spread</h3>
                    </div>
                    {sdgRows.length === 0 ? <p className="text-sm text-gray-400">No SDG tags yet.</p> : (
                        <MetricBars
                            items={sdgRows.slice(0, 8).map(([goal, count]) => ({
                                id: goal,
                                label: goal,
                                value: (count / sdgMax) * 100,
                                display: `${count}`,
                                segments: 20,
                                color: SEMANTIC.progress.bar,
                            }))}
                        />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Score distribution */}
                <div className="card p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-4 h-4 text-accent-500" />
                        <h3 className="text-gray-900 dark:text-white text-lg">Score distribution</h3>
                    </div>
                    {evaluated.length === 0 ? <p className="text-sm text-gray-400">No evaluations yet.</p> : <ScoreHistogram evaluations={evaluated} />}
                </div>

                {/* Criterion averages */}
                <div className="card p-6">
                    <h3 className="text-gray-900 dark:text-white text-lg mb-4">Rubric criterion averages</h3>
                    {critRows.length === 0 ? <p className="text-sm text-gray-400">No scores yet.</p> : (
                        <MetricBars
                            items={critRows.map(c => ({
                                id: c.key,
                                label: cap(c.key),
                                value: (c.avg / 10) * 100,
                                display: `${c.avg.toFixed(1)}/10`,
                                segments: 20,
                                color: SEMANTIC[criterionTone(c.avg)].bar,
                            }))}
                        />
                    )}
                </div>
            </div>

            {/* Email delivery */}
            <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Mail className="w-4 h-4 text-accent-500" />
                    <h3 className="text-gray-900 dark:text-white text-lg">Email delivery</h3>
                </div>
                {!emailLog || emailLog.length === 0 ? (
                    <p className="text-sm text-gray-400">No email attempts yet — alerts are sent when a pipeline event happens.</p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {['queued', 'sent', 'skipped', 'failed'].map(st => (
                            <div key={st} className="rounded-2xl bg-gray-50 dark:bg-white/5 px-4 py-3">
                                <p className="text-[11px] text-gray-400 capitalize">{st}</p>
                                <p className="text-xl text-gray-900 dark:text-white">{emailLog.filter(e => e.status === st).length}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const cap = (s) => String(s || '').replace(/^./, c => c.toUpperCase());

const Kpi = ({ label, value, sub, tone = 'info', className = '' }) => {
    const t = SEMANTIC[tone] || SEMANTIC.info;
    return (
        <div className={`card p-4 ${className}`}>
            <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
                <p className="text-[11px] text-gray-400 uppercase tracking-wide">{label}</p>
            </div>
            <p className={`text-2xl mt-1.5 ${t.text}`}>{value}</p>
            {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
        </div>
    );
};

function ScoreHistogram({ evaluations }) {
    const buckets = Array.from({ length: 10 }, (_, i) => ({ from: i * 10, count: 0 }));
    evaluations.forEach(e => {
        const b = Math.min(9, Math.floor(Number(e.total) / 10));
        buckets[b].count += 1;
    });
    const max = Math.max(1, ...buckets.map(b => b.count));
    return (
        <>
            <div className="flex items-end gap-1.5 h-28">
                {buckets.map(b => {
                    const tone = SEMANTIC[scoreTone(b.from + 5)];
                    return (
                        <div key={b.from} className="flex-1 flex flex-col items-center gap-1.5">
                            <span className="text-[10px] text-gray-400">{b.count || ''}</span>
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${(b.count / max) * 100}%` }}
                                transition={{ type: 'spring', stiffness: 140, damping: 20 }}
                                className={`w-full rounded-t-lg ${tone.bar}`}
                                style={{ minHeight: b.count ? 4 : 2 }}
                            />
                            <span className="text-[9px] text-gray-400">{b.from}</span>
                        </div>
                    );
                })}
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
                Weighted evaluation totals (0–100) per submission. Bars are coloured by band:
                <span className="text-rose-500"> red</span> · <span className="text-amber-500"> amber</span> ·
                <span className="text-accent-500"> orange</span> · <span className="text-emerald-500"> green</span>.
            </p>
        </>
    );
}

/* ─── Reports (+ CSV export + analytics) ─────────────────────── */
function Reports({ submissions, profiles, evaluations, gateEvents, emailLog }) {
    const { toast } = useToast();
    const byStage = {};
    STAGES.forEach(s => { byStage[s] = 0; });
    submissions.forEach(s => { byStage[s.stage] = (byStage[s.stage] || 0) + 1; });

    const evaluated = evaluations.filter(e => submissions.some(s => s.id === e.submission_id));
    const avg = evaluated.length
        ? Math.round(evaluated.reduce((a, e) => a + Number(e.total), 0) / evaluated.length)
        : null;
    const teams = submissions.filter(s => s.entry_type === 'team').length;
    const screenedIn = byStage.screened_in + byStage.in_evaluation + byStage.selection + byStage.awarded;
    const total = submissions.length || 1;

    /* SDG spread */
    const sdgCounts = {};
    submissions.forEach(s => (s.sdgs || []).forEach(g => { sdgCounts[g] = (sdgCounts[g] || 0) + 1; }));
    const sdgRows = Object.entries(sdgCounts).sort((a, b) => b[1] - a[1]);
    const sdgMax = Math.max(1, ...sdgRows.map(r => r[1]));

    /* Criterion averages */
    const critAgg = {};
    evaluated.forEach(e => Object.entries(e.scores || {}).forEach(([k, v]) => {
        critAgg[k] = critAgg[k] ? critAgg[k] + Number(v) : Number(v);
    }));
    const critRows = Object.entries(critAgg)
        .map(([k, sum]) => ({ key: k, avg: sum / evaluated.length }))
        .sort((a, b) => b.avg - a.avg);

    /* Score distribution (10-point buckets) */
    const buckets = Array.from({ length: 10 }, (_, i) => ({ from: i * 10, count: 0 }));
    evaluated.forEach(e => {
        const b = Math.min(9, Math.floor(Number(e.total) / 10));
        buckets[b].count += 1;
    });
    const bucketMax = Math.max(1, ...buckets.map(b => b.count));

    /* Time between gate decisions (median hours per gate) */
    const gateDur = {};
    (gateEvents || []).forEach(ev => {
        (gateDur[ev.gate] = gateDur[ev.gate] || []).push(new Date(ev.created_at));
    });
    const stageTiming = Object.entries(gateDur).map(([gate, times]) => {
        times.sort((a, b) => a - b);
        const gaps = times.slice(1).map((t, i) => (t - times[i]) / 36e5).filter(h => h >= 0);
        const avgGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null;
        return { gate, avgGap, events: times.length };
    }).filter(r => r.avgGap != null);

    const exportCsv = () => {
        if (!submissions.length) return;
        const headers = ['title', 'owner_name', 'entry_type', 'stage', 'sdgs', 'team', 'score_total', 'attachments', 'created_at'];
        const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const lines = [headers.join(',')].concat(submissions.map(s => {
            const ev = evaluated.find(e => e.submission_id === s.id);
            return [
                s.title, s.owner_name, s.entry_type, s.stage,
                (s.sdgs || []).join('; '),
                (s.team_members || []).map(m => m.name).join('; '),
                ev ? ev.total : '', (s.attachments || []).length,
                s.created_at,
            ].map(esc).join(',');
        }));
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ceda-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast('CSV exported', 'success');
    };

    return (
        <div className="max-w-5xl space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Registrations" value={profiles.filter(p => p.role === 'participant').length} />
                <StatCard label="Submissions" value={submissions.length} />
                <StatCard label="Team entries" value={`${teams} (${Math.round(teams / total * 100)}%)`} />
                <StatCard label="Avg evaluation" value={avg != null ? `${avg}/100` : '—'} />
            </div>

            <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-900 dark:text-white text-lg">Pipeline volume by stage</h3>
                    <button onClick={exportCsv} className="btn-secondary !py-2 !px-4 !text-xs" disabled={!submissions.length}>
                        <Download className="w-3.5 h-3.5" /> Export CSV
                    </button>
                </div>
                <div className="space-y-3">
                    {STAGES.map(s => (
                        <div key={s} className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 dark:text-gray-400 w-40 flex-shrink-0">{STAGE_LABELS[s]}</span>
                            <div className="flex-1 h-4 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${byStage[s] / total * 100}%` }}
                                    className="h-full rounded-full bg-accent-500"
                                />
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-300 w-8 text-right">{byStage[s]}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* SDG spread */}
                <div className="card p-6">
                    <div className="flex items-center gap-2 mb-4">
                        
                        <h3 className="text-gray-900 dark:text-white text-lg">SDG alignment spread</h3>
                    </div>
                    {sdgRows.length === 0 && <p className="text-sm text-gray-400">No SDG tags yet.</p>}
                    <div className="space-y-2">
                        {sdgRows.map(([goal, count]) => (
                            <div key={goal} className="flex items-center gap-3">
                                <span className="text-xs text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">{goal}</span>
                                <div className="flex-1 h-2.5 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(count / sdgMax) * 100}%` }}
                                        className="h-full rounded-full bg-accent-500"
                                    />
                                </div>
                                <span className="text-xs text-gray-600 dark:text-gray-300 w-6 text-right">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Score distribution */}
                <div className="card p-6">
                    <h3 className="text-gray-900 dark:text-white text-lg mb-4">Score distribution</h3>
                    {evaluated.length === 0 && <p className="text-sm text-gray-400">No evaluations yet.</p>}
                    <div className="flex items-end gap-1.5 h-28">
                        {buckets.map(b => (
                            <div key={b.from} className="flex-1 flex flex-col items-center gap-1.5">
                                <span className="text-[10px] text-gray-400">{b.count || ''}</span>
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(b.count / bucketMax) * 100}%` }}
                                    className="w-full rounded-t-lg bg-accent-500/80 min-h-[2px]"
                                    style={{ minHeight: b.count ? 4 : 2 }}
                                />
                                <span className="text-[9px] text-gray-400">{b.from}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2">Weighted evaluation totals (0–100) per submission.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Criterion averages */}
                <div className="card p-6">
                    <h3 className="text-gray-900 dark:text-white text-lg mb-4">Rubric criterion averages</h3>
                    {critRows.length === 0 && <p className="text-sm text-gray-400">No scores yet.</p>}
                    <div className="space-y-3">
                        {critRows.map(c => (
                            <div key={c.key}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-500 dark:text-gray-400 capitalize">{c.key}</span>
                                    <span className="text-gray-700 dark:text-gray-200">{c.avg.toFixed(1)} / 10</span>
                                </div>
                                <div className="h-2 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(c.avg / 10) * 100}%` }}
                                        className="h-full rounded-full bg-accent-500"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Gate timing */}
                <div className="card p-6">
                    <h3 className="text-gray-900 dark:text-white text-lg mb-4">Gate turnaround</h3>
                    {stageTiming.length === 0 && (
                        <p className="text-sm text-gray-400">Need at least two events per gate to measure turnaround.</p>
                    )}
                    <div className="space-y-3">
                        {stageTiming.map(t => (
                            <div key={t.gate} className="flex items-center justify-between gap-3">
                                <span className="text-sm text-gray-700 dark:text-gray-200 capitalize">{t.gate}</span>
                                <span className="text-sm text-gray-900 dark:text-white">
                                    {t.avgGap < 1 ? `${Math.round(t.avgGap * 60)} min` : `${t.avgGap.toFixed(1)} h`}
                                </span>
                                <span className="text-[11px] text-gray-400">{t.events} events</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Email delivery */}
            <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Mail className="w-4 h-4 text-accent-500" />
                    <h3 className="text-gray-900 dark:text-white text-lg">Email delivery</h3>
                </div>
                {!emailLog || emailLog.length === 0 ? (
                    <p className="text-sm text-gray-400">No email attempts yet — alerts are sent when a pipeline event happens.</p>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                            {['queued', 'sent', 'skipped', 'failed'].map(st => (
                                <div key={st} className="rounded-2xl bg-gray-50 dark:bg-white/5 px-4 py-3">
                                    <p className="text-[11px] text-gray-400 capitalize">{st}</p>
                                    <p className="text-xl text-gray-900 dark:text-white">{emailLog.filter(e => e.status === st).length}</p>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-1.5">
                            {emailLog.slice(0, 6).map(e => (
                                <div key={e.id} className="flex items-center gap-3 text-xs">
                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${e.status === 'failed' ? 'bg-rose-400' : e.status === 'skipped' ? 'bg-gray-300' : 'bg-emerald-400'}`} />
                                    <span className="text-gray-600 dark:text-gray-300 truncate flex-1">{e.email || '—'}</span>
                                    <span className="text-gray-400">{e.detail}</span>
                                    <span className="text-gray-400 flex-shrink-0">{new Date(e.created_at).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="card p-6">
                <h3 className="text-gray-900 dark:text-white text-lg mb-4">Pipeline conversion</h3>                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard label="Screened in" value={`${Math.round(screenedIn / total * 100)}%`} />
                    <StatCard label="Evaluated" value={evaluated.length ? `${Math.round(evaluated.length / total * 100)}%` : '0%'} />
                    <StatCard label="Awarded" value={byStage.awarded} />
                </div>
                <p className="text-[11px] text-gray-400 mt-4">CSV export includes SDGs, team, scores and attachment counts — ready for CEDA strategic reporting.</p>
            </div>
        </div>
    );
}

const StatCard = ({ label, value }) => (
    <div className="card p-5">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-3xl text-gray-900 dark:text-white mt-1">{value}</p>
    </div>
);
