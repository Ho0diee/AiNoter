-- Indexes
create index if not exists idx_users_username_lower on public.users (lower(username));
create index if not exists idx_games_slug on public.games (slug);
create index if not exists idx_jams_slug on public.jams (slug);
create index if not exists idx_games_tags_gin on public.games using gin (tags);
create index if not exists idx_promotions_placement on public.promotions (placement, starts_at, ends_at);

-- Simple views for admin convenience
create or replace view public.promotions_view as
  select p.*, g.title, g.slug from public.promotions p join public.games g on g.id = p.game_id
  where now() between p.starts_at and p.ends_at;

create or replace view public.jam_submissions_view as
  select js.*, g.title as game_title, g.slug as game_slug from public.jam_submissions js
  join public.games g on g.id = js.game_id;
