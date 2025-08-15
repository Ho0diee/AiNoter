BEGIN;

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

-- USERS
create table if not exists public.users (
id uuid primary key default uuid_generate_v4(),
username text unique not null,
avatar_url text,
role text check (role in ('user','creator','mod','admin')) default 'user' not null,
strike_count int default 0 not null,
created_at timestamptz default now() not null
);

-- GAMES
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

-- GAME VERSIONS
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

-- JAMS (needed for the seed/jam page)
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

-- Optional: JAM SUBMISSIONS (safe to include now)
create table if not exists public.jam_submissions (
id uuid primary key default uuid_generate_v4(),
jam_id uuid references public.jams (id) on delete cascade,
game_id uuid references public.games (id) on delete cascade,
submitter_id uuid references public.users (id),
notes text,
created_at timestamptz default now(),
status text check (status in ('submitted','accepted','rejected')) default 'submitted'
);

-- RLS
alter table public.games enable row level security;
alter table public.game_versions enable row level security;
alter table public.jams enable row level security;
alter table public.jam_submissions enable row level security;

-- Drop old policies if they exist (so this is re-runnable)
drop policy if exists "Public read games" on public.games;
drop policy if exists "Owner insert games" on public.games;
drop policy if exists "Owner update games" on public.games;

drop policy if exists "Readable versions of visible or owned games" on public.game_versions;
drop policy if exists "Owner insert versions" on public.game_versions;
drop policy if exists "Owner update versions" on public.game_versions;

drop policy if exists "Public read jams" on public.jams;
drop policy if exists "Submitter read own" on public.jam_submissions;
drop policy if exists "Submitter insert own" on public.jam_submissions;

-- Policies: games
create policy "Public read games" on public.games
for select using (status = 'public' or owner_id = auth.uid());

create policy "Owner insert games" on public.games
for insert with check (owner_id = auth.uid());

create policy "Owner update games" on public.games
for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Policies: game_versions
create policy "Readable versions of visible or owned games" on public.game_versions
for select using (
exists (
select 1 from public.games g
where g.id = game_id and (g.status = 'public' or g.owner_id = auth.uid())
)
);

create policy "Owner insert versions" on public.game_versions
for insert with check (
exists (
select 1 from public.games g
where g.id = game_id and g.owner_id = auth.uid()
)
);

create policy "Owner update versions" on public.game_versions
for update using (
exists (
select 1 from public.games g
where g.id = game_id and g.owner_id = auth.uid()
)
) with check (
exists (
select 1 from public.games g
where g.id = game_id and g.owner_id = auth.uid()
)
);

-- Policies: jams + submissions (basic)
create policy "Public read jams" on public.jams
for select using (true);

create policy "Submitter read own" on public.jam_submissions
for select using (auth.uid() = submitter_id);

create policy "Submitter insert own" on public.jam_submissions
for insert with check (auth.uid() = submitter_id or submitter_id is null);

-- Trigger: auto-create public.users row from auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
insert into public.users (id, username, role)
values (
new.id,
coalesce(split_part(new.email, '@', 1), 'user_' || left(new.id::text, 6)),
'user'
)
on conflict (id) do nothing;
return new;
end;

drop trigger if exists on_auth_user_created on auth.users; create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user(); -- Backfill current auth users (so your row exists right now) insert into public.users (id, username, role) select u.id, coalesce(split_part(u.email, '@', 1), 'user_' || left(u.id::text, 6)), 'user' from auth.users u where not exists (select 1 from public.users p where p.id = u.id); COMMIT; Then run this tiny seed (optional, but it makes the Jam page not empty): insert into public.jams (title, slug, theme, rules_md, starts_at, ends_at, prize_pool_cents) values ( 'Low-Token Jam', 'low-token-jam', 'Make fun with ≤2000 tokens', 'Keep it tight. No NSFW.', now(), now() + interval '14 days', 0 ) on conflict (slug) do nothing; One question: after you run the big block, can you check Supabase → **Table editor** → schema “public” and confirm you now see `users`, `games`, `game_versions`, and `jams`? Just say “yes” or paste a screenshot if anything errors.