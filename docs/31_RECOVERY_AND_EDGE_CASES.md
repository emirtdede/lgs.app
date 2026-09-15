# 31 — Recovery and Edge Cases

## Student is sick / exceptional day

Admin may cancel/reschedule required tasks with reason. Original schedule remains auditable. A cancelled task is excused, not completed/mastered; if every required academic task on a day is cancelled, that day is excluded from consistency rather than marked successful.

## Timer accidentally left running

After 4 hours, finishing path **persists** `timer_sessions.status=flagged` and returns a non-exception `flagged` result. Because it does not raise after the update, the flag is not rolled back. Admin may review/cancel/retry according to the correction workflow; flagged evidence never feeds trends.

## Device clears browser data

Anonymous Auth identity may be lost. Owner/admin generates a new pairing code; old device mapping can be revoked. Historical student data remains attached to student, not device.

## Duplicate submit/retry

Mutation endpoints/RPCs are idempotent where specified. DB unique constraints reject duplicate daily benchmark/non-benchmark result rows. Repeating an already-successful operation with the same semantic payload returns an existing/already-* status; conflicting post-finalization payload is rejected.

## Network fails after Finish tap

UI must not assume success. Retry using stable session id and the same result payload; server returns `already_completed` plus the existing question-session id rather than duplicating it. A different payload after finalization is rejected and requires audited correction.

## Workbook changes after dry-run

Commit requires expected SHA-256 matching current uploaded bytes; otherwise rerun dry-run.

## Official LGS date announced

Admin updates official exam date/final anchor. Only future uncompleted final-period schedule can be shifted. Historical dates/completions never move.

## Daily target increase

Importer/domain creates Benchmark 20 plus extra target difference; trend remains comparable.

## No learned Math topics on 1 Oct

Use special baseline per N-001. From 2 Oct learned-topic constraint applies.

## Exact lesson mapping unavailable

Import dry-run fails for the affected executable video row. The agent must research the approved source and resolve one exact item; it may not substitute a different Math/Turkish playlist or guess by position.

## MEB page contains unseen topics

Do not expose the mixed set as a required task. Resolve a learned-topic-safe official item/set first; otherwise keep it unresolved/reference-only until safe material is found.
