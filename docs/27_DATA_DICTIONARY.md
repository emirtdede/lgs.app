# 27 — Data Dictionary

## families

Private family workspace. `timezone` fixed to Europe/Istanbul.

## family_members

Adult Auth user membership. The partial unique index enforces **at most one** owner; deferred constraint triggers plus transactional create/transfer RPCs enforce **exactly one** owner for every existing family at commit.

## students

Learning subject/person. Store minimal display name; no child email required.

## student_devices

Maps anonymous Auth UID to one student. Revocation immediately terminates authorization even if Auth session still exists.

## pairing_codes / pairing_claim_attempts

`pairing_codes` is a hash-only one-time credential; previous live code is revoked when a new one is created. `pairing_claim_attempts` persists per-anonymous-UID attempts for the DB throttling window. Neither table is browser-selectable.

## subjects/topics/resources/resource_items

`subjects` and `topics` are the curriculum catalog. `resources` is **family-scoped** and represents an approved source/book/playlist/MEB source. `resource_items` represents exact executable items such as one YouTube video or one concrete official question set. `fixed_by_owner` protects fixed Math/Turkish source choice at application level; exact-item resolution must stay inside that approved source.

## study_plans/plan_days/tasks

Imported plan structure. `tasks.plan_day_id` is the immutable original date; `current_plan_day_id` is the effective date after audited reschedule. `task_group_key` joins derived children from one raw workbook row. `counts_toward_topic_completion` explicitly identifies mastery milestones. Raw workbook traceability is retained on every task.

## task_completions

Operational state for a task/student. `completed` is positive evidence; `cancelled` is an explicit excusal and must never be treated as mastery. `rescheduled` means still incomplete on its new effective date. Day completion is derived; no user-editable day-complete boolean exists.

## timer_sessions

Timestamp evidence for timed work. Browser reads own; writes through RPC for benchmark path.

## question_sessions

Question outcome evidence. `benchmark_20` is constrained to 20. Daily unique benchmark per routine/student/date prevents accidental duplicates.

## mistakes

Wrong/blank review record with categorized cause.

## reading_sessions

Optional reading activity; not academic day-completion evidence. Browser direct INSERT/UPDATE is revoked. Start/finish RPCs enforce current-day unlock and server-derived duration.

## plan_mutations

Append-only history of reschedule/cancel/override operations. Reschedule preserves original task date and records previous/effective dates, reason and actor.

## import_runs

Workbook hash, dry-run/commit/failed audit summary.

## audit_events

Security/product audit events; not exposed to student.
