/**
 * Semantic colour system.
 *
 * In this product colour carries meaning, so the scale is fixed and every
 * chart, counter and badge picks from it. Nothing here is decorative:
 * green = healthy / on track, amber = attention, orange = in progress,
 * red = blocked or failed, blue/sky = informational, grey = inactive.
 *
 * Each entry carries a class for light and dark mode plus a text colour
 * that meets contrast on our surfaces.
 */

export const SEMANTIC = {
    success: {
        label: 'Good',
        bar: 'bg-emerald-500',
        barSoft: 'bg-emerald-500/15',
        text: 'text-emerald-600 dark:text-emerald-400',
        dot: 'bg-emerald-500',
        hex: '#10b981',
    },
    warning: {
        label: 'Attention',
        bar: 'bg-amber-400',
        barSoft: 'bg-amber-400/15',
        text: 'text-amber-600 dark:text-amber-400',
        dot: 'bg-amber-400',
        hex: '#fbbf24',
    },
    progress: {
        label: 'In progress',
        bar: 'bg-accent-500',
        barSoft: 'bg-accent-500/15',
        text: 'text-accent-600 dark:text-accent-400',
        dot: 'bg-accent-500',
        hex: '#F26522',
    },
    danger: {
        label: 'Blocked',
        bar: 'bg-rose-500',
        barSoft: 'bg-rose-500/15',
        text: 'text-rose-600 dark:text-rose-400',
        dot: 'bg-rose-500',
        hex: '#f43f5e',
    },
    info: {
        label: 'Informational',
        bar: 'bg-sky-500',
        barSoft: 'bg-sky-500/15',
        text: 'text-sky-600 dark:text-sky-400',
        dot: 'bg-sky-500',
        hex: '#0ea5e9',
    },
    neutral: {
        label: 'Inactive',
        bar: 'bg-gray-300 dark:bg-white/20',
        barSoft: 'bg-gray-200/60 dark:bg-white/5',
        text: 'text-gray-500 dark:text-gray-400',
        dot: 'bg-gray-300 dark:bg-white/20',
        hex: '#cbd5e1',
    },
};

/**
 * Score band -> semantic tone.
 * A weighted total out of 100.
 */
export function scoreTone(score) {
    if (score == null) return 'neutral';
    if (score >= 85) return 'success';
    if (score >= 70) return 'progress';
    if (score >= 50) return 'warning';
    return 'danger';
}

/** A 0-10 rubric criterion average. */
export function criterionTone(avg) {
    if (avg == null) return 'neutral';
    if (avg >= 8.5) return 'success';
    if (avg >= 7) return 'progress';
    if (avg >= 5) return 'warning';
    return 'danger';
}

/** Pipeline stage -> semantic tone (funnel colouring). */
export function stageTone(stage) {
    switch (stage) {
        case 'draft': return 'neutral';
        case 'submitted': return 'info';
        case 'compliance_review': return 'info';
        case 'screened_in': return 'progress';
        case 'screened_out': return 'danger';
        case 'in_evaluation': return 'progress';
        case 'selection': return 'warning';
        case 'awarded': return 'success';
        case 'not_selected': return 'danger';
        default: return 'neutral';
    }
}

/** Triage severity -> semantic tone. */
export function severityTone(severity) {
    return severity === 'high' ? 'danger' : severity === 'medium' ? 'warning' : 'info';
}

/** Percentage of a cohort -> semantic tone. */
export function ratioTone(pct) {
    if (pct == null) return 'neutral';
    if (pct >= 75) return 'success';
    if (pct >= 40) return 'progress';
    if (pct > 0) return 'warning';
    return 'neutral';
}
