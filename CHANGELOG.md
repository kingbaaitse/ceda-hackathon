# Changelog

All notable changes to the CEDA Innovation Hub. The same content is rendered in the app at
`/changelog`.

## 1.0.0 — Phase 3: Trust, insight and reach

### Added
- **Partner section on the landing page**: CEDA and Oratory League shown as the two sides of the
  project — CEDA owns the competition, Oratory League is the official partner and developer —
  using the Obsidian *Split Showcase* with both marks.
- **Obsidian UI originals, pulled from their public registry** (`tools/sync-obsidian.mjs`):
  Active Sessions, Art Gallery, Draggable Marquee, Flip Text, Hover Image, Parallax Slider,
  Split Showcase, Status Bars, Text Stream and V Prism. Their assets are mirrored locally
  (`tools/mirror-obsidian-assets.mjs`) because their CDN blocks CORS.
- **Audit trail** (`ceda_audit_log`): every gate decision, evaluation, judge assignment,
  stage change, message and session revocation is recorded with actor, role and timestamp.
  Admins can filter by action and actor and export the trail to CSV.
- **Active sessions**: every device signed in to an account is listed in Settings with browser,
  OS, IP and last activity. A session can be revoked individually, or every other device at
  once. Revocation is enforced server-side and audited.
- **Participant–administrator conversations**: a message thread per submission with per-message
  visibility (participant + judges, judges only, or admins only).
- **Judge calibration**: judges see their own weighted total against anonymous panel aggregates
  (panel average, spread and per-criterion deltas) — never a peer identity or peer feedback.
- **Admin dashboard**: opens with a "Needs attention" triage queue (awaiting screening, no judge
  assigned, evaluation outstanding, ready for award, revision not resubmitted, unanswered
  message), then the KPI strip, written insights, pipeline funnel, SDG spread, score
  distribution and gate turnaround.
- **Email alerts**: database-triggered delivery through Resend with a branded, database-stored
  template, per-user opt-in and a delivery log.
- **Offline drafts**: edits made without a signal are queued on the device and synced on
  reconnect. The app is installable (PWA).
- **Public landing page**, **public awards gallery** and an in-app **changelog**.
- **Password strength meter** with a live character count and the rules still unmet.

### Changed
- Semantic colour system (`src/lib/semantics.js`): grey = inactive, blue = with CEDA,
  orange = moving, amber = decision due, green = awarded, red = out. Applied to every chart,
  counter, badge and stage pill. Decorative gradients were removed from data views.
- `Select` and `MultiSelect` render their menus in a portal, so they are no longer clipped by
  cards or scroll areas.
- Primary buttons use the CEDA accent instead of black; a `btn-danger` variant was added for
  destructive actions.
- The login brand panel and the landing page were rebuilt; the landing page was then trimmed to
  an essential summary.
- The Obsidian UI components are now the **originals**, pulled from their public registry
  (`tools/sync-obsidian.mjs`) instead of reimplementations; their assets are mirrored locally
  (`tools/mirror-obsidian-assets.mjs`) because their CDN blocks CORS.

### Fixed
- Wizard autosave sent a `team` key instead of `team_members`, which silently failed every save.
- The participant portal never fetched notifications (missing `userId`).
- The administrator notification bell showed other users' notifications.
- The audit trail, message thread and calibration functions are now reachable from the UI.
- The email template renderer had unbalanced parentheses and never compiled.
- The mail worker used `PERFORM` inside a dynamic `EXECUTE`, which is not valid SQL; it now uses
  `SELECT` (phase 3D).
- Tailwind never scanned `.tsx` files, so every class used only inside the Obsidian components
  was missing from the stylesheet. The content glob now covers `.ts` and `.tsx`, and an unlayered
  compatibility sheet (`src/obsidian-compat.css`) covers their Tailwind v4 variable syntax.

## 0.9.0 — Phase 2: The full innovation pipeline

### Added
- Four-step submission wizard with continuous autosave, team-member editor, SDG multi-select
  and media uploads to a private storage bucket (signed URLs, RLS-scoped).
- Stage-gate workflow with mandatory written feedback, revision loop and version history.
- Notifications with realtime delivery, rubric weights stored in the database, and a public
  awards gallery for awarded entries.

## 0.8.0 — Phase 1: The platform

### Added
- Authentication and the participant, judge and administrator portals.
- Stage-gated workflow, submissions, evaluations, gate events and reporting, all with
  row-level security.
- The CEDA brand system: orange/royal/gold palette, Elms Sans, glass panels, floating-pill shell.
