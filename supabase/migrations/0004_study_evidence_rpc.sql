-- Narrow RPC boundary for student study evidence. No direct browser DML on evidence tables.

create or replace function private.current_student_required()
returns uuid
language plpgsql stable security definer
set search_path = public, auth
as $$
declare v_student uuid;
begin
  select private.student_for_current_device() into v_student;
  if v_student is null then raise exception 'active student device required'; end if;
  return v_student;
end;
$$;
revoke all on function private.current_student_required() from public;
grant execute on function private.current_student_required() to authenticated;

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
  v_today := (now() at time zone 'Europe/Istanbul')::date;
  v_local_time := (now() at time zone 'Europe/Istanbul')::time;
  if v_local_time > time '21:50' then raise exception 'no new required benchmark may start after 21:50'; end if;

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
      and t.task_type in ('daily_math_benchmark','daily_paragraph_benchmark')
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

create or replace function public.cancel_task_timer(p_session_id uuid)
returns void
language plpgsql security definer
set search_path = public, auth
as $$
declare
  v_student uuid;
  v_timer public.timer_sessions%rowtype;
begin
  v_student := private.current_student_required();
  select * into v_timer from public.timer_sessions where id=p_session_id and student_id=v_student for update;
  if not found then raise exception 'timer not found'; end if;
  if v_timer.status='cancelled' then return; end if;
  if v_timer.status<>'active' then raise exception 'timer is already finalized'; end if;
  update public.timer_sessions
     set status='cancelled', finished_at=now(), duration_seconds=greatest(0,floor(extract(epoch from now()-started_at))::int)
   where id=p_session_id;
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

  if v_task.task_type='daily_math_benchmark' then v_routine:='math';
  elsif v_task.task_type='daily_paragraph_benchmark' then v_routine:='paragraph';
  else raise exception 'timer is not a benchmark task'; end if;

  v_duration := greatest(0,floor(extract(epoch from now()-v_timer.started_at))::int);
  if v_duration > 14400 then
    update public.timer_sessions set status='flagged', finished_at=now(), duration_seconds=v_duration where id=v_timer.id;
    return query select 'flagged'::text,null::uuid,v_duration;
    return;
  end if;

  update public.timer_sessions set status='completed', finished_at=now(), duration_seconds=v_duration where id=v_timer.id;

  insert into public.question_sessions(student_id,task_id,timer_session_id,plan_date,routine,block_kind,
    question_count,correct_count,wrong_count,blank_count,duration_seconds)
  values(v_student,v_task.id,v_timer.id,v_plan_date,v_routine,'benchmark_20',20,p_correct,p_wrong,p_blank,v_duration)
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
  if v_task.planned_question_count is null or v_count<>v_task.planned_question_count then
    raise exception 'question result must equal the planned task question count';
  end if;
  if exists(select 1 from public.task_completions c where c.task_id=v_task.id and c.student_id=v_student and c.status='cancelled') then
    raise exception 'task was cancelled';
  end if;

  if v_task.task_type='topic_questions' then v_block:='topic';
  elsif v_task.task_type='mixed_questions' then v_block:='mixed';
  elsif v_task.task_type='meb_questions' then v_block:='meb';
  elsif v_task.task_type='daily_math_extra' then v_block:='extra'; v_routine:='math';
  elsif v_task.task_type='daily_paragraph_extra' then v_block:='extra'; v_routine:='paragraph';
  elsif v_task.task_type in ('branch_mock','full_mock') then v_block:='mock';
  else raise exception 'task does not accept a question result'; end if;

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

  if v_task.task_type not in ('topic_video','topic_review','mistake_review','weekly_review','progress_review','mock_analysis') then
    raise exception 'task requires a dedicated completion workflow';
  end if;
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

create or replace function public.add_mistake(
  p_question_session_id uuid,
  p_subject_id smallint,
  p_topic_id uuid,
  p_reason public.mistake_reason,
  p_note text default null
) returns uuid
language plpgsql security definer
set search_path = public, auth
as $$
declare
  v_student uuid;
  v_id uuid;
  v_topic_subject smallint;
