# 04 — Architecture

## Stack

- Next.js 16.3.3 App Router
- React / React DOM 19.3.0 stable baseline
- Node.js 24 LTS
- TypeScript 6.x strict
- Tailwind CSS 4.x
- Supabase Auth/Postgres/RLS; Realtime only where it adds value
- pnpm + lockfile
- Vercel target

## Layers

```text
UI (app/, components/)
  ↓
Application use-cases (src/application/)
  ↓
Domain model + invariants (src/domain/)
  ↓
Repositories / server adapters (src/server/)
  ↓
Supabase/Postgres
```

UI must not reproduce domain math (completion, benchmark selection, authorization).

## Route groups

Use ASCII-only route-group/folder names to avoid known non-ASCII route-segment regressions. Visible Turkish labels come from UI text, not route directory names.

Suggested routes:

```text
/app
  /(auth)/login
  /(student)/today
  /(student)/plan
  /(student)/progress
  /(student)/mistakes
  /(adult)/dashboard
  /(adult)/calendar
  /(adult)/plan
  /(adult)/analytics
  /(adult)/mistakes
  /(adult)/resources
  /(adult)/settings
```

## Server boundaries

- mutations: server actions or route handlers with explicit Zod validation.
- authorization: database RLS is mandatory; server checks improve UX but never replace RLS.
- service secret: only in isolated server admin/import code; never browser.
- imports: staging/transactional server process, not client direct inserts.

## PWA

MVP includes manifest, installability, icons, standalone display and safe caching of immutable/static shell assets. Do **not** cache authenticated HTML/API responses in a generic service-worker cache.

Offline write reconciliation is Phase 2, not MVP release blocker. Timer refresh resilience is required online: session start lives in DB and elapsed time is recomputed. If offline support is later added, IndexedDB/outbox must have explicit conflict semantics.

## Realtime

Use optional Realtime subscription for adult Today/dashboard task completion. Core correctness must not depend on Realtime; page refresh must reconstruct correct state from DB.
