-- Row Level Security policies

alter table public.games enable row level security;
alter table public.game_versions enable row level security;
alter table public.plays enable row level security;
alter table public.ratings enable row level security;
alter table public.reports enable row level security;
alter table public.jams enable row level security;
alter table public.jam_submissions enable row level security;
alter table public.promotions enable row level security;

-- Define helper for roles (expects a 'role' claim in JWT; adjust as needed)
create or replace function auth_role() returns text language sql stable as $$
  select coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role','user')
$$;

-- games
create policy "Public can read public games" on public.games
  for select using (status = 'public');

create policy "Owner can read own games" on public.games
  for select using (auth.uid() = owner_id);

create policy "Owner can insert games" on public.games
  for insert with check (auth.uid() = owner_id) ;

create policy "Owner can update own games" on public.games
  for update using (auth.uid() = owner_id);

create policy "Mods/Admin full access" on public.games
  using (auth_role() in ('mod','admin'))
  with check (auth_role() in ('mod','admin'));

-- game_versions
create policy "Read versions of public parent" on public.game_versions
  for select using (exists (select 1 from public.games g where g.id = game_id and g.status = 'public')
    or exists (select 1 from public.games g where g.id = game_id and g.owner_id = auth.uid()));

create policy "Owner insert versions" on public.game_versions
  for insert with check (exists (select 1 from public.games g where g.id = game_id and g.owner_id = auth.uid()));

-- plays
create policy "Users read own plays" on public.plays for select using (auth.uid() = user_id);
create policy "Users insert plays" on public.plays for insert with check (auth.uid() = user_id or user_id is null);
create policy "Users update own plays" on public.plays for update using (auth.uid() = user_id);

-- ratings
create policy "Users read own ratings" on public.ratings for select using (auth.uid() = user_id);
create policy "Users insert ratings" on public.ratings for insert with check (auth.uid() = user_id or user_id is null);

-- reports
create policy "Users write own reports" on public.reports for insert with check (auth.uid() = reporter_id or reporter_id is null);
create policy "Mods read reports" on public.reports for select using (auth_role() in ('mod','admin'));
create policy "Mods update reports" on public.reports for update using (auth_role() in ('mod','admin'));

-- jams
create policy "Public read jams" on public.jams for select using (true);
create policy "Mods write jams" on public.jams using (auth_role() in ('mod','admin')) with check (auth_role() in ('mod','admin'));

-- jam_submissions
create policy "Submitter read own" on public.jam_submissions for select using (auth.uid() = submitter_id);
create policy "Submitter insert own" on public.jam_submissions for insert with check (auth.uid() = submitter_id or submitter_id is null);
create policy "Mods read all" on public.jam_submissions for select using (auth_role() in ('mod','admin'));

-- promotions
create policy "Public read promos" on public.promotions for select using (true);
create policy "Mods write promos" on public.promotions using (auth_role() in ('mod','admin')) with check (auth_role() in ('mod','admin'));
