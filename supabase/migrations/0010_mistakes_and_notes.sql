-- Migration 0010: Mistakes pool enhancements, student notes, and display name update

-- 1. Update default student name to Yusuf
update public.students
set display_name = 'Yusuf'
where display_name = 'Öğrenci' or display_name = 'Yusuf';

-- 2. Add image_data, topic_name, and correct_solution to mistakes
alter table public.mistakes
  add column if not exists image_data text,
  add column if not exists topic_name text,
  add column if not exists correct_solution text;

-- 3. Create student_notes table for personal study journal
create table if not exists public.student_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  category text not null default 'general', -- 'telafi', 'extra_time', 'future_plan', 'general'
  title text not null,
  content text not null,
  target_date date,
  is_resolved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists student_notes_student_cat_idx on public.student_notes(student_id, category);

-- 4. Enable RLS and grants on student_notes
alter table public.student_notes enable row level security;

create policy student_notes_read on public.student_notes
  for select to authenticated, anon using (true);

create policy student_notes_insert on public.student_notes
  for insert to authenticated, anon with check (true);

create policy student_notes_update on public.student_notes
  for update to authenticated, anon using (true);

create policy student_notes_delete on public.student_notes
  for delete to authenticated, anon using (true);

grant select, insert, update, delete on public.student_notes to authenticated, anon;

-- 5. RPC to revert a completed task back to pending
create or replace function public.uncomplete_task(p_task_id uuid)
returns table(result_status text)
language plpgsql security definer
set search_path = public, auth
as $$
declare
  v_student uuid;
begin
  begin
    v_student := private.current_student_required();
  exception when others then
    select id into v_student from public.students where active = true limit 1;
  end;

  delete from public.task_completions
  where task_id = p_task_id and student_id = v_student;

  delete from public.question_sessions
  where task_id = p_task_id and student_id = v_student;

  return query select 'uncompleted'::text;
end;
$$;

grant execute on function public.uncomplete_task(uuid) to authenticated, anon;
