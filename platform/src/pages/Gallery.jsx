/* ═══════════════════════════════════════════════════════════════
 *  CEDA Innovation Hub — Public Awards Gallery
 *  Awarded submissions only (RLS allows anon read on stage=awarded).
 *  Dark hero, glass cards, logo/media previews via signed URLs.
 * ═══════════════════════════════════════════════════════════════ */
import React, { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Sparkles, Loader2 } from 'lucide-react';
import Logo from '../components/Logo';
import ModalSheet from '../components/ui/ModalSheet';
import AttachmentGrid from '../components/AttachmentGrid';
import { HoverImg } from '@/components/block/hover-img';
import { supabase } from '../lib/supabase';
import { getAttachmentUrls } from '../lib/storage';
import { SDGS } from '../lib/sdgs';

/* three.js is heavy — load the showcase only when it is on screen */
const ArtGallery = lazy(() => import('@/components/block/art-gallery'));

export default function Gallery({ onBack }) {
    const [awarded, setAwarded] = useState(null);
    const [fatal, setFatal] = useState('');
    const [open, setOpen] = useState(null);
    const [mediaUrls, setMediaUrls] = useState({});

    useEffect(() => {
        supabase
            .from('ceda_submissions')
            .select('id, title, description, owner_name, stage_of_development, sdgs, team_members, attachments, entry_type, updated_at')
            .eq('stage', 'awarded')
            .order('updated_at', { ascending: false })
            .then(async ({ data, error }) => {
                if (error) { setFatal(error.message); setAwarded([]); return; }
                setAwarded(data || []);
                // signed URLs for the showcase tiles (public for awarded entries)
                const paths = (data || []).flatMap(s => (s.attachments || []).filter(a => a.kind === 'image').map(a => a.path));
                if (paths.length) setMediaUrls(await getAttachmentUrls(paths));
            });
    }, []);

    /* Art gallery tiles: one per awarded entry, using its image if it has one */
    const tiles = useMemo(() => (awarded || []).map(s => {
        const img = (s.attachments || []).find(a => a.kind === 'image');
        return {
            id: s.id,
            title: s.title,
            year: new Date(s.updated_at).getFullYear(),
            src: img ? mediaUrls[img.path] : null,
        };
    }), [awarded, mediaUrls]);

    /* the original Art Gallery takes image sources and captions separately */
    const galleryImages = useMemo(() => tiles.map(t => t.src).filter(Boolean), [tiles]);
    const galleryCaptions = useMemo(
        () => tiles.map((t, i) => ({ title: t.title || `Study ${i + 1}`, year: t.year || '2026' })),
        [tiles]
    );

    /* hover previews for the cards below */
    const hoverProjects = useMemo(
        () => tiles.filter(t => t.src).map(t => ({
            title: t.title,
            label: `${t.year} · CEDA award`,
            imageSrc: t.src,
        })),
        [tiles]
    );

    const sdgLabel = (v) => SDGS.find(s => s.value === v)?.label || v;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white dark">
            {/* Hero */}
            <div className="relative overflow-hidden">
                <div
                    className="absolute inset-0 opacity-40"
                    style={{
                        background:
                            'radial-gradient(600px 300px at 20% 0%, rgba(242,101,34,0.35), transparent), radial-gradient(500px 260px at 85% 20%, rgba(250,166,26,0.25), transparent)',
                    }}
                />
                <div className="relative max-w-6xl mx-auto px-6 pt-10 pb-14">
                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to sign in
                    </button>
                    <div className="mt-8 flex items-center gap-3">
                        <Logo className="w-9 h-9" />
                        <span className="text-sm text-white/70 tracking-tight">CEDA Innovation Hub</span>
                    </div>
                    <div className="mt-10 flex items-center gap-2 text-accent-400 text-sm">
                        <Trophy className="w-4 h-4" /> Awards Gallery
                    </div>
                    <h1 className="mt-3 text-4xl sm:text-5xl font-medium tracking-tight max-w-3xl">
                        Innovations awarded by CEDA
                    </h1>
                    <p className="mt-4 text-white/60 max-w-2xl">
                        Winning submissions that passed every stage gate — screening, evaluation,
                        selection — and earned CEDA's recognition.
                    </p>
                </div>
            </div>

            {/* Showcase — draggable lensed grid of awarded innovations */}
            {tiles.length > 0 && (
                <div className="max-w-6xl mx-auto px-6 pb-16">
                    <div className="flex items-end justify-between gap-4 mb-4">
                        <div>
                            <h2 className="text-2xl tracking-tight text-white">The showcase</h2>
                            <p className="text-white/50 text-sm mt-1">Drag through the awarded work.</p>
                        </div>
                    </div>
                    <Suspense fallback={
                        <div className="h-[420px] rounded-3xl bg-[#0a0a0a] flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-white/30" />
                        </div>
                    }>
                        <ArtGallery images={galleryImages} items={galleryCaptions} className="h-[420px]" />
                    </Suspense>
                </div>
            )}

            {/* Hover preview rail (original Obsidian component) */}
            {hoverProjects.length > 0 && (
                <div className="max-w-6xl mx-auto px-6 pb-14">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-4">Hover to preview</p>
                    <HoverImg projects={hoverProjects} isContained compact />
                </div>
            )}

            {/* Grid */}
            <div className="max-w-6xl mx-auto px-6 pb-24">
                {awarded === null && !fatal && (
                    <div className="flex items-center justify-center py-20 text-white/40">
                        <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                )}
                {fatal && (
                    <div className="glass-panel rounded-3xl p-8 text-center text-white/50 text-sm">
                        {fatal}
                    </div>
                )}
                {awarded && awarded.length === 0 && (
                    <div className="glass-panel rounded-3xl p-12 text-center">
                        <Sparkles className="w-8 h-8 text-white/20 mx-auto" />
                        <p className="text-white/50 mt-4">No awarded submissions yet. The first winners will appear here.</p>
                    </div>
                )}
                {awarded && awarded.length > 0 && (
                    <HoverImage
                        items={tiles.filter(t => t.src).map(t => ({ id: t.id, src: t.src, title: t.title }))}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                    >
                        {awarded.map((s, i) => {
                            const img = (s.attachments || []).find(a => a.kind === 'image');
                            const preview = img ? mediaUrls[img.path] : null;
                            return (
                                <motion.button
                                    key={s.id}
                                    data-hover-item={preview ? s.id : undefined}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06 }}
                                    onClick={() => setOpen(s)}
                                    className="glass-panel rounded-3xl p-6 text-left hover:border-accent-500/40 transition-colors group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="px-2.5 py-1 rounded-full text-[11px] bg-accent-500/15 text-accent-300">
                                            {s.stage_of_development || 'Idea'}
                                        </span>
                                        <Trophy className="w-4 h-4 text-accent-400 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <h3 className="mt-4 text-lg tracking-tight line-clamp-2">{s.title}</h3>
                                    <p className="mt-2 text-sm text-white/50 line-clamp-3">{s.description}</p>
                                    <div className="mt-4 flex items-center justify-between text-xs text-white/40">
                                        <span className="truncate">{s.owner_name || 'Anonymous innovator'}</span>
                                        <span>{(s.sdgs || []).length} SDG{s.sdgs?.length === 1 ? '' : 's'}</span>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </HoverImage>
                )}
            </div>

            {/* Detail sheet */}
            {open && (
                <ModalSheet
                    open
                    onClose={() => setOpen(null)}
                    title={open.title}
                    subtitle={`${open.owner_name || 'Anonymous innovator'} · ${open.entry_type || 'individual'}`}
                    footer={
                        <button className="btn-secondary !py-2.5 !px-5 !text-sm" onClick={() => setOpen(null)}>
                            Close
                        </button>
                    }
                >
                    <div className="space-y-5">
                        <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{open.description}</p>
                        {(open.sdgs || []).length > 0 && (
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">SDG alignment</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {open.sdgs.map(s => (
                                        <span key={s} className="px-2.5 py-1 rounded-full text-xs bg-accent-500/10 text-accent-600 dark:text-accent-400" title={sdgLabel(s)}>
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {(open.team_members || []).length > 0 && (
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Team</p>
                                <div className="flex flex-wrap gap-2">
                                    {open.team_members.map((m, i) => (
                                        <span key={i} className="px-3 py-1.5 rounded-full text-xs bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-200">
                                            {m.name}{m.roles?.length ? ` — ${m.roles.join(' / ')}` : ''}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {(open.attachments || []).length > 0 && (
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Media</p>
                                <AttachmentGrid attachments={open.attachments} />
                            </div>
                        )}
                    </div>
                </ModalSheet>
            )}
        </div>
    );
}
