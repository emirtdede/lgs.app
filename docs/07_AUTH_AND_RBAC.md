# 07 — Authentication and RBAC

## Adults

Use permanent Supabase Auth identities. **Binding MVP decision: email + password with email verification.** Password reset is supported. Email OTP is not part of MVP; adding it later requires an explicit decision update and tests.

## Student device

No child email/phone required.

Pairing flow:

1. Owner/admin creates a pairing code for one student.
2. Server generates >=80-bit random token; UI shows it once.
3. DB stores only SHA-256 hash + student_id + expires_at + used_at.
4. Student device calls `signInAnonymously()` with CAPTCHA/Turnstile protection.
5. Student submits pairing code.
6. Server/RPC verifies hash, expiry, unused status and anonymous JWT.
7. Transaction inserts one `student_devices` mapping and consumes code.
8. Device receives student UI access through RLS mapping.

Pairing code validity: **10 minutes**.

## Roles

| Capability                         | Owner | Admin | Viewer | Student Device |
| ---------------------------------- | ----: | ----: | -----: | -------------: |
| View progress                      |   Yes |   Yes |    Yes |       Own only |
| Complete student learning evidence |    No |    No |     No |            Yes |
| Edit plan                          |   Yes |   Yes |     No |             No |
| Reschedule                         |   Yes |   Yes |     No |             No |
| Manage resources                   |   Yes |   Yes |     No |             No |
| Invite/manage adults               |   Yes |    No |     No |             No |
| Revoke student device              |   Yes |   Yes |     No |             No |
| Delete family                      |   Yes |    No |     No |             No |

Learning evidence is student-device authored in MVP. Owner/admin may reschedule or cancel plan tasks with audit, but cannot impersonate the student or fabricate completion/question evidence.

## Session/rendering rule

Authenticated anonymous-student pages are dynamically rendered. Never statically cache user metadata across anonymous users.

## Family owner lifecycle

- A family is created only through the transactional `create_family_with_owner` boundary, which creates the family and initial owner atomically.
- Every existing family must have **exactly one** owner at transaction commit. A unique partial index guarantees at most one; deferred DB constraint triggers guarantee at least one.
- Ownership transfer is owner-only, transactional, and requires the new owner to already be an adult member of the same family.
- Owner deletion/account removal must first transfer ownership or delete the family; the deferred invariant intentionally rejects orphaned families.
