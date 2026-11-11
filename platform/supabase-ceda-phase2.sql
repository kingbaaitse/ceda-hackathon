-- CEDA Innovation Hub - Phase 2 migration
-- Storage bucket + policies, notifications + realtime, rubric weights,
-- submission versions, public gallery policy, SDG column.

-- 1) SDG multi-select column (wizard stores an array)
alter table public.ceda_submissions
  add column if not exists sdgs jsonb not null default '[]';

-- Migrate the old single-text SDG alignment into the array (idempotent)
update public.ceda_submissions
set sdgs = coalesce((
  select jsonb_agg(trim(x))
  from unnest(string_to_array(sdg_alignment, ',')) x
  where trim(x) <> ''
), '[]'::jsonb)
where sdgs = '[]'::jsonb and sdg_alignment is not null;

-- 2) Access helper (security definer so storage policies work)
create or replace function public.ceda_can_view_submission(sub uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.ceda_submissions s
    where s.id = sub
      and (
        s.owner_id = auth.uid()
        or s.stage = 'awarded'
        or exists (select 1 from public.ceda_profiles p where p.id = auth.uid() and p.role = 'admin')
        or exists (select 1 from public.ceda_judge_assignments a
                   where a.submission_id = sub and a.judge_id = auth.uid())
      )
  );
$$;

-- Safe wrapper: malformed paths return false instead of throwing a cast error
create or replace function public.ceda_can_view_attachment(obj_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when split_part(obj_name, '/', 2) !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      then false
    else public.ceda_can_view_submission(split_part(obj_name, '/', 2)::uuid)
  end;
$$;

-- 3) Storage bucket (private; access via signed URLs)
insert into storage.buckets (id, name, public)
values ('ceda-attachments', 'ceda-attachments', false)
on conflict (id) do nothing;

-- Path convention: {owner_id}/{submission_id}/{filename}
drop policy if exists "ceda att read" on storage.objects;
create policy "ceda att read" on storage.objects
  for select to authenticated, anon
  using (bucket_id = 'ceda-attachments' and public.ceda_can_view_attachment(name));

drop policy if exists "ceda att write" on storage.objects;
create policy "ceda att write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'ceda-attachments'
    and (storage.foldername(name))[1]::uuid = auth.uid()
  );

drop policy if exists "ceda att update" on storage.objects;
create policy "ceda att update" on storage.objects
  for update to authenticated
  using (bucket_id = 'ceda-attachments' and (storage.foldername(name))[1]::uuid = auth.uid())
  with check (bucket_id = 'ceda-attachments' and (storage.foldername(name))[1]::uuid = auth.uid());

drop policy if exists "ceda att delete" on storage.objects;
create policy "ceda att delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'ceda-attachments' and (storage.foldername(name))[1]::uuid = auth.uid());

-- 4) Notifications (realtime to the bell)
create table if not exists public.ceda_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists ceda_notif_user on public.ceda_notifications (user_id, created_at desc);

alter table public.ceda_notifications enable row level security;
drop policy if exists ceda_notif_select on public.ceda_notifications;
create policy ceda_notif_select on public.ceda_notifications
  for select using (user_id = auth.uid() or public.ceda_is_admin());
drop policy if exists ceda_notif_update on public.ceda_notifications;
create policy ceda_notif_update on public.ceda_notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Trigger: notify submission owner on gate events
create or replace function public.ceda_notify_gate()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid; title_txt text;
begin
  select s.owner_id, s.title into owner, title_txt from ceda_submissions s where s.id = new.submission_id;
  if owner is not null then
    insert into ceda_notifications (user_id, type, title, body, link)
    values (owner, 'gate',
            'Pipeline update: ' || title_txt,
            'Gate "' || new.gate || '" - ' || new.decision || '. ' || left(new.feedback, 140),
            '/participant');
  end if;
  return new;
end $$;
drop trigger if exists ceda_notify_gate_trg on public.ceda_gate_events;
create trigger ceda_notify_gate_trg after insert on public.ceda_gate_events
  for each row execute function public.ceda_notify_gate();

