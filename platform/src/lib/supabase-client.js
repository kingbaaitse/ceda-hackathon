/**
 * The Supabase client is a large library, and a public page does not need it
 * to draw its first frame. It is fetched on demand instead: the landing page
 * paints immediately and the data arrives a moment later.
 */
let pending;

/** Resolves with the shared Supabase client, downloading it once. */
export const loadSupabase = () => (pending ??= import('./supabase').then((m) => m.supabase));
