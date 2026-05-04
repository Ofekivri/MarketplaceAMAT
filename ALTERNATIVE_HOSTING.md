# Alternative Hosting (non-Vercel)

Use this guide when the default Vercel URL is blocked by a corporate firewall
(Applied Materials / Zscaler / Palo Alto / etc.) and a non-`*.vercel.app`
host is required.

## TL;DR — recommended path

**Deploy to Railway. It's the closest thing to Vercel in simplicity, gives you
a `*.up.railway.app` URL, and the existing `@vercel/blob` storage keeps working
without any code changes** (Vercel Blob is a service you call via SDK — it
works from any host, you just bring the token).

The only Vercel-specific feature that needs replacing is the daily cron job.
Cheapest fix: a free external cron pinger (cron-job.org) hitting
`/api/cron/check-overdue` once a day.

Everything is already wired up in this branch:
- `Dockerfile` + `.dockerignore` — for any container host
- `railway.json` — Railway config
- `render.yaml` — Render Blueprint
- `fly.toml` — Fly.io config
- `next.config.ts` — `output: "standalone"` enabled (Vercel ignores it)

---

## What needs to move when leaving Vercel

| Concern | Vercel today | What changes off-Vercel |
|---|---|---|
| Compute (Next.js server) | Vercel Functions | New host runs `npm run start` |
| Postgres database | Neon (separate service) | **No change** — Neon stays as is |
| Image storage (`@vercel/blob`) | Vercel Blob | **No change** — SDK works from any host with the token |
| Daily cron `/api/cron/check-overdue` | Vercel Cron (`vercel.json`) | Replace with host-native cron or cron-job.org |
| Preview/deploy URL | `*.vercel.app` (blocked) | New host's domain |

---

## Option A — Railway (recommended, ~5 minutes)

URL: `https://<your-app>.up.railway.app`

### 1. Sign up & connect repo
1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. **New Project** → **Deploy from GitHub repo** → pick this repo.
3. Railway auto-detects Next.js via Nixpacks and uses `railway.json`.

### 2. Set environment variables
In the Railway service → **Variables** tab, add:

| Key | Value |
|---|---|
| `DATABASE_URL` | Pooled connection string from Neon (same one Vercel uses) |
| `BLOB_READ_WRITE_TOKEN` | Same Vercel Blob token Vercel uses (Vercel → Storage → Blob → `.env.local`) |
| `SEED_SECRET` | Random string (`openssl rand -hex 16`) |
| `CRON_SECRET` | Random string (`openssl rand -hex 16`) |
| `NODE_ENV` | `production` |

Tip: pull the values from Vercel via `npx vercel env pull .env.production.local`
on your laptop, then copy them into Railway.

### 3. Generate a public URL
**Settings** → **Networking** → **Generate Domain**. You'll get something like
`marketplaceamat-production.up.railway.app`. Test it from the corporate network.

### 4. Replace the cron
The `vercel.json` cron is Vercel-only. Two options:

**Easy (free):** [cron-job.org](https://cron-job.org)
- Create a new job, schedule daily at 09:00 (or whenever).
- URL: `https://<your-railway-domain>/api/cron/check-overdue`
- Headers: `Authorization: Bearer <CRON_SECRET>`

**Native:** Railway → **New Service** → **Cron** → schedule `0 9 * * *`,
command:
```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" "$APP_URL/api/cron/check-overdue"
```
(Set `APP_URL` and `CRON_SECRET` as service vars.)

### 5. Seed (one-time)
```
https://<your-railway-domain>/api/admin/seed?secret=<SEED_SECRET>
```

---

## Option B — Render (~5 minutes)

URL: `https://<your-app>.onrender.com`

1. Push this branch to GitHub (already done if you're reading this).
2. [render.com](https://render.com) → **New** → **Blueprint** → connect repo.
3. Render reads `render.yaml` and offers to create:
   - a **Web Service** for the Next.js app
   - a **Cron Job** for the daily sweep
4. Fill in the `sync: false` env vars when prompted (`DATABASE_URL`,
   `BLOB_READ_WRITE_TOKEN`, `SEED_SECRET`, `CRON_SECRET`).
5. After the web service has a URL, set `APP_URL` on the cron service to that URL.
6. Free tier sleeps after 15 min idle (~30s cold start). Fine for an internal
   tool, less so for production.

---

## Option C — Fly.io (~10 minutes, Docker-based)

URL: `https://<your-app>.fly.dev`

Best when you want fine control or other hosts are also blocked. Uses the
`Dockerfile` in this repo.

```bash
# install: https://fly.io/docs/hands-on/install-flyctl/
fly auth login
fly launch --copy-config --no-deploy   # uses fly.toml
fly secrets set \
  DATABASE_URL="<neon pooled url>" \
  BLOB_READ_WRITE_TOKEN="<vercel blob token>" \
  SEED_SECRET="$(openssl rand -hex 16)" \
  CRON_SECRET="$(openssl rand -hex 16)"
fly deploy --build-arg DATABASE_URL="<neon pooled url>"
```

Fly's cron equivalent is **scheduled machines**. Easier path: cron-job.org
hitting `/api/cron/check-overdue` with the bearer token (same as Railway).

---

## Option D — Google Cloud Run (Docker, often unblocked at corporates)

URL: `https://<service>-<hash>-<region>.run.app`

Worth trying because `*.run.app` is rarely blocked — it's Google
infrastructure used widely in enterprises.

```bash
gcloud auth login
gcloud config set project <your-gcp-project>
gcloud run deploy marketplaceamat \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-secrets DATABASE_URL=database-url:latest,BLOB_READ_WRITE_TOKEN=blob-token:latest,SEED_SECRET=seed-secret:latest,CRON_SECRET=cron-secret:latest
```

Cron: **Cloud Scheduler** → HTTP target → `https://<your-run-url>/api/cron/check-overdue`
with header `Authorization: Bearer <CRON_SECRET>`.

---

## Switching image storage off Vercel Blob (optional)

You don't need to do this just to leave Vercel — Vercel Blob works fine from
anywhere with the token. Only do it if you also want to leave the Vercel
ecosystem entirely. Drop-in replacements with S3-compatible APIs:

- **Cloudflare R2** — free tier, no egress fees. Best choice.
- **AWS S3** — standard, paid.
- **Backblaze B2** — cheap.

Both `put` and `del` calls in `src/lib/actions.ts` would need swapping for
the AWS SDK (`@aws-sdk/client-s3`). Around 30 lines of changes total.

---

## If everything is blocked: your own domain

If Railway, Render, Fly.io, and Cloud Run are all blocked from the corporate
network (very rare), the last resort is a custom domain:

1. Buy `<something>.com` from Cloudflare Registrar (~$10/year, no markup).
2. Point it at any of the hosts above (or Vercel itself).
3. Aged domains and `.com` TLDs almost never trigger "Newly Registered Domain"
   firewall rules.

---

## Picking between options

- **You want minimum effort:** Railway.
- **You want native cron + free DB on the same host:** Render.
- **You want Docker control / other hosts are also blocked:** Fly.io.
- **You're already on GCP / want enterprise-friendly URL:** Cloud Run.
