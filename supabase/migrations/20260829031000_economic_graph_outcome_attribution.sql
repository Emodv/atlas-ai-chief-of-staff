begin;

alter table atlas_opportunities
  add column if not exists economic_value numeric(16,2),
  add column if not exists economic_currency text not null default 'CAD',
  add column if not exists close_probability numeric(6,5),
  add column if not exists expected_economic_value numeric(16,2),
  add column if not exists actual_economic_value numeric(16,2),
  add column if not exists income_stream text,
  add column if not exists source_asset text,
  add column if not exists human_minutes_actual integer,
  add column if not exists attention_efficiency numeric(16,2),
  add column if not exists realized_at timestamptz;

alter table atlas_opportunities drop constraint if exists atlas_opportunities_close_probability_check;
alter table atlas_opportunities
  add constraint atlas_opportunities_close_probability_check
  check (close_probability is null or (close_probability >= 0 and close_probability <= 1));

alter table atlas_opportunities drop constraint if exists atlas_opportunities_human_minutes_actual_check;
alter table atlas_opportunities
  add constraint atlas_opportunities_human_minutes_actual_check
  check (human_minutes_actual is null or human_minutes_actual >= 0);

create table if not exists atlas_economic_nodes (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  node_type text not null,
  label text not null,
  external_key text,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_key, node_type, external_key)
);

alter table atlas_economic_nodes drop constraint if exists atlas_economic_nodes_node_type_check;
alter table atlas_economic_nodes
  add constraint atlas_economic_nodes_node_type_check
  check (node_type in ('person','company','asset','income_stream','opportunity','action','outcome','relationship'));

create table if not exists atlas_economic_edges (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  source_node_id uuid not null references atlas_economic_nodes(id) on delete cascade,
  target_node_id uuid not null references atlas_economic_nodes(id) on delete cascade,
  relationship text not null,
  weight numeric(10,4) not null default 1,
  evidence_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_key, source_node_id, target_node_id, relationship)
);

create table if not exists atlas_economic_value_events (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  opportunity_id uuid references atlas_opportunities(id) on delete set null,
  action_id uuid references atlas_actions(id) on delete set null,
  kind text not null,
  amount numeric(16,2) not null,
  currency text not null default 'CAD',
  income_stream text,
  source_asset text,
  evidence jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table atlas_economic_value_events drop constraint if exists atlas_economic_value_events_kind_check;
alter table atlas_economic_value_events
  add constraint atlas_economic_value_events_kind_check
  check (kind in ('revenue','savings','cost','commission','compensation','asset_value'));

create index if not exists atlas_economic_nodes_user_type_idx
  on atlas_economic_nodes(user_key, node_type, updated_at desc);
create index if not exists atlas_economic_edges_user_source_idx
  on atlas_economic_edges(user_key, source_node_id);
create index if not exists atlas_economic_edges_user_target_idx
  on atlas_economic_edges(user_key, target_node_id);
create index if not exists atlas_economic_value_events_user_time_idx
  on atlas_economic_value_events(user_key, occurred_at desc);
create index if not exists atlas_economic_value_events_opportunity_idx
  on atlas_economic_value_events(user_key, opportunity_id, occurred_at desc);
create index if not exists atlas_opportunities_economic_rank_idx
  on atlas_opportunities(user_key, expected_economic_value desc nulls last, attention_efficiency desc nulls last);

alter table atlas_economic_nodes enable row level security;
alter table atlas_economic_edges enable row level security;
alter table atlas_economic_value_events enable row level security;

revoke all on table atlas_economic_nodes from anon;
revoke all on table atlas_economic_edges from anon;
revoke all on table atlas_economic_value_events from anon;

grant select, insert, update, delete on table atlas_economic_nodes to authenticated;
grant select, insert, update, delete on table atlas_economic_edges to authenticated;
grant select, insert, update, delete on table atlas_economic_value_events to authenticated;

drop policy if exists atlas_economic_nodes_workspace_isolation on atlas_economic_nodes;
create policy atlas_economic_nodes_workspace_isolation on atlas_economic_nodes
  for all to authenticated
  using (user_key = atlas_current_user_key())
  with check (user_key = atlas_current_user_key());

drop policy if exists atlas_economic_edges_workspace_isolation on atlas_economic_edges;
create policy atlas_economic_edges_workspace_isolation on atlas_economic_edges
  for all to authenticated
  using (user_key = atlas_current_user_key())
  with check (user_key = atlas_current_user_key());

drop policy if exists atlas_economic_value_events_workspace_isolation on atlas_economic_value_events;
create policy atlas_economic_value_events_workspace_isolation on atlas_economic_value_events
  for all to authenticated
  using (user_key = atlas_current_user_key())
  with check (user_key = atlas_current_user_key());

create or replace function atlas_sync_economic_metrics()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.economic_value is not null and new.close_probability is not null then
    new.expected_economic_value := round(new.economic_value * new.close_probability, 2);
  end if;

  if new.expected_economic_value is not null and coalesce(new.estimated_human_minutes, 0) > 0 then
    new.attention_efficiency := round(new.expected_economic_value / (new.estimated_human_minutes::numeric / 60), 2);
  else
    new.attention_efficiency := null;
  end if;

  return new;
end;
$$;

revoke all on function atlas_sync_economic_metrics() from public, anon, authenticated;
grant execute on function atlas_sync_economic_metrics() to service_role;

drop trigger if exists atlas_sync_economic_metrics_trigger on atlas_opportunities;
create trigger atlas_sync_economic_metrics_trigger
before insert or update of economic_value, close_probability, estimated_human_minutes
on atlas_opportunities
for each row execute function atlas_sync_economic_metrics();

commit;
