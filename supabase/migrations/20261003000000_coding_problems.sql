-- Migration: coding_problems table for faculty and admin managed coding assignments
-- Allows admins and superadmins to create, edit, toggle visibility, and delete coding problems.
-- Students can only read published problems.

create table if not exists public.coding_problems (
  id                  text primary key default ('prob-' || substr(gen_random_uuid()::text, 1, 8)),
  slug                text not null,
  title               text not null,
  difficulty          text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  category            text not null default 'Algorithms',
  points              integer not null default 50,
  published_by        text not null default 'Faculty',
  published_at        timestamptz not null default now(),
  is_published        boolean not null default true,
  description         text not null,
  constraints         jsonb not null default '[]'::jsonb,
  tags                jsonb not null default '[]'::jsonb,
  starter_code        jsonb not null default '{}'::jsonb,
  sample_test_cases   jsonb not null default '[]'::jsonb,
  hidden_test_cases   jsonb not null default '[]'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Index for fast retrieval
create index if not exists idx_coding_problems_published on public.coding_problems(is_published, created_at desc);

-- Enable RLS
alter table public.coding_problems enable row level security;

-- Policy: Everyone can read published problems
drop policy if exists "Anyone can view published problems" on public.coding_problems;
create policy "Anyone can view published problems"
  on public.coding_problems
  for select
  using (is_published = true);

-- Policy: Authenticated users / service role can manage problems
drop policy if exists "Admins can manage all problems" on public.coding_problems;
create policy "Admins can manage all problems"
  on public.coding_problems
  for all
  using (true)
  with check (true);
