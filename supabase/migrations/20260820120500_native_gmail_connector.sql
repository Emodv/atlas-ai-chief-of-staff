create table if not exists public.atlas_connector_credentials (
  user_key text not null,
  provider text not null,
  vault_secret_id uuid not null,
  account_email text,
  scopes text[] not null default '{}',
  status text not null default 'connected',
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  primary key (user_key, provider),
  constraint atlas_connector_credentials_provider_check check (provider in ('gmail','calendar','hubspot')),
  constraint atlas_connector_credentials_status_check check (status in ('connected','revoked','error'))
);

alter table public.atlas_connector_credentials enable row level security;
revoke all on table public.atlas_connector_credentials from anon, authenticated;
grant all on table public.atlas_connector_credentials to service_role;

create table if not exists public.atlas_oauth_states (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  provider text not null,
  state_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint atlas_oauth_states_provider_check check (provider in ('gmail','calendar','hubspot'))
);

create index if not exists atlas_oauth_states_provider_expiry_idx
  on public.atlas_oauth_states (provider, expires_at desc);

alter table public.atlas_oauth_states enable row level security;
revoke all on table public.atlas_oauth_states from anon, authenticated;
grant all on table public.atlas_oauth_states to service_role;

create or replace function public.atlas_store_connector_secret(
  p_user_key text,
  p_provider text,
  p_secret text,
  p_account_email text default null,
  p_scopes text[] default '{}',
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  existing_secret uuid;
  stored_secret uuid;
begin
  select vault_secret_id into existing_secret
  from public.atlas_connector_credentials
  where user_key = p_user_key and provider = p_provider;

  if existing_secret is null then
    stored_secret := vault.create_secret(
      p_secret,
      'atlas:' || p_user_key || ':' || p_provider,
      'Atlas connector refresh credential'
    );
  else
    perform vault.update_secret(existing_secret, p_secret);
    stored_secret := existing_secret;
  end if;

  insert into public.atlas_connector_credentials (
    user_key, provider, vault_secret_id, account_email, scopes, status, connected_at, updated_at, metadata
  ) values (
    p_user_key, p_provider, stored_secret, p_account_email, coalesce(p_scopes, '{}'), 'connected', now(), now(), coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (user_key, provider) do update set
    vault_secret_id = excluded.vault_secret_id,
    account_email = excluded.account_email,
    scopes = excluded.scopes,
    status = 'connected',
    updated_at = now(),
    metadata = excluded.metadata;

  return stored_secret;
end;
$$;

create or replace function public.atlas_get_connector_secret(
  p_user_key text,
  p_provider text
) returns table (
  secret text,
  account_email text,
  scopes text[],
  status text,
  metadata jsonb
)
language sql
security definer
set search_path = public, vault
as $$
  select d.decrypted_secret,
         c.account_email,
         c.scopes,
         c.status,
         c.metadata
  from public.atlas_connector_credentials c
  join vault.decrypted_secrets d on d.id = c.vault_secret_id
  where c.user_key = p_user_key
    and c.provider = p_provider
  limit 1;
$$;

create or replace function public.atlas_delete_connector_secret(
  p_user_key text,
  p_provider text
) returns boolean
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  secret_id uuid;
begin
  select vault_secret_id into secret_id
  from public.atlas_connector_credentials
  where user_key = p_user_key and provider = p_provider;

  delete from public.atlas_connector_credentials
  where user_key = p_user_key and provider = p_provider;

  if secret_id is not null then
    delete from vault.secrets where id = secret_id;
  end if;

  return secret_id is not null;
end;
$$;

revoke all on function public.atlas_store_connector_secret(text,text,text,text,text[],jsonb) from public, anon, authenticated;
revoke all on function public.atlas_get_connector_secret(text,text) from public, anon, authenticated;
revoke all on function public.atlas_delete_connector_secret(text,text) from public, anon, authenticated;
grant execute on function public.atlas_store_connector_secret(text,text,text,text,text[],jsonb) to service_role;
grant execute on function public.atlas_get_connector_secret(text,text) to service_role;
grant execute on function public.atlas_delete_connector_secret(text,text) to service_role;
