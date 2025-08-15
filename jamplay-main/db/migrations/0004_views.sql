-- Trending materialized view
drop materialized view if exists public.trending_games;
create materialized view public.trending_games as
with aggregates as (
  select
    g.id as game_id,
    g.title, g.slug, g.summary, g.tags, g.age_rating, g.created_at,
    count(p.id) filter (where p.created_at > now() - interval '7 days') as plays_7d,
    avg(case when p.duration_sec > 0 then (p.cost_tokens::float / nullif(p.duration_sec,0)) * 60 else null end) as avg_cost_per_min,
    avg(case when p.duration_sec > 0 then (case when p.completed then 1 else 0 end)::float end) as completion_rate,
    avg(r.score)::float as ratings_avg,
    count(distinct r.id) filter (where r.created_at > now() - interval '7 days') as ratings_count,
    count(distinct rep.id) filter (where rep.created_at > now() - interval '7 days') as reports_count
  from public.games g
  left join public.plays p on p.game_id = g.id
  left join public.ratings r on r.game_id = g.id
  left join public.reports rep on rep.game_id = g.id
  where g.status = 'public'
  group by g.id
),
scored as (
  select a.*,
    (0.5 * coalesce(completion_rate,0)) +
    (0.3 * least(coalesce(ratings_avg,0)/5.0,1)) +
    (-0.1 * least(coalesce(reports_count,0), 10)) +
    (-0.1 * least(coalesce(avg_cost_per_min,0)/50.0, 1)) +
    (case when a.created_at > now() - interval '48 hours' then 0.2 else 0 end) as score
  from aggregates a
)
select * from scored;

create index if not exists idx_trending_score on public.trending_games (score desc);

-- cron to refresh every 10 minutes
select cron.schedule('refresh_trending', '*/10 * * * *', $$ refresh materialized view concurrently public.trending_games; $$);
