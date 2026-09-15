# 11 — Analytics and Metrics

## Student-facing

- own progress only
- Benchmark-20 Math/Paragraph time trend
- Benchmark-20 accuracy trend
- actual question volume
- topic completion
- 30-day consistency
- mistake/review progress

## Adult-facing

- required academic task completion by day/week
- overdue inventory and age
- reschedule/cancellation history
- benchmark trends by routine
- subject question volume
- topic milestone state
- mistake categories

## Exact definitions

`academic_required_task`: `required=true` and task type is not `reading | break | meal | sleep_prep`.

`cancelled_task`: a task with `task_completions.status='cancelled'`. It is excused operationally but is **not** a completed/mastered task.

`eligible_day`: a plan date with at least one non-cancelled required academic task whose `current_plan_day_id` points to that date.

`excused_day`: a plan date that originally/effectively had required academic work but has zero remaining non-cancelled required academic tasks. It is excluded from consistency rather than counted as success.

`day_complete`: every non-cancelled required academic task effective on that date has `status='completed'`.

`day_completion_pct`: completed non-cancelled required academic tasks / all non-cancelled required academic tasks effective that date.

`consistency_30d`: completed eligible days / eligible days in the last 30 Europe/Istanbul local dates. Excused days are excluded from both numerator and denominator.

`benchmark_accuracy`: correct / 20.

`benchmark_seconds_per_question`: `duration_seconds / 20`.

`question_volume`: sum `question_sessions.question_count` over finalized, accepted question evidence. Never also add planned task question counts for the same evidence.

`topic_complete`: all required tasks for that topic with `counts_toward_topic_completion=true` are completed. Cancelled milestone tasks do not satisfy mastery.

## Benchmark quality

Only `block_kind='benchmark_20'` with completed, non-flagged timer evidence contributes to speed/accuracy trend. Extra blocks remain visible in volume but never contaminate the exact-20 trend.

## Reschedule semantics

Analytics use `current_plan_day_id` for current workload/day completion and retain `plan_day_id` for historical schedule/audit views. A rescheduled unfinished task is not counted twice.

## Data-quality prohibitions

Never mix:

- exact-20 benchmark with 25/30/35/40 total daily volume,
- flagged/cancelled timers with valid benchmark trend,
- planned target with actual submitted question count,
- optional reading/rest/meal/sleep blocks with academic completion,
- cancelled/excused work with mastery,
- original and effective date as if they were duplicate tasks.
