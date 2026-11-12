# CEDA Innovation Hub — Deployment & Operations

Everything below is what you need to run this platform outside the laptop it was built on.

---

## 1. Database migrations

Run in order, in the Supabase SQL editor (or `supabase db push`):

| File | What it adds |
|---|---|
| `supabase-ceda-schema.sql` | Core schema: profiles, submissions, gate events, judge assignments, evaluations + all RLS policies + admin bootstrap |
| `supabase-ceda-fix-judge-rls.sql` | Fixes column-shadowing in the judge RLS policies |
| `supabase-ceda-phase2.sql` | Storage bucket + policies, notifications + triggers + realtime, rubric weights, submission versions, public gallery, `sdgs` column |
| `supabase-ceda-phase3.sql` | Audit trail + triggers, Q&A threads, email preferences + delivery log, judge calibration functions, email pipeline (pg_net) |
| `supabase-ceda-phase3b-email.sql` | Vault-stored provider key, email templates, in-database (pg_net) sender, delivery log |
| `supabase-ceda-phase3c-email-key.local.sql` | stores the Resend key in Vault or the private schema (git-ignored) |
| `supabase-ceda-phase3d-email-fix.sql` | fixes the dynamic provider call (`SELECT`, not `PERFORM`) |
| `supabase-ceda-phase4-sessions.sql` | Active sessions: list the signed-in devices, revoke one, revoke all others (backed by `auth.sessions`) |
| `supabase-ceda-phase5-profile.sql` | Profile editor: bios, avatars, titles, team details |
| `supabase-ceda-phase3e-status.sql` | Automatic service status strip (computed from live activity, shown on the landing page) |
| `supabase-ceda-phase3f-public-profiles.sql` | Public profile cards behind the awards gallery (no contact data) |

Every file is idempotent — re-running is safe.

> **Re-run needed:** `supabase-ceda-phase3d-email-fix.sql` — the sender used `PERFORM` inside a
> dynamic `EXECUTE`, which Postgres rejects ("syntax error at or near perform"), so every send was
> logged as failed. One quick paste fixes it and email alerts start flowing.

### Sending domain
`oratoryleague.xyz` is verified with Resend. The sender address is
`notifications@oratoryleague.xyz` and the portal links point at
`https://ceda.oratoryleague.xyz` — change both in `ceda_email_settings` if the app is
hosted elsewhere:

```sql
update public.ceda_email_settings
set from_address = 'CEDA Innovation Hub <notifications@oratoryleague.xyz>',
    site_url = 'https://ceda.oratoryleague.xyz'
where id = true;
```

---

## 2. Email alerts

Email is delivered **from the database** via `pg_net` → Resend, so no Edge Function
deployment (and no Supabase CLI login) is required. The Resend key lives in Supabase
Vault, never in application code, and the email template lives in
`ceda_email_templates` so it can be edited without a redeploy.

```
supabase-ceda-phase3.sql      -- notifications, triggers, preferences
supabase-ceda-phase3b-email.sql  -- Vault key, templates, pg_net sender, delivery log
```

### Sending domain (required for real recipients)

Resend only allows sending to the account owner's address until a domain is verified:

1. Add your domain at <https://resend.com/domains> (add the DNS records it gives you —
   a `TXT` for verification and `MX`/`SPF` for sending).
2. Point the sender at it:

```sql
update public.ceda_email_settings
set from_address = 'CEDA Innovation Hub <notifications@your-domain>',
    site_url      = 'https://your-domain'
where id = true;
```

Until then the platform still works: attempts are logged as `skipped` with the reason,
in-app notifications are unaffected, and no errors surface to users.

### Checking delivery

```sql
select status, count(*) from public.ceda_email_log group by status;
select * from public.ceda_email_log order by created_at desc limit 20;
```

Admins also see the same ledger under **Reports → Email delivery**.

### Optional: Edge Function sender

`supabase/functions/send-notification-email/` renders the *same* database template and
sends via the same provider — useful if you would rather run the sender outside the
database (e.g. with retries or a different provider).

```bash
npm i -g supabase
supabase login
supabase link --project-ref ggpsmgvmhbeynzfujiql
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
supabase functions deploy send-notification-email --no-verify-jwt
```

---

## 3. Environment variables

`platform/.env` (Vite exposes only `VITE_` prefixed vars to the client):

```
VITE_SUPABASE_URL=https://ggpsmgvmhbeynzfujiql.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

The anon key is safe in the browser: every table has row-level security, so the
database decides what a signed-in user may read.

---

## 4. Hosting

The app is a static Vite build — any static host works.

```bash
cd platform
npm install
npm run build      # -> dist/
```

- **Vercel / Netlify / Cloudflare Pages**: build command `npm run build`, output `dist`.
- Set the two `VITE_SUPABASE_*` variables in the host's environment panel.
- Serve over HTTPS — required for service workers, camera-less media uploads and
  the PWA install prompt.

### PWA notes
`public/manifest.webmanifest` + `public/sw.js` are copied into `dist/` at build
time. The service worker caches the app shell and static assets, and explicitly
never caches `/rest/` (Supabase API) or the realtime socket, so live data stays
live. Draft edits made offline are queued in `localStorage` and pushed
automatically the moment the connection returns.

---

## 5. Demo accounts

| Role | Email | Password |
|---|---|---|
| Administrator | `cedatest.admin@gmail.com` | `TestPass123!` |
| Judge | `cedatest.judge@gmail.com` | `TestPass123!` |
| Participant | `cedatest.thato@gmail.com` | `TestPass123!` |

Supabase enforces email confirmation, so test accounts are created and confirmed
through the Admin API.

---

## 6. Operational checklist

- [ ] `ceda_rubric` weights reviewed by CEDA before the competition opens
- [ ] `EMAIL_FROM` verified with the email provider (SPF/DKIM) before launch
- [ ] Storage bucket retention policy set (competition closes → purge attachments)
- [ ] Audit trail reviewed weekly; it is the record of who accessed what
- [ ] Backup policy agreed for `ceda_submissions`, `ceda_evaluations`, `ceda_gate_events`
