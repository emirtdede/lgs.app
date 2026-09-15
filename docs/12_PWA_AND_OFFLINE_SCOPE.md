# 12 — PWA and Offline Scope

## Binding MVP decision

MVP is a **mobile-first installable web app** using Next.js App Router and `app/manifest.ts`, deployed over HTTPS. Do not add a service-worker/offline framework merely because the product is called a PWA.

MVP installability requirements:

- `app/manifest.ts`
- 192×192 and 512×512 app icons plus maskable icon
- `display: standalone`
- appropriate `name`, `short_name`, `start_url`, theme/background values
- production HTTPS

## MVP service-worker decision

**No runtime service-worker caching in MVP.** This is deliberate:

- authenticated student/family data must not be accidentally cached across principals;
- full offline writes are not required;
- adding a service-worker framework creates a second caching/data-consistency surface with no current product need.

A service worker may be introduced only in a later approved offline/notification phase with explicit cache allowlists and security tests.

## Timer refresh/reopen behavior

The database `started_at` is authoritative. For UI continuity, the client may persist only a tiny non-secret timer pointer such as `{sessionId, startedAt}` in local storage. On app load it must reconcile against the server; server state wins. Clear the pointer on finish, cancel, sign-out, device revocation, or mismatch.

Do **not** persist private plan/result payloads in localStorage.

## Network loss

MVP is online-first:

- show a clear offline state;
- do not pretend a mutation succeeded while offline;
- keep an already-running timer visually advancing from the known server timestamp, but Finish requires network reconciliation;
- preserve user-entered result values in component memory while retrying when practical, without committing fake evidence.

## Phase-2 offline writes

If offline mutation support is later approved, require IndexedDB outbox, per-command idempotency key, authenticated-principal scoping, encryption/privacy review, conflict semantics, replay ordering, sign-out purge, and end-to-end failure/recovery tests before release.
