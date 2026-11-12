/**
 * Message thread — Q&A between a participant and CEDA on one submission.
 *
 * Visibility:
 *   participant -> owner + assigned judges + admins (shared channel)
 *   judge       -> assigned judges + admins only
 *   admin       -> admins only
 * Enforced by RLS; the UI only chooses what to write.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send,
    Lock,
    Users,
    MessageCircle,
} from 'lucide-react';
import Select from './ui/Select';
import { supabase } from '../lib/supabase';
import { ButtonLoader, InlineLoader } from './Loader';

const VISIBILITY_OPTIONS = [
    { value: 'participant', label: 'Participant + judges', hint: 'Visible to everyone on this submission' },
    { value: 'judge', label: 'Judges only', hint: 'Internal evaluation discussion' },
    { value: 'admin', label: 'Admins only', hint: 'Not visible to the participant' },
];

export default function MessageThread({ submissionId, role = 'participant', onPosted }) {
    const [messages, setMessages] = useState([]);
    const [body, setBody] = useState('');
    const [visibility, setVisibility] = useState('participant');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        if (!submissionId) { setLoading(false); return; }
        const { data, error: err } = await supabase
            .from('ceda_messages')
            .select('*')
            .eq('submission_id', submissionId)
            .order('created_at');
        if (err) setError(err.message);
        setMessages(data || []);
        setLoading(false);
    }, [submissionId]);

    useEffect(() => { load(); }, [load]);

    const send = async () => {
        const text = body.trim();
        if (!text) return;
        setSending(true); setError('');
        try {
            const { data: user } = await supabase.auth.getUser();
            const { error: err } = await supabase.from('ceda_messages').insert({
                submission_id: submissionId,
                author_id: user.user.id,
                author_role: role,
                body: text,
                visibility: role === 'admin' ? visibility : 'participant',
            });
            if (err) throw err;
            setBody('');
            await load();
            onPosted?.();
        } catch (e) {
            setError(e.message || 'Could not send message.');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center py-8 text-gray-400"><InlineLoader size={24} /></div>;
    }

    return (
        <div className="space-y-4">
            {messages.length === 0 ? (
                <div className="text-center py-8">
                    <MessageCircle className="w-7 h-7 text-gray-300 dark:text-white/20 mx-auto" />
                    <p className="text-sm text-gray-400 mt-2">No messages yet.</p>
                    <p className="text-xs text-gray-400 mt-1">
                        {role === 'participant'
                            ? 'Ask CEDA anything about your submission — clarifications, evidence, next steps.'
                            : 'Start the conversation with the participant.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-hide pr-1">
                    <AnimatePresence initial={false}>
                        {messages.map(m => {
                            const mine = role !== 'participant';
                            return (
                                <motion.div
                                    key={m.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${mine
                                        ? 'bg-accent-500 text-white rounded-br-md'
                                        : 'bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-gray-100 rounded-bl-md'}`}
                                    >
                                        <p className="whitespace-pre-wrap">{m.body}</p>
                                        <p className={`text-[10px] mt-1 ${mine ? 'text-white/70' : 'text-gray-400'}`}>
                                            {m.author_role} · {new Date(m.created_at).toLocaleString()}
                                            {m.visibility !== 'participant' && (
                                                <span className="inline-flex items-center gap-1 ml-2">
                                                    <Lock className="w-2.5 h-2.5" /> {m.visibility}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {role === 'admin' && (
                <Select
                    value={visibility}
                    onChange={setVisibility}
                    options={VISIBILITY_OPTIONS}
                    placeholder="Who can see this?"
                />
            )}

            <div className="flex items-end gap-2">
                <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={2}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }}
                    placeholder={role === 'participant' ? 'Ask CEDA a question…' : 'Write a message…'}
                    className="flex-1 field-fill rounded-2xl py-2.5 px-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 resize-none"
                />
                <button
                    onClick={send}
                    disabled={sending || !body.trim()}
                    className="btn-accent !py-2.5 !px-4 !text-sm disabled:opacity-40 flex-shrink-0"
                >
                    {sending ? <ButtonLoader /> : <Send className="w-4 h-4" />}
                </button>
            </div>
            {error && <p className="text-royal-600 dark:text-royal-400 text-xs">{error}</p>}
            {role === 'participant' && (
                <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                    <Users className="w-3 h-3" /> CEDA and your assigned judges can see this thread.
                </p>
            )}
        </div>
    );
}
