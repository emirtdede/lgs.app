-- 0011_performance_and_rls_optimizations.sql
-- Resolves Supabase Linter warnings:
-- 1. auth_rls_initplan: wrap auth.uid() in (select auth.uid()) for InitPlan caching
-- 2. multiple_permissive_policies: consolidate multiple permissive SELECT policies on mock_exams
-- 3. unindexed_foreign_keys: add covering indexes on foreign key columns

-- -------------------------------------------------------------
-- 1. RLS Optimization: student_devices
-- -------------------------------------------------------------
drop policy if exists devices_read on public.student_devices;
create policy devices_read on public.student_devices for select to authenticated
using (auth_user_id = (select auth.uid()) or private.can_manage_student(student_id));

-- -------------------------------------------------------------
-- 2. RLS Optimization & Consolidation: mock_exams
-- -------------------------------------------------------------
drop policy if exists mock_exams_family_select on public.mock_exams;
drop policy if exists mock_exams_student_select on public.mock_exams;
drop policy if exists mock_exams_select on public.mock_exams;

create policy mock_exams_select on public.mock_exams
  for select to authenticated
  using (
    student_id = private.student_for_current_device()
    or student_id in (
      select s.id from public.students s
      join public.family_members m on m.family_id = s.family_id
      where m.auth_user_id = (select auth.uid())
    )
  );

-- -------------------------------------------------------------
-- 3. Covering Indexes for Foreign Keys
-- -------------------------------------------------------------

-- audit_events
create index if not exists audit_events_actor_auth_user_id_idx on public.audit_events(actor_auth_user_id);
create index if not exists audit_events_family_id_idx on public.audit_events(family_id);

-- family_members
create index if not exists family_members_auth_user_id_idx on public.family_members(auth_user_id);

-- import_runs
create index if not exists import_runs_actor_auth_user_id_idx on public.import_runs(actor_auth_user_id);
create index if not exists import_runs_family_id_idx on public.import_runs(family_id);
create index if not exists import_runs_student_id_idx on public.import_runs(student_id);

-- mistakes
create index if not exists mistakes_question_session_id_idx on public.mistakes(question_session_id);
create index if not exists mistakes_subject_id_idx on public.mistakes(subject_id);
create index if not exists mistakes_topic_id_idx on public.mistakes(topic_id);

-- mock_exams
create index if not exists mock_exams_plan_day_id_idx on public.mock_exams(plan_day_id);

-- pairing_codes
create index if not exists pairing_codes_created_by_idx on public.pairing_codes(created_by);
create index if not exists pairing_codes_student_id_idx on public.pairing_codes(student_id);

-- plan_mutations
create index if not exists plan_mutations_actor_auth_user_id_idx on public.plan_mutations(actor_auth_user_id);
create index if not exists plan_mutations_task_id_idx on public.plan_mutations(task_id);

-- question_sessions
create index if not exists question_sessions_task_id_idx on public.question_sessions(task_id);

-- resources
create index if not exists resources_family_id_idx on public.resources(family_id);
create index if not exists resources_subject_id_idx on public.resources(subject_id);

-- student_devices
create index if not exists student_devices_student_id_idx on public.student_devices(student_id);

-- students
create index if not exists students_family_id_idx on public.students(family_id);

-- task_completions
create index if not exists task_completions_student_id_idx on public.task_completions(student_id);

-- tasks
create index if not exists tasks_resource_id_idx on public.tasks(resource_id);
create index if not exists tasks_resource_item_fkey_idx on public.tasks(resource_item_id, resource_id);
create index if not exists tasks_subject_id_idx on public.tasks(subject_id);

-- timer_sessions
create index if not exists timer_sessions_task_id_idx on public.timer_sessions(task_id);

-- topics
create index if not exists topics_prerequisite_topic_id_idx on public.topics(prerequisite_topic_id);
