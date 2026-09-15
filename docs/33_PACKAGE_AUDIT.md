# 33 — Package Audit (V2)

Audit date: **2026-09-13**.

## V1 findings corrected in V2

1. **Antigravity settings key/preset** — replaced invalid `nonWorkspaceFileAccess` with current `allowNonWorkspaceAccess`; changed unrestricted terminal `always-proceed` to `proceed-in-sandbox` while retaining autonomous artifact writes.
2. **Benchmark flag rollback** — V1 updated timer to `flagged` and then raised an exception, which would roll the update back. V2 returns a `flagged` result without raising after the state change.
3. **Finish retry idempotency** — V1 returned “active timer not found” after a lost successful response. V2 returns the existing finalized result for same-payload retries.
4. **Resource RLS** — V1 `resources_read` was effectively broad for any authenticated user. V2 makes resources family-scoped and adds inherited RLS for exact `resource_items`.
5. **Reading invariant** — V1 allowed direct student INSERT/UPDATE into `reading_sessions`, bypassing the “required work first” rule. V2 revokes direct writes and enforces unlock through RPC.
6. **Schema/document mismatch** — docs required `resource_items`, while V1 schema lacked the table. V2 adds it and binds `topic_video` tasks to exact items.
7. **Canonical enums/constraints** — task/resource/mistake/mutation text columns are now DB-enforced enums; benchmark/timer/time constraints are strengthened.
8. **Pairing operation gap** — V2 includes create/claim/revoke RPCs, 80-bit one-time code generation, 10-minute expiry and audit events. Rate limiting/CAPTCHA remain application-edge controls.
9. **Workbook exact-video gap** — audit found 240 topic-teaching rows but only 7 playlist-level URLs. V2 adds a mandatory exact-resource resolver and blocks ambiguous/unresolved mappings.
10. **MEB generic tracking gap** — generic weekly MEB rows may include unseen topics. V2 requires concrete learned-topic-safe official item resolution before required task creation.
11. **Empty workbook Dashboard** — source workbook Dashboard is empty. V2 explicitly marks it noncanonical/ignored; application dashboards derive from DB evidence.
12. **Day-1 Math raw wording** — raw workbook still says learned topics on 1 Oct although teaching begins 2 Oct. Source workbook remains unchanged for traceability; deterministic N-001 baseline normalization is binding.
13. **React baseline freshness** — updated from React 19.2.8 to stable React/DOM 19.3.0.
14. **Auth ambiguity** — removed “email/password or OTP”; MVP is now unambiguously email+password with verification.

## Workbook structural audit

- 17 sheets.
- 2,491 `Gunluk_Gorevler` task rows.
- 256 plan dates, 2026-10-01 through 2027-06-13.
- Exactly one Math + one Paragraph daily routine on every plan date.
- No planned time overlaps detected.
- No planned block ends after 22:00.
- Maximum required planned study duration found: 380 minutes on selected weekend days; weekends are full-day available by product decision.

## Remaining implementation-time gates (not ambiguities)

The package is a development specification, not the finished app. These facts must be produced/verified during implementation before release:

- exact public YouTube/MEB item inventory and evidence at that time;
- clean local Supabase migration replay and RLS matrix tests;
- package/dependency installation compatibility;
- production env credentials, CAPTCHA/Turnstile keys, Vercel/Supabase deployment settings;
- official LGS 2027 date when MEB publishes it.

None of those may be guessed. Missing external evidence blocks the affected release gate.
