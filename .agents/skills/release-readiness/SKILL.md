---
name: release-readiness
description: Performs final release audit, deployment smoke preparation, backup checks and traceability closure.
---

# Release Readiness

Read `24_RELEASE_CHECKLIST.md`. Run all quality gates from a clean checkout. Invoke independent reviewers. Resolve findings. Verify migration replay, RLS, importer idempotency, mobile/desktop flows, PWA, headers, backups, env separation and no secrets. Update traceability/status. Do not deploy production without owner credentials/action, but make deployment deterministic and documented.
