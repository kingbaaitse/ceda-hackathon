/**
 * Particle Ribbon — a flowing band of instanced particles in the CEDA palette.
 *
 * Ported from the hero-3d ribbon in the kingbaaitse repo (a sine ribbon of
 * instanced particles that leans with the pointer) and re-skinned for CEDA.
 * It reads as one idea becoming many outcomes, which is the whole point of
 * the pipeline.
 *
 * It is a second WebGL context, so it stays cheap: the colours are written
 * once instead of every frame, the particle count follows the device, and the
 * render loop stops whenever the ribbon is off screen.
 */
import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { isLowEndDevice, useInView } from '../lib/perf';

const COUNT = 1400;
const COUNT_LOW = 500;
/* The ribbon drifts slowly, so it is drawn 30 times a second rather than on
   every animation tick. */
const FRAME_MS = 1000 / 30;

function Ribbon({ palette, reduced, count, active }) {
    const meshRef = useRef(null);
    const pointer = useRef({ x: 0, y: 0 });
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const color = useMemo(() => new THREE.Color(), []);
    const invalidate = useThree((state) => state.invalidate);

    const seeds = useMemo(
        () =>
            Array.from({ length: count }, (_, i) => ({
                t: i / count,
                spread: (Math.random() - 0.5) * 0.5,
                speed: 0.8 + Math.random() * 0.5,
                scale: 0.5 + Math.random() * 0.9,
            })),
        [count]
    );

    const onMove = useCallback((e) => {
        pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }, []);

    /* The palette never changes, so the instance colours are written once. */
    useEffect(() => {
        const mesh = meshRef.current;
        if (!mesh) return;
        for (let i = 0; i < count; i++) {
            color.set(palette[i % palette.length]);
            mesh.setColorAt(i, color);
        }
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }, [palette, count, color]);

    /* The canvas is drawn on demand, 30 times a second, and only while the
       ribbon is on screen. */
    useEffect(() => {
        if (!active) return;
        let frame = 0;
        let last = 0;
        const tick = (time) => {
            frame = requestAnimationFrame(tick);
            if (time - last < FRAME_MS) return;
            last = time;
            invalidate();
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [active, invalidate]);

    useFrame((state) => {
        const mesh = meshRef.current;
        if (!mesh) return;
        const time = reduced ? 0 : state.clock.elapsedTime;
        const tx = pointer.current.x * 0.9;
        const ty = pointer.current.y * 0.55;

        for (let i = 0; i < count; i++) {
            const { t, spread, speed, scale } = seeds[i];
            const x = (t - 0.5) * 18;
            const wave =
                Math.sin(t * Math.PI * 3 + time * 0.3 * speed) * 0.8 +
                Math.cos(t * Math.PI * 2 + time * 0.2 * speed) * 0.45 +
                Math.sin(t * Math.PI * 7 + time * 0.6) * 0.08;

            dummy.position.set(x + tx * 0.35, wave + spread * 0.5 + ty * 0.2, spread * 0.6);
            dummy.scale.setScalar(scale * 0.05);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]} onPointerMove={onMove}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
    );
}

export default function ParticleRibbon({
    className = '',
    palette = ['#F26522', '#FAA61A', '#A02013', '#FFD9A8'],
    opacity = 0.9,
}) {
    const reduced = typeof window !== 'undefined'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const hostRef = useRef(null);
    const inView = useInView(hostRef);
    const lowEnd = useMemo(() => isLowEndDevice(), []);
    const count = lowEnd ? COUNT_LOW : COUNT;

    return (
        <div ref={hostRef} className={`pointer-events-none ${className}`} aria-hidden="true">
            <Canvas
                dpr={lowEnd ? 1 : [1, 1.6]}
                frameloop="demand"
                gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
                camera={{ position: [0, 0, 6], fov: 55 }}
                style={{ opacity }}
            >
                <Ribbon palette={palette} reduced={reduced} count={count} active={inView} />
            </Canvas>
        </div>
    );
}
