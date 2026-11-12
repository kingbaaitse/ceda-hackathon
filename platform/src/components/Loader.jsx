/**
 * The platform's only loading state: the CEDA glass logo.
 *
 *  - InlineLoader: the transparent GIF, for buttons, rows and small panels.
 *  - FullscreenLoader: the full-screen video for page loads. The source file
 *    is opaque, so it is blended over the dark backdrop with `mix-blend-screen`
 *    which removes the black field and leaves only the logo.
 *
 * Both keep the surrounding background transparent - nothing is painted over
 * the page except the loader's own backdrop.
 */
import React from 'react';

const INLINE_SRC = '/loaders/ceda-glass-logo-inline-loader.gif?v=2';
const FULLSCREEN_SRC = '/loaders/ceda-glass-logo-fullscreen-loader.webm?v=2';

export function InlineLoader({ className = '', size = 28, label = 'Loading' }) {
    return (
        <span
            role="status"
            aria-label={label}
            data-loading="true"
            className={`inline-flex items-center justify-center shrink-0 ${className}`}
            style={{ width: size, height: size }}
        >
            <img
                src={INLINE_SRC}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-contain"
                style={{ background: 'transparent' }}
            />
        </span>
    );
}

export function FullscreenLoader({ className = '', label = 'Loading' }) {
    return (
        <div
            role="status"
            aria-label={label}
            className={`fixed inset-0 z-[500] flex items-center justify-center bg-[#0a0a0a]/92 backdrop-blur-sm ${className}`}
        >
            <video
                src={FULLSCREEN_SRC}
                autoPlay
                loop
                muted
                playsInline
                aria-hidden="true"
                className="w-[220px] h-[220px] sm:w-[300px] sm:h-[300px] object-contain"
                style={{ mixBlendMode: 'screen', background: 'transparent' }}
            />
        </div>
    );
}

/** Spinner-shaped replacement for a button that is working. */
export function ButtonLoader({ size = 16 }) {
    return <InlineLoader size={size} label="Working" />;
}

export default InlineLoader;
