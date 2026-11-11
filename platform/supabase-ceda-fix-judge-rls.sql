-- ═══════════════════════════════════════════════════════════════
--  Fix: unqualified column names inside policy subqueries resolve
--  to the INNER table's columns, shadowing the outer table.
--  Run this in the Supabase SQL editor (after the main schema).
-- ═══════════════════════════════════════════════════════════════

-- 1) Submissions select: judge branch referenced the inner `id`
drop policy if exists ceda_subs_select on public.ceda_submissions;
create policy ceda_subs_select on public.ceda_submissions
  for select using (
    owner_id = auth.uid()
    or public.ceda_is_admin()
    or (public.ceda_is_judge() and exists (
      select 1 from public.ceda_judge_assignments a
      where a.submission_id = ceda_submissions.id and a.judge_id = auth.uid()
    ))
  );

-- 2) Evaluations insert: `submission_id` was shadowed by the inner
--    ceda_judge_assignments.submission_id (always-true comparison)
drop policy if exists ceda_eval_insert on public.ceda_evaluations;
create policy ceda_eval_insert on public.ceda_evaluations
  for insert with check (
    judge_id = auth.uid()
    and public.ceda_is_judge()
    and exists (
      select 1 from public.ceda_judge_assignments a
      where a.submission_id = ceda_evaluations.submission_id and a.judge_id = auth.uid()
    )
  );
