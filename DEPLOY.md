# Deploying to Vercel

This MVP uses Next.js 15 + Prisma + Postgres. Total time: ~5 minutes.

## 1. Create a Neon Postgres database

The easiest path is via Vercel's built-in integration:

1. In your Vercel project's **Storage** tab → **Create Database** → **Neon**.
2. Click through with defaults. Vercel auto-injects `DATABASE_URL` into the project's environment variables for all environments (Production, Preview, Development).

Alternative (manual): create a free DB at [neon.tech](https://neon.tech), copy the **pooled** connection string, and add it as `DATABASE_URL` in Vercel → Project → Settings → Environment Variables.

## 2. Import the repo into Vercel

1. Vercel → **Add New** → **Project** → import this GitHub repo.
2. Framework preset auto-detects as Next.js. Leave defaults.
3. Click **Deploy**.

The `build` script (`prisma generate && prisma db push --accept-data-loss && next build`) will:
- generate the Prisma client
- create the schema in Neon (idempotent — safe to re-run)
- compile Next.js

## 3. Seed demo data (one-time)

The app exposes a protected `GET /api/admin/seed` endpoint. To use it:

1. In Vercel → **Settings → Environment Variables**, add:
   - **Name**: `SEED_SECRET`
   - **Value**: any random string (e.g. `openssl rand -hex 16`)
   - Apply to **Production** (and Preview if you want).
2. **Deployments → Redeploy** so the new env var is picked up.
3. Visit:
   ```
   https://YOUR-APP.vercel.app/api/admin/seed?secret=YOUR_SECRET
   ```
   You should see `{"ok":true,"users":5,"offers":3}`. Hitting it again is a no-op (skips if users already exist).
4. To wipe and re-seed: send a `POST` with `?reset=true`:
   ```bash
   curl -X POST "https://YOUR-APP.vercel.app/api/admin/seed?secret=YOUR_SECRET&reset=true"
   ```

### Alternative: seed from your laptop

```bash
npx vercel link
npx vercel env pull .env.production.local
DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d= -f2- | tr -d '"') npx tsx prisma/seed.ts
```

## 4. Verify

Open the deploy URL → `/login` → pick a user → confirm the dashboard loads with the seeded offers. Try posting a new item and claiming it from another user.

## Notes

- **Cookies**: the mock session cookie is set with `secure: true` in production, so it requires HTTPS (Vercel provides this automatically).
- **Schema changes**: every `git push` triggers `prisma db push --accept-data-loss` against the prod DB. For an MVP this is fine; for a real product, switch to `prisma migrate deploy` with committed migration files.
- **Cold starts**: Neon's free tier suspends after 5 minutes idle (~500ms first request). Fine for a demo.
- **Free-tier limits**: 256MB Neon storage, plenty for thousands of offers.

## Local development after the switch

This repo now uses Postgres locally too. Two options:

### Option A: Docker (recommended)

```bash
docker compose up -d        # starts Postgres on localhost:5432
npm install
npx prisma db push
npm run seed
npm run dev
```

The default `.env` already points at the docker container.

### Option B: Use a Neon dev branch

In the Neon dashboard, create a `dev` branch off your main DB and put its connection string in `.env`. Branches are free.
