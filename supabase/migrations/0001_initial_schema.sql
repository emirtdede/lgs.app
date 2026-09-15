create extension if not exists pgcrypto;
create schema if not exists private;

create type public.family_role as enum ('owner','admin','viewer');
create type public.device_status as enum ('active','revoked');
create type public.plan_status as enum ('draft','active','archived');
create type public.task_status as enum ('pending','in_progress','completed','overdue','rescheduled','cancelled');
create type public.session_status as enum ('active','completed','cancelled','flagged');
create type public.routine_type as enum ('math','paragraph');
create type public.question_block_kind as enum ('benchmark_20','extra','topic','mixed','meb','mock');
create type public.import_status as enum ('dry_run','committed','failed');
create type public.task_type as enum (
  'topic_video','topic_review','topic_questions','mixed_questions','meb_questions',
  'daily_math_benchmark','daily_math_extra','daily_paragraph_benchmark','daily_paragraph_extra',
  'mistake_review','weekly_review','progress_review','branch_mock','full_mock','mock_analysis',
  'reading','break','meal','sleep_prep'
);
create type public.resource_type as enum ('youtube_playlist','youtube_video','book','meb','other');
create type public.mistake_reason as enum ('knowledge_gap','calculation_error','misread','attention','strategy','unknown');
create type public.review_status as enum ('open','reviewed','resolved');
create type public.plan_mutation_type as enum ('import','reschedule','cancel','restore','override');

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  timezone text not null default 'Europe/Istanbul' check (timezone = 'Europe/Istanbul'),
  created_at timestamptz not null default now()
);

create table public.family_members (
  family_id uuid not null references public.families(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  role public.family_role not null,
  created_at timestamptz not null default now(),
  primary key (family_id, auth_user_id)
);
create unique index family_one_owner_idx on public.family_members(family_id) where role='owner';

create table public.students (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 80),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.student_devices (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  label text not null default 'Öğrenci Cihazı' check (char_length(trim(label)) between 1 and 80),
  status public.device_status not null default 'active',
  paired_at timestamptz not null default now(),
  revoked_at timestamptz,
  check ((status='active' and revoked_at is null) or (status='revoked' and revoked_at is not null))
);

create table public.pairing_codes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  code_hash text not null unique check (code_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  check (expires_at > created_at),
  check (used_at is null or used_at >= created_at),
  check (revoked_at is null or revoked_at >= created_at),
  check (used_at is null or revoked_at is null)
);

create table public.pairing_claim_attempts (
  id bigint generated always as identity primary key,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  attempted_at timestamptz not null default now(),
  success boolean not null default false
);
create index pairing_claim_attempts_uid_time_idx on public.pairing_claim_attempts(auth_user_id, attempted_at desc);

create table public.subjects (
  id smallint generated always as identity primary key,
  code text not null unique check (code ~ '^[a-z][a-z0-9_-]{1,31}$'),
  name_tr text not null unique
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  subject_id smallint not null references public.subjects(id),
  external_key text,
  name_tr text not null,
  prerequisite_topic_id uuid references public.topics(id),
  sort_order integer not null default 0 check (sort_order >= 0),
  unique(subject_id, name_tr)
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  subject_id smallint references public.subjects(id),
  resource_type public.resource_type not null,
  label text not null check (char_length(trim(label)) > 0),
  url text check (url is null or url ~ '^https://'),
  fixed_by_owner boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.resource_items (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  external_key text not null check (char_length(trim(external_key)) > 0),
  label text not null check (char_length(trim(label)) > 0),
  url text not null check (url ~ '^https://'),
  position integer not null check (position > 0),
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(resource_id, external_key),
  unique(resource_id, position),
  unique(id, resource_id)
);

create table public.study_plans (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  starts_on date not null,
  planning_anchor_end date,
  status public.plan_status not null default 'draft',
  source_workbook_sha256 text check(source_workbook_sha256 is null or source_workbook_sha256 ~ '^[a-f0-9]{64}$'),
  source_resource_inventory_sha256 text check(source_resource_inventory_sha256 is null or source_resource_inventory_sha256 ~ '^[a-f0-9]{64}$'),
  source_calendar_overrides_sha256 text check(source_calendar_overrides_sha256 is null or source_calendar_overrides_sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  check (planning_anchor_end is null or planning_anchor_end >= starts_on)
);
create unique index one_active_plan_per_student_idx on public.study_plans(student_id) where status='active';

create table public.plan_days (
  id uuid primary key default gen_random_uuid(),
  study_plan_id uuid not null references public.study_plans(id) on delete cascade,
  plan_date date not null,
  day_number integer not null check(day_number > 0),
  week_number integer not null check(week_number > 0),
  phase text not null check (char_length(trim(phase)) > 0),
  unique(study_plan_id, plan_date),
  unique(study_plan_id, day_number)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  plan_day_id uuid not null references public.plan_days(id) on delete cascade, -- immutable/original date
  current_plan_day_id uuid not null references public.plan_days(id) on delete restrict, -- effective date after audited reschedule
  external_task_id text not null check (char_length(trim(external_task_id)) > 0),
  task_group_key text not null check (char_length(trim(task_group_key)) > 0),
  subject_id smallint references public.subjects(id),
  topic_id uuid references public.topics(id),
  task_type public.task_type not null,
  title text not null check (char_length(trim(title)) > 0),
  planned_start time,
  planned_end time,
  planned_question_count integer check(planned_question_count is null or planned_question_count >= 0),
  required boolean not null default true,
  counts_toward_topic_completion boolean not null default false,
  sort_order integer not null default 0 check(sort_order >= 0),
  resource_id uuid references public.resources(id),
  resource_item_id uuid,
  source_sheet text not null check (char_length(trim(source_sheet)) > 0),
  source_row integer not null check (source_row >= 2),
  source_row_hash text not null check(source_row_hash ~ '^[a-f0-9]{64}$'),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(plan_day_id, external_task_id),
  foreign key (resource_item_id, resource_id) references public.resource_items(id, resource_id),
  check (resource_item_id is null or resource_id is not null),
  check (planned_start is null or planned_end is null or planned_end > planned_start),
  check (planned_end is null or planned_end <= time '22:00'),
  check (not required or planned_start is null or planned_start <= time '21:50'),
  check (task_type not in ('reading','break','meal','sleep_prep') or required = false),
  check (task_type <> 'topic_video' or (resource_id is not null and resource_item_id is not null)),
  check (task_type <> 'meb_questions' or (resource_id is not null and resource_item_id is not null)),
  check (task_type not in ('daily_math_benchmark','daily_paragraph_benchmark') or planned_question_count = 20),
  check (
    task_type not in (
      'topic_questions','mixed_questions','meb_questions','daily_math_benchmark','daily_math_extra',
      'daily_paragraph_benchmark','daily_paragraph_extra','branch_mock','full_mock'
    ) or planned_question_count > 0
  )
);
create index tasks_original_plan_day_idx on public.tasks(plan_day_id, sort_order);
create index tasks_current_plan_day_idx on public.tasks(current_plan_day_id, sort_order);
create index tasks_topic_milestone_idx on public.tasks(topic_id, counts_toward_topic_completion) where topic_id is not null;
create index resource_items_resource_idx on public.resource_items(resource_id, position);

create table public.task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status public.task_status not null,
  completed_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(task_id, student_id),
  check ((status='completed' and completed_at is not null) or status <> 'completed')
);

create table public.timer_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  status public.session_status not null default 'active',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_seconds integer check(duration_seconds is null or duration_seconds >= 0),
  created_at timestamptz not null default now(),
  check (
    (status='active' and finished_at is null and duration_seconds is null)
    or
    (status <> 'active' and finished_at is not null and duration_seconds is not null and finished_at >= started_at)
  )
);
create unique index one_active_timer_per_student_idx on public.timer_sessions(student_id) where status='active';

create table public.question_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  timer_session_id uuid references public.timer_sessions(id) on delete cascade,
  plan_date date not null,
  routine public.routine_type,
  block_kind public.question_block_kind not null,
  question_count integer not null check(question_count > 0),
  correct_count integer not null check(correct_count >= 0),
  wrong_count integer not null check(wrong_count >= 0),
  blank_count integer not null check(blank_count >= 0),
  duration_seconds integer check(duration_seconds is null or duration_seconds >= 0),
  finalized_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  check(correct_count + wrong_count + blank_count = question_count),
  check(block_kind <> 'benchmark_20' or question_count = 20),
  check(block_kind <> 'benchmark_20' or routine is not null),
  check(block_kind <> 'benchmark_20' or timer_session_id is not null),
  check(block_kind <> 'benchmark_20' or duration_seconds is not null),
  check(block_kind <> 'extra' or routine is not null)
);
create unique index one_daily_benchmark_per_routine_idx
  on public.question_sessions(student_id, plan_date, routine)
  where block_kind='benchmark_20';
