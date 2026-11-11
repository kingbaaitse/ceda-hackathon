-- ═══════════════════════════════════════════════════════════════
--  CEDA Innovation Hub — schema + RLS
--  Run in the Supabase SQL editor (shares the auth.users of the
--  project; all tables are ceda_* so nothing collides with HMCP).
-- ═══════════════════════════════════════════════════════════════

-- ── Profiles ───────────────────────────────────────────────────
create table if not exists public.ceda_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'participant' check (role in ('participant','judge','admin')),
  org_name text,
  created_at timestamptz not null default now()
);

-- ── Submissions ────────────────────────────────────────────────
create table if not exists public.ceda_submissions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  owner_name text not null,
  entry_type text not null default 'individual' check (entry_type in ('individual','team')),
  team_members jsonb not null default '[]',
  title text not null,
  description text not null,
  sdg_alignment text,
  stage_of_development text,
  attachments jsonb not null default '[]',
  stage text not null default 'draft'
    check (stage in ('draft','submitted','compliance_review','screened_in','screened_out','in_evaluation','selection','awarded','not_selected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One submission per participant (§4.3)
create unique index if not exists ceda_one_submission_per_owner
  on public.ceda_submissions (owner_id);

-- ── Gate events (workflow audit trail; feedback required by app, not-null in DB) ──
create table if not exists public.ceda_gate_events (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.ceda_submissions(id) on delete cascade,
  gate text not null,
  decision text not null,
  feedback text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ── Judge assignments (judge sees only assigned submissions) ──
create table if not exists public.ceda_judge_assignments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.ceda_submissions(id) on delete cascade,
  judge_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (submission_id, judge_id)
);

-- ── Evaluations (rubric scores; one per judge per submission) ──
create table if not exists public.ceda_evaluations (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.ceda_submissions(id) on delete cascade,
  judge_id uuid not null references auth.users(id) on delete cascade,
  scores jsonb not null default '{}',
  total numeric not null default 0,
  feedback text not null,
  created_at timestamptz not null default now(),
  unique (submission_id, judge_id)
);

-- ═══════════════════════════════════════════════════════════════
--  Role helpers
-- ═══════════════════════════════════════════════════════════════
create or replace function public.ceda_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ceda_profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.ceda_is_judge()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ceda_profiles where id = auth.uid() and role = 'judge');
$$;

-- ═══════════════════════════════════════════════════════════════
--  RLS
-- ═══════════════════════════════════════════════════════════════
alter table public.ceda_profiles enable row level security;
alter table public.ceda_submissions enable row level security;
alter table public.ceda_gate_events enable row level security;
alter table public.ceda_judge_assignments enable row level security;
alter table public.ceda_evaluations enable row level security;

-- profiles: self select/insert; admins read all + change roles
drop policy if exists ceda_profiles_select on public.ceda_profiles;
create policy ceda_profiles_select on public.ceda_profiles
  for select using (id = auth.uid() or public.ceda_is_admin());

drop policy if exists ceda_profiles_insert on public.ceda_profiles;
create policy ceda_profiles_insert on public.ceda_profiles
  for insert with check (id = auth.uid() and role = 'participant');

drop policy if exists ceda_profiles_update on public.ceda_profiles;
create policy ceda_profiles_update on public.ceda_profiles
  for update using (id = auth.uid() or public.ceda_is_admin())
  with check (id = auth.uid() or public.ceda_is_admin());

-- submissions:
--  * participant: full control of own row; editable while draft
--  * judge: read only assigned submissions
--  * admin: everything
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

drop policy if exists ceda_subs_insert on public.ceda_submissions;
create policy ceda_subs_insert on public.ceda_submissions
  for insert with check (owner_id = auth.uid());

drop policy if exists ceda_subs_update on public.ceda_submissions;
create policy ceda_subs_update on public.ceda_submissions
  for update using (owner_id = auth.uid() or public.ceda_is_admin())
  with check (owner_id = auth.uid() or public.ceda_is_admin());

-- gate events: participants read own; admins write
drop policy if exists ceda_gates_select on public.ceda_gate_events;
create policy ceda_gates_select on public.ceda_gate_events
  for select using (
    exists (select 1 from public.ceda_submissions s where s.id = submission_id and s.owner_id = auth.uid())
    or public.ceda_is_admin()
    or (public.ceda_is_judge() and exists (
      select 1 from public.ceda_judge_assignments a
      where a.submission_id = ceda_gate_events.submission_id and a.judge_id = auth.uid()
    ))
  );

drop policy if exists ceda_gates_insert on public.ceda_gate_events;
create policy ceda_gates_insert on public.ceda_gate_events
  for insert with check (public.ceda_is_admin());

-- assignments: judges read own; admins manage
drop policy if exists ceda_assign_select on public.ceda_judge_assignments;
create policy ceda_assign_select on public.ceda_judge_assignments
  for select using (judge_id = auth.uid() or public.ceda_is_admin());

drop policy if exists ceda_assign_insert on public.ceda_judge_assignments;
create policy ceda_assign_insert on public.ceda_judge_assignments
  for insert with check (public.ceda_is_admin());

drop policy if exists ceda_assign_update on public.ceda_judge_assignments;
create policy ceda_assign_update on public.ceda_judge_assignments
  for update using (public.ceda_is_admin()) with check (public.ceda_is_admin());

-- evaluations: judge writes own; participant reads on own submission; admin reads all
drop policy if exists ceda_eval_select on public.ceda_evaluations;
create policy ceda_eval_select on public.ceda_evaluations
  for select using (
    judge_id = auth.uid()
    or public.ceda_is_admin()
    or exists (select 1 from public.ceda_submissions s where s.id = submission_id and s.owner_id = auth.uid())
  );

drop policy if exists ceda_eval_insert on public.ceda_evaluations;
create policy ceda_eval_insert on public.ceda_evaluations
  for insert with check (
    judge_id = auth.uid()
    and public.ceda_is_judge()
    and exists (select 1 from public.ceda_judge_assignments a where a.submission_id = ceda_evaluations.submission_id and a.judge_id = auth.uid())
  );

drop policy if exists ceda_eval_update on public.ceda_evaluations;
create policy ceda_eval_update on public.ceda_evaluations
  for update using (judge_id = auth.uid()) with check (judge_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
--  First admin bootstrap (run AFTER your account exists — sign up
--  in the app once, then come back and run:)
--  update public.ceda_profiles set role = 'admin'
--    where id = (select id from auth.users where email = 'YOUR@EMAIL');
-- ═══════════════════════════════════════════════════════════════
