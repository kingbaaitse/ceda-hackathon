/**
 * ProfileDialog - the card that opens when you click a person.
 *
 * Shows who someone is, what they are part of, and how to reach them.
 * Used from the portal header, the team editor and the message thread.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar, { avatarUrl } from './Avatar';
import { supabase } from '../lib/supabase';
import { Building2, Mail, MapPin, Phone, Users, X } from './AnimatedIcons';

export default function ProfileDialog({ profile, open, onClose }) {
    const [team, setTeam] = useState(null);

    useEffect(() => {
        if (!open || !profile?.team_members?.length) { setTeam(null); return; }
        let alive = true;
        supabase
            .from('ceda_profiles')
            .select('id, full_name, title, avatar_path, org_name')
            .in('id', profile.team_members.map(m => m.id).filter(Boolean))
            .then(({ data }) => { if (alive) setTeam(data || []); });
        return () => { alive = false; };
    }, [open, profile]);

    if (!open || !profile) return null;

    const roleLabel = {
        participant: 'Participant',
        judge: 'Judge',
        admin: 'Administrator',
    }[profile.role] || 'Member';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center"
            >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
                <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 40, opacity: 0 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${profile.full_name}'s profile`}
                    className="relative bg-white dark:bg-[#161616] border border-gray-100 dark:border-white/10 rounded-t-[2rem] sm:rounded-[2rem] w-full sm:max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
                >
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-start gap-4">
                        <Avatar src={avatarUrl(profile.avatar_path)} name={profile.full_name} size={64} ring />
                        <div className="min-w-0 pt-1">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">{profile.full_name}</h3>
                            <p className="text-sm text-accent-600 dark:text-accent-400">
                                {profile.title || roleLabel}
                            </p>
                            {profile.org_name && (
                                <p className="text-xs text-gray-500 dark:text-white/45 mt-0.5 flex items-center gap-1">
                                    <Building2 className="w-3 h-3" /> {profile.org_name}
                                </p>
                            )}
                        </div>
                    </div>

                    {profile.bio && (
                        <p className="mt-5 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{profile.bio}</p>
                    )}

                    <div className="mt-5 space-y-2 text-sm">
                        {profile.email && (
                            <a href={`mailto:${profile.email}`} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-accent-500 transition-colors">
                                <Mail className="w-4 h-4" /> {profile.email}
                            </a>
                        )}
                        {profile.phone && (
                            <a href={`tel:${String(profile.phone).replace(/\s/g, '')}`} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-accent-500 transition-colors">
                                <Phone className="w-4 h-4" /> {profile.phone}
                            </a>
                        )}
                        {profile.location && (
                            <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <MapPin className="w-4 h-4" /> {profile.location}
                            </p>
                        )}
                    </div>

                    {team && team.length > 0 && (
                        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-white/10">
                            <p className="text-[10px] uppercase tracking-[0.16em] text-gray-400 dark:text-white/35 flex items-center gap-1.5">
                                <Users className="w-3 h-3" /> Team
                            </p>
                            <div className="mt-3 space-y-2">
                                {team.map(m => (
                                    <div key={m.id} className="flex items-center gap-3">
                                        <Avatar src={avatarUrl(m.avatar_path)} name={m.full_name} size={32} />
                                        <div className="min-w-0">
                                            <p className="text-sm text-gray-900 dark:text-white truncate">{m.full_name}</p>
                                            {m.title && <p className="text-xs text-gray-500 dark:text-white/45 truncate">{m.title}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
