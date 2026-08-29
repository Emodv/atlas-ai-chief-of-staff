begin;

create table if not exists atlas_prospect_domains (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  domain text not null,
  company_name text,
  country text,
  industry text,
  employee_range text,
  website text,
  enrichment_status text not null default 'pending',
  enrichment_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_key, domain)
);

create table if not exists atlas_prospect_contacts (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  source_asset text not null,
  email text not null,
  domain_id uuid references atlas_prospect_domains(id) on delete set null,
  first_name text,
  last_name text,
  title text,
  seniority text,
  country text,
  contact_status text not null default 'unscored',
  suppression_reason text,
  quality_score numeric(6,2),
  fit_score numeric(6,2),
  signal_score numeric(6,2),
  economic_score numeric(10,2),
  enrichment_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_key, email)
);

create table if not exists atlas_prospect_segments (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  name text not null,
  description text,
  filter_spec jsonb not null default '{}'::jsonb,
  offer_key text,
  priority integer not null default 50,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_key, name)
);

create table if not exists atlas_prospect_segment_members (
  user_key text not null,
  segment_id uuid not null references atlas_prospect_segments(id) on delete cascade,
  contact_id uuid not null references atlas_prospect_contacts(id) on delete cascade,
  score numeric(10,2),
  reasons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  primary key (segment_id, contact_id)
);

create table if not exists atlas_buying_signals (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  domain_id uuid references atlas_prospect_domains(id) on delete cascade,
  contact_id uuid references atlas_prospect_contacts(id) on delete cascade,
  signal_type text not null,
  signal_strength numeric(6,2) not null default 50,
  source_url text,
  evidence jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists atlas_prospect_contacts_domain_idx
  on atlas_prospect_contacts(user_key, domain_id);
create index if not exists atlas_prospect_contacts_score_idx
  on atlas_prospect_contacts(user_key, economic_score desc nulls last, fit_score desc nulls last);
create index if not exists atlas_prospect_domains_enrichment_idx
  on atlas_prospect_domains(user_key, enrichment_status, updated_at);
create index if not exists atlas_buying_signals_domain_idx
  on atlas_buying_signals(user_key, domain_id, detected_at desc);
create index if not exists atlas_buying_signals_contact_idx
  on atlas_buying_signals(user_key, contact_id, detected_at desc);

alter table atlas_prospect_domains enable row level security;
alter table atlas_prospect_contacts enable row level security;
alter table atlas_prospect_segments enable row level security;
alter table atlas_prospect_segment_members enable row level security;
alter table atlas_buying_signals enable row level security;

revoke all on table atlas_prospect_domains from anon;
revoke all on table atlas_prospect_contacts from anon;
revoke all on table atlas_prospect_segments from anon;
revoke all on table atlas_prospect_segment_members from anon;
revoke all on table atlas_buying_signals from anon;

grant select, insert, update, delete on table atlas_prospect_domains to authenticated;
grant select, insert, update, delete on table atlas_prospect_contacts to authenticated;
grant select, insert, update, delete on table atlas_prospect_segments to authenticated;
grant select, insert, update, delete on table atlas_prospect_segment_members to authenticated;
grant select, insert, update, delete on table atlas_buying_signals to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'atlas_prospect_domains',
    'atlas_prospect_contacts',
    'atlas_prospect_segments',
    'atlas_prospect_segment_members',
    'atlas_buying_signals'
  ]
  loop
    execute format('drop policy if exists %I on %I', table_name || '_workspace_isolation', table_name);
    execute format(
      'create policy %I on %I for all to authenticated using (user_key = atlas_current_user_key()) with check (user_key = atlas_current_user_key())',
      table_name || '_workspace_isolation',
      table_name
    );
  end loop;
end $$;

insert into atlas_prospect_segments (user_key, name, description, filter_spec, offer_key, priority)
values
  ('primary', 'Canada SMB Founders and CEOs', 'Canadian founder/CEO prospects with strong SMB economics.', '{"country":"CA","seniority":["founder","ceo","owner"]}'::jsonb, 'growth_execution', 90),
  ('primary', 'Temporary Marketing Coverage', 'Companies with maternity, parental leave, interim, or fixed-term marketing execution gaps.', '{"signals":["maternity_leave","parental_leave","fixed_term_marketing","interim_marketing"]}'::jsonb, 'fractional_marketing_coverage', 100),
  ('primary', 'AI Visibility Gaps', 'Companies with strong customer economics and weak AI/search visibility.', '{"signals":["weak_ai_visibility","weak_seo"]}'::jsonb, 'seo_ai_visibility', 85),
  ('primary', 'Business Funding Candidates', 'Established Canadian SMBs that may qualify for financing referral opportunities.', '{"country":"CA","signals":["funding_need","expansion","cashflow_need"]}'::jsonb, 'business_funding', 80),
  ('primary', 'Nonprofit Ad Grant Candidates', 'Eligible nonprofit organizations with strong search-demand and conversion use cases.', '{"organization_type":"nonprofit","signals":["grant_eligible"]}'::jsonb, 'google_ad_grants', 75)
on conflict (user_key, name) do update
set description = excluded.description,
    filter_spec = excluded.filter_spec,
    offer_key = excluded.offer_key,
    priority = excluded.priority,
    updated_at = now();

commit;
