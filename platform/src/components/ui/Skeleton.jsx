import React from 'react';

/** Skeleton shimmer block (flat design — pure opacity pulse, no shadow). */
export default function Skeleton({ className = 'h-4 w-full' }) {
    return (
        <div className={`rounded-full bg-gray-200/70 dark:bg-white/5 animate-pulse ${className}`} />
    );
}

export function SkeletonCard({ lines = 3 }) {
    return (
        <div className="card p-6 space-y-3">
            <Skeleton className="h-5 w-2/5" />
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton key={i} className={`h-3.5 ${i === lines - 1 ? 'w-1/3' : 'w-full'}`} />
            ))}
        </div>
    );
}