begin
  v_student := private.current_student_required();
  if p_question_session_id is not null and not exists(
    select 1 from public.question_sessions q where q.id=p_question_session_id and q.student_id=v_student
  ) then raise exception 'question session does not belong to student'; end if;

  if p_topic_id is not null then
    select subject_id into v_topic_subject from public.topics where id=p_topic_id;
    if not found then raise exception 'topic not found'; end if;
    if p_subject_id is not null and p_subject_id<>v_topic_subject then raise exception 'topic/subject mismatch'; end if;
    p_subject_id := v_topic_subject;
  end if;

  insert into public.mistakes(student_id,question_session_id,subject_id,topic_id,reason,note)
  values(v_student,p_question_session_id,p_subject_id,p_topic_id,p_reason,nullif(trim(p_note),''))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.set_mistake_review_status(p_mistake_id uuid, p_status public.review_status)
returns void
language plpgsql security definer
set search_path = public, auth
as $$
declare v_student uuid;
begin
  v_student := private.current_student_required();
  if p_status not in ('open','reviewed','resolved') then raise exception 'invalid review status'; end if;
  update public.mistakes
     set status=p_status,
         resolved_at=case when p_status='resolved' then coalesce(resolved_at,now()) else null end
   where id=p_mistake_id and student_id=v_student;
  if not found then raise exception 'mistake not found'; end if;
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
  v_today := (now() at time zone 'Europe/Istanbul')::date;
  v_local_time := (now() at time zone 'Europe/Istanbul')::time;
  if v_local_time >= time '21:50' then raise exception 'reading cannot start during sleep preparation'; end if;

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

create or replace function public.finish_reading_session(p_session_id uuid, p_pages_read integer default null)
returns table(session_id uuid, duration_seconds integer)
language plpgsql security definer
set search_path = public, auth
as $$
declare
  v_student uuid;
  v_session public.reading_sessions%rowtype;
  v_duration integer;
begin
  if p_pages_read is not null and p_pages_read < 0 then raise exception 'pages_read cannot be negative'; end if;
  v_student := private.current_student_required();
  select * into v_session from public.reading_sessions
  where id=p_session_id and student_id=v_student for update;
  if not found then raise exception 'reading session not found'; end if;

  if v_session.finished_at is not null then
    return query select v_session.id,v_session.duration_seconds;
    return;
  end if;

  v_duration := greatest(0,floor(extract(epoch from now()-v_session.started_at))::int);
  update public.reading_sessions
  set finished_at=now(),duration_seconds=v_duration,pages_read=p_pages_read
  where id=v_session.id;
  return query select v_session.id,v_duration;
end;
$$;

revoke all on function public.start_task_timer(uuid) from public, anon;
revoke all on function public.cancel_task_timer(uuid) from public, anon;
revoke all on function public.finish_benchmark_20(uuid,integer,integer,integer) from public, anon;
revoke all on function public.record_question_task_result(uuid,integer,integer,integer) from public, anon;
revoke all on function public.complete_non_question_task(uuid) from public, anon;
revoke all on function public.add_mistake(uuid,smallint,uuid,public.mistake_reason,text) from public, anon;
revoke all on function public.set_mistake_review_status(uuid,public.review_status) from public, anon;
revoke all on function public.start_reading_session(text) from public, anon;
revoke all on function public.finish_reading_session(uuid,integer) from public, anon;
grant execute on function public.start_task_timer(uuid) to authenticated;
grant execute on function public.cancel_task_timer(uuid) to authenticated;
grant execute on function public.finish_benchmark_20(uuid,integer,integer,integer) to authenticated;
grant execute on function public.record_question_task_result(uuid,integer,integer,integer) to authenticated;
grant execute on function public.complete_non_question_task(uuid) to authenticated;
grant execute on function public.add_mistake(uuid,smallint,uuid,public.mistake_reason,text) to authenticated;
grant execute on function public.set_mistake_review_status(uuid,public.review_status) to authenticated;
grant execute on function public.start_reading_session(text) to authenticated;
grant execute on function public.finish_reading_session(uuid,integer) to authenticated;
