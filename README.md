# CEDA Innovation Hub

The innovation management portal behind the CEDA innovation competition: one place where
participants submit, judges evaluate, and CEDA administers the pipeline from screening to award.

```
platform/     the app (Vite + React 19 + Tailwind + Supabase)
screenshots/  product screenshots used in the proposal
PROPOSAL.md   the technical proposal submitted to CEDA
```

## Run it

```bash
cd platform
npm install
cp .env.example .env      # add your Supabase URL and anon key
npm run dev               # http://localhost:5173
```

## Database

Run the migrations in this order in the Supabase SQL editor (each is idempotent):

| File | Adds |
|---|---|
| `supabase-ceda-schema.sql` | core schema + row-level security + admin bootstrap |
| `supabase-ceda-fix-judge-rls.sql` | judge RLS fix |
| `supabase-ceda-phase2.sql` | storage, notifications, rubric weights, versions, gallery |
| `supabase-ceda-phase3.sql` | audit trail, Q&A threads, email preferences, calibration |
| `supabase-ceda-phase3b-email.sql` | email templates + the in-database sender |
| `supabase-ceda-phase3c-email-key.local.sql` | stores the Resend key (git-ignored) |
| `supabase-ceda-phase4-sessions.sql` | active sessions (list and revoke devices) |

## Email alerts

The sender runs inside Postgres (`pg_net` → Resend). The provider key is stored in Vault or
in the private `ceda_private` schema — never in application code. Without a key, email is
logged as `skipped` and in-app notifications are unaffected.

## Obsidian UI components

The showcase components come from the Obsidian UI registry and are kept in sync with it:

```bash
node tools/sync-obsidian.mjs          # pull the originals
node tools/mirror-obsidian-assets.mjs # mirror their assets locally (no CORS)
```

Components live in `src/components/block/`. `motion/react` is aliased to `framer-motion`,
and `next/image` / `next-themes` are shimmed in `src/shims/`.

## Deploy

See `platform/DEPLOYMENT.md` for hosting, the service role key, the PWA notes and the
operational checklist.
