/**
 * MarketingNav — the floating pill navigation used by every public page.
 *
 * Hides on scroll down, returns on scroll up, tightens once the page moves,
 * and marks the section the reader is in.
 */
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../Logo';

export default function MarketingNav({ links = [], onSignIn, onRegister }) {
    const [scrolled, setScrolled] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [active, setActive] = useState('');
    const [maxVisible, setMaxVisible] = useState(links.length);
    const navRef = useRef(null);
    const linkRefs = useRef([]);

    useEffect(() => {
        let last = window.scrollY;
        const onScroll = () => {
            const y = window.scrollY;
            setScrolled(y > 24);
            setHidden(y > last && y > 140);
            last = y;

            let current = '';
            for (const l of links) {
                const el = l.id && document.getElementById(l.id);
                if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) current = l.id;
            }
            setActive(current);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [links]);

    /* Fit as many links as the pill can hold - never wrap, never overflow.
       As the wordmark collapses on scroll, more links come back. */
    useLayoutEffect(() => {
        const measure = () => {
            const nav = navRef.current;
            if (!nav) return;
            const items = linkRefs.current.filter(Boolean);
            if (!items.length) { setMaxVisible(0); return; }
            const navW = nav.clientWidth;
            let used = 0;
            let count = 0;
            for (const el of items) {
                const w = el.offsetWidth + 6;
                if (used + w > navW - 16) break;
                used += w;
                count++;
            }
            setMaxVisible(count);
        };
        measure();
        const ro = new ResizeObserver(measure);
        if (navRef.current) ro.observe(navRef.current);
        window.addEventListener('resize', measure);
        return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
    }, [links, scrolled]);

    return (
        <AnimatePresence>
            {!hidden && (
                <motion.header
                    initial={{ y: -80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -80, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                    className="fixed top-3 left-0 right-0 z-50 flex justify-center px-4"
                >
                    <nav
                        ref={navRef}
                        className={`flex items-center gap-1 rounded-full border border-gray-200/80 bg-white/80 backdrop-blur-xl shadow-[0_12px_40px_-20px_rgba(30,15,5,0.35)] dark:border-white/10 dark:bg-[#0f0f0f]/80 dark:shadow-[0_12px_40px_-20px_rgba(0,0,0,0.8)] transition-all duration-300 max-w-[calc(100vw-1.5rem)] overflow-hidden ${scrolled ? 'py-1.5 pl-3 pr-1.5' : 'py-2.5 pl-4 pr-2.5 sm:pl-5'}`}
                    >
                        <a href="/" className="flex items-center gap-2 mr-1 shrink-0">
                            <motion.span
                                animate={{ width: scrolled ? 24 : 30, height: scrolled ? 24 : 30 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                                className="block shrink-0"
                            >
                                <Logo className="w-full h-full" />
                            </motion.span>
                            <span className={`text-sm font-medium tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ${scrolled ? 'max-w-0 opacity-0' : 'max-w-0 opacity-0 sm:max-w-[180px] sm:opacity-100'}`}>
                                CEDA Innovation Hub
                            </span>
                        </a>

                        <div className="hidden md:flex items-center gap-0.5 mx-1 flex-nowrap min-w-0 overflow-hidden">
                            {links.slice(0, maxVisible).map((l, i) => (
                                <a
                                    key={l.id || l.href}
                                    ref={el => { linkRefs.current[i] = el; }}
                                    href={l.href || `#${l.id}`}
                                    className={`relative px-3.5 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${active === l.id ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-white/55 hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    {active === l.id && (
                                        <motion.span
                                            layoutId="marketing-nav-active"
                                            className="absolute inset-0 rounded-full bg-gray-900/5 dark:bg-white/10"
                                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative">{l.label}</span>
                                </a>
                            ))}
                        </div>

                        <div className="flex items-center gap-1.5 ml-auto sm:ml-1 shrink-0">
                            <button
                                onClick={onSignIn}
                                className="px-3 py-1.5 rounded-full text-sm whitespace-nowrap text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-gray-900/5 dark:hover:bg-white/10 transition-colors"
                            >
                                Sign in
                            </button>
                            <button
                                onClick={onRegister}
                                className="px-3.5 py-1.5 rounded-full text-sm whitespace-nowrap bg-accent-500 text-white hover:bg-accent-600 transition-colors shadow-[0_6px_18px_-8px_rgba(242,101,34,0.9)]"
                            >
                                Register
                            </button>
                        </div>
                    </nav>
                </motion.header>
            )}
        </AnimatePresence>
    );
}
