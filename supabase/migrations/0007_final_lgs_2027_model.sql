-- Migration 0007: Align Schema with LGS 2027 Final 500 Plan
-- 1. Add new task types
-- 2. Relax legacy check constraints on tasks table
-- 3. Add is_timed, timed_question_target, general_playlist_url, resource_label to tasks
-- 4. Create mock_exams table for 60-day intensive mock period
-- 5. Update study evidence RPCs for same-topic Math timing and Paragraph routine

-- 1. Enum updates
alter type public.task_type add value if not exists 'paragraph_routine';
alter type public.task_type add value if not exists 'spaced_review';
alter type public.task_type add value if not exists 'extra_science_video';
alter type public.task_type add value if not exists 'extra_science_questions';
alter type public.task_type add value if not exists 'source_catchup';
alter type public.task_type add value if not exists 'full_mock_verbal';
alter type public.task_type add value if not exists 'mock_break';
alter type public.task_type add value if not exists 'full_mock_numerical';
alter type public.task_type add value if not exists 'mock_remediation';
alter type public.task_type add value if not exists 'exam_prep';

-- 2. Drop obsolete/rigid check constraints on tasks dynamically
do $$
declare
  r record;
begin
  for r in (
    select conname, pg_get_constraintdef(oid) as def
    from pg_constraint
    where conrelid = 'public.tasks'::regclass and contype = 'c'
  ) loop
    if r.def like '%topic_video%' or r.def like '%meb_questions%' or r.def like '%daily_math_benchmark%' or r.def like '%planned_question_count%' then
      execute 'alter table public.tasks drop constraint ' || quote_ident(r.conname);
    end if;
  end loop;
end $$;

-- Add flexible question count check: if question count is specified, it must be >= 0
alter table public.tasks add constraint tasks_planned_question_count_check check (planned_question_count is null or planned_question_count >= 0);

-- 3. Add columns to tasks
alter table public.tasks add column if not exists is_timed boolean not null default false;
alter table public.tasks add column if not exists timed_question_target integer default null check (timed_question_target is null or timed_question_target > 0);
alter table public.tasks add column if not exists general_playlist_url text default null check (general_playlist_url is null or general_playlist_url ~ '^https://');
alter table public.tasks add column if not exists resource_label text default null;

-- 4. Create mock_exams table
create table if not exists public.mock_exams (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  plan_day_id uuid not null references public.plan_days(id) on delete cascade,
  plan_date date not null,
  mock_number integer not null check (mock_number between 1 and 60),
  
  -- Sözel Bölüm (50 Soru)
  turkish_correct integer not null default 0 check (turkish_correct between 0 and 20),
  turkish_wrong integer not null default 0 check (turkish_wrong between 0 and 20),
  turkish_blank integer not null default 0 check (turkish_blank between 0 and 20),
  
  history_correct integer not null default 0 check (history_correct between 0 and 10),
  history_wrong integer not null default 0 check (history_wrong between 0 and 10),
  history_blank integer not null default 0 check (history_blank between 0 and 10),
  
  religion_correct integer not null default 0 check (religion_correct between 0 and 10),
  religion_wrong integer not null default 0 check (religion_wrong between 0 and 10),
  religion_blank integer not null default 0 check (religion_blank between 0 and 10),
  
  english_correct integer not null default 0 check (english_correct between 0 and 10),
  english_wrong integer not null default 0 check (english_wrong between 0 and 10),
  english_blank integer not null default 0 check (english_blank between 0 and 10),
  
  -- Sayısal Bölüm (40 Soru)
  math_correct integer not null default 0 check (math_correct between 0 and 20),
  math_wrong integer not null default 0 check (math_wrong between 0 and 20),
  math_blank integer not null default 0 check (math_blank between 0 and 20),
  
  science_correct integer not null default 0 check (science_correct between 0 and 20),
  science_wrong integer not null default 0 check (science_wrong between 0 and 20),
  science_blank integer not null default 0 check (science_blank between 0 and 20),
  
  -- Timing & Status
  duration_verbal_seconds integer check (duration_verbal_seconds is null or duration_verbal_seconds >= 0),
  duration_numerical_seconds integer check (duration_numerical_seconds is null or duration_numerical_seconds >= 0),
  
  identified_weak_topics text[],
  analysis_completed boolean not null default false,
  remediation_completed boolean not null default false,
  notes text,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(student_id, mock_number),
  unique(student_id, plan_date),
  
  check (turkish_correct + turkish_wrong + turkish_blank = 20),
  check (history_correct + history_wrong + history_blank = 10),
  check (religion_correct + religion_wrong + religion_blank = 10),
  check (english_correct + english_wrong + english_blank = 10),
  check (math_correct + math_wrong + math_blank = 20),
  check (science_correct + science_wrong + science_blank = 20)
);

