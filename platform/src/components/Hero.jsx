/**
 * Orbit Hero.
 *
 * Pattern: the headline sits in the middle of the composition, the product
 * holds the centre, and supporting visuals orbit around it.
 *
 * Standards applied:
 *  - one focal object (the product), everything else supports it
 *  - depth comes from scale + opacity + parallax, not from decoration
 *  - orbiting art drifts slowly and parallaxes with the pointer and scroll
 *  - mobile collapses to headline -> product -> a horizontal strip of art
 *  - reduced motion freezes every animation
 *  - orbiting art is decorative (alt=""), the product carries the meaning
 */
import React, { useRef } from 'react';
import {
    motion, useScroll, useTransform, useReducedMotion, useSpring,
    useMotionValue,
} from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import winner from '../assets/img/illustrations/winner.svg';
import ideaToPlan from '../assets/img/illustrations/idea-to-plan.svg';
import pitch from '../assets/img/illustrations/pitch.svg';
import judging from '../assets/img/illustrations/judging.svg';
import team from '../assets/img/illustrations/co-workers.svg';
import sharedGoals from '../assets/img/illustrations/shared-goals.svg';
import decision from '../assets/img/illustrations/decision.svg';
import growth from '../assets/img/illustrations/growth.svg';
import dashboard from '../assets/img/illustrations/dashboard.svg';
import review from '../assets/img/illustrations/review.svg';
import harvest from '../assets/img/illustrations/harvest.svg';
import happyNews from '../assets/img/illustrations/happy-news.svg';

/* x/y are percentages of the stage, measured from the centre.
   Items stay clear of the product card in the middle (card is ~46% wide,
   ~60% tall), so the focal object is never covered. */
const ORBITS = [
    { src: winner, x: -46, y: -30, size: 132, rotate: -6, depth: 26, opacity: 1 },
    { src: ideaToPlan, x: -40, y: 36, size: 118, rotate: 5, depth: 18, opacity: 0.95 },
    { src: judging, x: -7, y: -50, size: 104, rotate: -3, depth: 30, opacity: 0.9 },
    { src: team, x: 45, y: -34, size: 124, rotate: 7, depth: 22, opacity: 0.95 },
    { src: sharedGoals, x: 51, y: 18, size: 108, rotate: -5, depth: 16, opacity: 0.9 },
    { src: pitch, x: 37, y: 43, size: 116, rotate: 4, depth: 20, opacity: 0.95 },
    { src: growth, x: -53, y: 4, size: 96, rotate: 8, depth: 14, opacity: 0.7 },
    { src: harvest, x: 6, y: 54, size: 100, rotate: -6, depth: 24, opacity: 0.85 },
    { src: dashboard, x: 22, y: -47, size: 92, rotate: 5, depth: 34, opacity: 0.7 },
    { src: review, x: -25, y: 50, size: 88, rotate: -4, depth: 28, opacity: 0.7 },
    { src: happyNews, x: 33, y: -12, size: 84, rotate: 3, depth: 36, opacity: 0.6 },
    { src: decision, x: -33, y: 20, size: 80, rotate: -7, depth: 32, opacity: 0.6 },
];

