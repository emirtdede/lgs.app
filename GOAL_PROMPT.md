# GOAL — Build LGS 2027 Study Tracker Completely

You are the primary implementation agent for this repository. Use **Gemini 3.8 Flash High** and operate autonomously until the application is complete and all quality gates pass.

## Non-negotiable execution protocol

1. Read `AGENTS.md`.
2. Read `docs/00_DECISIONS_AND_PRECEDENCE.md` and `docs/05_DOMAIN_MODEL_AND_INVARIANTS.md` in full.
3. Inspect `data/LGS_2027_MASTER_PLAN.xlsx`, `docs/08_EXCEL_IMPORT_SPEC.md`, `data/resource_sources.json`, `data/calendar_overrides.json`, and `docs/32_RESOURCE_RESOLUTION_SPEC.md` before designing the database/importer.
4. Read the architecture/security/test documents before writing production code.
5. Create an implementation plan with milestones and file targets in `docs/IMPLEMENTATION_STATUS.md`.
6. Execute milestone by milestone. **Never advance while the current milestone has unresolved findings or a failing quality gate.**
7. When you discover a bug, logical inconsistency, security defect, test gap, accessibility defect, or architectural violation:
   - identify the root cause,
   - write a deterministic fix plan,
   - implement the fix,
   - add/update tests that would have caught it,
   - rerun the relevant gates,
   - only then continue.
8. Do not stop merely to report problems. Fix them unless an external credential or irreversible production action makes execution physically impossible.
9. Do not ask preference questions already settled by the docs. For genuinely unspecified implementation details, choose the lowest-complexity option that preserves data integrity, privacy, accessibility, performance and the domain invariants; record it in `docs/DECISION_LOG.md`.

## Product to build

Build a **private, mobile-first installable PWA** for one family to operate the LGS 2027 study plan. It must work on phone and desktop.

Roles:

- `owner`: full family + plan administration.
- `admin`: plan/student/resource administration, no ownership transfer.
- `viewer`: read-only family progress.
- `student-device`: anonymous-authenticated device linked to exactly one student; can only operate that student's allowed workflows.

Core student navigation:

- Bugün
- Plan
- Gelişim
- Yanlışlar
- Profil

Core adult navigation:

- Dashboard
- Takvim
- Plan
- Analiz
- Yanlışlar
- Kaynaklar
- Ayarlar

## Mandatory domain behavior

- Plan starts 2026-10-01.
- School curriculum, tests and topic order never drive the plan. School only means the student becomes available at 16:00 on weekdays.
- Sleep is 22:00; no new mandatory study session starts after 21:50.
- Math and Turkish start from foundations using the fixed user-selected playlists; do not replace them.
- Daily Paragraph/Turkish routine: minimum 20 questions.
- Daily Math routine: minimum 20 questions.
- Daily targets may rise above 20 later.
- **Benchmark 20**: exactly 20 questions are timed with a count-up timer each day for Math and Paragraph. These exact-20 durations feed speed trend graphs. Extra questions are tracked separately and never mixed into the benchmark time series.
- Timer never counts down and never displays a target time.
- Record correct/wrong/blank with duration. Show accuracy and speed together.
- Day-1 Math benchmark is a one-time baseline exception and does not claim any mastered topic.
- Topic questions are separate from daily routine questions.
- A topic is not complete merely because its video was watched; completion requires its configured required components.
- Every executable topic-video task must resolve to one exact video/resource item; playlist URL alone is not executable.
- MEB validation questions are only used for learned/completed topics and must resolve to a concrete official item/set.
- Missed tasks remain auditable and are not automatically piled onto the next day. Owner/admin reschedules them.
- Student cannot edit plan structure or dates.
- Optional reading unlocks only after all required effective tasks for the day are resolved as completed or explicitly cancelled/excused. Reading does not affect day-completion percentage; cancellation never counts as mastery.
- No leaderboard, peer comparison, public profile, shame language, fragile streak punishment, ads, social feed or monetization.
- "500 points" is a quality-of-preparation standard, never a pressure/failure label.

## Technical baseline

