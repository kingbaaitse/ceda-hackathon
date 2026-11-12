-- CEDA Innovation Hub - Phase 3E: automatic service status
--
-- The status strip is computed from operational data, never hand-typed:
--   green  = the portal served activity that day, nothing failed
--   amber  = a subsystem failed that day (e.g. email delivery failures)
--   red    = a recorded incident
--
-- The function is SECURITY DEFINER so public pages can read the aggregate
-- without exposing the underlying rows.

create table if not exists public.ceda_service_incidents (
  id uuid primary key default gen_random_uuid(),
  occurred_on date not null default current_date,
  title text not null,
  minutes integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.ceda_service_incidents enable row level security;
drop policy if exists ceda_incidents_read on public.ceda_service_incidents;
create policy ceda_incidents_read on public.ceda_service_incidents
  for select to authenticated, anon
  using (true);
drop policy if exists ceda_incidents_write on public.ceda_service_incidents;
create policy ceda_incidents_write on public.ceda_service_incidents
  for insert to authenticated
  with check (public.ceda_is_admin());

create index if not exists ceda_incidents_day on public.ceda_service_incidents (occurred_on);

create or replace function public.ceda_service_status(days integer default 30)
returns table (
  day date,
  status text,
  note text,
  events integer
)
language sql stable security definer set search_path = public as $$
  with span as (
    select generate_series(
      (current_date - (greatest(days, 1) - 1)),
      current_date,
      interval '1 day'
    )::date as d
  ),
  fails as (
    select (created_at at time zone 'utc')::date as d, count(*)::int as n
    from public.ceda_email_log
    where status = 'failed'
      and (created_at at time zone 'utc')::date >= (current_date - (greatest(days, 1) - 1))
    group by 1
  ),
  acts as (
    select (created_at at time zone 'utc')::date as d, count(*)::int as n
    from public.ceda_notifications
    where (created_at at time zone 'utc')::date >= (current_date - (greatest(days, 1) - 1))
    group by 1
  ),
  incs as (
    select occurred_on as d, count(*)::int as n, sum(minutes)::int as mins,
           string_agg(title, '; ' order by created_at) as titles
    from public.ceda_service_incidents
    where occurred_on >= (current_date - (greatest(days, 1) - 1))
    group by 1
  )
  select
    s.d as day,
    case
      when coalesce(i.n, 0) > 0 then 'down'
      when coalesce(f.n, 0) > 0 then 'degraded'
      when coalesce(a.n, 0) > 0 or s.d = current_date then 'up'
      else 'up'
    end as status,
    case
      when coalesce(i.n, 0) > 0 then coalesce(i.titles, 'Recorded incident')
      when coalesce(f.n, 0) > 0 then f.n || ' email deliver' || case when f.n = 1 then 'y' else 'ies' end || ' failed'
      else null
    end as note,
    coalesce(f.n, 0) + coalesce(a.n, 0) as events
  from span s
  left join fails f on f.d = s.d
  left join acts a on a.d = s.d
  left join incs i on i.d = s.d
  order by s.d desc;
$$;

grant execute on function public.ceda_service_status(integer) to anon, authenticated;
