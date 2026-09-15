# 08 — Excel Import Specification

## Input

`data/LGS_2027_MASTER_PLAN.xlsx`

The workbook is retained byte-for-byte as planning-source evidence. It is **not** executable application data by itself. Canonical application semantics are the workbook plus this normalization specification plus the resolved resource inventory.

Canonical source sheets include `Gunluk_Gorevler`, `Ana_Takvim`, `Soru_Takibi`, `Haftalik_Degerlendirme`, subject roadmap sheets, `MEB_Takibi`, `Yanlis_Defteri`, `Kurallar`, `Kaynaklar`, and `Ayarlar`. The empty workbook `Dashboard` is noncanonical.

## Import pipeline

1. Parse workbook server-side/offline; never in the browser.
2. Validate workbook SHA-256 and mandatory sheets/headers.
3. Map headers by normalized exact Turkish labels.
4. Compute a deterministic SHA-256 for every raw source row.
5. Apply N-001…N-011 exactly.
6. Validate normalized rows against `contracts/plan-import.schema.json`.
7. Resolve exact executable resource items using `docs/32_RESOURCE_RESOLUTION_SPEC.md`.
8. Validate all domain invariants and unique identities.
9. Produce a dry-run diff/report; production writes remain zero.
10. Commit only with the exact workbook hash, exact resolved-resource-inventory hash, **and** exact `data/calendar_overrides.json` hash approved by the dry-run.
11. Commit transactionally; any validation/write failure rolls back the entire import.
12. Persist `import_runs`, hashes, normalization counts, and audit metadata.

## Stable identity and traceability

Raw `TaskID` is never discarded. Derived task identity is deterministic:

- ordinary one-to-one row → `externalTaskId = <TaskID>`
- daily target split → `<TaskID>:benchmark` and, when target >20, `<TaskID>:extra`
- compound teaching row split → `<TaskID>:video` and `<TaskID>:practice`

Every normalized child retains:

- raw TaskID,
- raw task type,
- source sheet/row,
- raw normalized row hash,
- `taskGroupKey = <TaskID>`.

Reimport rules:

- same child identity + same raw row hash + same normalization version → no-op;
- changed future/uncompleted row → audited diff/update;
- completed historical evidence is never silently rewritten;
- a changed normalization contract requires an explicit migration/version decision, not accidental reimport drift.

Initial import sets `tasks.plan_day_id == tasks.current_plan_day_id`. Later audited rescheduling changes only `current_plan_day_id`; original `plan_day_id` remains immutable.

## N-001 — Day-1 Math baseline

Raw plan has daily Math on 2026-10-01 while Math teaching begins on 2026-10-02. Normalize the 1 Oct Math benchmark to:

- `topic = null`
- label `Başlangıç Matematik Baz Çizgisi`
- exact 20-question benchmark
- no mastery evidence
- use the owner-approved **MUBA 8. Sınıf Başlangıç Matematik Soru Bankası (ISBN 9789756526972)** as the baseline question source; do not use future-topic MEB material for this one-time diagnostic

No learned topic may be inferred for this baseline.

## N-002 — Exact-20 daily benchmark split

Each raw `Günlük Rutin` row maps by subject:

- Matematik → `daily_math_benchmark`
- Türkçe/Paragraf → `daily_paragraph_benchmark`

The first child is always exactly 20 questions and uses `<TaskID>:benchmark`.

If raw target >20, create a second required child for `target - 20`:

- Math → `daily_math_extra`
- Paragraph → `daily_paragraph_extra`
- identity `<TaskID>:extra`

The extra child does not contribute to the speed benchmark trend. It may have no independent planned time because it shares the parent routine block.

## N-003 — Optional reading

Raw `İsteğe Bağlı` → `reading`, `required=false`. Reading is excluded from required-day completion and may start only after all required academic tasks for that effective local date are either completed or explicitly cancelled/excused.

## N-004 — Non-academic schedule blocks

- `Dinlenme` → `break`, optional
- `Serbest` → `break`, optional
- `Yemek / Mola` → `meal`, optional
- `Öğle / Serbest` → `meal`, optional
- `Uyku Hazırlığı` → `sleep_prep`, optional

These may render in timeline UI but are excluded from academic completion metrics.

## N-005 — Owner-selected source preservation

Preserve approved source URLs and source identity. Validate HTTPS and host allowlist. Math and Turkish fixed playlists are never replaced, silently rewritten, or substituted by the resolver.

## N-006 — Exact executable video resolution

Every normalized `topic_video` must bind to exactly one resolved `ResourceItem` containing stable external id, title, exact HTTPS URL, source key, playlist position, and evidence. Playlist-level URL alone is insufficient.

Zero matches or multiple defensible matches = blocking dry-run error. Never guess by visual order alone.

## N-007 — Learned-topic-safe MEB resolution

Raw `Resmî Soru Çözümü` → `meb_questions`, but only after resolving a concrete official item/set whose `allowedTopics` are all learned by the scheduled effective date.

A generic MEB page may remain source metadata but cannot satisfy an executable required task. Unresolved, mixed, or future-topic material blocks plan commit for that task.

## N-008 — Empty Dashboard

Workbook `Dashboard` is empty and ignored. Runtime dashboard/analytics are derived from database evidence only.

## N-009 — Compound `Konu Anlatımı` rows

