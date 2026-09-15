# 26 — Server Actions / RPC Boundary

## Principle

Reads may use Supabase under RLS. Evidence and structural mutations use narrow typed RPC/server-action boundaries. There is no endpoint that accepts arbitrary table/field updates.

## Student commands

- `startBenchmark(taskId)` → `start_task_timer`
- `cancelBenchmark(sessionId)` → `cancel_task_timer`
- `finishBenchmark20(sessionId, correct, wrong, blank)` → `finish_benchmark_20`; handle `completed | already_completed | flagged`
- `recordQuestionTaskResult(taskId, correct, wrong, blank)` → `record_question_task_result`; covers topic, mixed, MEB, extra and mock question tasks according to task type
- `completeNonQuestionTask(taskId)` → `complete_non_question_task`; strict allowlist for video/review/analysis tasks
- `addMistake(...)` → `add_mistake`
- `setMistakeReviewStatus(...)` → `set_mistake_review_status`
- `startReading(title?)` / `finishReading(sessionId, pagesRead?)` → reading RPCs

Student commands are actionable only for the current effective Europe/Istanbul plan date. Student cannot reschedule/cancel plan tasks.

## Adult owner/admin commands

- `createPairingCode(studentId)` → `create_student_pairing_code`
- `revokeStudentDevice(deviceId)` → `revoke_student_device`
- `rescheduleTask(taskId, newDate, reason)` → `reschedule_task`; preserves original date, changes effective date, writes mutation + audit
- `cancelPlanTask(taskId, reason)` → `cancel_plan_task`; writes explicit excusal/cancellation, never fake completion
- `dryRunPlanImport(workbook, resourceInventory)` → server-only importer
- `commitPlanImport(workbookHash, resourceInventoryHash)` → server-only transactional import
- resource catalog/exact-item management → server-only validated path

Viewer has no mutation commands.

## Pairing claim

`claimPairingCode(code, deviceLabel)` → `claim_student_pairing_code` is available only to an anonymous authenticated student principal. Stable statuses: `paired | already_paired | invalid_or_expired | rate_limited`.

DB enforces a per-anonymous-UID claim-attempt window; CAPTCHA/Turnstile on anonymous account creation is a second layer against identity rotation.

## Import TOCTOU binding

Commit requires the exact workbook SHA-256 and exact resolved-resource-inventory SHA-256 from the successful dry-run. Any byte/inventory change invalidates approval and requires a new dry-run.

## Stable application errors

Map database/internal failures to stable app codes; do not leak SQL text. Minimum codes:

- `AUTH_REQUIRED`
- `FORBIDDEN`
- `PAIR_CODE_INVALID_OR_EXPIRED`
- `PAIR_RATE_LIMITED`
- `ACTIVE_TIMER_EXISTS`
- `BENCHMARK_MUST_TOTAL_20`
- `TASK_NOT_ACTIONABLE`
- `TASK_CANCELLED`
- `TASK_ALREADY_FINALIZED`
- `READING_LOCKED`
- `IMPORT_VALIDATION_FAILED`
- `IMPORT_RESOURCE_UNRESOLVED`
- `IMPORT_HASH_MISMATCH`
- `RESCHEDULE_TARGET_INVALID`

UI maps codes to calm Turkish copy.

## Family lifecycle boundaries

- `create_family_with_owner(name)` — permanent adult auth only; creates family + initial owner atomically.
- `transfer_family_ownership(familyId,newOwnerAuthUserId)` — current owner only; new owner must already be a member; audited and atomic.
- Student learning evidence cannot be authored by owner/admin in MVP. Administrative cancellation/reschedule is not completion evidence.
