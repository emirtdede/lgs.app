-- RLS baseline. Keep policies + grants covered by automated authorization tests.

create or replace function private.is_anonymous_auth()
returns boolean language sql stable security definer set search_path = public, auth
as $$ select coalesce((auth.jwt()->>'is_anonymous')::boolean, false); $$;

create or replace function private.has_family_role(p_family uuid, p_roles public.family_role[])
returns boolean language sql stable security definer set search_path = public, auth
as $$
  select exists (
    select 1 from public.family_members fm
    where fm.family_id = p_family
      and fm.auth_user_id = auth.uid()
      and fm.role = any(p_roles)
  );
$$;

create or replace function private.student_for_current_device()
returns uuid language sql stable security definer set search_path = public, auth
as $$
  select sd.student_id from public.student_devices sd
  where sd.auth_user_id = auth.uid()
    and sd.status='active'
    and private.is_anonymous_auth()
  limit 1;
$$;

create or replace function private.can_read_student(p_student uuid)
returns boolean language sql stable security definer set search_path = public, auth
as $$
  select
    p_student = private.student_for_current_device()
    or exists (
      select 1 from public.students s
      join public.family_members fm on fm.family_id=s.family_id
      where s.id=p_student and fm.auth_user_id=auth.uid()
    );
$$;

create or replace function private.can_manage_student(p_student uuid)
returns boolean language sql stable security definer set search_path = public, auth
as $$
  select exists (
    select 1 from public.students s
    join public.family_members fm on fm.family_id=s.family_id
    where s.id=p_student and fm.auth_user_id=auth.uid() and fm.role in ('owner','admin')
  );
$$;

revoke all on function private.is_anonymous_auth() from public;
revoke all on function private.has_family_role(uuid, public.family_role[]) from public;
revoke all on function private.student_for_current_device() from public;
revoke all on function private.can_read_student(uuid) from public;
revoke all on function private.can_manage_student(uuid) from public;
grant execute on function private.is_anonymous_auth() to authenticated;
grant execute on function private.has_family_role(uuid, public.family_role[]) to authenticated;
grant execute on function private.student_for_current_device() to authenticated;
grant execute on function private.can_read_student(uuid) to authenticated;
grant execute on function private.can_manage_student(uuid) to authenticated;

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.students enable row level security;
alter table public.student_devices enable row level security;
alter table public.pairing_codes enable row level security;
alter table public.pairing_claim_attempts enable row level security;
alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.resources enable row level security;
alter table public.resource_items enable row level security;
alter table public.study_plans enable row level security;
alter table public.plan_days enable row level security;
alter table public.tasks enable row level security;
alter table public.task_completions enable row level security;
alter table public.timer_sessions enable row level security;
alter table public.question_sessions enable row level security;
alter table public.mistakes enable row level security;
alter table public.reading_sessions enable row level security;
alter table public.plan_mutations enable row level security;
alter table public.import_runs enable row level security;
alter table public.audit_events enable row level security;

revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

grant select on public.subjects, public.topics to authenticated;
grant select on public.families, public.family_members, public.students, public.student_devices,
  public.resources, public.resource_items, public.study_plans, public.plan_days, public.tasks, public.task_completions,
  public.timer_sessions, public.question_sessions, public.mistakes, public.reading_sessions,
  public.plan_mutations, public.import_runs, public.audit_events to authenticated;
-- All student evidence writes use narrow RPCs. Structural adult writes use validated server/RPC paths.

create policy families_read on public.families for select to authenticated
using (private.has_family_role(id, array['owner','admin','viewer']::public.family_role[]));

create policy members_read on public.family_members for select to authenticated
using (private.has_family_role(family_id, array['owner','admin','viewer']::public.family_role[]));

create policy students_read on public.students for select to authenticated
using (private.can_read_student(id));

create policy devices_read on public.student_devices for select to authenticated
using (auth_user_id=auth.uid() or private.can_manage_student(student_id));

create policy subjects_read on public.subjects for select to authenticated using (true);
create policy topics_read on public.topics for select to authenticated using (true);

create policy resources_read on public.resources for select to authenticated
using (
  private.has_family_role(family_id, array['owner','admin','viewer']::public.family_role[])
  or exists (
    select 1 from public.students s
    where s.id=private.student_for_current_device() and s.family_id=resources.family_id
  )
);

create policy resource_items_read on public.resource_items for select to authenticated
using (exists(
  select 1 from public.resources r
  where r.id=resource_items.resource_id
    and (
      private.has_family_role(r.family_id, array['owner','admin','viewer']::public.family_role[])
      or exists(select 1 from public.students s where s.id=private.student_for_current_device() and s.family_id=r.family_id)
    )
));

create policy plans_read on public.study_plans for select to authenticated
using (private.can_read_student(student_id));

create policy plan_days_read on public.plan_days for select to authenticated
using (exists(select 1 from public.study_plans p where p.id=study_plan_id and private.can_read_student(p.student_id)));

create policy tasks_read on public.tasks for select to authenticated
using (exists(
  select 1 from public.plan_days d join public.study_plans p on p.id=d.study_plan_id
  where d.id=tasks.plan_day_id and private.can_read_student(p.student_id)
));

create policy completions_read on public.task_completions for select to authenticated
using (private.can_read_student(student_id));
create policy timers_read on public.timer_sessions for select to authenticated
using (private.can_read_student(student_id));
create policy qs_read on public.question_sessions for select to authenticated
using (private.can_read_student(student_id));
create policy mistakes_read on public.mistakes for select to authenticated
using (private.can_read_student(student_id));
create policy reading_read on public.reading_sessions for select to authenticated
using (private.can_read_student(student_id));

create policy mutations_read on public.plan_mutations for select to authenticated
using(exists(select 1 from public.study_plans p where p.id=study_plan_id and private.can_read_student(p.student_id)));
create policy imports_read on public.import_runs for select to authenticated
using(private.has_family_role(family_id, array['owner','admin']::public.family_role[]));
create policy audit_read on public.audit_events for select to authenticated
using(private.has_family_role(family_id, array['owner','admin']::public.family_role[]));

-- Pairing codes and pairing-attempt rows are deliberately not directly readable/writable from browser roles.
-- Structural admin mutations and all student evidence writes use validated server/RPC paths.
