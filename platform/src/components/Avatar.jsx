/**
 * Avatar - a profile picture, always circle-cropped.
 *
 * Falls back to the person's initials on a deterministic tint, so a
 * missing photo never leaves a broken square.
 */
import React, { useState } from 'react';

const TINTS = [
    'bg-accent-500/15 text-accent-600 dark:text-accent-300',
    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
    'bg-sky-500/15 text-sky-600 dark:text-sky-300',
    'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    'bg-royal-500/15 text-royal-600 dark:text-royal-300',
];

/** Public URL for an avatar stored in the ceda-avatars bucket. */
export const avatarUrl = (path) =>
    path ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/ceda-avatars/${path}` : null;

function initials(name = '') {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function tintFor(name = '') {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
    return TINTS[h % TINTS.length];
}

export default function Avatar({ src, name = '', size = 36, className = '', onClick, ring = false }) {
    const [failed, setFailed] = useState(false);
    const showImage = src && !failed;

    const style = {
        width: size,
        height: size,
        minWidth: size,
    };

    const content = showImage ? (
        <img
            src={src}
            alt={name ? `${name}'s profile picture` : 'Profile picture'}
            onError={() => setFailed(true)}
            className="w-full h-full object-cover"
            style={{ background: 'transparent' }}
        />
    ) : (
        <span className={`w-full h-full flex items-center justify-center font-medium ${tintFor(name)}`} style={{ fontSize: Math.max(10, size * 0.38) }}>
            {initials(name)}
        </span>
    );

    const classes = `rounded-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-white/10 ${ring ? 'ring-2 ring-white dark:ring-[#0a0a0a]' : ''} ${className}`;

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                aria-label={`View ${name || 'profile'}`}
                style={style}
                className={`${classes} transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500`}
            >
                {content}
            </button>
        );
    }

    return (
        <span style={style} className={classes} title={name}>
            {content}
        </span>
    );
}
