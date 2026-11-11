-- CEDA Innovation Hub - Phase 3
-- Audit trail, Q&A threads, email alert pipeline, analytics support.
-- Safe to re-run.

-- ============================================================
-- 1) Email alert preferences + delivery log
-- ============================================================
alter table public.ceda_profiles
  add column if not exists email_opt_in boolean not null default true;

create table if not exists public.ceda_email_log (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid,
  user_id uuid,
  email text,
  status text not null default 'queued',
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists ceda_email_log_created on public.ceda_email_log (created_at desc);

alter table public.ceda_email_log enable row level security;
drop policy if exists ceda_email_log_select on public.ceda_email_log;
create policy ceda_email_log_select on public.ceda_email_log
  for select using (user_id = auth.uid() or public.ceda_is_admin());

-- ============================================================
-- 2) Audit trail (who did what, when)
-- ============================================================
create table if not exists public.ceda_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_role text,
  action text not null,
  entity_type text,
  entity_id uuid,
  submission_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);
create index if not exists ceda_audit_created on public.ceda_audit_log (created_at desc);
create index if not exists ceda_audit_submission on public.ceda_audit_log (submission_id, created_at desc);

alter table public.ceda_audit_log enable row level security;
drop policy if exists ceda_audit_select on public.ceda_audit_log;
create policy ceda_audit_select on public.ceda_audit_log
  for select using (
    public.ceda_is_admin()
    or (submission_id is not null and exists (
      select 1 from public.ceda_submissions s
      where s.id = ceda_audit_log.submission_id and s.owner_id = auth.uid()
    ))
  );

-- Helper: role of the acting user
create or replace function public.ceda_actor_role()
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select p.role from public.ceda_profiles p where p.id = auth.uid()), 'anonymous');
$$;

-- Gate events
create or replace function public.ceda_audit_gate()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.ceda_audit_log (actor_id, actor_role, action, entity_type, entity_id, submission_id, detail)
  values (auth.uid(), public.ceda_actor_role(), 'gate.' || new.decision, 'gate_event', new.id, new.submission_id,
          jsonb_build_object('gate', new.gate, 'decision', new.decision, 'feedback', left(new.feedback, 200)));
  return new;
end $$;
drop trigger if exists ceda_audit_gate_trg on public.ceda_gate_events;
create trigger ceda_audit_gate_trg after insert on public.ceda_gate_events
  for each row execute function public.ceda_audit_gate();

-- Evaluations (new + re-evaluation)
create or replace function public.ceda_audit_eval()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.ceda_audit_log (actor_id, actor_role, action, entity_type, entity_id, submission_id, detail)
  values (auth.uid(), public.ceda_actor_role(), 'evaluation.saved', 'evaluation', new.id, new.submission_id,
          jsonb_build_object('total', new.total));
  return new;
end $$;
drop trigger if exists ceda_audit_eval_trg on public.ceda_evaluations;
create trigger ceda_audit_eval_trg after insert or update on public.ceda_evaluations
  for each row execute function public.ceda_audit_eval();

-- Judge assignments
create or replace function public.ceda_audit_assign()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.ceda_audit_log (actor_id, actor_role, action, entity_type, entity_id, submission_id, detail)
  values (auth.uid(), public.ceda_actor_role(), 'judge.assigned', 'judge_assignment', new.id, new.submission_id,
          jsonb_build_object('judge_id', new.judge_id));
  return new;
end $$;
drop trigger if exists ceda_audit_assign_trg on public.ceda_judge_assignments;
create trigger ceda_audit_assign_trg after insert or update on public.ceda_judge_assignments
  for each row execute function public.ceda_audit_assign();

-- Submission stage changes
create or replace function public.ceda_audit_submission()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.stage is distinct from old.stage then
    insert into public.ceda_audit_log (actor_id, actor_role, action, entity_type, entity_id, submission_id, detail)
    values (auth.uid(), public.ceda_actor_role(), 'stage.' || new.stage, 'submission', new.id, new.id,
            jsonb_build_object('from', old.stage, 'to', new.stage));
  end if;
  return new;
end $$;
drop trigger if exists ceda_audit_submission_trg on public.ceda_submissions;
create trigger ceda_audit_submission_trg after update on public.ceda_submissions
  for each row execute function public.ceda_audit_submission();

