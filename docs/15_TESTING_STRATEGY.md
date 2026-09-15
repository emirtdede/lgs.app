# 15 — Testing Strategy

## Pyramid

### Unit

Domain calculations and invariants:

- benchmark exact 20
- target split 20 + extra
- day completion excludes optional
- accuracy/time math
- timezone date resolution
- topic completion criteria

### Component

- Today task rendering
- timer presentation from timestamps
- result validation
- locked reading
- role-based controls hidden/disabled appropriately

### DB/RLS

For every sensitive table test:

- student A cannot read/write student B
- viewer cannot mutate
- admin/owner permissions
- anonymous unpaired user gets zero student data
- revoked student device immediately loses access
- resource rows/items cannot cross family boundaries
- direct reading INSERT/UPDATE is denied; RPC unlock is enforced
- unauthenticated request gets zero private data
- secret role is not used in client tests

### Import

- valid workbook dry-run
- missing sheet/column
- duplicate TaskID
- invalid date/time
- Day-1 normalization
- target 25/30/35/40 benchmark split
- idempotent second import
- rollback on any error
- exact video mapping: zero/multi-match blocks commit
- MEB unresolved/unlearned-topic mapping blocks required task creation

### E2E Playwright

Required viewports:

- mobile ~390x844
- desktop ~1440x900

Critical paths:

1. owner login/import/dashboard
2. create pairing code
3. student anonymous pair
4. student completes Benchmark 20
5. refresh during running timer
6. retry Finish after simulated lost response returns the same finalized result
7. > 4h benchmark persists flagged state and is excluded from trends
8. complete topic task
9. day completion unlocks reading and direct pre-unlock DB write fails
10. missed task → adult reschedule → audit
11. viewer cannot edit
12. device revoke

### Accessibility

Automated accessibility scans on critical routes + manual keyboard pass.

## Quality command contract

Repo must expose:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:db
pnpm test:e2e
pnpm build
pnpm quality
```

`pnpm quality` is blocking and aggregates all deterministic local gates except long-running optional audits.

## V3 mandatory regressions

Add automated tests for: deferred exactly-one-owner cardinality; family creation/ownership transfer rollback; adults unable to author student learning evidence; benchmark start blocked after 21:50; N-011 17–18 May full-day effective layout without academic task-set mutation; and dry-run/commit rejection when any of the three input hashes differ.
