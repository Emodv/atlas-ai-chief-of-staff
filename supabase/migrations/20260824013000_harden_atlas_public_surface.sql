-- Atlas.Moda production security hardening.
-- Removes anonymous access to Atlas-owned tables, locks internal functions down,
-- enables RLS on the legacy invite table, and fixes mutable function search paths.

do $$
declare
  r record;
begin
  for r in
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename like 'atlas_%'
  loop
    execute format('revoke all privileges on table public.%I from anon', r.tablename);
  end loop;
end $$;

alter table public.atlas_alpha_invites enable row level security;
revoke all privileges on table public.atlas_alpha_invites from authenticated;

alter function public.atlas_preserve_human_decision_count() set search_path = public, pg_temp;
alter function public.atlas_sync_expected_value() set search_path = public, pg_temp;

revoke execute on function public.atlas_create_workspace_for_new_user() from public, anon, authenticated;
revoke execute on function public.atlas_require_alpha_invite() from public, anon, authenticated;
revoke execute on function public.atlas_current_user_key() from public, anon;
revoke execute on function public.atlas_preserve_human_decision_count() from public, anon, authenticated;
revoke execute on function public.atlas_sync_expected_value() from public, anon, authenticated;

grant execute on function public.atlas_current_user_key() to authenticated;
grant execute on function public.atlas_create_workspace_for_new_user() to service_role;
grant execute on function public.atlas_require_alpha_invite() to service_role;
grant execute on function public.atlas_preserve_human_decision_count() to service_role;
grant execute on function public.atlas_sync_expected_value() to service_role;
