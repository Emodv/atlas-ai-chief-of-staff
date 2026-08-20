begin;

alter table atlas_opportunities
  add column if not exists lifecycle_stage text not null default 'detected',
  add column if not exists execution_plan jsonb not null default '{}'::jsonb,
  add column if not exists assigned_action_id uuid,
  add column if not exists verification_evidence jsonb not null default '[]'::jsonb,
  add column if not exists closed_at timestamptz,
  add column if not exists learned_at timestamptz,
  add column if not exists last_verified_at timestamptz,
  add column if not exists estimated_human_minutes integer not null default 0,
  add column if not exists attention_measurement_basis text not null default 'estimated';

alter table atlas_opportunities drop constraint if exists atlas_opportunities_lifecycle_stage_check;
alter table atlas_opportunities
  add constraint atlas_opportunities_lifecycle_stage_check
  check (lifecycle_stage in ('detected','ranked','assigned','acted','verified','closed','learned'));

alter table atlas_opportunities drop constraint if exists atlas_opportunities_estimated_human_minutes_check;
alter table atlas_opportunities
  add constraint atlas_opportunities_estimated_human_minutes_check
  check (estimated_human_minutes >= 0 and estimated_human_minutes <= 1440);

alter table atlas_opportunities drop constraint if exists atlas_opportunities_attention_measurement_basis_check;
alter table atlas_opportunities
  add constraint atlas_opportunities_attention_measurement_basis_check
  check (attention_measurement_basis in ('estimated','measured','mixed'));

alter table atlas_opportunities drop constraint if exists atlas_opportunities_assigned_action_id_fkey;
alter table atlas_opportunities
  add constraint atlas_opportunities_assigned_action_id_fkey
  foreign key (assigned_action_id) references atlas_actions(id) on delete set null;

alter table atlas_actions drop constraint if exists atlas_actions_status_check;
alter table atlas_actions
  add constraint atlas_actions_status_check
  check (status in ('queued','awaiting_approval','executing','verification_pending','verifying','completed','failed','cancelled','blocked','dead_letter'));

alter table atlas_actions
  add column if not exists verification_status text not null default 'pending',
  add column if not exists verification_receipt jsonb,
  add column if not exists verification_result jsonb,
  add column if not exists verified_at timestamptz,
  add column if not exists verification_attempt_count integer not null default 0;

alter table atlas_actions drop constraint if exists atlas_actions_verification_status_check;
alter table atlas_actions
  add constraint atlas_actions_verification_status_check
  check (verification_status in ('pending','verified','failed','not_required'));

alter table atlas_actions drop constraint if exists atlas_actions_verification_attempt_count_check;
alter table atlas_actions
  add constraint atlas_actions_verification_attempt_count_check
  check (verification_attempt_count >= 0 and verification_attempt_count <= 20);

create table if not exists atlas_opportunity_history (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  opportunity_id uuid not null references atlas_opportunities(id) on delete cascade,
  action_id uuid references atlas_actions(id) on delete set null,
  from_stage text,
  to_stage text not null,
  transition_reason text,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists atlas_opportunity_history_opportunity_idx
  on atlas_opportunity_history(user_key, opportunity_id, created_at desc);

create table if not exists atlas_attention_outcomes (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  opportunity_id uuid references atlas_opportunities(id) on delete set null,
  action_id uuid not null references atlas_actions(id) on delete cascade,
  connector text,
  human_minutes_saved integer not null default 0,
  revenue_influenced numeric(14,2),
  money_saved numeric(14,2),
  opportunity_advanced boolean not null default false,
  relationship_protected boolean not null default false,
  autonomous_actions integer not null default 1,
  human_decisions integer not null default 0,
  metric_quality text not null default 'estimated',
  verification_evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_key, action_id)
);

alter table atlas_attention_outcomes drop constraint if exists atlas_attention_outcomes_metric_quality_check;
alter table atlas_attention_outcomes
  add constraint atlas_attention_outcomes_metric_quality_check
  check (metric_quality in ('estimated','measured','mixed'));

alter table atlas_attention_outcomes drop constraint if exists atlas_attention_outcomes_human_minutes_saved_check;
alter table atlas_attention_outcomes
  add constraint atlas_attention_outcomes_human_minutes_saved_check
  check (human_minutes_saved >= 0 and human_minutes_saved <= 1440);

create index if not exists atlas_attention_outcomes_user_created_idx
  on atlas_attention_outcomes(user_key, created_at desc);

create index if not exists atlas_opportunities_lifecycle_idx
  on atlas_opportunities(user_key, lifecycle_stage, priority, master_score desc);

create index if not exists atlas_actions_verification_queue_idx
  on atlas_actions(user_key, status, next_attempt_at, created_at)
  where status in ('verification_pending','verifying');

commit;
