-- CEDA Innovation Hub - Phase 3C: provider key wiring (EXAMPLE)
-- Copy to supabase-ceda-phase3c-email-key.local.sql and paste your Resend key
-- in place of the placeholder, then run it in the Supabase SQL editor.
-- The Vault extension is not present on every project, so the key is stored
-- in a private schema (not exposed through PostgREST) and the Vault is used
-- when available. Both are read only by the SECURITY DEFINER sender.
-- Safe to re-run.

-- ============================================================
-- 1) Private credential store (never exposed through the API)
-- ============================================================
create schema if not exists ceda_private;

create table if not exists ceda_private.credentials (
  key text primary key,
  value text not null,
  created_at timestamptz not null default now()
);

revoke all on schema ceda_private from public, anon, authenticated;
revoke all on table ceda_private.credentials from public, anon, authenticated;

insert into ceda_private.credentials (key, value) values ('resend_api_key', ''<YOUR_RESEND_API_KEY>'')
on conflict (key) do update set value = excluded.value;

-- ============================================================
-- 2) Best-effort: also mirror the key into Supabase Vault
-- ============================================================
do $do$
begin
  create extension if not exists supabase_vault with schema vault;
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where p.proname = 'create_secret' and n.nspname = 'vault') then
    if not exists (select 1 from vault.secrets where name = 'resend_api_key') then
      perform vault.create_secret(''<YOUR_RESEND_API_KEY>'', 'resend_api_key');
    end if;
    raise notice 'Vault secret ready';
  else
    raise notice 'Vault unavailable - using the private credential store';
  end if;
exception when others then
  raise notice 'Vault unavailable (%): using the private credential store', sqlerrm;
end $do$;

-- ============================================================
-- 3) One place that resolves the provider key
-- ============================================================
create or replace function public.ceda_resend_key()
returns text
language plpgsql stable security definer set search_path = public as $$
declare k text;
begin
  -- preferred: Vault
  begin
    select decrypted_secret into k
    from vault.decrypted_secrets
    where name = 'resend_api_key';
    if k is not null then
      return k;
    end if;
  exception when others then
    k := null;
  end;

  -- fallback: the private schema
  begin
    select value into k from ceda_private.credentials where key = 'resend_api_key';
  exception when others then
    k := null;
  end;

  return k;
end $$;

revoke all on function public.ceda_resend_key() from public, anon;
grant execute on function public.ceda_resend_key() to service_role;

-- ============================================================
-- 4) The sender, now resolving the key through the helper
-- ============================================================
create or replace function public.ceda_queue_email()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  http_schema text;
  v_key text;
  v_email text;
  v_optin boolean;
  v_site text;
  v_from text;
  v_rendered jsonb;
  v_body text;
begin
  select p.email_opt_in, u.email into v_optin, v_email
  from public.ceda_profiles p
  join auth.users u on u.id = p.id
  where p.id = new.user_id;

  if v_email is null then
    insert into public.ceda_email_log (notification_id, user_id, email, status, detail)
    values (new.id, new.user_id, null, 'skipped', 'no email on account');
    return new;
  end if;
  if v_optin is false then
    insert into public.ceda_email_log (notification_id, user_id, email, status, detail)
    values (new.id, new.user_id, v_email, 'skipped', 'recipient opted out');
    return new;
  end if;

  select site_url, from_address into v_site, v_from from public.ceda_email_settings where id = true;
  if coalesce((select enabled from public.ceda_email_settings where id = true), true) = false then
    insert into public.ceda_email_log (notification_id, user_id, email, status, detail)
    values (new.id, new.user_id, v_email, 'skipped', 'email delivery disabled by admin');
    return new;
  end if;

  v_key := public.ceda_resend_key();
  if v_key is null then
    insert into public.ceda_email_log (notification_id, user_id, email, status, detail)
    values (new.id, new.user_id, v_email, 'skipped', 'no provider key configured');
    return new;
  end if;

  v_rendered := public.ceda_render_email(new.type, new.title, coalesce(new.body, ''), coalesce(new.link, ''), v_site);
  if v_rendered is null then
    insert into public.ceda_email_log (notification_id, user_id, email, status, detail)
    values (new.id, new.user_id, v_email, 'skipped', 'no template for type ' || new.type);
    return new;
  end if;

  v_body := jsonb_build_object(
    'from', v_from,
    'to', jsonb_build_array(v_email),
    'subject', v_rendered ->> 'subject',
    'html', v_rendered ->> 'html'
  )::text;

  select n.nspname into http_schema
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where p.proname = 'http_post' limit 1;

  if http_schema is null then
    insert into public.ceda_email_log (notification_id, user_id, email, status, detail)
    values (new.id, new.user_id, v_email, 'skipped', 'pg_net not installed - run: create extension pg_net with schema extensions;');
    return new;
  end if;

  execute format('perform %I.http_post(url := $1, headers := $2, body := $3)', http_schema)
    using
      'https://api.resend.com/emails',
      jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
      v_body::jsonb;

  insert into public.ceda_email_log (notification_id, user_id, email, status, detail)
  values (new.id, new.user_id, v_email, 'queued', 'handed to the provider');

  return new;
exception when others then
  insert into public.ceda_email_log (notification_id, user_id, email, status, detail)
  values (new.id, new.user_id, null, 'failed', left(sqlerrm, 200));
  return new;
end $$;

-- ============================================================
-- 5) Confirm pg_net is present (needed for the outbound call)
-- ============================================================
do $do$
begin
  create extension if not exists pg_net with schema extensions;
  raise notice 'pg_net ready';
exception when others then
  raise notice 'pg_net unavailable (%): emails will be logged as skipped', sqlerrm;
end $do$;
