import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from '../AnimatedIcons';

/**
 * Shared dialog shell (hmcp ModalSheet pattern).
 * Renders through a portal to document.body so it always paints above
 * the sticky header / motion stacking contexts. Bottom sheet on phones,
 * centred card from `sm` up.
 */
export default function ModalSheet({
    open,
    onClose,
    title,
    subtitle,
    children,
    footer,
    maxWidth = 'max-w-lg',
    closeLabel = 'Close dialog',
    contentClassName = '',
}) {
    /* Escape closes; background scroll is locked while open */
    useEffect(() => {
        if (!open || !onClose) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prevOverflow;
            document.removeEventListener('keydown', onKey);
        };
    }, [open, onClose]);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                        role="dialog"
                        aria-modal="true"
                        className={`relative flex w-full ${maxWidth} max-h-[92dvh] flex-col overflow-hidden rounded-t-[2rem] border border-gray-100 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0a0a0a] sm:max-h-[85vh] sm:rounded-[2.5rem]`}
                        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                    >
                        {(title || onClose) && (
                            <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-white/5">
                                <div className="min-w-0">
                                    {title && <h2 className="truncate text-xl text-gray-900 dark:text-white">{title}</h2>}
                                    {subtitle && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
                                </div>
                                {onClose && (
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        aria-label={closeLabel}
                                        className="-mr-1 flex-shrink-0 rounded-full bg-gray-100 p-2 text-gray-400 transition-colors hover:text-gray-600 dark:bg-white/5 dark:hover:text-gray-300"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        )}

                        <div className={`scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 ${contentClassName}`}>
                            {children}
                        </div>

                        {footer && (
                            <div className="flex-shrink-0 border-t border-gray-100 px-6 py-4 dark:border-white/5">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