create unique index question_session_timer_unique_idx
  on public.question_sessions(timer_session_id)
  where timer_session_id is not null;
create unique index one_nonbenchmark_question_result_per_task_idx
  on public.question_sessions(student_id, task_id)
  where task_id is not null and block_kind <> 'benchmark_20';
create index question_sessions_student_date_idx on public.question_sessions(student_id, plan_date);

create table public.mistakes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  question_session_id uuid references public.question_sessions(id) on delete set null,
  subject_id smallint references public.subjects(id),
  topic_id uuid references public.topics(id),
  reason public.mistake_reason not null,
  note text,
  status public.review_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check ((status='resolved') = (resolved_at is not null))
);
create index mistakes_student_status_idx on public.mistakes(student_id, status);

create table public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  plan_date date not null,
  title text,
  started_at timestamptz not null,
  finished_at timestamptz,
  duration_seconds integer check(duration_seconds is null or duration_seconds >= 0),
  pages_read integer check(pages_read is null or pages_read >= 0),
  created_at timestamptz not null default now(),
  check (finished_at is null or finished_at >= started_at),
  check ((finished_at is null and duration_seconds is null) or (finished_at is not null and duration_seconds is not null))
);
create unique index one_active_reading_per_student_idx on public.reading_sessions(student_id) where finished_at is null;

create table public.plan_mutations (
  id uuid primary key default gen_random_uuid(),
  study_plan_id uuid not null references public.study_plans(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  mutation_type public.plan_mutation_type not null,
  from_date date,
  to_date date,
  reason text not null check (char_length(trim(reason)) > 0),
  actor_auth_user_id uuid not null references auth.users(id),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index plan_mutations_plan_idx on public.plan_mutations(study_plan_id, created_at desc);

create table public.import_runs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  workbook_sha256 text not null check(workbook_sha256 ~ '^[a-f0-9]{64}$'),
  resource_inventory_sha256 text check(resource_inventory_sha256 is null or resource_inventory_sha256 ~ '^[a-f0-9]{64}$'),
  calendar_overrides_sha256 text check(calendar_overrides_sha256 is null or calendar_overrides_sha256 ~ '^[a-f0-9]{64}$'),
  status public.import_status not null,
  summary jsonb not null default '{}'::jsonb,
  actor_auth_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  actor_auth_user_id uuid references auth.users(id),
  action text not null check (char_length(trim(action)) > 0),
  entity_type text not null check (char_length(trim(entity_type)) > 0),
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
