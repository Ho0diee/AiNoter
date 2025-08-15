# JamPlay (MVP)

Roblox‑inspired hub for AI prompt games. Creators upload a `.zip` containing `PromptScript.json` (+ optional assets). Players browse, play, rate, and join promoted jams.

## Stack
Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui  
Supabase (Postgres, Auth, Storage, RLS)  
UploadThing (large uploads)  
Vercel deploy

**No live LLM calls** – dry-run and token estimator are stubs.

## One‑click-ish Deploy

1. **Create a Supabase project.** Copy the `Project URL` and `anon` key, and the `service_role` key.
2. **Create storage buckets**: `thumbs` (public), `game_zips` (private), `promptscripts` (public).
3. **Run SQL migrations**: In Supabase **SQL Editor**, run the files under `db/migrations` in order.
   - Ensure `pg_cron` is enabled (Database > Extensions > enable `pg_cron`).
4. **UploadThing**: Create a token in UploadThing dashboard, set `UPLOADTHING_TOKEN`.
5. **Vercel**: Import this repo, set env vars from `.env.example`.
6. **Seed**: Locally, run `pnpm i` (or npm/yarn), then `pnpm seed` to create a sample jam, templates, and a few example games.

## Local Dev

```bash
pnpm i
cp .env.example .env.local   # fill in values
pnpm dev
```

## Tests
- **Unit**: `pnpm test` (Vitest) – exercises server actions with mocked Supabase client.
- **E2E**: `pnpm test:ui` (Playwright) – happy-path publish flow. Requires .env and running dev server on :3000.

## Repo Layout
- `app/` – routes & server actions
- `components/` – shadcn/ui primitives + app components
- `db/migrations/` – SQL schema, RLS, views, seeds
- `lib/` – Supabase client, zod, token estimator, uploadthing
- `scripts/seed.ts` – seeds templates + "Low‑Token Jam"
- `tests/` – unit + Playwright

## Notes
- RLS enforces: public can read public games/versions; owners can read/write own; mods/admin full. Ratings/plays are per-user readable; views expose aggregates.
- Trending is a materialized view refreshed every 10 min via `pg_cron`.
- Creator role is granted after first publish (or via admin toggle).
- Three‑strike policy demotes all games to `private` on 3 strikes.

## Non‑goals (MVP)
- No payments/coins.
- No real model calls.
- Minimal moderation (regex + stub thumbnail NSFW check).
