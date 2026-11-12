/**
 * Service status - computed, never hand-typed.
 *
 * The database derives each day's status from real operational data
 * (activity recorded, email deliveries that failed, recorded incidents), so
 * the strip moves between green, amber and red on its own.
 */
import { supabase } from './supabase';

/**
 * @returns {Promise<{ days: Array<{date:string, status:string, note:string|null, events:number}>, today: string }>}
 */
export async function fetchServiceStatus(days = 30) {
    const fallback = {
        days: [],
        today: new Date().toISOString().slice(0, 10),
    };
    try {
        const { data, error } = await supabase.rpc('ceda_service_status', { days });
        if (error || !data) return fallback;
        return {
            days: data.map(r => ({
                date: r.day,
                status: r.status,
                note: r.note || null,
                events: r.events || 0,
            })),
            today: (data[0]?.day) || fallback.today,
        };
    } catch {
        return fallback;
    }
}

/** Map the computed status onto the StatusBars day shape. */
export function toStatusBarDays(days) {
    return days.map(d => {
        const day = { date: d.date };
        if (d.status === 'degraded') day.degraded = 30;
        if (d.status === 'down') day.downtime = 60;
        if (d.note) day.incidents = [{ title: d.note, minutes: d.status === 'down' ? 60 : 30 }];
        return day;
    });
}

/** The status of today, for the headline. */
export function todayStatus(days) {
    const today = new Date().toISOString().slice(0, 10);
    const d = days.find(x => x.date === today);
    return d?.status || 'up';
}
