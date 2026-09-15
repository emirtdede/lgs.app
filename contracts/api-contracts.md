# Application Mutation Contracts

All mutations validate input server-side and map internal DB errors to stable application codes.

## `startBenchmark(taskId)`

Linked student-device principal; task must be today's effective exact-20 benchmark. A retry for the same active task returns the existing `{sessionId, startedAt}`; another active timer blocks start.

## `finishBenchmark(sessionId, correct, wrong, blank)`

Totals exactly 20. Returns `{status, questionSessionId, durationSeconds}` where status is `completed | already_completed | flagged`. Same-payload retry is idempotent. Different payload after finalization is rejected. >4h sanity case persists `flagged` and returns normally so the flag cannot be transaction-rolled-back by an exception.

## `cancelBenchmark(sessionId)`

Cancels an active timer; repeat cancel is idempotent. Finalized completed/flagged timer cannot be silently changed.

## `recordQuestionTaskResult(taskId, result)`

Student current-day only. Result total must equal `planned_question_count`. Allowed task types are topic/mixed/MEB/daily-extra/branch-mock/full-mock. Same result retry is idempotent; a different result after finalization is rejected.

## `completeNonQuestionTask(taskId)`

Student current-day only. Strict task-type allowlist: `topic_video | topic_review | mistake_review | weekly_review | progress_review | mock_analysis`. It cannot bypass a question result or dedicated timer workflow.

## `addMistake` / `setMistakeReviewStatus`

Student only; referenced question session must belong to the same student and topic/subject must agree. Direct table DML is not exposed.

## `startReading(title?)` / `finishReading(sessionId, pagesRead?)`

Student only. Reading starts only on today's active plan day after every required effective task is resolved `completed` or explicitly `cancelled`; never at/after 21:50. Finish duration is server-derived and retry-safe.

## `createPairingCode(studentId)`

Permanent owner/admin only. Revokes previous still-active code for that student, generates an 80-bit readable one-time token with 10-minute expiry, returns plaintext once, stores SHA-256 only.

## `claimPairingCode(code, deviceLabel)`

Anonymous authenticated principal only. Atomic claim/link. Status: `paired | already_paired | invalid_or_expired | rate_limited`. Failed attempts persist for DB-level per-principal throttling; CAPTCHA/Turnstile protects anonymous-auth creation against UID rotation.

## `revokeStudentDevice(deviceId)`

Permanent owner/admin only; immediate, idempotent, audited.

## `rescheduleTask(taskId, newDate, reason)`

Permanent owner/admin only. New date must exist in the same active plan and be today/future. Original date is immutable; only effective date changes. Completed/cancelled task or active timer blocks mutation. Mutation + audit rows are mandatory.

## `cancelPlanTask(taskId, reason)`

Permanent owner/admin only. Completed tasks cannot be cancelled; active timer must be resolved first. Cancellation is an excusal state, not completion/mastery. Repeat cancel is idempotent and audited once.

## `importPlan(file, resourceInventory, mode)`

Owner only for commit; admin may dry-run. `mode=dry_run|commit`. Commit requires exact workbook hash and exact resolved-resource-inventory hash from the accepted dry-run. N-001…N-010, exact video resolution and MEB learned-topic guard are mandatory.

## `createFamilyWithOwner(name)`

Permanent adult only. Creates family + first owner atomically; deferred DB invariant requires exactly one owner at commit.

## `transferFamilyOwnership(familyId, newOwnerAuthUserId)`

Current owner only. New owner must already be an adult member of that family. Transfer is atomic, audited and retry-safe.
