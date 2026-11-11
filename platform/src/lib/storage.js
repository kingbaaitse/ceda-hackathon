import { supabase } from './supabase';

/* Supabase Storage helpers for the private ceda-attachments bucket.
   Path convention: {owner_id}/{submission_id}/{ts}-{filename}          */

export const BUCKET = 'ceda-attachments';

export const attachmentPath = (ownerId, submissionId, file) =>
  `${ownerId}/${submissionId}/${Date.now()}-${file.name.replace(/[^\w.\-() ]/g, '_')}`;

export async function uploadAttachment(ownerId, submissionId, file) {
  const path = attachmentPath(ownerId, submissionId, file);
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  return {
    path,
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    kind: file.type?.startsWith('image/') ? 'image' : 'document',
  };
}

export async function deleteAttachment(path) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

/** Signed URL (1h) for inline preview — access is RLS-checked server-side. */
export async function getAttachmentUrl(path) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function getAttachmentUrls(paths = []) {
  const out = {};
  await Promise.all(paths.map(async p => { try { out[p] = await getAttachmentUrl(p); } catch { /* skip */ } }));
  return out;
}

export const prettySize = (bytes) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
