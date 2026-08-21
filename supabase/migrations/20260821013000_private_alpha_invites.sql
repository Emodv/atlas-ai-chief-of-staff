begin;

create extension if not exists pgcrypto;

create table if not exists atlas_alpha_invites (
  id uuid primary key default gen_random_uuid(),
  code_hash bytea not null unique,
  label text not null,
  allowed_email text,
  max_uses integer not null default 1 check (max_uses between 1 and 20),
  used_count integer not null default 0 check (used_count >= 0),
  expires_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists atlas_alpha_events (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists atlas_alpha_feedback (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  rating integer check (rating between 1 and 5),
  category text not null default 'general',
  feedback text not null,
  created_at timestamptz not null default now()
);

alter table atlas_alpha_events enable row level security;
alter table atlas_alpha_feedback enable row level security;

drop policy if exists atlas_alpha_events_workspace_isolation on atlas_alpha_events;
create policy atlas_alpha_events_workspace_isolation on atlas_alpha_events
for all to authenticated
using (user_key = public.atlas_current_user_key())
with check (user_key = public.atlas_current_user_key());

drop policy if exists atlas_alpha_feedback_workspace_isolation on atlas_alpha_feedback;
create policy atlas_alpha_feedback_workspace_isolation on atlas_alpha_feedback
for all to authenticated
using (user_key = public.atlas_current_user_key())
with check (user_key = public.atlas_current_user_key());

grant select, insert on atlas_alpha_events, atlas_alpha_feedback to authenticated;

create or replace function public.atlas_require_alpha_invite()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_code text;
  v_invite atlas_alpha_invites%rowtype;
begin
  v_code := nullif(trim(coalesce(new.raw_user_meta_data->>'atlas_invite_code', '')), '');
  if v_code is null then
    raise exception 'atlas_private_alpha_invite_required';
  end if;

  select * into v_invite
  from atlas_alpha_invites
  where code_hash = digest(v_code, 'sha256')
    and revoked_at is null
    and (expires_at is null or expires_at > now())
    and used_count < max_uses
    and (allowed_email is null or lower(allowed_email) = lower(new.email))
  for update;

  if v_invite.id is null then
    raise exception 'atlas_private_alpha_invite_invalid';
  end if;

  update atlas_alpha_invites
  set used_count = used_count + 1, last_used_at = now()
  where id = v_invite.id;

  new.raw_user_meta_data := (coalesce(new.raw_user_meta_data, '{}'::jsonb) - 'atlas_invite_code') || jsonb_build_object('atlas_alpha_invite_id', v_invite.id);
  return new;
end;
$$;

drop trigger if exists atlas_require_alpha_invite_before_signup on auth.users;
create trigger atlas_require_alpha_invite_before_signup
before insert on auth.users
for each row execute function public.atlas_require_alpha_invite();

commit;
