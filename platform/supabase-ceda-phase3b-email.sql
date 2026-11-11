-- CEDA Innovation Hub - Phase 3B: email delivery
-- Template lives in the database (single source of truth for both the
-- in-database sender and the optional Edge Function sender).
-- Safe to re-run.

-- ============================================================
-- 1) Store the Resend key in Vault (never in application code)
--    The key itself is not in this file: run
--    supabase-ceda-phase3c-email-key.local.sql (git-ignored)
--    to store it in Vault or in the private credential store.
-- ============================================================
do $$
begin
  if vault.is_secret('resend_api_key') then
    raise notice 'Vault secret resend_api_key already present - left untouched';
  else
    raise notice 'No resend_api_key in Vault yet - run supabase-ceda-phase3c-email-key.local.sql';
  end if;
exception when others then
  raise notice 'Vault unavailable (%): key must be added another way', sqlerrm;
end $$;

-- ============================================================
-- 2) Email settings + templates
-- ============================================================
create table if not exists public.ceda_email_settings (
  id boolean primary key default true check (id),
  enabled boolean not null default true,
  from_address text not null default 'CEDA Innovation Hub <notifications@oratoryleague.xyz>',
  site_url text not null default 'https://ceda.oratoryleague.xyz',
  reply_to text,
  constraint ceda_email_settings_singleton check (id)
);
insert into public.ceda_email_settings (id) values (true) on conflict (id) do nothing;

-- Point the sender at the verified domain
update public.ceda_email_settings
set from_address = 'CEDA Innovation Hub <notifications@oratoryleague.xyz>',
    site_url = 'https://ceda.oratoryleague.xyz'
where id = true;

alter table public.ceda_email_settings enable row level security;
drop policy if exists ceda_email_settings_select on public.ceda_email_settings;
create policy ceda_email_settings_select on public.ceda_email_settings
  for select using (public.ceda_is_admin());
drop policy if exists ceda_email_settings_update on public.ceda_email_settings;
create policy ceda_email_settings_update on public.ceda_email_settings
  for update using (public.ceda_is_admin()) with check (public.ceda_is_admin());

-- One row per notification type. Placeholders: {{title}} {{body}} {{cta_label}}
-- {{cta_url}} {{meta}} {{logo}} {{preheader}}
create table if not exists public.ceda_email_templates (
  key text primary key,
  eyebrow text not null,
  subject text not null,
  html text not null,
  updated_at timestamptz not null default now()
);

alter table public.ceda_email_templates enable row level security;
drop policy if exists ceda_email_templates_select on public.ceda_email_templates;
create policy ceda_email_templates_select on public.ceda_email_templates
  for select using (true);
drop policy if exists ceda_email_templates_update on public.ceda_email_templates;
create policy ceda_email_templates_update on public.ceda_email_templates
  for update using (public.ceda_is_admin()) with check (public.ceda_is_admin());

