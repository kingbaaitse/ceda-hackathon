/* Offline draft queue.
 *
 * When a participant edits their submission with no connection, the wizard
 * cannot reach Supabase. We park the pending row here and flush it as soon
 * the browser is back online, so no typing is ever lost on a patchy signal.
 */
const KEY = 'ceda-offline-drafts';

export function queueDraft(submissionId, payload) {
    try {
        const all = JSON.parse(localStorage.getItem(KEY) || '{}');
        all[submissionId] = { payload, at: new Date().toISOString() };
        localStorage.setItem(KEY, JSON.stringify(all));
    } catch { /* storage full or unavailable - not fatal */ }
}

export function pendingDrafts() {
    try {
        return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch {
        return {};
    }
}

export function clearDraft(submissionId) {
    try {
        const all = JSON.parse(localStorage.getItem(KEY) || '{}');
        delete all[submissionId];
        localStorage.setItem(KEY, JSON.stringify(all));
    } catch { /* ignore */ }
}

/** Push any queued drafts. Returns the ids that synced successfully. */
export async function flushDrafts(supabase) {
    const all = pendingDrafts();
    const synced = [];
    for (const [id, entry] of Object.entries(all)) {
        const { error } = await supabase
            .from('ceda_submissions')
            .update({ ...entry.payload, updated_at: new Date().toISOString() })
            .eq('id', id);
        if (!error) {
            clearDraft(id);
            synced.push(id);
        }
    }
    return synced;
}
