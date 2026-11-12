/* ═══════════════════════════════════════════════════════════════
 *  CEDA Innovation Hub — Judge Portal (Phase 2)
 *  Judges see ONLY submissions assigned to them (RLS-enforced),
 *  score against the DB-configured weighted rubric (0–100),
 *  review attachments/media, and write required feedback.
 *  Judges are anonymized to participants.
 * ═══════════════════════════════════════════════════════════════ */
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    ClipboardList,
    FileText,
    RefreshCw,
    Star,
} from 'lucide-react';
import PortalLayout from '../../components/PortalLayout';
import AttachmentGrid from '../../components/AttachmentGrid';
import ModalSheet from '../../components/ui/ModalSheet';
import Slider from '../../components/ui/Slider';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { STAGE_LABELS, STAGE_COLORS } from '../../lib/pipeline';
import { useRubric, weightedTotal } from '../../lib/rubric';
import EmptyState from '../../components/EmptyState';
import emptyArt from '../../assets/img/illustrations/organising.svg';
import { ButtonLoader, InlineLoader } from '../../components/Loader';

const NAV = [
    { id: 'assigned', label: 'Assigned Submissions', icon: ClipboardList },
];

export default function JudgePortal() {
    const { user, profile, logout } = useAuth();
    const [tab, setTab] = useState('assigned');
    const [search, setSearch] = useState('');
    const [rows, setRows] = useState([]); // {submission, assignment, evaluation, versions}
    const [scoring, setScoring] = useState(null); // {submission, evaluation}
    const [loading, setLoading] = useState(true);
    const [fatal, setFatal] = useState('');

    const refresh = useCallback(async () => {
        const [asg, evs] = await Promise.all([
            supabase.from('ceda_judge_assignments').select('*'),
            supabase.from('ceda_evaluations').select('*'),
        ]);
        if (asg.error) { setFatal(asg.error.message); setLoading(false); return; }
        const mine = asg.data || [];
        if (mine.length === 0) { setRows([]); setLoading(false); return; }

        const { data: subs, error } = await supabase
            .from('ceda_submissions')
            .select('*')
            .in('id', mine.map(a => a.submission_id))
            .order('created_at', { ascending: false });
        if (error) { setFatal(error.message); setLoading(false); return; }

        const byId = new Map((subs || []).map(s => [s.id, s]));
        const bySub = new Map((evs.data || []).filter(e => e.judge_id === user.id).map(e => [e.submission_id, e]));
        setRows(mine
            .map(a => ({ assignment: a, submission: byId.get(a.submission_id), evaluation: bySub.get(a.submission_id) }))
            .filter(r => r.submission));
        setLoading(false);
    }, [user.id]);

    useEffect(() => { refresh(); }, [refresh]);

    const visible = rows.filter(r => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (r.submission.title || '').toLowerCase().includes(q)
            || (r.submission.description || '').toLowerCase().includes(q);
    });
    const pending = rows.filter(r => !r.evaluation).length;

    return (
        <PortalLayout
            portalName="CEDA Innovation Hub"
            navItems={NAV}
            activeTab={tab}
            onTabChange={setTab}
            userName={profile?.full_name || user.email}
            userRole={profile?.role || 'judge'}
            userId={user.id}
            onSearch={setSearch}
            onLogout={logout}
            headerActions={
                <button onClick={refresh} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full" title="Refresh">
                    <RefreshCw className="w-4 h-4" />
                </button>
            }
        >
            {loading ? (
                <div className="max-w-5xl space-y-4">
                    <SkeletonCard lines={3} />
                    <SkeletonCard lines={3} />
                </div>
            ) : fatal ? (
                <div className="card p-6 text-royal-600 text-sm">{fatal}</div>
            ) : rows.length === 0 ? (
                <div className="card max-w-2xl mx-auto">
                    <EmptyState
                        art={emptyArt}
                        title="Nothing assigned to you yet"
                        body="CEDA administration assigns submissions for evaluation. You will see them here, and you will be notified."
                    />
                </div>
            ) : (
                <div className="max-w-5xl space-y-4">
                    <p className="text-xs text-gray-400 px-1">
                        {pending} of {rows.length} awaiting your evaluation · scores and feedback reach participants without your identity.
                    </p>
                    {visible.map(({ submission, evaluation }) => (
                        <motion.div
                            key={submission.id}
                            whileHover={{ y: -2 }}
                            className="card p-6 cursor-pointer"
                            onClick={() => setScoring({ submission, evaluation })}
                        >
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="flex gap-4 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-accent-50 dark:bg-accent-500/10 flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-5 h-5 text-accent-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-gray-900 dark:text-white text-lg truncate">{submission.title}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{submission.description}</p>
                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                            <span className={`px-2.5 py-1 rounded-full text-[11px] ${STAGE_COLORS[submission.stage]}`}>
                                                {STAGE_LABELS[submission.stage]}
                                            </span>
                                            <span className="text-[11px] text-gray-400 capitalize">{submission.entry_type}</span>
                                            {(submission.sdgs || []).slice(0, 3).map(s => (
                                                <span key={s} className="px-2 py-0.5 rounded-full text-[10px] bg-accent-500/10 text-accent-600 dark:text-accent-400">{s}</span>
                                            ))}
                                            {(submission.attachments?.length || 0) > 0 && (
                                                <span className="text-[11px] text-gray-400">· {submission.attachments.length} attachment(s)</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    {evaluation ? (
                                        <span className="text-accent-600 dark:text-accent-400 text-sm">
                                            <Star className="w-3.5 h-3.5 inline -mt-0.5" /> {Math.round(evaluation.total)}/100
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300 text-xs">
                                            Evaluation pending
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {visible.length === 0 && (
                        <div className="card p-8 text-center text-sm text-gray-400">No submissions match “{search}”.</div>
                    )}
                </div>
            )}

            {/* Scoring dialog */}
            {scoring && (
                <ScoringSheet
                    key={scoring.submission.id}
                    submission={scoring.submission}
                    existing={scoring.evaluation}
                    onClose={() => setScoring(null)}
                    onDone={() => { setScoring(null); refresh(); }}
                />
            )}
        </PortalLayout>
    );
}

/* ─── Scoring Sheet (ModalSheet + weighted rubric) ───────────── */
function ScoringSheet({ submission, existing, onClose, onDone }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const rubric = useRubric();
    const [scores, setScores] = useState(() => {
        const base = {};
        (rubric || []).forEach(c => { base[c.key] = existing?.scores?.[c.key] ?? 5; });
        return base;
    });
    const [rubricReady, setRubricReady] = useState(false);
    const [feedback, setFeedback] = useState(existing?.feedback || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [panel, setPanel] = useState(null);      // { judges, avg_total, spread }
    const [panelCrit, setPanelCrit] = useState({});

    React.useEffect(() => {
        if (rubric && !rubricReady) {
            setScores(prev => {
                const base = {};
                rubric.forEach(c => { base[c.key] = existing?.scores?.[c.key] ?? 5; });
                return base;
            });
            setRubricReady(true);
        }
    }, [rubric, existing, rubricReady]);

    /* Panel calibration — aggregates only, never peer identities */
    React.useEffect(() => {
        let alive = true;
        (async () => {
            const [stats, crits] = await Promise.all([
                supabase.rpc('ceda_panel_stats', { sub: submission.id }),
                supabase.rpc('ceda_criterion_avgs', { sub: submission.id }),
            ]);
            if (!alive) return;
            if (stats.data) setPanel(stats.data);
            if (crits.data) setPanelCrit(crits.data);
        })();
        return () => { alive = false; };
    }, [submission.id]);

    const total = weightedTotal(rubric, scores);
    const feedbackMissing = !feedback.trim();
    const attachments = submission.attachments || [];

    const setScore = (key, v) => {
        const n = Math.max(0, Math.min(10, Number(v) || 0));
        setScores(s => ({ ...s, [key]: n }));
    };

    const handleSubmit = async () => {
        if (feedbackMissing) { setError('Written feedback is required — a gate cannot move without it.'); return; }
        setSaving(true); setError('');
        try {
            const payload = {
                submission_id: submission.id,
                judge_id: user.id,
                scores,
                total,
                feedback,
            };
            const { error: err } = existing
                ? await supabase.from('ceda_evaluations').update(payload).eq('id', existing.id)
                : await supabase.from('ceda_evaluations').insert(payload);
            if (err) throw err;
            toast(existing ? 'Evaluation updated' : 'Evaluation submitted', 'success');
            onDone();
        } catch (err) {
            setError(err.message || 'Could not save evaluation.');
            setSaving(false);
        }
    };

    return (
        <ModalSheet
            open
            onClose={onClose}
            title={submission.title}
            subtitle={`${submission.entry_type} · ${submission.stage_of_development || 'Idea'} · weighted rubric /100`}
            maxWidth="max-w-2xl"
            footer={
                <div className="flex justify-between items-center gap-3">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">Weighted total</span>
                        <span className="text-accent-600 dark:text-accent-400 font-medium">{total}/100</span>
                    </div>
                    <div className="flex gap-2">
                        <button className="btn-secondary !py-2.5 !px-5 !text-sm" onClick={onClose}>Cancel</button>
                        <button className="btn-accent !py-2.5 !px-5 !text-sm" onClick={handleSubmit} disabled={saving}>
                            {saving && <ButtonLoader />}
                            {existing ? 'Update evaluation' : 'Submit evaluation'}
                        </button>
                    </div>
                </div>
            }
        >
            <div className="space-y-6">
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Submission</p>
                    <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{submission.description}</p>
                    {(submission.sdgs || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {submission.sdgs.map(s => (
                                <span key={s} className="px-2.5 py-1 rounded-full text-xs bg-accent-500/10 text-accent-600 dark:text-accent-400">{s}</span>
                            ))}
                        </div>
                    )}
                </div>

                {attachments.length > 0 && (
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Media & documents ({attachments.length})</p>
                        <AttachmentGrid attachments={attachments} />
                    </div>
                )}

                {(submission.team_members || []).length > 0 && (
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Team</p>
                        <div className="flex flex-wrap gap-2">
                            {submission.team_members.map((m, i) => (
                                <span key={i} className="px-3 py-1.5 rounded-full text-xs bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-200">
                                    {m.name}{m.roles?.length ? ` — ${m.roles.join(' / ')}` : ''}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="border-t border-gray-100 dark:border-white/5 pt-5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Rubric scores (0–10 each, weighted)</p>
                        {panel?.judges > 0 && (
                            <span className="text-[11px] text-gray-400">
                                Panel: {panel.judges} judge{panel.judges === 1 ? '' : 's'} · avg {panel.avg_total}/100
                            </span>
                        )}
                    </div>
                    <div className="space-y-4">
                        {(rubric || []).map(c => (
                            <Slider
                                key={c.key}
                                label={c.label}
                                hint={`weighted ×${Math.round(c.weight * 100)}%`}
                                value={scores[c.key] ?? 5}
                                onChange={v => setScore(c.key, v)}
                                min={0}
                                max={10}
                                step={1}
                                format={v => `${v}`}
                                marks={[{ value: 0, label: '0' }, { value: 5, label: '5' }, { value: 10, label: '10' }]}
                            />
                        ))}
                    </div>
                </div>

                {/* Panel calibration: aggregates only */}
                {panel?.judges > 0 && (
                    <div className="border-t border-gray-100 dark:border-white/5 pt-5">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Calibration</p>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-2xl bg-gray-50 dark:bg-white/5 px-4 py-3">
                                <p className="text-[11px] text-gray-400">Your weighted total</p>
                                <p className="text-xl text-gray-900 dark:text-white">{total}/100</p>
                            </div>
                            <div className="rounded-2xl bg-gray-50 dark:bg-white/5 px-4 py-3">
                                <p className="text-[11px] text-gray-400">Panel average</p>
                                <p className="text-xl text-gray-900 dark:text-white">{panel.avg_total}/100</p>
                            </div>
                            <div className="rounded-2xl bg-gray-50 dark:bg-white/5 px-4 py-3">
                                <p className="text-[11px] text-gray-400">Panel spread</p>
                                <p className="text-xl text-gray-900 dark:text-white">{panel.spread}</p>
                            </div>
                        </div>
                        <div className="mt-3 space-y-1.5">
                            {(rubric || []).map(c => {
                                const pa = panelCrit?.[c.key];
                                if (pa == null) return null;
                                const mine = scores[c.key] ?? 0;
                                const delta = mine - pa;
                                return (
                                    <div key={c.key} className="flex items-center gap-3 text-xs">
                                        <span className="text-gray-500 dark:text-gray-400 flex-1 truncate">{c.label}</span>
                                        <span className="text-gray-400">panel {pa}</span>
                                        <span className="text-gray-900 dark:text-white w-6 text-right">{mine}</span>
                                        <span className={`w-14 text-right ${delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : delta < 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>
                                            {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-2">
                            Panel figures are anonymous aggregates for calibration — no judge identity or feedback is exposed.
                        </p>
                    </div>
                )}

                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Written feedback (required)</p>
                    <textarea
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                        rows={4}
                        placeholder="Structured feedback the participant will receive at this gate…"
                        className="w-full field-fill py-3.5 px-5 text-sm text-gray-900 dark:text-white placeholder-gray-400"
                    />
                </div>

                {error && <p className="text-royal-600 dark:text-royal-400 text-sm">{error}</p>}
            </div>
        </ModalSheet>
    );
}
