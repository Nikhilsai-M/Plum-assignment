create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  member_id text unique not null,
  full_name text not null,
  relationship text,
  join_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists claims (
  id text primary key,
  member_id text not null,
  member_name text not null,
  treatment_date date not null,
  claim_amount numeric(12, 2) not null,
  status text not null check (status in ('APPROVED', 'REJECTED', 'PARTIAL', 'MANUAL_REVIEW')),
  raw_payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists claim_documents (
  id uuid primary key default gen_random_uuid(),
  claim_id text not null references claims(id) on delete cascade,
  file_name text not null,
  mime_type text,
  file_size integer,
  storage_url text,
  document_type text,
  created_at timestamptz not null default now()
);

create table if not exists extracted_fields (
  id uuid primary key default gen_random_uuid(),
  claim_id text unique not null references claims(id) on delete cascade,
  fields jsonb not null,
  confidence_score numeric(5, 4) not null,
  created_at timestamptz not null default now()
);

create table if not exists adjudication_results (
  id uuid primary key default gen_random_uuid(),
  claim_id text unique not null references claims(id) on delete cascade,
  decision text not null check (decision in ('APPROVED', 'REJECTED', 'PARTIAL', 'MANUAL_REVIEW')),
  approved_amount numeric(12, 2) not null default 0,
  rejection_reasons jsonb not null default '[]'::jsonb,
  confidence_score numeric(5, 4) not null,
  notes text not null,
  next_steps text not null,
  rule_explanations jsonb not null default '[]'::jsonb,
  full_result jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  claim_id text references claims(id) on delete cascade,
  event_type text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists claims_member_id_idx on claims(member_id);
create index if not exists claims_status_idx on claims(status);
create index if not exists claims_treatment_date_idx on claims(treatment_date);
create index if not exists audit_logs_claim_id_idx on audit_logs(claim_id);
