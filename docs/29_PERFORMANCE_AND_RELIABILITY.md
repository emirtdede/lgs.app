# 29 — Performance and Reliability

## Performance priorities

The app is small-family scale; correctness beats premature infrastructure. Still:

- server queries are scoped by student/date and indexed,
- Today page fetches one local date plus minimal dependencies,
- charts fetch aggregated bounded ranges,
- source PDFs/Excel are not shipped to ordinary client bundle,
- route/code split via App Router naturally,
- no heavy animation framework required.

## Reliability

- all import writes transactional,
- timer start/finish RPCs atomic,
- unique constraints protect active timer and daily benchmark duplicates,
- Realtime is enhancement, not source of truth,
- refresh reconstructs state from DB,
- retries use idempotency for structural mutations/import.

## Targets

- no unbounded table scan on core Today/dashboard queries,
- mobile UI usable under moderate latency,
- P95 normal interactive navigation target <=2.5s after warm CDN where controllable,
- no client polling faster than needed; prefer event refresh/Revalidation or Realtime selectively.