The audited workbook has **108** `Konu Anlatımı` rows with a non-zero `Planlanan Soru`; the task text includes `+ 10 kısa pekiştirme sorusu`. They must not be imported as one video task because that would silently discard 1,080 planned questions.

Split each compound row into two required children in the same `taskGroupKey`:

1. `<TaskID>:video`
   - `taskType=topic_video`
   - exact resolved video item required
   - `plannedQuestionCount=0`
   - retains the source row's planned start/end
   - `countsTowardTopicCompletion=true`

2. `<TaskID>:practice`
   - `taskType=topic_questions`
   - same explicit topic
   - `plannedQuestionCount=<raw count>` (currently 10 in all 108 audited rows)
   - no independent planned start/end; it is sequential work inside the parent block
   - `countsTowardTopicCompletion=true`

Both child tasks must be completed for the compound block to be complete.

## N-010 — Exhaustive raw task-type mapping

The workbook currently contains exactly 18 raw `Görev Türü` values. Import must reject any unknown value instead of falling through to a generic type.

| Raw workbook value       | Canonical mapping                                         | Topic rule                                                                              |
| ------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `Günlük Rutin`           | N-002 benchmark (+ optional extra)                        | Day-1 Math per N-001; otherwise learned-topic pool metadata only                        |
| `İsteğe Bağlı`           | `reading`                                                 | none                                                                                    |
| `Konu Anlatımı`          | `topic_video`; N-009 child practice when raw questions >0 | explicit source topic                                                                   |
| `Konu Bitiş Testi`       | `topic_questions`                                         | explicit source topic; completion milestone                                             |
| `Pekiştirme`             | `mixed_questions`                                         | **null** unless source row itself names one exact topic; never infer `Günün ana konusu` |
| `Tekrar / Karışık Soru`  | `mixed_questions`                                         | null/multi-topic metadata                                                               |
| `Resmî Soru Çözümü`      | `meb_questions`                                           | N-007 exact learned-topic allowlist                                                     |
| `Yanlış Analizi`         | `mistake_review`                                          | none                                                                                    |
| `Haftalık Tekrar`        | `weekly_review`                                           | none                                                                                    |
| `Haftalık Değerlendirme` | `progress_review`                                         | none                                                                                    |
| `Değerlendirme`          | `progress_review`                                         | none                                                                                    |
| `Tam LGS Denemesi`       | `full_mock`                                               | none                                                                                    |
| `Deneme Analizi`         | `mock_analysis`                                           | none                                                                                    |
| `Dinlenme`               | `break`                                                   | none                                                                                    |
| `Serbest`                | `break`                                                   | none                                                                                    |
| `Yemek / Mola`           | `meal`                                                    | none                                                                                    |
| `Öğle / Serbest`         | `meal`                                                    | none                                                                                    |
| `Uyku Hazırlığı`         | `sleep_prep`                                              | none                                                                                    |

`Pekiştirme` remains a required question task but is treated as subject-scoped mixed reinforcement because the audited workbook often labels it only `Günün ana konusu`; guessing a topic would corrupt mastery analytics.

## N-011 — Verified calendar availability overrides

The workbook remains immutable source evidence. Apply `data/calendar_overrides.json` only to **effective availability/template placement**, never to curriculum order, task identity, source-resource choice, mastery or historical evidence.

Binding audited overrides:

- `2027-05-17` → `full_day` (Kurban Bayramı 2. gün)
- `2027-05-18` → `full_day` (Kurban Bayramı 3. gün)

For these two dates, rebuild the effective day layout using the same full-day scheduling template used by comparable plan days while preserving the same date's academic task set, relative task order, required flags and question targets. The transformation must remain conflict-free, must end by 22:00, and must not invent extra academic work.

The official evidence URL is stored with each override. Any future override requires a source, an explicit decision-log entry and a changed calendar-overrides hash.

## Topic-completion milestone binding

`countsTowardTopicCompletion=true` only for:

- every explicit `topic_video` for that topic,
- every N-009 terminal practice child,
- every explicit `Konu Bitiş Testi` normalized as `topic_questions`.

Generic mixed reinforcement, daily routines, MEB weekly validation, reviews, and denemeler do **not** become topic-completion prerequisites merely because they happen later.

A topic is complete only when every required configured milestone task for that topic is completed. Cancellation does not count as mastery and therefore cannot complete a topic.

## Dry-run report — mandatory contents

- workbook SHA-256
- resolved-resource-inventory SHA-256
- calendar-overrides SHA-256
- raw rows parsed/skipped
- normalized children created
- create/update/no-op counts
- counts for each N-001…N-011 rule
- raw task-type count and proof all values mapped
- compound-row count and derived practice question total
- errors with sheet/row/column and raw TaskID
- unresolved/ambiguous video and MEB mappings (must be zero for commit)
- task counts per effective date
- invariant summary

## Commit acceptance

Commit is forbidden unless:

- schema validation has zero errors,
- unknown raw task types = 0,
- unresolved executable resource items = 0,
- ambiguous executable resource items = 0,
- all exact MEB tasks are learned-topic-safe,
- same workbook/resource/calendar-override hashes as approved dry-run are supplied,
- reimport identity checks pass.

Importing the same source twice must create no duplicate plan, task, or evidence rows.
