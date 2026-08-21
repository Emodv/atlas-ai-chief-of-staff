begin;
grant select, insert, update on table atlas_profile to authenticated;
grant select, insert, update on table atlas_runtime_state to authenticated;
grant select on table atlas_actions to authenticated;
grant select on table atlas_attention_outcomes to authenticated;
grant select on table atlas_opportunities to authenticated;
grant select, update on table atlas_workspaces to authenticated;
grant select on table atlas_workspace_members to authenticated;
commit;
