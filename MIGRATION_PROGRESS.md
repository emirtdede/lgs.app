# MIGRATION PROGRESS — LGS 2027 FINAL STUDY PLAN

**Date**: 2026-09-14  
**Active Plan File**: `data/LGS_2027_MASTER_PLAN.xlsx` (Updated with Final 500 Plan)  
**Target Supabase Instance**: `https://zqnjqxwrvjahrezgdxcr.supabase.co` (`lgs-2027`, `eu-central-1`)  
**Status**: COMPLETED
---

## 1. Inspection & Analysis Checklist

- [x] Verified Supabase database credentials and connectivity (`zqnjqxwrvjahrezgdxcr`).
- [x] Inspect new workbook sheets, columns, date ranges, and row counts.
- [x] Verify 1 October 2026 start date and tasks in new workbook.
- [x] Verify 13 April 2027 learning phase cutoff.
- [x] Verify 14 April 2027 to 12 June 2027 (60 Mock Days).
- [x] Inspect third-subject rotation in new workbook (Fen -> Din -> İnkılap -> İngilizce, 0 errors across 195 days).
- [x] Identify obsolete code:
  - Separate "Matematik Günlük Rutini / Benchmark 20" task logic
  - Hardcoded mock fallback data (`buildDefaultTodayData()`)
  - Fake cards ("Çarpanlar ve Katlar" mock)
  - Unused exact YouTube video item resolution requirements

---

## 2. Domain & Schema Migration Plan

- [x] Update Domain Types & Schema:
  - Migration 0007 applied to Supabase: relaxed constraints, added `is_timed`, `timed_question_target`, `general_playlist_url`, `resource_label`, created `mock_exams` table, updated RPCs.
  - Migration 0008 applied: dropped deferred owner check triggers, bootstrapped default family and student.
- [x] Build Final Plan Importer:
  - `src/domain/plan-import/final-plan-importer.ts` created and verified.
  - Transactionally imported into remote Supabase (`zqnjqxwrvjahrezgdxcr`).
  - Exactly 256 plan days, 2,947 tasks, 2,005 mandatory, 942 optional, 390 timed first-20 tasks.
  - Verified 1 October 2026, 60 mock days (14.04 - 12.06), 13 June exam anchor.
  - Idempotency verified: re-running does not duplicate records.

---

## 3. UI & Client Refactoring

- [x] Student Today Screen (`src/components/student/`):
  - Removed independent Math daily benchmark card.
  - Implemented Math Topic Video -> Math Same-Topic Questions (first 20 timed).
  - Implemented Paragraph 20 Routine (first 20 timed).
  - Implemented Turkish Topic Video -> Turkish Topic Questions.
  - Implemented Third Subject Video -> Third Subject Questions.
  - Implemented "Oynatma Listesini Aç" general playlist button for video tasks.
  - Removed all hardcoded mock fallback tasks. Real loading/empty/offline states.
  - Handled pre-1-October state: "Plan 1 Ekim 2026 tarihinde başlıyor."
- [x] Mock Exam Workflow (`14 April - 12 June`):
  - Mock exam day UI (Full LGS Mock #1 to #60, score entry, error analysis, weak topic remediation).
- [x] Navigation & Responsive Layout:
  - Verified bottom nav, touch targets, mobile layouts (320px - 1440px).

---

## 4. Verification & Quality Gates

- [x] Import Count Validation (Excel vs DB: 256 days, 2,947 tasks, 390 timed first-20 tasks).
- [x] Automated Unit & Component Tests (`pnpm test`: 15 files, 64 tests passing).
- [x] Database Tests (`pnpm test:db`: 8 files, 30 tests passing).
- [x] TypeScript Typecheck (`pnpm typecheck`: 0 errors).
- [x] ESLint (`pnpm lint`: 0 errors).
- [x] Prettier Format Check (`pnpm format:check`: 100% clean).
- [x] Playwright E2E Tests (`pnpm test:e2e`: 18 tests passing on Desktop Chrome and Mobile Safari).
- [x] Production Build (`pnpm build`: Next.js 16 compiled successfully, 0 errors).
- [x] Generate `FINAL_PLAN_MIGRATION_REPORT.md`.