alter table public.mock_exams enable row level security;

create policy mock_exams_student_select on public.mock_exams
  for select to authenticated
  using (student_id = private.student_for_current_device());

create policy mock_exams_student_insert on public.mock_exams
  for insert to authenticated
  with check (student_id = private.student_for_current_device());

create policy mock_exams_student_update on public.mock_exams
  for update to authenticated
  using (student_id = private.student_for_current_device())
  with check (student_id = private.student_for_current_device());

create policy mock_exams_family_select on public.mock_exams
  for select to authenticated
  using (
    student_id in (
      select s.id from public.students s
      join public.family_members m on m.family_id = s.family_id
      where m.auth_user_id = auth.uid()
    )
  );

grant select, insert, update on public.mock_exams to authenticated;

-- 5. Update study evidence RPCs
create or replace function public.start_task_timer(p_task_id uuid)
returns table(session_id uuid, started_at timestamptz)
language plpgsql security definer
set search_path = public, auth
as $$
declare
  v_student uuid;
  v_timer public.timer_sessions%rowtype;
  v_today date;
  v_local_time time;
begin
  v_student := private.current_student_required();
  v_today := coalesce(nullif(current_setting('app.override_today', true), '')::date, (now() at time zone 'Europe/Istanbul')::date);
  v_local_time := coalesce(nullif(current_setting('app.override_time', true), '')::time, (now() at time zone 'Europe/Istanbul')::time);
  if v_local_time > time '21:50' and nullif(current_setting('app.bypass_cutoff', true), '') is null then
    raise exception 'no new required benchmark may start after 21:50';
  end if;

  select * into v_timer from public.timer_sessions
   where student_id=v_student and status='active' for update;
  if found then
    if v_timer.task_id=p_task_id then
      return query select v_timer.id,v_timer.started_at;
      return;
    end if;
    raise exception 'an active timer already exists';
  end if;

  if not exists(
    select 1 from public.tasks t
    join public.plan_days original_day on original_day.id=t.plan_day_id
    join public.plan_days current_day on current_day.id=t.current_plan_day_id
    join public.study_plans p on p.id=original_day.study_plan_id
    where t.id=p_task_id and p.student_id=v_student and p.status='active'
      and current_day.study_plan_id=p.id and current_day.plan_date=v_today
      and (
        t.is_timed
        or t.task_type in ('daily_math_benchmark','daily_paragraph_benchmark','paragraph_routine','topic_questions')
      )
      and not exists(
        select 1 from public.task_completions c
        where c.task_id=t.id and c.student_id=v_student and c.status in ('completed','cancelled')
      )
  ) then raise exception 'task not timer-actionable for this student today'; end if;

  insert into public.timer_sessions(student_id,task_id,status)
  values(v_student,p_task_id,'active') returning * into v_timer;
  return query select v_timer.id,v_timer.started_at;
end;
$$;

create or replace function public.finish_benchmark_20(
  p_session_id uuid,
  p_correct integer,
  p_wrong integer,
  p_blank integer
) returns table(result_status text, question_session_id uuid, duration_seconds integer)
language plpgsql security definer
set search_path = public, auth
as $$
declare
  v_student uuid;
  v_timer public.timer_sessions%rowtype;
  v_task public.tasks%rowtype;
  v_plan_date date;
  v_routine public.routine_type;
  v_duration integer;
  v_q public.question_sessions%rowtype;
  v_subject_code text;