-- The template. Table based, inline styles, no external CSS - renders in
-- Outlook, Gmail and Apple Mail. Colours follow the CEDA brand:
-- accent #F26522, royal #A02013, gold #FAA61A, cream #FBFAF8.
insert into public.ceda_email_templates (key, eyebrow, subject, html) values
('gate', 'Pipeline update', '{{title}}', $tpl$
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#FBFAF8;font-family:'Elm Sans','Elms Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <tr><td style="padding:0 0 28px 0;text-align:center;">
      <img src="{{logo}}" alt="CEDA Innovation Hub" width="52" height="52" style="display:inline-block;border-radius:14px;" />
      <div style="margin-top:10px;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#F26522;">CEDA Innovation Hub</div>
    </td></tr>

    <tr><td style="background:#ffffff;border:1px solid #EEE9E2;border-radius:20px;overflow:hidden;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="height:4px;line-height:4px;font-size:0;background:#F26522;">&nbsp;</td></tr>
        <tr><td style="padding:32px 32px 8px 32px;">
          <span style="display:inline-block;background:#FEF1E7;color:#C24E13;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;padding:6px 12px;border-radius:999px;">{{eyebrow}}</span>
          <h1 style="margin:18px 0 0 0;font-size:26px;font-weight:700;color:#241F1B;letter-spacing:-0.02em;line-height:1.25;">{{title}}</h1>
        </td></tr>
        <tr><td style="padding:12px 32px 0 32px;">
          <p style="margin:0;font-size:16px;color:#5C554E;line-height:1.7;">{{body}}</p>
        </td></tr>
        {{meta_block}}
        <tr><td style="padding:28px 32px 8px 32px;">
          <a href="{{cta_url}}" style="display:inline-block;background:#F26522;color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:999px;text-decoration:none;">{{cta_label}}</a>
        </td></tr>
        <tr><td style="padding:16px 32px 30px 32px;">
          <p style="margin:0;font-size:13px;color:#9A918A;line-height:1.6;">You are receiving this because you are registered on the CEDA Innovation Hub. You can turn off email alerts at any time from Settings in the portal.</p>
        </td></tr>
      </table>
    </td></tr>

    <tr><td style="padding:28px 0 0 0;border-top:1px solid #EEE9E2;text-align:center;">
      <p style="margin:0;font-size:14px;font-weight:700;color:#241F1B;">Citizen Entrepreneurial Development Agency</p>
      <p style="margin:4px 0 0 0;font-size:13px;color:#9A918A;">From idea to award, on one platform.</p>
      <p style="margin:12px 0 0 0;font-size:12px;color:#B5ACA4;">
        <a href="{{site_url}}" style="color:#8A817A;text-decoration:none;font-weight:600;">{{site_url}}</a>
      </p>
    </td></tr>
  </table>
</body>
</html>
$tpl$),
('evaluation', 'Evaluation received', '{{title}}', $tpl$
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#FBFAF8;font-family:'Elm Sans','Elms Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <tr><td style="padding:0 0 28px 0;text-align:center;">
      <img src="{{logo}}" alt="CEDA Innovation Hub" width="52" height="52" style="display:inline-block;border-radius:14px;" />
      <div style="margin-top:10px;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#F26522;">CEDA Innovation Hub</div>
    </td></tr>
    <tr><td style="background:#ffffff;border:1px solid #EEE9E2;border-radius:20px;overflow:hidden;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="height:4px;line-height:4px;font-size:0;background:#FAA61A;">&nbsp;</td></tr>
        <tr><td style="padding:32px 32px 8px 32px;">
          <span style="display:inline-block;background:#FEF6E4;color:#9A6A08;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;padding:6px 12px;border-radius:999px;">{{eyebrow}}</span>
          <h1 style="margin:18px 0 0 0;font-size:26px;font-weight:700;color:#241F1B;letter-spacing:-0.02em;line-height:1.25;">{{title}}</h1>
        </td></tr>
        <tr><td style="padding:12px 32px 0 32px;">
          <p style="margin:0;font-size:16px;color:#5C554E;line-height:1.7;">{{body}}</p>
        </td></tr>
        {{meta_block}}
        <tr><td style="padding:28px 32px 8px 32px;">
          <a href="{{cta_url}}" style="display:inline-block;background:#F26522;color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:999px;text-decoration:none;">{{cta_label}}</a>
        </td></tr>
        <tr><td style="padding:16px 32px 30px 32px;">
          <p style="margin:0;font-size:13px;color:#9A918A;line-height:1.6;">Judge feedback is shared with you anonymously, so you can act on the substance without identity concerns.</p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:28px 0 0 0;border-top:1px solid #EEE9E2;text-align:center;">
      <p style="margin:0;font-size:14px;font-weight:700;color:#241F1B;">Citizen Entrepreneurial Development Agency</p>
      <p style="margin:4px 0 0 0;font-size:13px;color:#9A918A;">From idea to award, on one platform.</p>
      <p style="margin:12px 0 0 0;font-size:12px;color:#B5ACA4;">
        <a href="{{site_url}}" style="color:#8A817A;text-decoration:none;font-weight:600;">{{site_url}}</a>
      </p>
    </td></tr>
  </table>
</body>
</html>
$tpl$),
('assignment', 'Evaluation assigned', '{{title}}', $tpl$
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#FBFAF8;font-family:'Elm Sans','Elms Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <tr><td style="padding:0 0 28px 0;text-align:center;">
      <img src="{{logo}}" alt="CEDA Innovation Hub" width="52" height="52" style="display:inline-block;border-radius:14px;" />
      <div style="margin-top:10px;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#F26522;">CEDA Innovation Hub</div>
    </td></tr>
    <tr><td style="background:#ffffff;border:1px solid #EEE9E2;border-radius:20px;overflow:hidden;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="height:4px;line-height:4px;font-size:0;background:#A02013;">&nbsp;</td></tr>
        <tr><td style="padding:32px 32px 8px 32px;">
          <span style="display:inline-block;background:#FBEDEA;color:#A02013;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;padding:6px 12px;border-radius:999px;">{{eyebrow}}</span>
          <h1 style="margin:18px 0 0 0;font-size:26px;font-weight:700;color:#241F1B;letter-spacing:-0.02em;line-height:1.25;">{{title}}</h1>
        </td></tr>
        <tr><td style="padding:12px 32px 0 32px;">
          <p style="margin:0;font-size:16px;color:#5C554E;line-height:1.7;">{{body}}</p>
        </td></tr>
        {{meta_block}}
        <tr><td style="padding:28px 32px 8px 32px;">
          <a href="{{cta_url}}" style="display:inline-block;background:#F26522;color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:999px;text-decoration:none;">{{cta_label}}</a>
        </td></tr>
        <tr><td style="padding:16px 32px 30px 32px;">
          <p style="margin:0;font-size:13px;color:#9A918A;line-height:1.6;">Only the submissions assigned to you are visible to your account, and your identity is never shared with participants.</p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:28px 0 0 0;border-top:1px solid #EEE9E2;text-align:center;">
      <p style="margin:0;font-size:14px;font-weight:700;color:#241F1B;">Citizen Entrepreneurial Development Agency</p>
      <p style="margin:4px 0 0 0;font-size:13px;color:#9A918A;">From idea to award, on one platform.</p>
      <p style="margin:12px 0 0 0;font-size:12px;color:#B5ACA4;">
        <a href="{{site_url}}" style="color:#8A817A;text-decoration:none;font-weight:600;">{{site_url}}</a>
      </p>
    </td></tr>
  </table>
</body>
</html>
$tpl$),
('message', 'New message', '{{title}}', $tpl$
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#FBFAF8;font-family:'Elm Sans','Elms Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <tr><td style="padding:0 0 28px 0;text-align:center;">
      <img src="{{logo}}" alt="CEDA Innovation Hub" width="52" height="52" style="display:inline-block;border-radius:14px;" />
      <div style="margin-top:10px;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#F26522;">CEDA Innovation Hub</div>
    </td></tr>
    <tr><td style="background:#ffffff;border:1px solid #EEE9E2;border-radius:20px;overflow:hidden;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="height:4px;line-height:4px;font-size:0;background:#F26522;">&nbsp;</td></tr>
        <tr><td style="padding:32px 32px 8px 32px;">
          <span style="display:inline-block;background:#FEF1E7;color:#C24E13;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;padding:6px 12px;border-radius:999px;">{{eyebrow}}</span>
          <h1 style="margin:18px 0 0 0;font-size:26px;font-weight:700;color:#241F1B;letter-spacing:-0.02em;line-height:1.25;">{{title}}</h1>
        </td></tr>
        <tr><td style="padding:12px 32px 0 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5;border-radius:14px;border:1px solid #F0EBE4;">
            <tr><td style="padding:20px 22px;font-size:15px;color:#4A423B;line-height:1.65;">{{body}}</td></tr>
          </table>
        </td></tr>
        {{meta_block}}
        <tr><td style="padding:28px 32px 8px 32px;">
          <a href="{{cta_url}}" style="display:inline-block;background:#F26522;color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:999px;text-decoration:none;">{{cta_label}}</a>
        </td></tr>
        <tr><td style="padding:16px 32px 30px 32px;">
          <p style="margin:0;font-size:13px;color:#9A918A;line-height:1.6;">Reply in the portal to keep the whole conversation on record for both sides.</p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:28px 0 0 0;border-top:1px solid #EEE9E2;text-align:center;">
      <p style="margin:0;font-size:14px;font-weight:700;color:#241F1B;">Citizen Entrepreneurial Development Agency</p>
      <p style="margin:4px 0 0 0;font-size:13px;color:#9A918A;">From idea to award, on one platform.</p>
      <p style="margin:12px 0 0 0;font-size:12px;color:#B5ACA4;">
        <a href="{{site_url}}" style="color:#8A817A;text-decoration:none;font-weight:600;">{{site_url}}</a>
      </p>
    </td></tr>
  </table>
</body>
</html>
$tpl$)
on conflict (key) do update set eyebrow = excluded.eyebrow, subject = excluded.subject, html = excluded.html;

