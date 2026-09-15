# 19 — Implementation Roadmap

## M0 — Bootstrap

Create Next app, pnpm lockfile, TypeScript strict, formatting/lint/testing scripts, env schema, CI baseline.

Gate: install + lint + typecheck + test + build.

## M1 — Data/Auth/RLS

Migrations, seed, adults, anonymous student pairing, RLS helper functions, policies, audit.

Gate: `supabase db reset` + authorization matrix tests.

## M2 — Plan Import

Workbook parser, schema validator, dry-run, normalizations, transactional upsert, import audit.

Gate: fixtures + Day1 + Benchmark split + idempotency + rollback tests.

## M3 — Student Core

Today, task actions, Benchmark 20, timer persistence, result form, extra block, daily completion.

Gate: mobile E2E + refresh timer E2E.

## M4 — Learning Workflows

Topics, prerequisites, MEB, mistakes, overdue, explicit reschedule, reading unlock.

Gate: invariant and reschedule audit tests.

## M5 — Adult Analytics

Dashboard, calendar, plan admin, charts, 30-day consistency, weak areas.

Gate: role and metric tests.

## M6 — PWA/UX/A11y

Manifest/icons/installability, responsive polish, dark/system mode if implemented, accessibility.

Gate: mobile/desktop E2E + a11y.

## M7 — Hardening

CSP/headers, rate limits, Turnstile, dependency audit, backups, observability.

Gate: security reviewer + database reviewer findings resolved.

## M8 — Release

Fresh checkout reproducibility, preview smoke, final traceability, release checklist.

Gate: all requirements PASS/verified.
