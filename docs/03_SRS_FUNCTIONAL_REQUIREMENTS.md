# 03 — Software Requirements Specification

## Authentication

- SRS-AUTH-01 Adults authenticate with permanent Supabase Auth identities.
- SRS-AUTH-02 Student uses anonymous Supabase Auth; email/phone is not required.
- SRS-AUTH-03 Anonymous UID must be linked to exactly one active student device record before student data is accessible.
- SRS-AUTH-04 Pairing code expires after 10 minutes, is single-use and stored only as a SHA-256 hash.
- SRS-AUTH-05 Owner/admin can revoke a student device immediately.
- SRS-AUTH-06 Student operational authorization requires both `is_anonymous=true` and an active device link; a permanent adult identity is never treated as a student device principal.

## Authorization

- owner: full family scope.
- admin: full operational scope except ownership/deletion.
- viewer: SELECT-only on family study data.
- student-device: own student's operational rows only; never plan definition mutation.
- every browser request is constrained by Postgres RLS.

## Plan

- SRS-PLAN-01 import workbook using dry-run → validate → commit workflow.
- SRS-PLAN-02 import is idempotent.
- SRS-PLAN-03 raw source keys and row hash retained.
- SRS-PLAN-04 schedule mutation writes audit history.
- SRS-PLAN-05 required vs optional is explicit.
- SRS-PLAN-06 task order is stable.

## Timer and questions

- start action writes `started_at` on server and stores session id client-side.
- UI elapsed display derives from `now - started_at`, not accumulated intervals.
- finish writes `finished_at`; server computes authoritative duration seconds.
- benchmark result requires exactly 20 attempted items: correct + wrong + blank = 20.
- total daily target may be >20; extra block uses separate session/result.
- multiple active benchmark sessions for same student/routine/date are prohibited by DB constraint/application transaction.

## Daily completion

A day is complete when every non-cancelled required **academic** task whose effective date is that plan date is completed. Explicitly cancelled/excused tasks are removed from the task denominator, never counted as completed/mastered. A day with no remaining required academic tasks is excused and excluded from consistency. Optional reading/rest/meal/sleep blocks are excluded.

## Topic completion

Topic completion is derived, not freely toggled. It requires every configured required task with `counts_toward_topic_completion=true` for that topic to be completed. Cancellation does not satisfy mastery. Admin override, if ever implemented, must be explicit and audited.

## Reading

Reading is disabled until all required effective tasks for the local date are resolved as completed or explicitly cancelled/excused. No minimum duration. Optional book/title/page metadata may be stored. Reading never contributes to academic completion/mastery.

## Non-functional

- NFR-01 WCAG 2.2 AA target.
- NFR-02 P95 interactive route load on normal mobile broadband target <=2.5s after warm CDN, excluding third-party YouTube navigation.
- NFR-03 destructive admin actions require explicit confirm and server validation.
- NFR-04 no runtime secret in client bundle.
- NFR-05 recoverable audit trail for plan mutations.
- NFR-06 all business timestamps use timestamptz; product-local date resolution is Europe/Istanbul.
