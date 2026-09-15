-- Migration 0008: Default family setup placeholder
-- Remote Supabase already initialized default family and student.
-- No-op for isolated migration test runners.
do $$
begin
  null;
end $$;
