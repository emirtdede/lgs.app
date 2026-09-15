# 00 — Decisions, Precedence and Conflict Resolution

Status: **Canonical / binding**

## Product decisions

| ID    | Decision                                                                                                                                                                                                                                            |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-001 | Product is a private family LGS 2027 learning tracker, not a public social app.                                                                                                                                                                     |
| D-002 | Primary client is mobile-first PWA; desktop is fully supported for family dashboards.                                                                                                                                                               |
| D-003 | UI language is Turkish. Internal code identifiers are English.                                                                                                                                                                                      |
| D-004 | Product timezone is `Europe/Istanbul`.                                                                                                                                                                                                              |
| D-005 | Plan begins `2026-10-01`. `2027-06-13` in the workbook is a planning anchor, not an asserted official LGS date. When MEB announces the official date, owner/admin may shift the final stabilization window without rewriting the completed history. |
| D-006 | School is **not** an academic dependency. It only creates weekday unavailability until 16:00.                                                                                                                                                       |
| D-007 | Sleep at 22:00 is hard. New mandatory sessions do not start after 21:50.                                                                                                                                                                            |
| D-008 | Math and Turkish playlists are fixed by the project owner and may not be replaced by the agent.                                                                                                                                                     |
| D-009 | Student starts from foundations. Do not skip prerequisite concepts merely because the learner is in 8th grade.                                                                                                                                      |
| D-010 | Daily Math and Paragraph routines are independent from topic-end question tasks.                                                                                                                                                                    |
| D-011 | Both daily routines start at >=20 questions.                                                                                                                                                                                                        |
| D-012 | Speed trend uses an **exact 20-question benchmark sample** even when the day's total target grows beyond 20.                                                                                                                                        |
| D-013 | Count-up only. No countdown and no target-time pressure.                                                                                                                                                                                            |
| D-014 | Every timed benchmark stores correct/wrong/blank and duration; speed without accuracy is never presented as improvement.                                                                                                                            |
| D-015 | 1 Oct Math is a baseline benchmark exception: 20 foundation-level questions, no mastery assumption. Topic teaching starts 2 Oct.                                                                                                                    |
| D-016 | Optional book reading is available only after all required daily tasks are complete and never affects day completion.                                                                                                                               |
| D-017 | Missed tasks remain overdue; they are never automatically added to tomorrow's load. Admin explicitly reschedules.                                                                                                                                   |
| D-018 | No leaderboard, peer ranking, public profile, streak-shame, ads, coins, loot boxes or social feed.                                                                                                                                                  |
| D-019 | “500 tam puan” is preparation-quality language, not a pass/fail outcome requirement.                                                                                                                                                                |
| D-020 | Child account does not require email/phone; student device uses anonymous auth + guardian pairing.                                                                                                                                                  |

## Source precedence

If two artifacts conflict, use the first applicable source:

1. Current explicit owner instruction.
2. This file.
3. `05_DOMAIN_MODEL_AND_INVARIANTS.md` and `10_TIMER_AND_BENCHMARK_SPEC.md`.
4. `08_EXCEL_IMPORT_SPEC.md` normalization rules.
5. Raw Excel plan.
6. PRD/SRS.
7. Architecture/UI docs.
8. Existing implementation.

Never silently choose the lower-precedence behavior.

## Change management

A binding decision can change only when the owner explicitly requests it. When changed:

1. update this document,
2. update affected requirements and contracts,
3. add a migration if data semantics change,
4. update tests,
5. record the change in `DECISION_LOG.md`.

## V3 binding inputs

For effective scheduling/import, `data/calendar_overrides.json` is a canonical, hash-bound input alongside the immutable workbook and resolved resource inventory. `docs/34_FINAL_PACKAGE_AUDIT.md` supersedes the historical V2 audit where they differ.
