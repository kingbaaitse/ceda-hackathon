/* Read-only attachment gallery with signed URLs. Used by participants,
   judges and admins. Renders image grids and document rows. */
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, ExternalLink } from 'lucide-react';
import { getAttachmentUrls, prettySize } from '../lib/storage';

export default function AttachmentGrid({ attachments = [] }) {
    const [urls, setUrls] = useState({});

    useEffect(() => {
        let alive = true;
        if (attachments.length) {
            getAttachmentUrls(attachments.map(a => a.path)).then(u => { if (alive) setUrls(u); });
        }
        return () => { alive = false; };
    }, [attachments.map(a => a.path).join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!attachments.length) return null;

    const images = attachments.filter(a => a.kind === 'image');
    const docs = attachments.filter(a => a.kind !== 'image');

    return (
        <div className="space-y-3">
            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {images.map((a, i) => (
                        <motion.a
                            key={a.path}
                            href={urls[a.path]}
                            target="_blank"
                            rel="noreferrer"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="group relative rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 aspect-[4/3]"
                        >
                            {urls[a.path]
                                ? <img src={urls[a.path]} alt={a.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                                : <div className="w-full h-full animate-pulse bg-gray-200/60 dark:bg-white/5" />}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2.5 pt-6 pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-[11px] text-white truncate">{a.name}</p>
                            </div>
                        </motion.a>
                    ))}
                </div>
            )}
            {docs.map(a => (
                <a key={a.path} href={urls[a.path]} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-gray-100 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-colors group">
                    <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-900 dark:text-white truncate">{a.name}</p>
                        <p className="text-[11px] text-gray-400">{prettySize(a.size)}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-accent-500 transition-colors flex-shrink-0" />
                </a>
            ))}
        </div>
    );
}
