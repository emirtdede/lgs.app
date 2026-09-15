---
name: design-supabase-rls
description: Designs and verifies Supabase schema, grants and RLS for family roles and anonymous student devices.
---

# Design Supabase RLS

Use local Supabase migrations. Every exposed table gets RLS plus minimal GRANTs. Do not rely on UI checks. Anonymous student Auth uses `authenticated`; require active device mapping. Adult membership uses family role. Create helper functions with controlled SECURITY DEFINER and fixed search_path. Keep service secret server-only. Write authorization matrix tests: owner/admin/viewer/student A/student B/unpaired anonymous/revoked/unauthenticated. Do not finish until every forbidden path is denied at DB level.
