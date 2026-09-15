# Domain Enums

Use these exact canonical values in DB/code. Turkish labels are presentation only. DB-backed enums must remain synchronized with `supabase/migrations/0001_initial_schema.sql`.

```text
family_role: owner | admin | viewer
student_device_status: active | revoked
plan_status: draft | active | archived
task_type: topic_video | topic_review | topic_questions | mixed_questions | meb_questions | daily_math_benchmark | daily_math_extra | daily_paragraph_benchmark | daily_paragraph_extra | mistake_review | weekly_review | progress_review | branch_mock | full_mock | mock_analysis | reading | break | meal | sleep_prep
requirement_kind: required | optional
task_status: pending | in_progress | completed | overdue | rescheduled | cancelled
session_status: active | completed | cancelled | flagged
routine_type: math | paragraph
question_block_kind: benchmark_20 | extra | topic | mixed | meb | mock
mistake_reason: knowledge_gap | calculation_error | misread | attention | strategy | unknown
review_status: open | reviewed | resolved
resource_type: youtube_playlist | youtube_video | book | meb | other
plan_mutation_type: import | reschedule | cancel | restore | override
import_status: dry_run | committed | failed
```

## Binding notes

- `mixed_questions` is subject-scoped mixed/reinforcement work and must not be assigned an exact topic unless the source row proves one.
- `reading`, `break`, `meal`, and `sleep_prep` are optional/non-academic task types.
- `topic_video` and `meb_questions` require an exact resolved `resource_item` before production plan commit.
- Only `benchmark_20` blocks are eligible for the longitudinal speed trend.
