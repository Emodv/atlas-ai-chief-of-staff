begin;

create table if not exists atlas_workspaces (
  id uuid primary key default gen_random_uuid(),
  user_key text not null unique,
  name text not null,
  autonomy_level text not null default 'suggest',
  execution_enabled boolean not null default false,
  kill_switch boolean not null default true,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint atlas_workspaces_autonomy_level_check check (autonomy_level in ('suggest','approval','autonomous'))
);

create table if not exists atlas_workspace_members (
  workspace_id uuid not null references atlas_workspaces(id) on delete cascade,
  auth_user_id uuid not null,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (workspace_id, auth_user_id),
  constraint atlas_workspace_members_role_check check (role in ('owner','admin','member'))
);

create index if not exists atlas_workspace_members_user_idx on atlas_workspace_members(auth_user_id, workspace_id);

insert into atlas_workspaces(user_key, name, autonomy_level, execution_enabled, kill_switch, onboarding_completed)
values ('primary', 'Primary Atlas Workspace', 'approval', true, false, true)
on conflict (user_key) do nothing;

create or replace function public.atlas_current_user_key()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select w.user_key
  from atlas_workspace_members m
  join atlas_workspaces w on w.id = m.workspace_id
  where m.auth_user_id = auth.uid()
  order by case m.role when 'owner' then 0 when 'admin' then 1 else 2 end, m.created_at
  limit 1
$$;

grant execute on function public.atlas_current_user_key() to authenticated;

create or replace function public.atlas_create_workspace_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id uuid;
  v_name text;
begin
  v_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'Atlas User'), '@', 1), 'Atlas User');
  insert into atlas_workspaces(user_key, name)
  values (new.id::text, v_name)
  returning id into v_workspace_id;

  insert into atlas_workspace_members(workspace_id, auth_user_id, role)
  values (v_workspace_id, new.id, 'owner');
  return new;
end;
$$;

drop trigger if exists atlas_on_auth_user_created on auth.users;
create trigger atlas_on_auth_user_created
after insert on auth.users
for each row execute function public.atlas_create_workspace_for_new_user();

alter table atlas_workspaces enable row level security;
alter table atlas_workspace_members enable row level security;

create policy atlas_workspaces_member_select on atlas_workspaces
for select to authenticated
using (exists (
  select 1 from atlas_workspace_members m
  where m.workspace_id = atlas_workspaces.id and m.auth_user_id = auth.uid()
));

create policy atlas_workspaces_owner_update on atlas_workspaces
for update to authenticated
using (exists (
  select 1 from atlas_workspace_members m
  where m.workspace_id = atlas_workspaces.id and m.auth_user_id = auth.uid() and m.role in ('owner','admin')
))
with check (exists (
  select 1 from atlas_workspace_members m
  where m.workspace_id = atlas_workspaces.id and m.auth_user_id = auth.uid() and m.role in ('owner','admin')
));

create policy atlas_workspace_members_self_select on atlas_workspace_members
for select to authenticated
using (auth_user_id = auth.uid());

-- Every end-user-facing Atlas table is isolated by the workspace's user_key.
do $$
declare
  t text;
begin
  foreach t in array array[
    'atlas_action_attempts','atlas_actions','atlas_approval_decisions','atlas_attention_outcomes',
    'atlas_connector_credentials','atlas_corrections','atlas_evidence','atlas_learning_events',
    'atlas_oauth_states','atlas_opportunities','atlas_opportunity_history','atlas_profile',
    'atlas_relationships','atlas_rules','atlas_runtime_state'
  ] loop
    if exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name=t and column_name='user_key'
    ) then
      execute format('drop policy if exists atlas_workspace_isolation on %I', t);
      execute format(
        'create policy atlas_workspace_isolation on %I for all to authenticated using (user_key = public.atlas_current_user_key()) with check (user_key = public.atlas_current_user_key())',
        t
      );
    end if;
  end loop;
end $$;

commit;