-- ============================================================
-- 3) Q&A threads between participants, admins and judges
-- ============================================================
create table if not exists public.ceda_messages (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.ceda_submissions(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_role text not null,
  body text not null,
  visibility text not null default 'participant'
    check (visibility in ('participant','judge','admin')),
  created_at timestamptz not null default now()
);
create index if not exists ceda_messages_sub on public.ceda_messages (submission_id, created_at);

alter table public.ceda_messages enable row level security;
drop policy if exists ceda_messages_select on public.ceda_messages;
create policy ceda_messages_select on public.ceda_messages
  for select using (
    public.ceda_is_admin()
    or (
      visibility = 'participant'
      and exists (
        select 1 from public.ceda_submissions s
        where s.id = ceda_messages.submission_id and s.owner_id = auth.uid()
      )
    )
    or (
      public.ceda_is_judge() and visibility in ('participant','judge')
      and exists (
        select 1 from public.ceda_judge_assignments a
        where a.submission_id = ceda_messages.submission_id and a.judge_id = auth.uid()
      )
    )
  );
drop policy if exists ceda_messages_insert on public.ceda_messages;
create policy ceda_messages_insert on public.ceda_messages
  for insert with check (
    auth.uid() = author_id
    and (
      public.ceda_is_admin()
      or exists (
        select 1 from public.ceda_submissions s
        where s.id = ceda_messages.submission_id and s.owner_id = auth.uid()
      )
    )
  );

-- Message notifications
create or replace function public.ceda_notify_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid; title_txt text; target uuid;
begin
  select s.owner_id, s.title into owner, title_txt from ceda_submissions s where s.id = new.submission_id;
  -- notify the owner when an admin/judge speaks
  if owner is not null and new.author_id <> owner then
    insert into ceda_notifications (user_id, type, title, body, link)
    values (owner, 'message', 'New message on: ' || title_txt, left(new.body, 140), '/participant');
  end if;
  -- notify admins when the participant speaks
  if new.author_id = owner then
    insert into ceda_notifications (user_id, type, title, body, link)
    select p.id, 'message', 'Participant message: ' || title_txt, left(new.body, 140), '/admin'
    from public.ceda_profiles p where p.role = 'admin';
  end if;
  return new;
end $$;
drop trigger if exists ceda_notify_message_trg on public.ceda_messages;
create trigger ceda_notify_message_trg after insert on public.ceda_messages
  for each row execute function public.ceda_notify_message();

-- ============================================================
-- 4) Judge calibration (aggregate only - no peer identities or
--    feedback text is exposed to judges)
-- ============================================================
create or replace function public.ceda_panel_stats(sub uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'judges', count(*),
    'avg_total', round(avg(e.total)::numeric, 1),
    'min_total', min(e.total),
    'max_total', max(e.total),
    'spread', round((max(e.total) - min(e.total))::numeric, 1)
  )
  from public.ceda_evaluations e
  where e.submission_id = sub
    and (
      public.ceda_is_admin()
      or exists (
        select 1 from public.ceda_judge_assignments a
        where a.submission_id = sub and a.judge_id = auth.uid()
      )
    );
$$;

create or replace function public.ceda_criterion_avgs(sub uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(t.key, round(t.avg, 1)), '{}'::jsonb)
  from (
    select j.key, avg(j.value::numeric) as avg
    from public.ceda_evaluations e,
         jsonb_each_text(e.scores) j
    where e.submission_id = sub
      and (
        public.ceda_is_admin()
        or exists (
          select 1 from public.ceda_judge_assignments a
          where a.submission_id = sub and a.judge_id = auth.uid()
        )
      )
    group by j.key
  ) t;
$$;

-- ============================================================
-- 5) Email alert pipeline (pg_net -> edge function)
--    Wrapped so the rest of this script still applies if pg_net
--    is unavailable on the project.
-- ============================================================
do $do$
declare
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncHNtZ3ZtaGJleW56ZnVqaXFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQzOTAzNDQsImV4cCI6MjEwOTk2NjM0NH0.q4Y7yJ-2Qsr784jr-G-Naw-mNomUVg2dmYFOt578S6I';
  http_schema text;
begin
  create extension if not exists pg_net with schema extensions;

  -- find whichever schema actually holds http_post
  select n.nspname into http_schema
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where p.proname = 'http_post' limit 1;

  if http_schema is null then
    raise notice 'pg_net installed but http_post not found - email pipeline not wired';
    return;
  end if;

  execute format($fn$
    create or replace function public.ceda_queue_email()
    returns trigger language plpgsql security definer set search_path = public as $inner$
    declare
      anon_key text := %L;
    begin
      execute format('perform %I.http_post(url := $1, headers := $2, body := $3)', %L)
        using
          'https://ggpsmgvmhbeynzfujiql.supabase.co/functions/v1/send-notification-email',
          jsonb_build_object(
            'Content-Type', 'application/json',
            'apikey', anon_key,
            'Authorization', 'Bearer ' || anon_key
          ),
          jsonb_build_object('notification_id', new.id);
      return new;
    end $inner$;
  $fn$, anon_key, http_schema);

  drop trigger if exists ceda_queue_email_trg on public.ceda_notifications;
  create trigger ceda_queue_email_trg after insert on public.ceda_notifications
    for each row execute function public.ceda_queue_email();

  raise notice 'Email pipeline wired via %.http_post', http_schema;
exception
  when others then
    raise notice 'pg_net unavailable - email pipeline not wired: %', sqlerrm;
end $do$;
