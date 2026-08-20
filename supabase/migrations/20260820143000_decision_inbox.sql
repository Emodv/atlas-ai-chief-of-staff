create table if not exists public.atlas_approval_decisions (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  action_id uuid not null references public.atlas_actions(id) on delete cascade,
  opportunity_id uuid references public.atlas_opportunities(id) on delete set null,
  decision text not null,
  original_risk_level text,
  residual_risk_level text,
  note text,
  decided_by text not null default 'user',
  decided_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint atlas_approval_decisions_decision_check check (decision in ('approved','rejected','edited'))
);

create index if not exists atlas_approval_decisions_action_idx
  on public.atlas_approval_decisions (user_key, action_id, decided_at desc);

alter table public.atlas_approval_decisions enable row level security;
revoke all on table public.atlas_approval_decisions from anon, authenticated;
grant all on table public.atlas_approval_decisions to service_role;

create or replace function public.atlas_preserve_human_decision_count()
returns trigger
language plpgsql
as $$
begin
  new.human_decisions := greatest(coalesce(old.human_decisions, 0), coalesce(new.human_decisions, 0));
  return new;
end;
$$;

drop trigger if exists atlas_attention_preserve_human_decisions on public.atlas_attention_outcomes;
create trigger atlas_attention_preserve_human_decisions
before update on public.atlas_attention_outcomes
for each row execute function public.atlas_preserve_human_decision_count();
