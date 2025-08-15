-- Seed jam only (no fake users)
insert into public.jams (title, slug, theme, rules_md, starts_at, ends_at, prize_pool_cents)
values (
  'Low-Token Jam',
  'low-token-jam',
  'Make fun with ≤2000 tokens',
  'Keep it tight. No NSFW.',
  now(),
  now() + interval '14 days',
  0
)
on conflict (slug) do nothing;
