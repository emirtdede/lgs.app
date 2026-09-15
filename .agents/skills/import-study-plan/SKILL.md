---
name: import-study-plan
description: Imports and validates the LGS_2027_MASTER_PLAN.xlsx workbook using deterministic N-001 through N-011 normalizations, exact resource resolution, dry-run hashing, and idempotent transactional commit.
---

# Import Study Plan

Read `docs/08_EXCEL_IMPORT_SPEC.md`, `docs/05_DOMAIN_MODEL_AND_INVARIANTS.md`, `docs/32_RESOURCE_RESOLUTION_SPEC.md`, `contracts/plan-import.schema.json`, `data/calendar_overrides.json`, `contracts/calendar-overrides.schema.json`, and the workbook before writing importer code.

Implement parse → source-row hash → N-001…N-011 normalization → JSON-schema/domain validation → exact resource resolution → dry-run diff → hash binding → transactional commit.

Non-negotiable checks:

- never partially commit an invalid workbook;
- retain raw TaskID/type, sheet/row/hash and deterministic derived ids;
- split daily targets into exact Benchmark-20 + extra;
- split all compound `Konu Anlatımı + questions` rows into video + practice children;
- map every raw `Görev Türü` through the exhaustive N-010 table and reject unknown values;
- treat generic `Pekiştirme` as subject-scoped mixed questions instead of guessing a topic;
- treat 1 Oct Math as baseline only;
- require exact video/MEB items before commit;
- initial original/effective plan day must be identical;
- verify idempotent reimport and rollback-on-error.

Produce machine-readable and human-readable dry-run reports and fixture tests for all eleven normalizations.
