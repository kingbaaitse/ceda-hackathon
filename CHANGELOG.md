# Changelog

All notable changes to the CEDA Innovation Hub. The same content is rendered in the app at
`/changelog`.

## 1.0.3 - Gallery and trail fixes

### Fixed
- **The awards gallery hover preview floats over the page** instead of being clipped inside the
  strip it belongs to.
- **Participants and team members can be opened from the awards gallery** — click a name to see
  the profile card behind a winning entry. Only presentation details are shown; contact
  information stays private. Requires the phase 3F database step.
- **The timeline markers on the changelog no longer show the rail through them** in dark mode.
- **The milestone trail marks every stage an entry has reached** in green with a tick, including
  the stage it is in now.
- Fixed a crash that could blank a participant portal whose entry had reached the final stage.

## 1.0.2 - Round two polish

### Fixed
- **Milestone trail**: the connecting lines now touch the outline of each circle instead of
  stopping short or sliding underneath, and completed stages are tinted green with a tick.
- **Profile pictures, submission images and media thumbnails show the CEDA loader while they
  load**, so a slow image never looks like an empty page.
- **Deep links to the marketing pages** (changelog, team, legal and the rest) now resolve on the
  deployed site instead of returning 404.
- **The contact email in the footer** is corrected.

### Changed
- **The phone picker is the production-grade international input**: every country in the world,
  real rendered flags, a searchable list, and numbers saved in the standard international
  format automatically.
- **The team profile carries the real social accounts** — LinkedIn, Instagram and X — with the
  same marks used across the wider brand.

## 1.0.1 - Phase 3 polish

### Added
- **Animated icons** throughout the signed-in portal: every icon responds to hover and to a
  tap, and the notification bell keeps ringing while something is unread.
- **A working notification centre**: a frosted panel over a heavy blur, unread items tinted and
  marked, read items faded back, a badge that matches the panel, mark-all-read, and a short,
  soft chime when a notification arrives while the portal is open.
- **Full-screen loading on every portal**, not only the dashboard, while data is fetched.

### Changed
- **Search rests as a circle** and expands only when opened or typed into, giving the header
  back its space.
- **Refresh reports its own state**: a calm spinner while loading, a green tick when the view is
  current, and a red mark when a refresh fails.
- **Loading buttons grey out** and show the CEDA mark instead of text dots. No screen uses an
  ellipsis as a placeholder.
- **Theme switch moved to Settings**, which is now fully working.
- **Phone numbers use a flag picker** with a searchable country list, matching the rest of the
  sign-up experience.

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
- **Hero rebuilt as an orbit.** The headline now sits in the middle of the composition with the
  live product preview holding the centre and supporting illustrations orbiting it, drifting with
  scroll and pointer parallax. The artwork is recoloured into the CEDA palette so it reads as ours
  rather than as stock (`tools/prepare-illustrations.mjs`).
- **Floating pill navigation** that hides on scroll down, returns on scroll up, tightens once the
  page moves and marks the section you are reading.
- **Cursor follower** — a soft CEDA glow that trails the pointer and swells over anything
  interactive. Touch devices and reduced-motion users never see it.
- **Particle ribbon** (ported from the kingbaaitse hero-3d) flowing behind the hero composition,
  leaning with the pointer.
- Sections are centred, the small uppercase orange labels are gone, and the closing band and
  footer carry the legal text, the CEDA mark and the "designed and developed by Oratory League"
  credit.
- Login and signup both offer a "Back to the hub" link.
- Empty states across the participant, judge and administrator portals now use the illustration set
  instead of a bare line of text.
- Semantic colour system (`src/lib/semantics.js`): grey = inactive, blue = with CEDA,
  orange = moving, amber = decision due, green = awarded, red = out. Applied to every chart,
  counter, badge and stage pill. Decorative gradients were removed from data views.
- **Landing page rebuilt** in the ReactDrops reference composition: a light editorial page with
  a live interactive preview (the glass prism) as the hero, pill CTAs, section eyebrows, a
  three-step getting-started row, and a dark closing band. The prism moved here from the login
  panel.
- **Login panel now matches the signup panel exactly** ("One submission. Every gate.").
- **Public pages follow the user's theme.** The landing page, awards gallery and changelog were
  authored dark-only and carried a hardcoded `dark` class; they now use semantic tokens and
  render light or dark with the rest of the app.
- `Select` and `MultiSelect` render their menus in a portal, so they are no longer clipped by
  cards or scroll areas.
- Primary buttons use the CEDA accent instead of black; a `btn-danger` variant was added for
  destructive actions.
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