-- ============================================================
-- 3) Render + send (in-database sender via pg_net + Resend)
-- ============================================================
create or replace function public.ceda_render_email(
  p_type text, p_title text, p_body text, p_link text, p_site_url text
) returns jsonb language plpgsql stable as $$
declare
  t record;
  h text;
  cta text;
begin
  select * into t from public.ceda_email_templates where key = coalesce(p_type, 'gate');
  if not found then
    return null;
  end if;

  cta := case p_type
    when 'evaluation' then 'Read the feedback'
    when 'assignment' then 'Open the submission'
    when 'message' then 'Read and reply'
    else 'Open your submission'
  end;

  h := t.html;
  h := replace(h, '{{title}}', p_title);
  h := replace(h, '{{body}}', p_body);
  h := replace(h, '{{eyebrow}}', t.eyebrow);
  h := replace(h, '{{cta_label}}', cta);
  h := replace(h, '{{cta_url}}', p_site_url || coalesce(nullif(p_link, ''), '/participant'));
  h := replace(h, '{{logo}}', p_site_url || '/ceda-icon.png');
  h := replace(h, '{{site_url}}', p_site_url);
  h := replace(h, '{{meta_block}}', '');

  return jsonb_build_object(
    'subject', replace(t.subject, '{{title}}', p_title),
    'html', h
  );
