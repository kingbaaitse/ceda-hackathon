# Technical Proposal — CEDA Innovation Platform
*Working title: CEDA Innovation Hub (changeable — pick a name and replace throughout)*

> DRAFT STATUS: Sections marked ⬜ TODO are pending. Everything else is submission-ready pending your read-through.

---

## 1. Executive Summary

The CEDA Innovation Hub is a cloud-based Innovation Management Portal through which CEDA's innovation competition — and any future CEDA innovation pipeline — can be run end to end: participant registration, idea and solution submission, multi-level evaluation, and award administration.

The platform serves four role groups — public visitors, participants, judges, and CEDA administrators — with strict role-based access controls that keep commercially sensitive submissions visible only to their owners and to judges assigned to review them.

A stage-gated workflow (Screening → Evaluation → Selection → Award) enforces that every submission receives structured feedback at each gate, and that participants can track their progression and revise resubmissions within a competition stage.

The platform is also **built for the conditions our entrants actually have**: a four-step submission wizard with autosave, private media attachment (logos, decks, product imagery), a two-way message thread with CEDA, realtime in-app and optional email notifications, and an installable offline-capable phone app that queues draft edits when the signal drops.

Judging is consistent and auditable rather than ad hoc: the rubric and its weights are configuration, not code, so CEDA can tune the model without a redeploy; judges see only their assigned submissions and are calibrated against anonymous panel aggregates; and every gate decision, evaluation, assignment and stage change is written to an audit trail.

Full lifecycle data handling complies with Botswana's Data Protection Act: data is collected lawfully, used only for competition operations, protected against unauthorized access, and retained only as long as necessary.

The platform is modular and API-ready, so CEDA can extend it in future stages — advanced analytics, integration with CEDA's funding systems, and ML-assisted evaluation — without re-architecting.

---

## 2. Platform Walkthrough

### 2.0 Public landing page
Visitors land on a public page that explains the pipeline and proves it works: the six stages are colour-coded by what they mean (grey not started, blue with CEDA, orange moving, amber a decision is due, green awarded, red out), live counters show how many entries have been awarded and how many SDGs the pipeline covers, and the awarded work itself is explorable. Nothing about the competition's rules or process is hidden behind a login.

### 2.1 Participant registration
1. Public landing page describes the competition, eligibility (Botswana citizens, 18–35), and the window (9–12 Nov). No data is collected from visitors who do not register.
2. Register as an **Individual** or a **Team**. Team registration collects each member's name, role(s), and consent to the data/competition terms.
3. Passwords are checked as they are typed: a four-segment strength meter (red → orange → amber → green) plus the exact rules still unmet and a live character count, so nobody discovers a weak password only at submission time.
4. Identity and eligibility details are captured at registration and verified by CEDA administrators during the compliance screen (see §3, Gate 0).
5. One submission per participant is enforced by the platform, matching §4.3.