-- Trigger: notify owner on judge evaluation
create or replace function public.ceda_notify_eval()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid; title_txt text;
begin
  select s.owner_id, s.title into owner, title_txt from ceda_submissions s where s.id = new.submission_id;
  if owner is not null then
    insert into ceda_notifications (user_id, type, title, body, link)
    values (owner, 'evaluation',
            'New evaluation: ' || title_txt,
            'A judge scored your submission ' || new.total || '/100 with written feedback.',
            '/participant');
  end if;
  return new;
end $$;
drop trigger if exists ceda_notify_eval_trg on public.ceda_evaluations;
create trigger ceda_notify_eval_trg after insert or update on public.ceda_evaluations
  for each row execute function public.ceda_notify_eval();

-- Trigger: notify judge of new assignment
create or replace function public.ceda_notify_assign()
returns trigger language plpgsql security definer set search_path = public as $$
declare title_txt text;
begin
  select s.title into title_txt from ceda_submissions s where s.id = new.submission_id;
  insert into ceda_notifications (user_id, type, title, body, link)
  values (new.judge_id, 'assignment',
          'Evaluation assigned: ' || title_txt,
          'CEDA assigned you a submission for rubric evaluation.',
          '/judge');
  return new;
end $$;
drop trigger if exists ceda_notify_assign_trg on public.ceda_judge_assignments;
create trigger ceda_notify_assign_trg after insert or update on public.ceda_judge_assignments
  for each row execute function public.ceda_notify_assign();

-- 5) Realtime for the bell + live pipeline (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'ceda_notifications'
  ) then
    alter publication supabase_realtime add table public.ceda_notifications;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'ceda_submissions'
  ) then
    alter publication supabase_realtime add table public.ceda_submissions;
  end if;
end $$;

-- 6) Rubric weights (admin-configurable)
create table if not exists public.ceda_rubric (
  key text primary key,
  label text not null,
  weight numeric not null default 0.20 check (weight >= 0 and weight <= 1),
  sort int not null default 0
);
insert into public.ceda_rubric (key, label, weight, sort) values
  ('innovation', 'Innovation & Originality', 0.20, 1),
  ('feasibility', 'Feasibility & Scalability', 0.20, 2),
  ('impact', 'SDG Impact', 0.20, 3),
  ('viability', 'Commercial Viability', 0.20, 4),
  ('team', 'Team Capability', 0.20, 5)
on conflict (key) do nothing;

alter table public.ceda_rubric enable row level security;
drop policy if exists ceda_rubric_select on public.ceda_rubric;
create policy ceda_rubric_select on public.ceda_rubric
  for select using (true);
drop policy if exists ceda_rubric_update on public.ceda_rubric;
create policy ceda_rubric_update on public.ceda_rubric
  for update using (public.ceda_is_admin()) with check (public.ceda_is_admin());

-- 7) Submission versions (revision history)
create table if not exists public.ceda_submission_versions (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.ceda_submissions(id) on delete cascade,
  version int not null,
  data jsonb not null,
  note text,
  created_at timestamptz not null default now(),
  unique (submission_id, version)
);

alter table public.ceda_submission_versions enable row level security;
drop policy if exists ceda_versions_select on public.ceda_submission_versions;
create policy ceda_versions_select on public.ceda_submission_versions
  for select using (
    exists (select 1 from public.ceda_submissions s where s.id = submission_id and s.owner_id = auth.uid())
    or public.ceda_is_admin()
    or (public.ceda_is_judge() and exists (
      select 1 from public.ceda_judge_assignments a
      where a.submission_id = ceda_submission_versions.submission_id and a.judge_id = auth.uid()
    ))
  );
drop policy if exists ceda_versions_insert on public.ceda_submission_versions;
create policy ceda_versions_insert on public.ceda_submission_versions
  for insert with check (
    exists (select 1 from public.ceda_submissions s where s.id = submission_id and s.owner_id = auth.uid())
  );

-- 8) Public gallery: awarded submissions visible to everyone
drop policy if exists ceda_subs_select on public.ceda_submissions;
create policy ceda_subs_select on public.ceda_submissions
  for select using (
    stage = 'awarded'
    or owner_id = auth.uid()
    or public.ceda_is_admin()
    or (public.ceda_is_judge() and exists (
      select 1 from public.ceda_judge_assignments a
      where a.submission_id = ceda_submissions.id and a.judge_id = auth.uid()
    ))
  );
