-- CEDA Innovation Hub - Phase 4
-- Active sessions: list the devices signed in to an account, revoke one,
-- or revoke all others. Backed by auth.sessions, so a revoked session
-- is genuinely rejected on its next request.
-- Safe to re-run.

-- ============================================================
-- 1) List the signed-in devices
-- ============================================================
-- The session id of the caller, read from the JWT claims PostgREST sets.
create or replace function public.ceda_current_session_id()
returns uuid language sql stable as $$
  select nullif(
    current_setting('request.jwt.claims', true)::jsonb ->> 'session_id',
    ''
  )::uuid;
$$;

create or replace function public.ceda_list_sessions()
returns table (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  user_agent text,
  ip text,
  current boolean
)
language sql stable security definer set search_path = public as $$
  select
    s.id,
    s.created_at,
    s.updated_at,
    s.user_agent,
    host(s.ip),
    (s.id = public.ceda_current_session_id()) as current
  from auth.sessions s
  where s.user_id = auth.uid()
  order by (s.id = public.ceda_current_session_id()) desc, s.updated_at desc;
$$;

revoke all on function public.ceda_list_sessions() from public;
grant execute on function public.ceda_list_sessions() to authenticated;

-- ============================================================
-- 2) Revoke one other session
-- ============================================================
create or replace function public.ceda_revoke_session(session_id uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare current_id uuid;
begin
  current_id := public.ceda_current_session_id();

  -- never revoke the session making the request
  if session_id is null or session_id = current_id then
    return false;
  end if;

  delete from auth.sessions
  where id = session_id and user_id = auth.uid();

  return found;
end $$;

revoke all on function public.ceda_revoke_session(uuid) from public;
grant execute on function public.ceda_revoke_session(uuid) to authenticated;

-- ============================================================
-- 3) Revoke every other session
-- ============================================================
create or replace function public.ceda_revoke_other_sessions()
returns integer
language plpgsql security definer set search_path = public as $$
declare
  current_id uuid;
  removed integer;
begin
  current_id := public.ceda_current_session_id();

  delete from auth.sessions
  where user_id = auth.uid()
    and id is distinct from current_id;

  get diagnostics removed = row_count;
  return removed;
end $$;

revoke all on function public.ceda_revoke_other_sessions() from public;
grant execute on function public.ceda_revoke_other_sessions() to authenticated;

-- ============================================================
-- 4) Audit the security action
-- ============================================================
create or replace function public.ceda_audit_session()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.ceda_audit_log (actor_id, actor_role, action, entity_type, entity_id, detail)
  values (auth.uid(), public.ceda_actor_role(), 'session.revoked', 'session', new.id,
          jsonb_build_object('ip', new.ip, 'user_agent', left(coalesce(new.user_agent, ''), 160)));
  return new;
end $$;

drop trigger if exists ceda_audit_session_trg on auth.sessions;
create trigger ceda_audit_session_trg after delete on auth.sessions
  for each row execute function public.ceda_audit_session();
