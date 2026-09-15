-- Audited owner/admin plan mutations. Original plan_day_id never changes.

create or replace function public.reschedule_task(
  p_task_id uuid,
  p_new_date date,
  p_reason text
) returns table(result_status text, original_date date, previous_date date, "current_date" date)
language plpgsql security definer
set search_path = public, auth
as $$
declare
  v_uid uuid;
  v_task public.tasks%rowtype;
  v_plan uuid;
  v_student uuid;
  v_family uuid;
  v_original_date date;
  v_previous_date date;
  v_target_day uuid;
  v_today date;
  v_reason text;
  v_completion public.task_completions%rowtype;
begin
  v_uid := auth.uid();
  if v_uid is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
    raise exception 'permanent adult auth required';
  end if;
  v_reason := nullif(trim(p_reason),'');
  if v_reason is null then raise exception 'reschedule reason is required'; end if;
  v_today := (now() at time zone 'Europe/Istanbul')::date;
  if p_new_date is null or p_new_date < v_today then raise exception 'new date must be today or later'; end if;

  select p.id, p.student_id, s.family_id, od.plan_date, cd.plan_date
    into v_plan, v_student, v_family, v_original_date, v_previous_date
  from public.tasks t
  join public.plan_days od on od.id=t.plan_day_id
  join public.plan_days cd on cd.id=t.current_plan_day_id
  join public.study_plans p on p.id=od.study_plan_id
  join public.students s on s.id=p.student_id
  where t.id=p_task_id and p.status='active'
  for update of t;
  if not found then raise exception 'task not found in active plan'; end if;
  if not private.can_manage_student(v_student) then raise exception 'forbidden'; end if;

  if v_previous_date=p_new_date then
    return query select 'already_scheduled'::text,v_original_date,v_previous_date,v_previous_date;
    return;
  end if;

  select * into v_completion
  from public.task_completions
  where task_id=p_task_id and student_id=v_student
  for update;
  if found and v_completion.status='completed' then raise exception 'completed task cannot be rescheduled'; end if;
  if found and v_completion.status='cancelled' then raise exception 'cancelled task cannot be rescheduled'; end if;
  if exists(select 1 from public.timer_sessions where task_id=p_task_id and student_id=v_student and status='active') then
    raise exception 'active timer must be cancelled or completed before reschedule';
  end if;

  select id into v_target_day
  from public.plan_days
  where study_plan_id=v_plan and plan_date=p_new_date;
  if not found then raise exception 'target date is outside the active plan calendar'; end if;

  update public.tasks set current_plan_day_id=v_target_day where id=p_task_id;
  insert into public.task_completions(task_id,student_id,status,payload)
  values(p_task_id,v_student,'rescheduled',jsonb_build_object('from_date',v_previous_date,'to_date',p_new_date))
  on conflict(task_id,student_id) do update
    set status='rescheduled',completed_at=null,payload=excluded.payload,updated_at=now();

  insert into public.plan_mutations(study_plan_id,task_id,mutation_type,from_date,to_date,reason,actor_auth_user_id)
  values(v_plan,p_task_id,'reschedule',v_previous_date,p_new_date,v_reason,v_uid);

  insert into public.audit_events(family_id,actor_auth_user_id,action,entity_type,entity_id,details)
  values(v_family,v_uid,'task_rescheduled','task',p_task_id::text,
    jsonb_build_object('original_date',v_original_date,'from_date',v_previous_date,'to_date',p_new_date,'reason',v_reason));

  return query select 'rescheduled'::text,v_original_date,v_previous_date,p_new_date;
end;
$$;

create or replace function public.cancel_plan_task(
  p_task_id uuid,
  p_reason text
) returns table(result_status text, plan_date date)
language plpgsql security definer
set search_path = public, auth
as $$
declare
  v_uid uuid;
  v_plan uuid;
  v_student uuid;
  v_family uuid;
  v_date date;
  v_reason text;
  v_completion public.task_completions%rowtype;
begin
  v_uid := auth.uid();
  if v_uid is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
    raise exception 'permanent adult auth required';
  end if;
  v_reason := nullif(trim(p_reason),'');
  if v_reason is null then raise exception 'cancellation reason is required'; end if;

  select p.id,p.student_id,s.family_id,cd.plan_date
    into v_plan,v_student,v_family,v_date
  from public.tasks t
  join public.plan_days od on od.id=t.plan_day_id
  join public.plan_days cd on cd.id=t.current_plan_day_id
  join public.study_plans p on p.id=od.study_plan_id
  join public.students s on s.id=p.student_id
  where t.id=p_task_id and p.status='active'
  for update of t;
  if not found then raise exception 'task not found in active plan'; end if;
  if not private.can_manage_student(v_student) then raise exception 'forbidden'; end if;

  select * into v_completion
  from public.task_completions
  where task_id=p_task_id and student_id=v_student
  for update;
  if found and v_completion.status='completed' then raise exception 'completed task cannot be cancelled'; end if;
  if found and v_completion.status='cancelled' then
    return query select 'already_cancelled'::text,v_date;
    return;
  end if;
  if exists(select 1 from public.timer_sessions where task_id=p_task_id and student_id=v_student and status='active') then
    raise exception 'active timer must be cancelled before task cancellation';
  end if;

  insert into public.task_completions(task_id,student_id,status,payload)
  values(p_task_id,v_student,'cancelled',jsonb_build_object('reason',v_reason))
  on conflict(task_id,student_id) do update
    set status='cancelled',completed_at=null,payload=excluded.payload,updated_at=now();

  insert into public.plan_mutations(study_plan_id,task_id,mutation_type,from_date,to_date,reason,actor_auth_user_id)
  values(v_plan,p_task_id,'cancel',v_date,null,v_reason,v_uid);

  insert into public.audit_events(family_id,actor_auth_user_id,action,entity_type,entity_id,details)
  values(v_family,v_uid,'task_cancelled','task',p_task_id::text,jsonb_build_object('date',v_date,'reason',v_reason));

  return query select 'cancelled'::text,v_date;
end;
$$;

revoke all on function public.reschedule_task(uuid,date,text) from public, anon;
revoke all on function public.cancel_plan_task(uuid,text) from public, anon;
grant execute on function public.reschedule_task(uuid,date,text) to authenticated;
grant execute on function public.cancel_plan_task(uuid,text) to authenticated;
