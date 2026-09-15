# Database / Security Rule

Supabase exposed tables require RLS and minimal GRANTs. `anon` gets no private app table access. Anonymous student Auth users are `authenticated`, so authorization must require an active `student_devices` mapping and use `is_anonymous` where relevant. Service/secret key is server-only. Structural plan/member/pairing mutations use transactional validated server/RPC paths and audit. Pairing code plaintext is never persisted. Test cross-student, viewer-write, unpaired-anonymous and revoked-device denial. Do not weaken RLS to fix an application bug.

High-value evidence paths (benchmark timers/results and reading unlock) must be enforced through narrow RPCs, not browser table DML. Resource/resource-item reads are family-scoped. Flagged timer state and Finish retry semantics must be transactionally correct.
