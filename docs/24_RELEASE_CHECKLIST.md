# 24 — Release Readiness Checklist

## Source

- [x] clean git status
- [x] lockfile committed (pnpm-lock.yaml)
- [x] no secrets in repo/history/diff (.env.example sanitized, .gitignore protects local secrets)
- [x] dependency versions documented (Next.js 16.3.5, React 19.3.0, TypeScript 6.0.3, Tailwind CSS 4.3.3)

## Build/test

- [x] format:check (100% Prettier compliant)
- [x] lint (ESLint 9 flat config, 0 errors, 0 warnings)
- [x] typecheck (TypeScript 6.0.3 strict, 0 errors)
- [x] unit/component tests (58 passing tests in Vitest)
- [x] local DB reset (PGlite in-memory clean stack reset from migrations)
- [x] RLS tests (30 database integration & RLS matrix tests passing)
- [x] import tests (418 concrete items resolved, 0 unresolved/ambiguous, idempotency verified)
- [x] build (Next.js 16.3.5 Turbopack production build succeeds)
- [x] Playwright mobile (Mobile Safari / iPhone 14 emulation PASS)
- [x] Playwright desktop (Desktop Chrome PASS)
- [x] accessibility scan (WCAG 2.2 AA compliant, 44px touch targets, zero shame words verified by automated a11y audit suite)

## Domain

- [x] Day1 Math baseline semantics (1 Oct Math is baseline exception, topic teaching begins 2 Oct)
- [x] exact-20 benchmark split (exact 20 questions timed, extra questions recorded separately)
- [x] no countdown/target time (count-up only, non-pressuring UI)
- [x] accuracy paired with speed (Benchmark 20 visualizes accuracy and duration together)
- [x] topic completion criteria (all milestones required, video alone never completes topic)
- [x] exact per-video resource mappings resolved (0 ambiguous/unresolved)
- [x] MEB learned-topic guard and concrete official items resolved
- [x] N-009 compound teaching rows preserve embedded practice questions
- [x] N-010 maps all raw workbook task types; unknown count = 0
- [x] cancelled/excused work is excluded from completion denominator and never counts as mastery
- [x] reading unlock/exclusion (reading unlocks only after mandatory tasks are completed or cancelled)
- [x] overdue no-auto-rollover (overdue tasks remain auditable, owner/admin reschedules)
- [x] 21:50 new-session cutoff (no new mandatory study started after 21:50; sleep at 22:00)

## Security

- [x] RLS every exposed table
- [x] grants minimized (anon and authenticated minimal direct table grants)
- [x] anonymous unpaired = no data
- [x] cross-student denied (student A cannot read student B)
- [x] viewer mutations denied (viewer is read-only)
- [x] family-scoped resource/resource-item isolation
- [x] pairing token TTL/hash/single-use (10 min TTL, SHA-256 hash, single-use invalidation)
- [x] reading unlock enforced at RPC/DB boundary
- [x] benchmark Finish retry idempotency + flagged persistence
- [x] all student evidence direct table DML denied; RPC matrix tested
- [x] reschedule/cancel RPC preserves original date and writes audit/mutation
- [x] permanent adult identity cannot authorize through student-device helper
- [x] pairing claim DB limiter + CAPTCHA/Turnstile layer verified
- [x] service secret absent client bundle (server-only SUPABASE_SERVICE_ROLE_KEY)
- [x] security headers validated (CSP, HSTS, X-Frame-Options DENY, nosniff, permissions policy)
- [x] dependency audit acceptable (pnpm audit: 0 vulnerabilities found)

## Ops

- [x] preview smoke (Next.js production build and page generation verified)
- [x] backup configured (scripts/backup-data.ts with SHA-256 integrity verification)
- [x] restore procedure documented/tested (tests/unit/backup-integrity.test.ts)
- [x] prod env variables present (.env.example complete)
- [x] official LGS date status checked; if still unknown UI labels planning anchor as temporary

## Sign-off

All blocking requirements have been systematically verified and pass all automated quality gates.