begin
  if p_correct < 0 or p_wrong < 0 or p_blank < 0 or p_correct+p_wrong+p_blank <> 20 then
    raise exception 'benchmark result must total exactly 20';
  end if;

  v_student := private.current_student_required();
  select * into v_timer from public.timer_sessions
   where id=p_session_id and student_id=v_student for update;
  if not found then raise exception 'timer not found'; end if;

  if v_timer.status='completed' then
    select * into v_q from public.question_sessions where timer_session_id=v_timer.id;
    if not found then raise exception 'completed timer is missing question evidence'; end if;
    if v_q.correct_count<>p_correct or v_q.wrong_count<>p_wrong or v_q.blank_count<>p_blank then
      raise exception 'benchmark already finalized with different result';
    end if;
    return query select 'already_completed'::text,v_q.id,v_q.duration_seconds;
    return;
  elsif v_timer.status='flagged' then
    return query select 'flagged'::text,null::uuid,v_timer.duration_seconds;
    return;
  elsif v_timer.status='cancelled' then
    raise exception 'timer was cancelled';
  end if;

  select t.* into v_task
    from public.tasks t
    join public.plan_days original_day on original_day.id=t.plan_day_id
    join public.study_plans p on p.id=original_day.study_plan_id
   where t.id=v_timer.task_id and p.student_id=v_student and p.status='active';
  if not found then raise exception 'timer task not found for active student plan'; end if;

  select d.plan_date into v_plan_date
    from public.plan_days d
   where d.id=v_task.current_plan_day_id;
  if not found then raise exception 'timer plan day not found'; end if;

  select code into v_subject_code from public.subjects where id=v_task.subject_id;

  if v_task.task_type in ('daily_math_benchmark') or (v_subject_code='matematik') then
    v_routine:='math';
  elsif v_task.task_type in ('daily_paragraph_benchmark','paragraph_routine') or (v_subject_code='turkce' and v_task.task_type='paragraph_routine') then
    v_routine:='paragraph';
  else
    v_routine:=null;
  end if;

  v_duration := greatest(0,floor(extract(epoch from now()-v_timer.started_at))::int);
  if v_duration > 14400 then
    update public.timer_sessions set status='flagged', finished_at=now(), duration_seconds=v_duration where id=v_timer.id;
    return query select 'flagged'::text,null::uuid,v_duration;
    return;
  end if;

  update public.timer_sessions set status='completed', finished_at=now(), duration_seconds=v_duration where id=v_timer.id;

  insert into public.question_sessions(student_id,task_id,timer_session_id,plan_date,routine,block_kind,
    question_count,correct_count,wrong_count,blank_count,duration_seconds)
  values(v_student,v_task.id,v_timer.id,v_plan_date,v_routine,
    case when v_routine is not null then 'benchmark_20'::public.question_block_kind else 'topic'::public.question_block_kind end,
    20,p_correct,p_wrong,p_blank,v_duration)
  returning * into v_q;

  insert into public.task_completions(task_id,student_id,status,completed_at,payload)
  values(v_task.id,v_student,'completed',now(),jsonb_build_object('question_session_id',v_q.id))
  on conflict(task_id,student_id) do update
    set status='completed',completed_at=excluded.completed_at,payload=excluded.payload,updated_at=now();

  return query select 'completed'::text,v_q.id,v_duration;
end;
$$;

create or replace function public.record_question_task_result(
  p_task_id uuid,
  p_correct integer,
  p_wrong integer,
  p_blank integer
) returns table(result_status text, question_session_id uuid, question_count integer)
language plpgsql security definer
set search_path = public, auth
as $$
declare
  v_student uuid;
  v_task public.tasks%rowtype;
  v_plan_date date;
  v_today date;
  v_count integer;
  v_block public.question_block_kind;
  v_routine public.routine_type;
  v_existing public.question_sessions%rowtype;
  v_subject_code text;
begin
  if p_correct < 0 or p_wrong < 0 or p_blank < 0 then raise exception 'question counts cannot be negative'; end if;
  v_count := p_correct+p_wrong+p_blank;
  if v_count <= 0 then raise exception 'question result cannot be empty'; end if;

  v_student := private.current_student_required();
  v_today := (now() at time zone 'Europe/Istanbul')::date;

  select t.* into v_task
  from public.tasks t
  join public.plan_days od on od.id=t.plan_day_id
  join public.study_plans p on p.id=od.study_plan_id
  where t.id=p_task_id and p.student_id=v_student and p.status='active';
  if not found then raise exception 'task not found for active student plan'; end if;

  select plan_date into v_plan_date from public.plan_days where id=v_task.current_plan_day_id;
  if v_plan_date<>v_today then raise exception 'question task is not scheduled for today'; end if;

  if exists(select 1 from public.task_completions c where c.task_id=v_task.id and c.student_id=v_student and c.status='cancelled') then
    raise exception 'task was cancelled';
  end if;

  select code into v_subject_code from public.subjects where id=v_task.subject_id;

  if v_task.task_type in ('topic_questions','extra_science_questions','source_catchup') then v_block:='topic';
  elsif v_task.task_type='mixed_questions' then v_block:='mixed';
  elsif v_task.task_type='meb_questions' then v_block:='meb';
  elsif v_task.task_type in ('daily_math_extra') then v_block:='extra'; v_routine:='math';
  elsif v_task.task_type in ('daily_paragraph_extra') then v_block:='extra'; v_routine:='paragraph';
  elsif v_task.task_type in ('paragraph_routine') then v_block:='benchmark_20'; v_routine:='paragraph';
  elsif v_task.task_type in ('branch_mock','full_mock','full_mock_verbal','full_mock_numerical') then v_block:='mock';
  else v_block:='topic'; end if;

  select * into v_existing from public.question_sessions
  where student_id=v_student and task_id=v_task.id and block_kind<>'benchmark_20';
  if found then
    if v_existing.correct_count=p_correct and v_existing.wrong_count=p_wrong and v_existing.blank_count=p_blank then
      return query select 'already_completed'::text,v_existing.id,v_existing.question_count;
      return;
    end if;
    raise exception 'question task already finalized with different result';
  end if;

  insert into public.question_sessions(student_id,task_id,plan_date,routine,block_kind,
    question_count,correct_count,wrong_count,blank_count)
  values(v_student,v_task.id,v_plan_date,v_routine,v_block,v_count,p_correct,p_wrong,p_blank)
  returning * into v_existing;

  insert into public.task_completions(task_id,student_id,status,completed_at,payload)
  values(v_task.id,v_student,'completed',now(),jsonb_build_object('question_session_id',v_existing.id))
  on conflict(task_id,student_id) do update
    set status='completed',completed_at=excluded.completed_at,payload=excluded.payload,updated_at=now();

  return query select 'completed'::text,v_existing.id,v_existing.question_count;
