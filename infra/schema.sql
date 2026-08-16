create extension if not exists pgcrypto;

create table if not exists atlas_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references atlas_users(id) on delete cascade,
  provider text not null,
  external_account_id text,
  scopes text[] not null default '{}',
  status text not null default 'connected',
  sync_cursor text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, provider, external_account_id)
);

create table if not exists identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references atlas_users(id) on delete cascade,
  display_name text,
  emails text[] not null default '{}',
  phones text[] not null default '{}',
  companies text[] not null default '{}',
  aliases text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists relationships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references atlas_users(id) on delete cascade,
  identity_id uuid not null references identities(id) on delete cascade,
  relationship_type text not null default 'unknown',
  warmth numeric(4,3) not null default 0.5,
  formality numeric(4,3) not null default 0.5,
  languages text[] not null default '{}',
  cadence_days integer,
  last_meaningful_contact timestamptz,
  human_touch_preferred boolean not null default false,
  model_confidence numeric(4,3) not null default 0,
  unique(user_id, identity_id)
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references atlas_users(id) on delete cascade,
  provider text not null,
  source_id text not null,
  kind text not null,
  occurred_at timestamptz not null,
  actor_identity_ids uuid[] not null default '{}',
  subject text,
  body_text text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, provider, source_id)
);

create index if not exists events_user_occurred_idx on events(user_id, occurred_at desc);
create index if not exists events_metadata_gin_idx on events using gin(metadata);

-- Durable, synthesized facts. Raw evidence remains in source events/documents.
create table if not exists memory_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references atlas_users(id) on delete cascade,
  subject_key text not null,
  fact_text text not null,
  source_event_ids uuid[] not null default '{}',
  importance numeric(4,3) not null default 0.5,
  observed_at timestamptz not null default now(),
  last_confirmed_at timestamptz not null default now(),
  contradicted boolean not null default false,
  stale_after_days integer not null default 90,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memory_facts_user_subject_idx on memory_facts(user_id, subject_key);
create index if not exists memory_facts_user_confirmed_idx on memory_facts(user_id, last_confirmed_at desc);

-- Typed graph edges let Atlas traverse relationships instead of relying only on vector similarity.
create table if not exists graph_edges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references atlas_users(id) on delete cascade,
  from_type text not null,
  from_key text not null,
  edge_type text not null,
  to_type text not null,
  to_key text not null,
  source_event_ids uuid[] not null default '{}',
  last_confirmed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, from_type, from_key, edge_type, to_type, to_key)
);

create index if not exists graph_edges_from_idx on graph_edges(user_id, from_type, from_key);
create index if not exists graph_edges_to_idx on graph_edges(user_id, to_type, to_key);

create table if not exists twin_profiles (
  user_id uuid primary key references atlas_users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  confidence numeric(4,3) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists action_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references atlas_users(id) on delete cascade,
  task_type text not null,
  target_identity_id uuid references identities(id),
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  confidence numeric(4,3) not null,
  reversible boolean not null default true,
  consequence text not null check (consequence in ('low','medium','high')),
  autonomy_stage text not null check (autonomy_stage in ('surface','recommend','draft','execute')),
  evidence_event_ids uuid[] not null default '{}',
  status text not null default 'proposed',
  created_at timestamptz not null default now(),
  acted_at timestamptz
);

create table if not exists corrections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references atlas_users(id) on delete cascade,
  action_proposal_id uuid references action_proposals(id) on delete cascade,
  outcome text not null check (outcome in ('accepted','edited','rejected','different_action')),
  correction_reason text,
  final_payload jsonb,
  created_at timestamptz not null default now()
);
