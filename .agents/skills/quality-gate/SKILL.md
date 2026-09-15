---
name: quality-gate
description: Runs the complete local verification loop and requires fixes before milestone progression.
---

# Quality Gate

From a clean-ish working tree run format check, lint, typecheck, unit/component tests, local DB reset, RLS tests, import tests, production build and relevant Playwright E2E. For release include accessibility and dependency audit. On failure: root-cause → fix → regression test → rerun affected gate, then full gate. Record result in `docs/IMPLEMENTATION_STATUS.md`. Never mark milestone DONE on a red gate.