- Next.js App Router: pin `16.3.3` unless an official newer **security patch in the same compatible line** exists at implementation time; if upgrading, document the reason and rerun all gates.
- React/React DOM: pin `19.3.0` (current stable at the package audit date). If Next 16.3.3 rejects that pair, stop and resolve through an official compatible version; never use `--force` or `--legacy-peer-deps`.
- Node.js: 24 LTS; audited current baseline is 24.21.0. A newer 24.x security/patch release may be used if documented and gates rerun.
- TypeScript: 6.x strict; no deprecated compiler options.
- Tailwind CSS 4.x.
- Supabase JS 2.x; local Supabase CLI migrations are authoritative.
- Supabase Auth + Postgres + RLS; optional Realtime for family dashboard freshness.
- Testing: Vitest + Testing Library for unit/component; Playwright 1.63.x for E2E; SQL/RLS tests for authorization boundaries.
- Deployment target: Vercel + Supabase.
- Package manager: pnpm with lockfile committed; Corepack enabled.

## Authentication decision

Adults use permanent Supabase Auth accounts.
Student device uses Supabase anonymous sign-in to avoid requiring child email/phone. The anonymous auth UID is linked to exactly one student through a single-use pairing code. Pairing code requirements:

- cryptographically random,
- > = 80 bits entropy,
- expires in 10 minutes,
- stored only as SHA-256 hash,
- single use,
- invalidated after claim,
- rate limited,
- Turnstile/CAPTCHA on anonymous signup.

Use dynamic rendering for authenticated anonymous-student pages. Do not statically cache user-specific metadata.

## Data/security requirements

- RLS on every exposed table.
- Every existing family has exactly one owner at transaction commit; creation/transfer are transactional and audited.
- In MVP only the paired student device may create learning/completion evidence; adults cannot fabricate student evidence.
- Explicit minimal GRANTs in addition to policies.
- Secret/service-role key server-only.
- Audit plan mutations, reschedules, role changes and device pairing/revocation.
- Use `Europe/Istanbul` as the only product timezone.
- Store duration as integer seconds; timestamps as timestamptz; schedule dates as date.
- Idempotent Excel import using stable source keys (`TaskID`, sheet name, date, normalized row hash); bind workbook + resolved-resource inventory + calendar-overrides SHA-256 hashes.
- Import runs in a transaction/staging flow; validation failure means zero partial production writes.

## UX requirements

The student UI must be simpler than the adult UI. The default student page is Today's Plan with large touch targets, visible progress and one primary action at a time. Do not expose administrative complexity to the student.

Accessibility target: WCAG 2.2 AA. Use semantic HTML, keyboard support, visible focus, labels, error summaries, reduced-motion support, sufficient contrast and 44px-class touch targets.

## Required deliverables in repo

- production application code
- local Supabase stack + migrations + seed
- resolved exact resource-item inventory with validation evidence
- typed domain layer
- Excel import/validation script
- student workflow
- timer/session workflow resilient to refresh
- question-result workflow
- adult dashboards
- wrong-answer workflow
- plan rescheduling/audit workflow
- PWA manifest/installability
- tests
- CI quality gates
- `.env.example`
- deployment runbook
- security checklist and evidence
- `docs/IMPLEMENTATION_STATUS.md`
- `docs/DECISION_LOG.md`

## Milestone order

M0 Repository/bootstrap and executable quality gates.
M1 Database schema, migrations, RLS, auth/pairing and RLS tests.
M2 Exact resource resolver + verified calendar override normalization + Excel importer + dry-run validation + idempotency + import audit.
M3 Student Today screen + task execution + Benchmark 20 timers/results.
M4 Topic progress, MEB, wrong-answer workflow, overdue/reschedule rules.
M5 Adult family dashboard + analytics + charts.
M6 PWA installability, responsive polish, accessibility.
M7 Security hardening, backup/observability, full E2E.
M8 Release readiness and final audit.

Run independent `security-reviewer`, `database-reviewer`, `ux-accessibility-reviewer`, and `qa-reviewer` subagents before M8 completion. Resolve every P0/P1 and every correctness/security finding. P2 findings require either a fix or an explicit documented non-risk acceptance; do not silently ignore them.

## Final completion rule

Do not state that the project is complete until all of the following pass from a clean checkout:

- dependency install without peer override
- formatting check
- lint
- TypeScript typecheck
- unit/component tests
- database reset from migrations
- RLS authorization tests
- resource-resolution gate (0 unresolved/ambiguous executable items)
- import dry-run and import idempotency test
- production build
- Playwright E2E on mobile + desktop
- accessibility automated checks with no serious/critical findings
- dependency vulnerability scan with no unresolved critical/high issue in runtime dependencies
- manual domain invariant audit

At the end, produce a concise final report listing what was built, test/gate evidence, known non-blocking limitations, deployment steps and exact locations of key files.
