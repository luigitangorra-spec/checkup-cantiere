create table if not exists public.leads (
  id uuid primary key,
  created_at timestamptz not null default now(),
  name text not null,
  company text not null,
  email text not null,
  phone text not null,
  score integer not null,
  level text not null,
  answers jsonb not null,
  report_filename text not null,
  email_status text not null
);

alter table public.leads enable row level security;

drop policy if exists "Service role can manage leads" on public.leads;

create policy "Service role can manage leads"
on public.leads
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
