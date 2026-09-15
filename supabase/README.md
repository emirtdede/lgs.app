# Supabase Scaffold

These migrations define the intended baseline, not permission to skip testing. The coding agent must run them on local Supabase, repair any SQL/version incompatibilities without weakening the model, and write RLS tests before considering M1 complete.

Structural writes (family creation, adult membership administration, pairing-code generation, plan import/reschedule) should be implemented through validated server functions/actions/RPCs and audited. Do not expose broad table mutation grants simply to make the UI easy.

V3 migration order includes `0005_plan_admin_rpc.sql` and `0006_family_lifecycle_rpc.sql`. Always replay from a clean local database and test deferred owner-cardinality behavior before deployment.
