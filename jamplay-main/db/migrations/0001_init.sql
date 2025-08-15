-- Enable uuid
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;
create extension if not exists pgcrypto;
create extension if not exists "pg_stat_statements";
create extension if not exists "pg_cron";

-- Users
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  username text unique not null,
  avatar_url text,
  role text check (role in ('user','creator','mod','admin')) default 'user' not null,
  strike_count int default 0 not null,
  created_at timestamptz default now() not null
);

-- Games
create table if not exists public.games (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references public.users (id) on delete cascade,
  title text not null,
  slug text unique not null,
  summary text not null,
  tags text[] default '{}'::text[],
  age_rating text check (age_rating in ('E','E10','Teen')) not null,
  thumb_url text,
  status text check (status in ('draft','public','private','removed')) default 'draft' not null,
  cost_budget_tokens int default 2000 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Game versions
create table if not exists public.game_versions (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid references public.games (id) on delete cascade,
  version text not null,
  promptscript_url text not null,
  assets_zip_url text,
  model_lock text,
  seed int,
  notes text,
  published_at timestamptz default now()
);

-- Plays
create table if not exists public.plays (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid references public.games (id) on delete cascade,
  user_id uuid references public.users (id),
  version_id uuid references public.game_versions (id),
  duration_sec int default 0,
  completed boolean default false,
  cost_tokens int default 0,
  created_at timestamptz default now()
);

-- Ratings
create table if not exists public.ratings (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid references public.games (id) on delete cascade,
  user_id uuid references public.users (id),
  score int check (score between 1 and 5) not null,
  review text,
  created_at timestamptz default now()
);

-- Reports
create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid references public.games (id) on delete cascade,
  reporter_id uuid references public.users (id),
  reason text not null,
  created_at timestamptz default now(),
  resolved boolean default false
);

-- Jams
create table if not exists public.jams (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text unique not null,
  theme text,
  rules_md text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  promo_banner_url text,
  prize_pool_cents int default 0,
  created_at timestamptz default now()
);

-- Jam submissions
create table if not exists public.jam_submissions (
  id uuid primary key default uuid_generate_v4(),
  jam_id uuid references public.jams (id) on delete cascade,
  game_id uuid references public.games (id) on delete cascade,
  submitter_id uuid references public.users (id),
  notes text,
  created_at timestamptz default now(),
  status text check (status in ('submitted','accepted','rejected')) default 'submitted'
);

-- Promotions
create table if not exists public.promotions (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid references public.games (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  placement text check (placement in ('homepage_hero','category_spotlight')) not null,
  created_at timestamptz default now()
);
