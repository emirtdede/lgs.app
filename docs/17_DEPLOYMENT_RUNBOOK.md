# 17 — Deployment Runbook

## Environments

- local: local Supabase + Next dev
- preview: Vercel preview + dedicated non-prod Supabase project
- production: Vercel + production Supabase

Never point PR previews at production DB.

## Secrets

`.env.example` documents names only. Actual values live in local secret store/Vercel/Supabase configuration.

Required categories:

- public Supabase URL/publishable key
- server Supabase secret key for restricted admin/import path
- Turnstile site/secret keys
- app origin

## Database

1. run migrations locally via `supabase db reset`.
2. run DB/RLS tests.
3. link non-prod and `supabase db push`.
4. verify.
5. production push only after release gate.

## Vercel

- Node 24 runtime.
- environment variables scoped per environment.
- production branch protected.
- build command runs type/build gates.

## Post-deploy smoke

- adult login
- student pair on test student
- Today data isolation
- Benchmark start/finish
- realtime/fallback refresh
- dashboard
- revoke device
- logs no secrets

Rollback app by previous Vercel deployment; DB rollback uses forward-fix migration unless migration is explicitly reversible and verified.
