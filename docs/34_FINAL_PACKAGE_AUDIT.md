# 34 — Final Package Audit (V3)

Audit date: **2026-09-13**.

V3 supersedes V1/V2 and is the package that should be handed to Antigravity.

## Closed findings

1. Benchmark `flagged` persistence does not raise/rollback after the state change.
2. Benchmark Finish same-payload retry is idempotent.
3. Resource/resource-item reads are family-scoped.
4. Reading unlock is enforced through RPC; direct browser evidence DML is revoked.
5. Canonical DB enums/constraints are enforced.
6. Pairing uses 80-bit one-time tokens, 10-minute expiry, hash-only persistence and DB principal throttling; Turnstile remains the edge layer.
7. Exact video/MEB item resolution is a pre-commit gate.
8. Day-1 Math is an explicit non-mastery MUBA baseline.
9. Benchmark speed trend always compares exactly 20 questions; extras are separate.
10. Family ownership is **exactly one** at transaction commit via unique index + deferred constraint triggers + transactional lifecycle RPCs.
11. Only the paired student device authors learning evidence in MVP; adults manage plan structure but cannot fabricate completion.
12. New benchmark starts are rejected after 21:50 Europe/Istanbul.
13. 17–18 May 2027 public-holiday availability is corrected through hash-bound N-011 without mutating the workbook evidence snapshot.
14. Antigravity terminal remains `proceed-in-sandbox`; network is restricted to an explicit development/source domain allowlist rather than `read_url(*)`.
15. Manifest is regenerated only after all package edits, then package audit + ZIP integrity checks are run.

## Source/effective-plan policy

`data/LGS_2027_MASTER_PLAN.xlsx` remains byte-for-byte source evidence. Deterministic import normalizations are part of the product contract, not silent spreadsheet edits. The effective application plan is therefore the workbook **plus** the versioned normalization contract, exact resource inventory and `data/calendar_overrides.json`.

## External implementation-time gates

The finished application still must resolve exact public resource items, replay migrations against the installed Supabase/Postgres version, install compatible dependency patches, pass the complete test/RLS/E2E/accessibility/security gates, and update the final phase when MEB publishes the official LGS 2027 exam date. External facts are never guessed.
