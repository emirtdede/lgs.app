# 18 — Backup and Observability

## Backups

If Supabase Pro/Team/Enterprise: verify managed daily backups are active.

If Free: schedule encrypted logical backups using `supabase db dump` and store off-site. Minimum recommended for this project: nightly or at least daily while actively used; test restore periodically.

Storage objects, if later introduced, need separate backup because DB backups only cover storage metadata, not deleted object bytes.

## Observability

Privacy-first. Prefer structured application logs and Supabase/Vercel platform logs; no third-party behavior tracking required.

Track operational events:

- auth/pair failures
- import runs
- DB errors
- task mutation errors
- timer anomalies
- backup outcome

Do not log student answer text unless needed; this app only needs aggregate question results and mistake metadata.

## Health checks

- application health route with no private data
- DB connection health server-side
- latest backup timestamp visible to owner/admin if implemented
