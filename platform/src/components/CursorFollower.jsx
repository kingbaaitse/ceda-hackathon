/**
 * Cursor Follower — a soft CEDA glow that trails the pointer.
 *
 * Small, dependency-free and deliberately quiet: a blurred halo that eases
 * toward the cursor plus a solid core. It swells over anything interactive so
 * the pointer feels connected to the page, and it never appears on touch
 * devices or when reduced motion is requested.
 */
import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

export default function CursorFollower() {
    const reduced = useReducedMotion();
    const [enabled, setEnabled] = useState(false);
    const [active, setActive] = useState(false);

    const x = useMotionValue(-200);
    const y = useMotionValue(-200);
    const sx = useSpring(x, { stiffness: 220, damping: 26, mass: 0.4 });
    const sy = useSpring(y, { stiffness: 220, damping: 26, mass: 0.4 });
    const rx = useSpring(x, { stiffness: 90, damping: 20, mass: 0.6 });
    const ry = useSpring(y, { stiffness: 90, damping: 20, mass: 0.6 });

    useEffect(() => {
        if (reduced) return;
        const fine = window.matchMedia('(pointer: fine)');
        if (!fine.matches) return;
        setEnabled(true);

        const move = (e) => {
            x.set(e.clientX);
            y.set(e.clientY);
            const t = e.target;
            const interactive = t instanceof Element && !!t.closest('a, button, input, textarea, select, [role="button"], [data-cursor="active"]');
            setActive(interactive);
        };
        const leave = () => {
            x.set(-200);
            y.set(-200);
        };
        window.addEventListener('pointermove', move, { passive: true });
        window.addEventListener('pointerleave', leave);
        return () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerleave', leave);
        };
    }, [reduced, x, y]);

    if (!enabled) return null;

    return (
        <div className="pointer-events-none fixed inset-0 z-[400]" aria-hidden="true">
            {/* halo */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    x: rx, y: ry,
                    translateX: '-50%', translateY: '-50%',
                    width: 44, height: 44,
                    background: 'radial-gradient(circle, rgba(242,101,34,0.22) 0%, rgba(242,101,34,0) 70%)',
                }}
                animate={{ scale: active ? 2.1 : 1, opacity: active ? 1 : 0.65 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            />
            {/* core */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    x: sx, y: sy,
                    translateX: '-50%', translateY: '-50%',
                    width: 7, height: 7,
                    backgroundColor: '#F26522',
                }}
                animate={{ scale: active ? 1.8 : 1, opacity: active ? 0.9 : 0.55 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            />
        </div>
    );
}