export default function Hero({
    eyebrow,
    title,
    accent,
    body,
    ctaPrimary,
    ctaSecondary,
    onPrimary,
    onSecondary,
    preview,
    counters,
}) {
    const stageRef = useRef(null);
    const reduced = useReducedMotion();
    const { scrollYProgress } = useScroll({ target: stageRef, offset: ['start end', 'end start'] });

    return (
        <section className="relative overflow-hidden">
            {/* soft glow behind the composition */}
            <div
                className="absolute inset-0 opacity-80 dark:opacity-100"
                style={{ background: 'radial-gradient(760px 420px at 50% 12%, rgba(242,101,34,0.16), transparent 70%)' }}
            />

            <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 text-center">
                <div className="flex items-center justify-center gap-2 text-accent-600 dark:text-accent-400 text-xs font-medium uppercase tracking-[0.16em]">
                    {eyebrow}
                </div>

                <h1 className="mt-6 text-[44px] sm:text-6xl lg:text-7xl font-semibold leading-[1.02] tracking-[-0.035em] mx-auto max-w-4xl">
                    {title} <span className="text-accent-600 dark:text-accent-400">{accent}</span>
                </h1>

                <p className="mt-6 text-gray-600 dark:text-white/60 text-lg sm:text-xl leading-relaxed mx-auto max-w-2xl">
                    {body}
                </p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <button
                        onClick={onPrimary}
                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-gray-900 text-white hover:bg-gray-800 dark:bg-accent-500 dark:text-white dark:hover:bg-accent-600 transition-colors"
                    >
                        {ctaPrimary} <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onSecondary}
                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-gray-300 text-gray-800 hover:border-gray-400 dark:border-white/15 dark:text-white/85 dark:hover:border-white/30 transition-colors"
                    >
                        {ctaSecondary}
                    </button>
                </div>

                {counters && <div className="mt-10">{counters}</div>}

                {/* ── Orbit stage ── */}
                <div ref={stageRef} className="relative mt-14 h-[560px] sm:h-[620px]">
                    {/* the product, at the centre */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92%,680px)]">
                        <motion.div
                            initial={{ opacity: 0, y: 24, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                            className="rounded-[28px] border border-gray-200 overflow-hidden bg-[#0a0a0a] shadow-[0_40px_100px_-40px_rgba(30,15,5,0.45)] dark:border-white/10"
                        >
                            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                                <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-white/40">
                                    Interactive preview
                                </span>
                                <span className="text-[11px] text-white/30">drag to aim the beam</span>
                            </div>
                            <div className="h-[300px] sm:h-[340px]">{preview}</div>
                        </motion.div>
                    </div>

                    {/* the orbit */}
                    {ORBITS.map((o, i) => (
                        <OrbitItem key={i} {...o} reduced={reduced} scrollY={scrollYProgress} />
                    ))}
                </div>
            </div>

            {/* a strip of the artwork for small screens */}
            <div className="lg:hidden max-w-6xl mx-auto px-6 pb-16">
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                    {ORBITS.slice(0, 8).map((o, i) => (
                        <img
                            key={i}
                            src={o.src}
                            alt=""
                            className="w-24 h-24 flex-shrink-0 opacity-80"
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

/* One orbiting illustration: slow drift + pointer parallax + scroll parallax. */
function OrbitItem({ src, x, y, size, rotate, depth, opacity, reduced, scrollY }) {
    const ref = useRef(null);
    const px = useMotionValue(0);
    const py = useMotionValue(0);
    const sx = useSpring(px, { stiffness: 120, damping: 20, mass: 0.5 });
    const sy = useSpring(py, { stiffness: 120, damping: 20, mass: 0.5 });
    const moveX = useTransform(sx, v => v * depth);
    const moveY = useTransform(sy, v => v * depth);
    const scrollShift = useTransform(scrollY, [0, 1], [36, -36]);

    const onMove = (e) => {
        if (reduced) return;
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        px.set(((e.clientX - cx) / (r.width || 1)) * 10);
        py.set(((e.clientY - cy) / (r.height || 1)) * 10);
    };

    const onLeave = () => {
        px.set(0);
        py.set(0);
    };

    return (
        <motion.img
            ref={ref}
            src={src}
            alt=""
            aria-hidden="true"
            onPointerMove={onMove}
            onPointerLeave={onLeave}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity, scale: 1 }}
            transition={{ delay: 0.15 + i_delay(src), duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
                left: `${50 + x}%`,
                top: `${50 + y}%`,
                width: size,
                rotate: `${rotate}deg`,
                x: reduced ? 0 : moveX,
                y: reduced ? 0 : scrollShift,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none hidden lg:block drop-shadow-[0_18px_30px_rgba(30,15,5,0.12)] dark:drop-shadow-[0_18px_34px_rgba(0,0,0,0.5)]"
        />
    );
}

/* deterministic per-illustration delay so the orbit assembles in sequence */
function i_delay(src) {
    let h = 0;
    for (let i = 0; i < src.length; i++) h = (h * 31 + src.charCodeAt(i)) % 100;
    return (h / 100) * 0.5;
}
