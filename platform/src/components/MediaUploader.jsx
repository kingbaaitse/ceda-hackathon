/* Upload zone with per-file progress, image previews, delete.
   Uploads straight to the private ceda-attachments bucket. */
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, Loader2, FileText } from 'lucide-react';
import { uploadAttachment, deleteAttachment, getAttachmentUrl, prettySize } from '../lib/storage';

export default function MediaUploader({ ownerId, submissionId, attachments = [], onChange }) {
    const inputRef = useRef(null);
    const [busy, setBusy] = useState({}); // name -> uploading
    const [error, setError] = useState('');
    const [dragOver, setDragOver] = useState(false);

    const handleFiles = async (files) => {
        if (!submissionId) { setError('Save a draft first — attachments need a submission.'); return; }
        setError('');
        const list = Array.from(files);
        const next = [...attachments];
        for (const f of list) {
            setBusy(b => ({ ...b, [f.name]: true }));
            try {
                const att = await uploadAttachment(ownerId, submissionId, f);
                next.push(att);
                onChange(next);
            } catch (e) {
                setError(e.message || `Could not upload ${f.name}`);
            } finally {
                setBusy(b => { const c = { ...b }; delete c[f.name]; return c; });
            }
        }
    };

    const handleRemove = async (att) => {
        try {
            await deleteAttachment(att.path);
            onChange(attachments.filter(a => a.path !== att.path));
        } catch (e) {
            setError(e.message || 'Could not remove file.');
        }
    };

    return (
        <div className="space-y-3">
            <div
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                className={`rounded-3xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors ${dragOver
                    ? 'border-accent-500 bg-accent-50 dark:bg-accent-500/5'
                    : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
            >
                <UploadCloud className="w-7 h-7 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    Drop files here or <span className="text-accent-600 dark:text-accent-400">browse</span>
                </p>
                <p className="text-[11px] text-gray-400 mt-1">Logos, product shots, pitch decks, technical drawings (PDF) — up to 50 MB each</p>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
                />
            </div>

            {error && <p className="text-royal-600 dark:text-royal-400 text-xs px-1">{error}</p>}

            <AnimatePresence>
                {attachments.map(att => (
                    <motion.div
                        key={att.path}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-gray-100 dark:border-white/10"
                    >
                        {att.kind === 'image' ? (
                            <img src={`pending-signed-${att.path}`} alt="" className="hidden" />
                        ) : null}
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                            {att.kind === 'image'
                                ? <ThumbPath path={att.path} />
                                : <FileText className="w-3.5 h-3.5 text-gray-500 dark:text-gray-300" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-900 dark:text-white truncate">{att.name}</p>
                            <p className="text-[11px] text-gray-400 capitalize">{att.kind} · {prettySize(att.size)}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleRemove(att)}
                            className="p-1.5 rounded-full text-gray-400 hover:text-royal-600 hover:bg-royal-50 dark:hover:bg-royal-500/10"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
                {Object.keys(busy).map(name => (
                    <div key={name} className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 opacity-70">
                        <Loader2 className="w-4 h-4 text-accent-500 animate-spin" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{name}</p>
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
}

/* Tiny signed-thumbnail used inside the uploader list. */
function ThumbPath({ path }) {
    const [src, setSrc] = useState(null);
    useEffect(() => { getAttachmentUrl(path).then(setSrc).catch(() => { }); }, [path]);
    return src
        ? <img src={src} alt="" className="w-8 h-8 rounded-full object-cover" />
        : <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />;
}
