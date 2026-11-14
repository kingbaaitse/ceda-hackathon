/**
 * Runtime capability probes.
 *
 * The hero runs two WebGL scenes. Phones, laptops, remote desktops and CI
 * machines differ by an order of magnitude in how fast they can rasterise, so
 * the scenes ask these questions once and scale themselves to the answer
 * instead of assuming a desktop GPU.
 */
import { useEffect, useState } from 'react';

let cached;

/** The unmasked GPU string, or '' when the browser refuses to tell us. */
function gpuName() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (!gl) return '';
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return String(name || '');
    } catch {
        return '';
    }
}

/** True when the page is rasterised on the CPU (SwiftShader, llvmpipe, VMs). */
export function isSoftwareRenderer() {
    if (cached) return cached.software;
    const gpu = gpuName();
    cached = cached || {};
    cached.software = /swiftshader|llvmpipe|softwarerasterizer|software|basic render|microsoft basic/i.test(gpu);
    return cached.software;
}

/**
 * True when the device is unlikely to sustain a full-rate WebGL scene:
 * a software rasteriser, a data-saver connection, or very little CPU/RAM.
 */
export function isLowEndDevice() {
    if (cached) return cached.lowEnd;
    const nav = typeof navigator !== 'undefined' ? navigator : {};
    const conn = nav.connection || {};
    const cores = nav.hardwareConcurrency || 8;
    const memory = nav.deviceMemory || 8;
    cached = cached || {};
    cached.lowEnd =
        isSoftwareRenderer() ||
        conn.saveData === true ||
        (cores <= 2 && memory <= 4) ||
        memory <= 2;
    return cached.lowEnd;
}

/** True when the reader asked the OS to cut animations. */
export function prefersReducedMotion() {
    return typeof window !== 'undefined'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * True while the element is on screen (plus a margin, so a scene is ready
 * before it scrolls into view). Returns false until the first observation,
 * which keeps expensive work out of the first paint.
 */
export function useInView(ref, rootMargin = '200px') {
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (typeof IntersectionObserver === 'undefined') {
            setInView(true);
            return;
        }
        const observer = new IntersectionObserver(
            (entries) => setInView(entries[0].isIntersecting),
            { rootMargin }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [ref, rootMargin]);

    return inView;
}