end $$;

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
  -- recipient + preferences
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

  -- provider key from the vault
  begin
    select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key';
  exception when others then
    v_key := null;
  end;
  if v_key is null then
    insert into public.ceda_email_log (notification_id, user_id, email, status, detail)
    values (new.id, new.user_id, v_email, 'skipped', 'no provider key in vault');
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

  -- find the schema holding pg_net's http_post
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
  values (new.id, new.user_id, v_email, 'queued', 'sent to provider');

  return new;
exception when others then
  insert into public.ceda_email_log (notification_id, user_id, email, status, detail)
  values (new.id, new.user_id, null, 'failed', left(sqlerrm, 200));
  return new;
end $$;

-- Replace the phase-3 trigger (which pointed at the Edge Function) with the
-- in-database sender. The Edge Function stays available as an alternative.
drop trigger if exists ceda_queue_email_trg on public.ceda_notifications;
create trigger ceda_queue_email_trg after insert on public.ceda_notifications
  for each row execute function public.ceda_queue_email();

-- ============================================================
-- 4) Audit the message thread too (who communicated with whom)
-- ============================================================
create or replace function public.ceda_audit_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.ceda_audit_log (actor_id, actor_role, action, entity_type, entity_id, submission_id, detail)
  values (auth.uid(), new.author_role, 'message.sent', 'message', new.id, new.submission_id,
          jsonb_build_object('visibility', new.visibility, 'excerpt', left(new.body, 160)));
  return new;
end $$;
drop trigger if exists ceda_audit_message_trg on public.ceda_messages;
create trigger ceda_audit_message_trg after insert on public.ceda_messages
  for each row execute function public.ceda_audit_message();

-- ============================================================
-- 5) Admin view of what was sent
-- ============================================================
drop policy if exists ceda_email_log_select on public.ceda_email_log;
create policy ceda_email_log_select on public.ceda_email_log
  for select using (public.ceda_is_admin());
