/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    AlertCircle,
    Info,
    X,
} from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
};

const COLORS = {
    success: 'text-emerald-600 dark:text-emerald-400',
    error: 'text-royal-600 dark:text-royal-400',
    info: 'text-accent-600 dark:text-accent-400',
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const idRef = useRef(0);

    const dismiss = useCallback((id) => {
        setToasts(ts => ts.filter(t => t.id !== id));
    }, []);

    const toast = useCallback((message, type = 'info', duration = 3500) => {
        const id = ++idRef.current;
        setToasts(ts => [...ts.slice(-3), { id, message, type }]);
        if (duration) setTimeout(() => dismiss(id), duration);
    }, [dismiss]);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-2 w-80 max-w-[calc(100vw-3rem)]">
                <AnimatePresence>
                    {toasts.map(t => {
                        const Icon = ICONS[t.type] || Info;
                        return (
                            <motion.div
                                key={t.id}
                                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                                className="glass-panel-strong rounded-2xl px-4 py-3 flex items-start gap-3"
                            >
                                <Icon className={`w-4.5 h-4.5 w-5 h-5 flex-shrink-0 mt-0.5 ${COLORS[t.type] || COLORS.info}`} />
                                <p className="text-sm text-gray-900 dark:text-white flex-1">{t.message}</p>
                                <button onClick={() => dismiss(t.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
