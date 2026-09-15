---
name: bootstrap-project
description: Bootstraps the LGS 2027 Next.js/Supabase repository with deterministic tooling, scripts and quality gates.
---

# Bootstrap Project

1. Read AGENTS.md and architecture docs.
2. Initialize Next.js App Router with TypeScript, Tailwind and `src/` layout using pnpm.
3. Pin Next 16.3.3, React/DOM 19.3.0, Node 24; do not force peer conflicts.
4. Create strict `tsconfig`, env validation, `.env.example`, formatting/lint/typecheck/test/build scripts.
5. Initialize local Supabase and reconcile packaged migrations with the installed CLI/Postgres version without weakening constraints.
6. Add Vitest, Testing Library and Playwright.
7. Create CI that runs deterministic quality gates.
8. Run install/lint/typecheck/test/build. Fix all failures before completing.
