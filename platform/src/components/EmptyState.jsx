/**
 * EmptyState — a friendly illustrated placeholder.
 *
 * Used instead of a bare "no data" line, so an empty list still looks
 * designed. The artwork comes from the same set as the landing page.
 */
import React from 'react';
import { motion } from 'framer-motion';

export default function EmptyState({
    art,
    title,
    body,
    action,
    className = '',
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`flex flex-col items-center justify-center text-center px-6 py-14 ${className}`}
        >
            {art && (
                <motion.img
                    src={art}
                    alt=""
                    aria-hidden="true"
                    className="w-28 h-28 opacity-90 mb-4"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
            )}
            <p className="text-gray-900 dark:text-white font-medium">{title}</p>
            {body && <p className="text-sm text-gray-500 dark:text-white/45 mt-1.5 max-w-sm">{body}</p>}
            {action && <div className="mt-5">{action}</div>}
        </motion.div>
    );
}
