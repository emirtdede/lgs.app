# 06 — Database and RLS Design

## Design principles

- UUID primary keys (`gen_random_uuid()`).
- timestamps use `timestamptz`; tables carry lifecycle timestamps appropriate to their semantics.
- plan dates use `date`; session moments use `timestamptz`.
- durations use integer seconds.
- soft history for schedule mutations; do not overwrite evidence.
- exposed public tables: RLS enabled + explicit GRANTs.

## Main relations

```text
families 1─* family_members
families 1─* students
students 1─* student_devices
students 1─* study_plans 1─* plan_days 1─* tasks
subjects 1─* topics
resources 1─* resource_items
students 1─* question_sessions
students 1─* timer_sessions
students 1─* mistakes
students 1─* reading_sessions
```

## Authorization helpers

Create `private` SECURITY DEFINER helper functions with fixed `search_path`; do not expose arbitrary SQL.

Required predicates:

- permanent adult has family role?
- current auth UID is anonymous **and** maps to an active student device?
- current principal can read student?
- current principal can manage student/plan?

Anonymous student users have Postgres role `authenticated`; distinguish through JWT `is_anonymous` plus active device mapping.

## Grants

- `anon`: no application table privileges.
- `authenticated`: only operations needed by policies.
- secret/service role: server-only administrative/import path.

RLS policies and GRANTs must be tested together. Never assume adding policies automatically revokes broad grants.

## Mutation boundary

Structural changes (plan import, reschedule/cancel, role changes, pairing code generation/revoke) go through validated server/RPC transaction code. All student evidence writes (`timer_sessions`, `question_sessions`, `task_completions`, `mistakes`, `reading_sessions`) use narrow RPCs; browser direct DML is revoked. RPCs validate `auth.uid()`, anonymous-device mapping, effective plan date, task type, counts, and idempotency. RLS remains the read-isolation boundary.

## Audit

Audit at minimum:

- plan import
- task reschedule/cancel/restore
- role add/change/remove
- student device pair/revoke
- corrected question result
- topic override

## Resource isolation

`resources` is family-scoped. `resource_items` inherits access through its parent resource. A student device can read only resource rows belonging to its linked student's family. Playlist-level sources and exact video/item rows are distinct entities.

## Constraint expectations

Database enums/checks enforce canonical task/resource/mistake/mutation values, valid task time ranges, benchmark evidence shape, finalized timer timestamps, reading-session time consistency, and resource-item parent binding. `plan_day_id` is original/immutable by application contract; `current_plan_day_id` is effective and may change only through audited mutation RPC. Application validation supplements DB constraints; it never replaces them.

## Family-owner cardinality

`family_one_owner_idx` alone is only an at-most-one constraint. Migration `0006_family_lifecycle_rpc.sql` adds deferred exactly-one-owner constraint triggers and transactional family-create/ownership-transfer RPCs. Tests must cover create, transfer, attempted owner removal, cross-family transfer, and rollback behavior.
