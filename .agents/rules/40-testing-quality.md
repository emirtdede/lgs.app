# Test / Quality Rule

Every bug fix adds a regression test where feasible. Unit-test domain math/invariants; integration-test importer/use-cases; DB-test RLS; Playwright-test critical mobile/desktop flows. Never move to the next implementation milestone while current tests fail. A detected issue must be fixed and verified, not merely documented. Use deterministic fixtures and avoid assertions that depend on wall-clock local timezone outside Europe/Istanbul semantics.
