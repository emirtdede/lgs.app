-- Migration 0009: RPC enhancements for time overrides and reading session alignment

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

revoke all on function public.start_task_timer(uuid) from public;
grant execute on function public.start_task_timer(uuid) to authenticated;

revoke all on function public.start_reading_session(text) from public;
grant execute on function public.start_reading_session(text) to authenticated;
