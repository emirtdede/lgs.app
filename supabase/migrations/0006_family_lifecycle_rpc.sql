-- Family lifecycle RPCs + deferred exactly-one-owner invariant.
-- A partial unique index in 0001 guarantees at most one owner; these deferred
-- constraint triggers additionally guarantee every existing family has exactly one owner at COMMIT.

create or replace function private.assert_exactly_one_family_owner()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_family uuid;
  v_ids uuid[] := array[]::uuid[];
begin
  if tg_table_name='families' then
    if tg_op <> 'DELETE' then v_ids := array_append(v_ids,new.id); end if;
    if tg_op <> 'INSERT' then v_ids := array_append(v_ids,old.id); end if;
  elsif tg_table_name='family_members' then
    if tg_op <> 'DELETE' then v_ids := array_append(v_ids,new.family_id); end if;
    if tg_op <> 'INSERT' then v_ids := array_append(v_ids,old.family_id); end if;
  end if;

  foreach v_family in array v_ids loop
    if v_family is null then continue; end if;
    if exists(select 1 from public.families f where f.id=v_family) then
      if (select count(*) from public.family_members fm where fm.family_id=v_family and fm.role='owner') <> 1 then
        raise exception 'family % must have exactly one owner',v_family;
      end if;
    end if;
  end loop;
  return null;
end;
$$;

create constraint trigger families_exactly_one_owner_ct
  after insert or update on public.families
  deferrable initially deferred
  for each row execute function private.assert_exactly_one_family_owner();

create constraint trigger family_members_exactly_one_owner_ct
  after insert or update or delete on public.family_members
  deferrable initially deferred
  for each row execute function private.assert_exactly_one_family_owner();

create or replace function public.create_family_with_owner(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid;
  v_family uuid;
  v_name text;
begin
  v_uid := auth.uid();
  if v_uid is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
    raise exception 'permanent adult auth required';
  end if;
  v_name := nullif(trim(p_name),'');
  if v_name is null or char_length(v_name)>120 then raise exception 'invalid family name'; end if;

  insert into public.families(name) values(v_name) returning id into v_family;
  insert into public.family_members(family_id,auth_user_id,role) values(v_family,v_uid,'owner');
  insert into public.audit_events(family_id,actor_auth_user_id,action,entity_type,entity_id,details)
  values(v_family,v_uid,'family_created','family',v_family::text,'{}'::jsonb);
  return v_family;
end;
$$;

create or replace function public.transfer_family_ownership(p_family_id uuid,p_new_owner_auth_user_id uuid)
returns table(result_status text, previous_owner uuid, new_owner uuid)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid;
  v_current_owner uuid;
begin
  v_uid := auth.uid();
  if v_uid is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
    raise exception 'permanent adult auth required';
  end if;

  select auth_user_id into v_current_owner
  from public.family_members
  where family_id=p_family_id and role='owner'
  for update;
  if not found then raise exception 'family owner not found'; end if;
  if v_current_owner<>v_uid then raise exception 'only current owner may transfer ownership'; end if;

  if p_new_owner_auth_user_id=v_current_owner then
    return query select 'already_owner'::text,v_current_owner,v_current_owner;
    return;
  end if;
  if not exists(select 1 from public.family_members where family_id=p_family_id and auth_user_id=p_new_owner_auth_user_id) then
    raise exception 'new owner must already be an adult family member';
  end if;

  -- Order avoids temporary violation of the unique partial index. Deferred cardinality trigger
  -- evaluates at COMMIT, so a failure rolls the transaction back to the prior valid owner.
  update public.family_members set role='admin'
    where family_id=p_family_id and auth_user_id=v_current_owner;
  update public.family_members set role='owner'
    where family_id=p_family_id and auth_user_id=p_new_owner_auth_user_id;

  insert into public.audit_events(family_id,actor_auth_user_id,action,entity_type,entity_id,details)
  values(p_family_id,v_uid,'family_ownership_transferred','family',p_family_id::text,
    jsonb_build_object('previous_owner',v_current_owner,'new_owner',p_new_owner_auth_user_id));

  return query select 'transferred'::text,v_current_owner,p_new_owner_auth_user_id;
end;
$$;

revoke all on function private.assert_exactly_one_family_owner() from public;
revoke all on function public.create_family_with_owner(text) from public, anon;
revoke all on function public.transfer_family_ownership(uuid,uuid) from public, anon;
grant execute on function public.create_family_with_owner(text) to authenticated;
grant execute on function public.transfer_family_ownership(uuid,uuid) to authenticated;
