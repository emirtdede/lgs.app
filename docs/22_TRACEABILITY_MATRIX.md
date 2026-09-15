# 22 — Traceability Matrix

| Requirement            | Domain/Spec | Implementation target     | Minimum test                              |
| ---------------------- | ----------- | ------------------------- | ----------------------------------------- |
| FR-001 family roles    | 07          | auth/membership/RLS       | DB role matrix                            |
| FR-002 student pairing | 07,13       | pairing RPC/server action | expiry/reuse/revoke tests                 |
| FR-003 Excel import    | 08          | importer                  | dry-run/idempotency/rollback              |
| FR-004 Today           | 09          | student routes            | mobile E2E                                |
| FR-005 task completion | 03,05       | application use-cases     | unit + E2E                                |
| FR-006 forward timer   | 10          | timer service/UI          | refresh E2E                               |
| FR-007 Benchmark 20    | 05,10       | question sessions         | exact-20 unit/DB                          |
| FR-008 extras          | 08,10       | normalized tasks          | target split tests                        |
| FR-009 topic progress  | 05          | topic projection          | prerequisite tests                        |
| FR-010 MEB             | 05,32       | task/resource-item model  | learned-topic + exact official item guard |
| FR-011 mistakes        | 02          | mistakes workflow         | CRUD isolation                            |
| FR-012 reschedule      | 05          | plan mutation             | audit E2E                                 |
| FR-013 reading         | 05,09,26    | reading UI + RPC          | UI + DB unlock tests                      |
| FR-014 analytics       | 11          | adult dashboard           | metric fixtures                           |
| FR-015 admin plan      | 03          | adult routes              | RBAC E2E                                  |
| FR-016 audit           | 06          | audit_events              | mutation tests                            |
| FR-017 PWA             | 12          | manifest/SW               | installability smoke                      |
| FR-018 accessibility   | 14          | all UI                    | axe + manual                              |
| FR-019 backups         | 18          | ops                       | restore runbook check                     |

| Resource exactness | 08,30,32 | resolver + resource_items | zero/multi-match blocking tests |
| Benchmark retry/flag | 10,26,31 | timer RPC | idempotency + flagged persistence DB tests |
