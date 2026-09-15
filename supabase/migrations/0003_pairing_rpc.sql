create or replace function public.create_student_pairing_code(p_student_id uuid)
returns table(code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid;
  v_raw text;
  v_code text;
  v_hash text;
  v_expires timestamptz;
  v_family uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception 'authentication required'; end if;
  if coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then raise exception 'permanent adult auth required'; end if;
  if not private.can_manage_student(p_student_id) then raise exception 'forbidden'; end if;

  select family_id into v_family from public.students where id=p_student_id and active=true;
  if not found then raise exception 'active student not found'; end if;

  -- Keep only one active pairing code per student. Revocation is distinct from successful use.
  update public.pairing_codes
     set revoked_at=now()
   where pairing_codes.student_id=p_student_id and pairing_codes.used_at is null and pairing_codes.revoked_at is null and pairing_codes.expires_at > now();

  -- 20 hex chars = 80 bits of entropy. Hyphens only improve readability.
  v_raw := upper(substr(encode(gen_random_bytes(16),'hex'),1,20));
  v_code := substr(v_raw,1,5)||'-'||substr(v_raw,6,5)||'-'||substr(v_raw,11,5)||'-'||substr(v_raw,16,5);
  v_hash := encode(digest(v_code,'sha256'),'hex');
  v_expires := now() + interval '10 minutes';

  insert into public.pairing_codes(student_id,code_hash,expires_at,created_by)
  values(p_student_id,v_hash,v_expires,v_uid);

  insert into public.audit_events(family_id,actor_auth_user_id,action,entity_type,entity_id,details)
  values(v_family,v_uid,'pairing_code_created','student',p_student_id::text,jsonb_build_object('expires_at',v_expires));

  return query select v_code,v_expires;
end;
$$;

create or replace function public.claim_student_pairing_code(p_code text, p_device_label text default 'Öğrenci Cihazı')
returns table(result_status text, student_id uuid)
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_hash text;
  v_pair public.pairing_codes%rowtype;
  v_uid uuid;
  v_family uuid;
  v_attempt_id bigint;
  v_existing public.student_devices%rowtype;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception 'authentication required'; end if;
  if not coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'student pairing requires anonymous auth identity';
  end if;

  -- DB-level per-principal limiter. CAPTCHA/Turnstile on anonymous sign-up remains required as the
  -- second layer against attackers rotating anonymous identities.
  if (
    select count(*) from public.pairing_claim_attempts
    where auth_user_id=v_uid and attempted_at > now() - interval '10 minutes'
  ) >= 10 then
    return query select 'rate_limited'::text, null::uuid;
    return;
  end if;

  insert into public.pairing_claim_attempts(auth_user_id,success)
  values(v_uid,false) returning id into v_attempt_id;

  if p_code is null or char_length(trim(p_code)) < 10 then
    return query select 'invalid_or_expired'::text, null::uuid;
    return;
  end if;

  select * into v_existing
  from public.student_devices
  where auth_user_id=v_uid and status='active'
  for update;
  if found then
    return query select 'already_paired'::text, v_existing.student_id;
    return;
  end if;

  v_hash := encode(digest(upper(trim(p_code)), 'sha256'), 'hex');
  select * into v_pair
  from public.pairing_codes
  where code_hash=v_hash and used_at is null and revoked_at is null and expires_at > now()
  for update;
  if not found then
    return query select 'invalid_or_expired'::text, null::uuid;
    return;
  end if;

  insert into public.student_devices(student_id, auth_user_id, label, status, paired_at, revoked_at)
  values(
    v_pair.student_id,
    v_uid,
    left(coalesce(nullif(trim(p_device_label),''),'Öğrenci Cihazı'),80),
    'active',now(),null
  )
  on conflict(auth_user_id) do update
    set student_id=excluded.student_id,
        label=excluded.label,
        status='active',
        paired_at=now(),
        revoked_at=null;

  update public.pairing_codes set used_at=now() where id=v_pair.id;
  update public.pairing_claim_attempts set success=true where id=v_attempt_id;

  select family_id into v_family from public.students where id=v_pair.student_id;
  insert into public.audit_events(family_id,actor_auth_user_id,action,entity_type,entity_id,details)
  values(v_family,v_uid,'student_device_paired','student',v_pair.student_id::text,'{}'::jsonb);

  return query select 'paired'::text, v_pair.student_id;
end;
$$;

create or replace function public.revoke_student_device(p_device_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid;
  v_student uuid;
  v_family uuid;
  v_status public.device_status;
begin
  v_uid := auth.uid();
  if v_uid is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'permanent adult auth required'; end if;
  select sd.student_id,s.family_id,sd.status into v_student,v_family,v_status
  from public.student_devices sd join public.students s on s.id=sd.student_id
  where sd.id=p_device_id
  for update of sd;
  if not found then raise exception 'device not found'; end if;
  if not private.can_manage_student(v_student) then raise exception 'forbidden'; end if;
  if v_status='revoked' then return; end if;

  update public.student_devices
  set status='revoked', revoked_at=now()
  where id=p_device_id;

  insert into public.audit_events(family_id,actor_auth_user_id,action,entity_type,entity_id,details)
  values(v_family,v_uid,'student_device_revoked','student_device',p_device_id::text,'{}'::jsonb);
end;
$$;

revoke all on function public.create_student_pairing_code(uuid) from public, anon;
revoke all on function public.claim_student_pairing_code(text,text) from public, anon;
revoke all on function public.revoke_student_device(uuid) from public, anon;
grant execute on function public.create_student_pairing_code(uuid) to authenticated;
grant execute on function public.claim_student_pairing_code(text,text) to authenticated;
grant execute on function public.revoke_student_device(uuid) to authenticated;
