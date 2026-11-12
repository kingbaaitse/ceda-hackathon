-- CEDA Innovation Hub - Phase 3D: fix the dynamic provider call
--
-- The sender used `execute format('perform %I.http_post(...)')`, but
-- PERFORM is a PL/pgSQL statement and cannot be executed as dynamic SQL.
-- A plain SELECT is the correct form.
-- Safe to re-run.

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
  v_body jsonb;
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
  );

  select n.nspname into http_schema
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where p.proname = 'http_post' limit 1;

  if http_schema is null then
    insert into public.ceda_email_log (notification_id, user_id, email, status, detail)
    values (new.id, new.user_id, v_email, 'skipped', 'pg_net not installed - run: create extension pg_net with schema extensions;');
    return new;
  end if;

  -- SELECT, not PERFORM: dynamic SQL cannot run PL/pgSQL statements
  execute format('select %I.http_post(url := $1, headers := $2, body := $3)', http_schema)
    using
      'https://api.resend.com/emails',
      jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
      v_body;

  insert into public.ceda_email_log (notification_id, user_id, email, status, detail)
  values (new.id, new.user_id, v_email, 'queued', 'handed to the provider');

  return new;
exception when others then
  insert into public.ceda_email_log (notification_id, user_id, email, status, detail)
  values (new.id, new.user_id, null, 'failed', left(sqlerrm, 200));
  return new;
end $$;