### 2.2 Solution submission
1. The participant creates a submission against the open competition stage through a **four-step guided wizard** (The Idea → Alignment & Team → Media & Documents → Review & Submit), capturing: idea title, description, stage of development, SDG alignment (multi-select), team members with roles (UX/UI Designer, Developer, Business Analyst, Technical Analyst), and attachments (the technical proposal, logos and product media, per the guidelines' "documents as per attachment").
2. **Autosave.** Draft state: every field change is persisted automatically (debounced), so a participant never loses work. Submissions remain editable until the participant explicitly submits — only then do they enter the evaluation pipeline and lock.
3. **Media & documents.** Logos, product photography, pitch decks and technical drawings upload to a private object-storage bucket under a path scoped to the owner and submission (`{owner}/{submission}/{file}`). Files are served through short-lived signed URLs and are readable only by the owner, CEDA administrators, the assigned judges, and — for awarded entries — the public gallery.
4. Every submission is stored with access limited to: its owner(s), CEDA administrators, and (later, at the evaluation gate) judges assigned to it.
5. The participant sees a live status tracker (§4) from the moment of submission.

### 2.3 Public awards gallery
Awarded submissions are published to a public, read-only gallery (`/gallery`) that visitors can browse without registering — recognition for winners and transparency for sponsors, without exposing competitors' commercially sensitive submissions. Only entries that reached the award gate are published. The gallery opens with an interactive showcase — a lensed, infinitely tiled grid of the awarded work that visitors drag through (WebGL, with a readable fallback), then the entries in full below.

### 2.4 Administrator operation
Administrators open a competition stage, manage judge assignments (via in-portal dropdowns), monitor pipeline volume (live-updating, no refresh needed), tune the rubric weights, and trigger the stage-gate transitions described in §3. Every gate action is confirmed in a dialog that **requires written feedback before it can be applied**, so the audit trail can never contain a silent gate move.

---

## 3. Stage-Gated Workflow (mirrors §3.2(b) and (c))

Each submission moves through fixed gates. A submission cannot skip a gate, and each gate produces recorded feedback visible to the participant.

| Gate | Stage | Who acts | Gate action | What the participant sees |
|---|---|---|---|---|
| 0 | **Compliance & eligibility screen** | CEDA admin | Verify age, citizenship, shareholding, completeness | Status: "Under compliance review" |
| 1 | **Initial screening** | CEDA admin (first-level screeners) | Pass/fail against screening criteria; rejection includes reason | Status + screening feedback |
| 2 | **Multi-level evaluation** | Assigned external + internal judges, scored against the published rubric | Weighted scores + written feedback per criterion | Scores and judge feedback (anonymized judges) |
| 3 | **Final selection** | CEDA evaluation committee | Rank, deliberate, select winners | Status: "Selected" / "Not selected" |
| 4 | **Approval & award** | CEDA admin | Award determination, approval record | Award notification |

Design properties of the gates:

- **Multi-level by construction.** Gate 1 (administrative screen) and Gate 2 (judged evaluation) are separate roles with separate rubrics, satisfying "multi-level evaluation with customized rubrics."
- **Internal + external participation.** Judges can be provisioned as internal CEDA staff or external experts; both see only the submissions assigned to them.
- **Rubric-driven, not vibes-driven.** Every gate-2 score is recorded per published criterion, so the raw scoring data exists for §3.2(f) reporting and for audit.
- **Feedback is a gate output, not an afterthought.** A gate cannot be passed or failed without feedback text. This is what makes the §3.2(e) iteration loop possible.

---

## 4. Feedback & Iteration Loop (mirrors §3.2(e))

1. **Status tracking.** Every participant sees a persistent, timestamped status trail: Submitted → Compliance review → Screened → In evaluation → Selection → Award outcome.
2. **Structured feedback delivery.** Each gate decision delivers written feedback to the participant, plus — at the evaluation stage — per-criterion weighted scores and the judge's written comment.
3. **Revise & resubmit.** Where CEDA opens a revision round within a stage, the participant receives a "Revise requested" action, edits the submission, and resubmits; the platform keeps every version with its timestamp and the feedback that triggered the change, so CEDA retains the full iteration history. On resubmission the platform snapshots the prior version automatically, so the participant and CEDA can both see what changed between rounds.
4. **Notifications.** Every gate decision, judge assignment, evaluation and participant message creates an in-app notification, delivered **in real time** to the affected participant or judge (a live notification bell plus an unread badge) — so nobody has to poll the portal for news. Each user can additionally opt into **email alerts** (Settings → Email alerts); delivery runs through a database-triggered mail worker, and every attempt is recorded in a delivery log for audit.
5. **Two-way clarification.** A submission carries a message thread, so a participant can ask CEDA for clarification (missing documents, eligibility questions, next steps) and CEDA can answer, with a per-message visibility control: *participant + judges*, *judges only*, or *admins only*. This turns one-shot gate feedback into an actual conversation while keeping evaluation discussion private.

---

## 5. Role-Based Access Control & IP Protection (mirrors §3.2(d) and (h))

### 5.1 RBAC matrix

| Permission | Public | Participant | Judge | Admin |
|---|---|---|---|---|
| View competition info | ✅ | ✅ | ✅ | ✅ |
| Register (individual/team) | ✅ | — | — | — |
| Create/edit own submission | — | ✅ (own only, draft state) | — | — |
| View own submission status & feedback | — | ✅ (own only) | — | — |
| View submissions | — | — | ✅ **assigned only** | ✅ |
| Score & write evaluation feedback | — | — | ✅ (assigned only) | — |
| Assign judges, open/close stages | — | — | — | ✅ |
| Change gate states | — | — | — | ✅ |
| View reports/metrics | — | — | limited (own scores) | ✅ |
| Export data | — | — | — | ✅ |

### 5.2 How this protects commercially sensitive data
- **No cross-participant visibility.** A participant can never see another participant's submission, in any state. Enforcement is at the data layer (row-level ownership), not just hidden links.
- **Judge assignment isolation.** A judge's account is scoped to their assignment list. Unassigned submissions are unreachable, preventing IP exposure beyond the necessary review circle.
- **Anonymized feedback channel.** Participants see judge feedback but not judge identities; judges see submissions but not necessarily other judges' scores while scoring is open — reducing influence and disclosure risk during the review. Judge calibration is offered as **anonymous aggregates only** (panel average and spread, never peer identities or feedback text).
- **Audit trail.** Every gate decision, evaluation, judge assignment and stage change is written to an immutable audit log with actor, role, entity and timestamp — giving CEDA a demonstrable record of who did what, which is the substance of the NDA/confidentiality requirement in §3.2(h). The log is filterable by action and actor and exportable to CSV.
- **Private attachments.** Logos, decks and product media live in a private bucket; files are delivered through short-lived signed URLs to the owner, admins and assigned judges only, and to the public only for awarded entries.

---

## 6. Data Protection Act Compliance (mirrors §3.2(h), (i)) ⬜ TODO — draft next
- Data map: what is collected (identity, eligibility, submission content), where stored (cloud region, encryption at rest/in transit), who can access (per §5 RBAC).
- Purpose limitation: personal data used only for competition operation and reporting, never sold or reused without consent.
- Retention: submissions and personal data retained for [X] after competition close, then deleted/anonymized; audit logs retained per CEDA policy.
- Breach posture: access logging, least-privilege accounts, notification plan.
- English-only enforcement on all submission fields.

---

## 7. Reporting & Metrics (mirrors §3.2(f))
Admin dashboard covering: registration counts (individual vs team), submission volume over time, submissions per stage/gate, evaluation score distributions per rubric criterion, and pipeline conversion (screened-in %, evaluated %, awarded %). Every submission can be **exported to CSV** (title, owner, entry type, stage, SDGs, team, weighted score, attachment count, timestamps) for CEDA's strategic decision-making, without touching the database.

**Admin-configurable scoring model.** The rubric (Innovation & Originality, Feasibility & Scalability, SDG Impact, Commercial Viability, Team Capability) is stored as data, not code: CEDA admins tune the weights in the portal, and every judge scores each criterion 0–10 against the live weighting, producing a weighted total on a 0–100 scale. Changing the model therefore needs no redeploy, and every evaluation retains its per-criterion raw scores for audit.

**Insight beyond counts.** The reporting layer answers operating questions, not just "how many": SDG alignment spread (which goals the pipeline actually serves), score distribution across submissions, per-criterion averages (which criterion is actually holding entries back), and gate turnaround (how long each gate takes in practice). Judge calibration shows each judge their own weighted total against the anonymous panel average and per-criterion spread, which keeps scoring honest without exposing anyone.

**A dashboard that tells the administrator what to do next.** The admin home is not a wall of charts: it opens with a *Needs attention* queue — submissions awaiting screening, entries with no judge assigned, evaluations outstanding, entries ready for the award decision, revisions requested but not yet resubmitted, and participant messages with no reply — each item jumping straight to the screen where the decision is made. Below it sit the KPI strip, the funnel, and the spread charts, with written insights derived from the data ("Commercial Viability is the weakest criterion at 7.4/10"), so the first thing an administrator reads is a prioritised list, not a spreadsheet.

---

## 8. Scalability & Future-Ready Architecture (mirrors §3.2(g))
Modular cloud architecture: web app + API layer + relational datastore (PostgreSQL with row-level security) + private object storage for attachments, hosted on Supabase (Botswana-relevant data residency options on request). Each module (registration, submissions, evaluation, reporting) communicates through defined APIs, so future capabilities — advanced analytics, CEDA system integration, ML-assisted evaluation — plug in without re-architecture. *Deliberately not built in this scope: ML evaluation — the guidelines position it as future capability.*

Security and scalability properties already in place: row-level security on every table (ownership, judge-assignment scope and admin access enforced in the database, not the UI); signed, expiring URLs for all media; realtime subscriptions scoped per user for notifications and per table for the live pipeline; and idempotent, re-runnable database migrations so schema evolution is safe.

**Built for the conditions our entrants actually have.** The portal is installable (PWA) and works on a phone browser, and drafts are autosaved continuously — if a participant loses signal mid-edit, the changes are queued on the device and synced the moment the connection returns. Nothing is lost to a dropped connection on a shared network.

**Account security that participants can actually use.** A *Settings → Active sessions* panel lists every device signed in to the account (browser, OS, IP, last activity), lets the owner sign out a single device or every other device at once, and the revocation is enforced server-side — the revoked session is rejected on its next request, not just hidden from a list. Every revocation is written to the audit trail.

---

## 9. Team (mirrors §5.1) ⬜ TODO — needs your names
2 members covering the 4 specified roles:

| Member | Hats (2 of 4) | Covers |
|---|---|---|
| [Member 1 name] | UX + UI Designer, Developer | [one line each] |
| [Member 2 name] | Business Analyst, Technical Analyst | [one line each] |

Explicit statement: together the two members cover all four competencies listed in §6.1 — state the division of labor in one line per person.

---

## 10. Compliance & Eligibility Confirmations ⬜ TODO — needs your facts
- Botswana citizens, aged 18–35 at submission: confirmed ✅/⬜
- 50% shareholding evidence (company entry): attached ⬜
- One submission per participant: confirmed by platform design (§2.1)
- No application fee: acknowledged
- Submission via CEDA portal per §4.2
