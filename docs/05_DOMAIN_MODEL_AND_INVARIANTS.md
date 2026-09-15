# 05 — Domain Model and Invariants

## Entities

Family, AdultMember, Student, StudentDevice, StudyPlan, PlanDay, Subject, Topic, Resource, ResourceItem, Task, TaskCompletion, TimerSession, QuestionSession, Mistake, ReadingSession, PairingCode, PairingClaimAttempt, PlanMutation, AuditEvent, ImportRun.

## Time invariants

- Product timezone is `Europe/Istanbul`.
- Weekday availability begins at 16:00; school subject order is irrelevant to the plan.
- 22:00 means already in bed/asleep, not a study-finish target.
- No new required study session may start after 21:50.
- Original task date (`plan_day_id`) is immutable. Effective date (`current_plan_day_id`) may change only through audited owner/admin reschedule.

## Daily Math and Paragraph

- Each plan date has exactly one raw Math and one raw Paragraph daily routine.
- Daily target starts at at least 20 and may grow above 20.
- Longitudinal speed sample is always exactly 20; extra questions are a separate evidence block.
- Daily routine evidence is separate from topic-end question evidence.

## Benchmark 20

- Exactly 20 questions.
- `correct + wrong + blank = 20`.
- Timer counts **up** from zero; there is no countdown or target time.
- Authoritative duration is computed from trusted server timestamps.
- Only completed, non-flagged Benchmark-20 sessions feed speed trends.
- Extra, topic, mixed, MEB and mock question blocks never enter the Benchmark-20 speed trend.

## Day-1 Math exception

2026-10-01 Math Benchmark 20 is a foundation baseline only. It has no topic/mastery meaning. From 2026-10-02 onward routine pools may use only already learned material.

## Import semantics

- Workbook source remains unchanged for traceability.
- Application semantics require deterministic N-001…N-010 normalization from `docs/08_EXCEL_IMPORT_SPEC.md`.
- Unknown raw task types, unresolved executable resources, or ambiguous exact mappings block commit.
- Compound teaching rows must not lose their embedded question work.

## Topic progress

- Watching one video never completes a topic by itself.
- `counts_toward_topic_completion` is configured only on explicit topic milestones.
- A topic becomes complete only when **all required milestone tasks** for that topic are completed.
- Cancelled/excused milestone tasks do not constitute mastery and cannot complete the topic.
- Generic mixed practice, daily routine, MEB weekly validation and deneme work do not become mastery prerequisites by chronology alone.

## Resource resolution

- Workbook playlist/source URLs identify approved sources, not necessarily an exact executable item.
- Every `topic_video` and `meb_questions` task must bind to an exact `ResourceItem` before production plan commit.
- Fixed Math/Turkish playlists are immutable source choices.
- Ambiguous/missing mappings are blocking; never guess.
- MEB executable items must cover only topics learned by that effective date.

## Rescheduling and cancellation

- Missing work is not auto-copied to tomorrow.
- Owner/admin can explicitly reschedule with reason; original date is retained forever and effective date changes.
- Owner/admin can explicitly cancel/excuse a task with reason; cancellation is audit history, not fabricated completion.
- Completed tasks cannot be rescheduled/cancelled by the normal mutation path.
- Active timer must be resolved before reschedule/cancel.

## Reading

- Reading is optional and never part of required completion percentage.
- It unlocks only after every required task on the effective local date is resolved as `completed` or explicitly `cancelled`.
- No minimum reading duration exists.
- Reading cannot begin during the 21:50–22:00 sleep-preparation window.

## Privacy and motivation

- No public student identity, leaderboard, peer ranking, shame copy, ads, or coercive gamification.
- 500 points is a quality standard, not a pressure/failure label.
- Student compares current performance only with their own historical performance.

## Metrics

- `accuracy = correct / question_count` when `question_count > 0`.
- `seconds_per_question = duration_seconds / question_count`.
- `required_task_denominator = required academic tasks whose effective date is the measured date and status is not cancelled`.
- `day_completion = completed required academic tasks / required_task_denominator` when denominator >0.
- A day where every required academic task is cancelled/excused is an **excused day**, not a completed day, and is excluded from consistency numerator/denominator.
- `consistency_30d = completed eligible days / eligible non-excused plan days`.
- Speed improvement is never presented without adjacent accuracy context.
