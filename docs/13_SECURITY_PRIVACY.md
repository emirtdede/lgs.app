# 13 — Security and Privacy

Security baseline: OWASP ASVS 5.0-oriented controls appropriate to a private family application.

## Data minimization

Collect only:

- nickname/display name needed by family
- plan/progress/question data
- adult auth identifiers
- technical audit/security metadata

Do not require child email/phone. Do not collect precise location, contacts, microphone/camera, advertising IDs or third-party marketing analytics.

## Auth/security

- RLS everywhere.
- least-privilege GRANTs.
- service secret server-only.
- student anonymous auth paired to specific student.
- Turnstile/CAPTCHA for anonymous auth abuse protection.
- pairing token hash-only, 10-minute TTL, one use.
- rate-limit pairing claim and auth-sensitive endpoints.
- CSRF-safe server mutation approach consistent with Next/Supabase auth pattern.
- validate inputs with Zod server-side.
- avoid dangerous HTML injection; no unsanitized `dangerouslySetInnerHTML`.
- external URLs allowlisted where practical.

## Headers

Set appropriate production headers:

- Content-Security-Policy tuned to actual origins
- Referrer-Policy
- X-Content-Type-Options
- Permissions-Policy
- frame-ancestors via CSP
- Strict-Transport-Security on HTTPS production

Do not blindly copy a CSP that breaks Supabase/YouTube navigation; test it.

## Logging

Never log:

- passwords
- auth tokens
- service secrets
- pairing code plaintext

Audit logs store action metadata, IDs and before/after references where appropriate.

## Dependency security

- exact lockfile
- no `--force` / `--legacy-peer-deps`
- audit before release
- react/next security patches reviewed promptly

## Child privacy posture

This is a family-private tool. Apply privacy-by-design and data minimization. Legal compliance depends on deployment/operator context; do not present implementation as legal advice or automatic KVKK compliance.
