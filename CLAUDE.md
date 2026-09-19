# SecondLife — project notes

An internal marketplace for surplus equipment. Someone lists an item their
department is about to scrap; someone in another department claims it before it
goes to salvage. Design principle from the README: "Brutal Simplicity" —
post → notify → claim → pickup.

Deeper documentation lives in `handoff/`:

- `handoff/DESIGN.md` — screens, flows, permissions, business rules
- `handoff/DATA_MODEL.md` — entities, fields, relationships
- `handoff/IT_REQUIREMENTS.md` — what is needed to run this on company infrastructure

## Stack

- **Next.js 15** (App Router) + **TypeScript** + **React 19**
- **Tailwind CSS** with a Material-style token palette; Material Symbols for icons
- **Prisma 5** + **PostgreSQL**
- **Server Actions** for every mutation — there is no REST API layer
- `sharp` for image compression, `sonner` for toasts
- Node 22

## Structure

```
prisma/
  schema.prisma       User, Offer, Claim, Notification, SearchSubscription(+Match)
  migrations/         versioned schema history, applied by `prisma migrate deploy`
  seed.ts             CLI entry point for demo data
src/
  app/
    layout.tsx        sidebar + topbar shell; server-rendered on every request
    page.tsx          dashboard: search, category filter, sort, pagination
    login/            mock user picker
    offers/new/       posting form
    offers/[id]/      detail, edit, photo management, activity timeline
    my-offers/        own listings grouped by status
    claims/           To Collect / Collected
    watchlist/        saved searches and their matches
    inbox/            notification list
    analytics/        "My Impact" personal dashboard
    api/cron/         daily overdue sweep (Bearer-authenticated)
  components/         Sidebar, TopBar, MobileNav, celebrations, buttons
  lib/
    db.ts             Prisma singleton
    session.ts        cookie-backed mock auth        <- SSO seam
    notify.ts         DB-backed notifications        <- email seam
    storage.ts        image upload/delete            <- object-storage seam
    actions.ts        all Server Actions and all authorization checks
    categories.ts     category / subcategory taxonomy
    format.ts         date and label helpers
public/fonts/         self-hosted Inter + Material Symbols
scripts/              smoke test, screenshot and demo-data helpers
```

## Key decisions

- **Server Actions instead of a REST API.** Every mutation is a function in
  `src/lib/actions.ts`. That file is also where every permission check lives —
  it is the right place to look for authorization questions.
- **Three deliberate seams** for the things a prototype fakes: `session.ts`
  (auth), `notify.ts` (email), `storage.ts` (files). Each is small and has one
  implementation; swapping it is meant to be a single-file change.
- **Authorization is ownership-based, with no roles.** There is no admin. See
  `handoff/DESIGN.md` for the full matrix.
- **Nothing is cached.** The layout and most pages set `dynamic = "force-dynamic"`.
- **Fonts are self-hosted**, so the app makes no outbound browser requests. Do
  not reintroduce a CDN `<link>`; an internal network may block it, which would
  take out every icon in the UI.
- **Schema changes go through migrations** (`prisma/migrations/`), applied by
  `prisma migrate deploy` during the build. Do not use `prisma db push` on this
  branch — it is what the migration setup replaced.

## What works

Posting with photos, the full claim → pickup lifecycle, race-safe claiming,
search and filtering, saved searches with matching, in-app notifications,
owner-side deadline management, the daily overdue sweep, and the personal
impact dashboard.

## What is missing

- **Authentication.** `/login` is a dropdown of all users with no password.
- **Email.** Notifications are in-app only; users learn nothing unless they visit.
- No admin role, audit log, rate limiting or moderation.
- `estimatedValue` has no currency attached, yet drives every analytics figure.
- `handoff/DESIGN.md` lists what the test suite does and does not cover.

## Running locally

```bash
docker compose up -d                    # Postgres on localhost:5432
cp .env.example .env                    # then fill in DATABASE_URL
npm install
npx prisma migrate deploy               # create the schema
npm run seed                            # 5 demo users + 60 sample offers
npm run dev                             # http://localhost:3000
```

Then open `/login` and pick a user. To wipe and reload demo data:
`npm run db:reset`.

Photo upload needs `BLOB_READ_WRITE_TOKEN`; everything else works without it.

## Checks

```bash
npm run lint      # eslint, flat config
npm run build     # includes a type check
npm test          # Playwright, starts the app itself
```

`npm test` writes to the database in `DATABASE_URL`, so point it at a scratch
one. It needs a browser: `npx playwright install chromium`, or set
`CHROMIUM_PATH` to an existing Chrome where downloads are blocked. CI runs all
three on every push (`.github/workflows/ci.yml`).

## Deployment

The prototype deploys from branch **`claude/start-building-4qTZN`** to Vercel
(project `marketplace-amad`). `DEPLOY.md` documents that path and predates the
migration and storage changes on this branch — treat it as historical.

For deployment onto company infrastructure, see `handoff/IT_REQUIREMENTS.md`.

## Workflow rules

- **Always ask before pushing anything that will land in prod.** That includes:
  - Merging a PR into `claude/start-building-4qTZN`
  - Pushing directly to `claude/start-building-4qTZN`
  - Force-pushing any branch already open in a PR targeting prod
- Pushing feature branches (e.g. `claude/<feature>-XXXX`) to `origin` is fine
  without asking — they don't reach prod until a PR is merged.
- Open PRs with `claude/start-building-4qTZN` as the base (not `main` — there is
  no `main`).