end;
$$;

create or replace function public.complete_non_question_task(p_task_id uuid)
returns table(result_status text, completed_at timestamptz)
language plpgsql security definer
set search_path = public, auth
as $$
declare
  v_student uuid;
  v_task public.tasks%rowtype;
  v_plan_date date;
  v_today date;
  v_existing public.task_completions%rowtype;
  v_now timestamptz;
begin
  v_student := private.current_student_required();
  v_today := (now() at time zone 'Europe/Istanbul')::date;

  select t.* into v_task
  from public.tasks t
  join public.plan_days od on od.id=t.plan_day_id
  join public.study_plans p on p.id=od.study_plan_id
  where t.id=p_task_id and p.student_id=v_student and p.status='active';
  if not found then raise exception 'task not found for active student plan'; end if;

  select plan_date into v_plan_date from public.plan_days where id=v_task.current_plan_day_id;
  if v_plan_date<>v_today then raise exception 'task is not scheduled for today'; end if;

  select * into v_existing from public.task_completions where task_id=v_task.id and student_id=v_student for update;
  if found and v_existing.status='completed' then
    return query select 'already_completed'::text,v_existing.completed_at;
    return;
  elsif found and v_existing.status='cancelled' then
    raise exception 'task was cancelled';
  end if;

  v_now := now();
  insert into public.task_completions(task_id,student_id,status,completed_at)
  values(v_task.id,v_student,'completed',v_now)
  on conflict(task_id,student_id) do update
    set status='completed',completed_at=excluded.completed_at,updated_at=now();
  return query select 'completed'::text,v_now;
end;
$$;

create or replace function public.start_reading_session(p_title text default null)
returns table(session_id uuid, started_at timestamptz)
language plpgsql security definer
set search_path = public, auth
as $$
declare
  v_student uuid;
  v_today date;
  v_local_time time;
  v_day uuid;
  v_existing public.reading_sessions%rowtype;
  v_new public.reading_sessions%rowtype;
begin
  v_student := private.current_student_required();
  v_today := coalesce(nullif(current_setting('app.override_today', true), '')::date, (now() at time zone 'Europe/Istanbul')::date);
  v_local_time := coalesce(nullif(current_setting('app.override_time', true), '')::time, (now() at time zone 'Europe/Istanbul')::time);
  if v_local_time >= time '21:50' and nullif(current_setting('app.bypass_cutoff', true), '') is null then
    raise exception 'reading cannot start during sleep preparation';
  end if;

  select d.id into v_day
  from public.plan_days d join public.study_plans p on p.id=d.study_plan_id
  where p.student_id=v_student and p.status='active' and d.plan_date=v_today;
  if not found then raise exception 'no active plan day for today'; end if;

  if exists(
    select 1 from public.tasks t
    where t.current_plan_day_id=v_day and t.required=true
      and not exists(
        select 1 from public.task_completions c
        where c.task_id=t.id and c.student_id=v_student and c.status in ('completed','cancelled')
      )
  ) then raise exception 'reading is locked until required tasks are resolved'; end if;

  select * into v_existing from public.reading_sessions
  where student_id=v_student and finished_at is null for update;
  if found then
    return query select v_existing.id,v_existing.started_at;
    return;
  end if;

  insert into public.reading_sessions(student_id,plan_date,title,started_at)
  values(v_student,v_today,nullif(trim(p_title),''),now()) returning * into v_new;
  return query select v_new.id,v_new.started_at;
end;
$$;

revoke all on function public.start_reading_session(text) from public;
grant execute on function public.start_reading_session(text) to authenticated;

revoke all on function public.start_task_timer(uuid) from public;
grant execute on function public.start_task_timer(uuid) to authenticated;

revoke all on function public.finish_benchmark_20(uuid, integer, integer, integer) from public;
grant execute on function public.finish_benchmark_20(uuid, integer, integer, integer) to authenticated;

revoke all on function public.record_question_task_result(uuid, integer, integer, integer) from public;
grant execute on function public.record_question_task_result(uuid, integer, integer, integer) to authenticated;

revoke all on function public.complete_non_question_task(uuid) from public;
grant execute on function public.complete_non_question_task(uuid) to authenticated;
