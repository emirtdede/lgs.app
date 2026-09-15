# 25 — Threat Model

## Assets

- child study/progress data
- family membership and roles
- adult authentication sessions
- anonymous student device session
- plan integrity/history
- pairing codes
- Supabase secret/service credentials

## Trust boundaries

1. Browser ↔ Next/Vercel.
2. Browser ↔ Supabase Data/Auth APIs.
3. Next server ↔ Supabase privileged administrative path.
4. Excel workbook ↔ import parser/staging.
5. External links ↔ YouTube/MEB resources.

## Primary threats and controls

| Threat                                | Control                                                                                 |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| Student A reads Student B             | RLS by student device mapping + DB tests                                                |
| Viewer edits data                     | RLS/grant denial + UI hidden actions                                                    |
| Unpaired anonymous auth accesses data | active device mapping required                                                          |
| Pairing code guessed/replayed         | >=80-bit random, 10m TTL, hash-only, single-use, rate limit/CAPTCHA                     |
| Forged benchmark duration             | direct timer/question DML revoked; finish via DB RPC using server clock                 |
| Workbook injects invalid plan         | server-only parser, schema validation, invariant pass, transaction, URL validation      |
| Service key exposed                   | server-only env + client bundle scan                                                    |
| Cached anonymous metadata leaks       | dynamic rendering; no generic private-response SW caching                               |
| Plan history erased                   | mutation/audit append history                                                           |
| Dependency supply-chain issue         | lockfile, supported versions, audit, no forced peer install                             |
| XSS via notes/resource titles         | React escaping, no unsafe HTML, server validation                                       |
| CSRF/unauthorized mutation            | Supabase-authenticated action/RPC + origin/framework protections + RLS where applicable |

## Abuse assumptions

The student is not treated as hostile, but correctness must not rely on UI honesty. High-value evidence such as benchmark duration must be enforced at server/DB boundary.
