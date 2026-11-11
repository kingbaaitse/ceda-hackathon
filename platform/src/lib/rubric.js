import { useEffect, useState } from 'react';
import { supabase } from './supabase';

/* Rubric weights come from the ceda_rubric table so CEDA admins can
   tune the scoring model without a redeploy. Falls back to the static
   definition if the table is unavailable. */
let cache = null;

export async function fetchRubric() {
  if (cache) return cache;
  try {
    const { data, error } = await supabase
      .from('ceda_rubric')
      .select('key, label, weight, sort')
      .order('sort');
    if (!error && data?.length) {
      cache = data.map(r => ({ key: r.key, label: r.label, weight: Number(r.weight) }));
      return cache;
    }
  } catch { /* fall through */ }
  const { RUBRIC } = await import('./pipeline');
  cache = RUBRIC.map(r => ({ ...r, weight: 0.20 }));
  return cache;
}

export function useRubric() {
  const [rubric, setRubric] = useState(cache || null);
  useEffect(() => {
    if (!rubric) fetchRubric().then(setRubric);
  }, [rubric]);
  return rubric;
}

/** Weighted total on a 0–100 scale. scores: { key: 0..10 } */
export function weightedTotal(rubric, scores) {
  if (!rubric) return 0;
  const sum = rubric.reduce((a, r) => a + (Number(scores?.[r.key]) || 0) * r.weight, 0);
  return Math.round(sum * 10);
}

/** Normalize weights so they sum to 1 (keeps the /100 scale honest). */
export function normalizeWeights(rows) {
  const sum = rows.reduce((a, r) => a + Number(r.weight) || 0, 0) || 1;
  return rows.map(r => ({ ...r, weight: Number((r.weight / sum).toFixed(4)) }));
}
