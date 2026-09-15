# TypeScript / Architecture Rule

Use TypeScript strict. Domain invariants belong in `src/domain`, use-cases in `src/application`, database/server adapters in `src/server`; UI must not duplicate business logic. Avoid `any`, `@ts-ignore`, unchecked casts and non-null assertions. Validate all boundary input server-side. Use Europe/Istanbul for product-local date semantics. Keep Server/Client Components intentional. Never expose secrets to client bundles. Dependency changes require exact lockfile and tests; never use `--force` or `--legacy-peer-deps`.
