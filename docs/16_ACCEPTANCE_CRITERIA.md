# 16 — Acceptance Criteria

Release is accepted only when:

## Student

- Today loads only that student's tasks.
- 20-question Math/Paragraph benchmark can start/finish and survives refresh.
- retrying Finish with the same payload is idempotent; a lost response cannot create a duplicate.
- > 4h timer completion persists a flagged session rather than rolling the flag back.
- Result cannot submit unless correct+wrong+blank=20.
- Daily target above 20 creates extra work separate from benchmark trend.
- topic task completion follows requirements.
- optional reading is locked until required day complete at **both UI and DB/RPC boundary**.
- student cannot edit plan/reschedule/resources/family.

## Family

- owner/admin/viewer see permitted student progress.
- viewer mutation attempts fail at UI and DB.
- reschedule preserves original date and audit reason.
- benchmark charts use comparable exact-20 samples.

## Security

- all public schema app tables have RLS.
- minimal grants verified.
- cross-student access tests pass.
- no service secret in client bundle.
- pair token plaintext never persists.

## Plan

- workbook imports without silent skipped required rows.
- Day-1 Math normalization applied.
- import is idempotent.
- import dry-run describes all changes before commit.
- every executable video task has one exact resolved resource item; unresolved/ambiguous mapping blocks commit.
- required MEB work is limited to learned-topic-safe official items.

## UX/accessibility

- no horizontal page overflow at 320px.
- touch interactions work without hover.
- keyboard critical paths work.
- no serious/critical automated accessibility issue.

## Build

Clean checkout can install, reset local DB, test and build from documented commands.

## V3 release additions

- Existing families cannot commit with zero or multiple owners.
- Owner/admin cannot fabricate student completion/question/timer evidence.
- A new benchmark cannot start after 21:50 Europe/Istanbul.
- 17 and 18 May 2027 import as full-day **effective availability** while preserving their academic task set/order.
- Import commit is hash-bound to workbook, resolved resource inventory and calendar-overrides inputs.
- `scripts/audit-package.py` returns zero FAIL on the distributed package.
