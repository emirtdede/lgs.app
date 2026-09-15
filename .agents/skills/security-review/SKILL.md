---
name: security-review
description: Performs a remedial security audit against project threat model, Supabase RLS and OWASP ASVS-oriented controls.
---

# Security Review

Audit secrets/client bundle, Auth, RLS/grants, anonymous-device isolation, pairing replay/expiry/rate limiting, input validation, authorization, CSP/headers, dependency vulnerabilities, logs, imports and audit paths. Attempt cross-student and viewer-write abuse cases. Rank findings P0-P3. The primary workflow must fix P0/P1 and correctness issues, add tests and rerun review. Never solve a failing access test by broadening data access without a canonical requirement.
