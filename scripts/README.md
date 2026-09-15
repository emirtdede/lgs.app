# Scripts to be implemented by coding agent

Expected executable scripts after M0/M2:

- `scripts/import-plan.ts --file data/LGS_2027_MASTER_PLAN.xlsx --dry-run`
- `scripts/import-plan.ts --file ... --commit --expected-sha256 <hash>`
- `scripts/check-rls.ts` or SQL test suite wrapper
- `scripts/verify-release.ts`

Do not add ad-hoc one-off import logic to a page component. Scripts must call the same domain/application logic used by the server path.
