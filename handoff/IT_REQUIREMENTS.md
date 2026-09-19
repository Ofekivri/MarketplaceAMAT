# IT requirements for running SecondLife internally

This document is written to be handed to an infrastructure or platform team as
the request for what the application needs. It describes a small internal web
application currently running as a prototype on external hosting, which we want
to move onto company infrastructure.

## What the application is

An internal marketplace for surplus equipment. An employee lists an item their
department is about to scrap; employees in other departments can see it and
claim it before it goes to salvage. Usage is read-heavy and low volume — this
is an intranet tool measured in hundreds of listings, not a public site.

It is a standard server-rendered web application. No message queue, no cache
layer, no background worker pool, no third-party SaaS dependency at runtime.

## Platform requirements

| Need | Requirement | Notes |
|---|---|---|
| Runtime | **Node.js 22.x** | Pinned in `package.json`. The app listens on port 3000 by default |
| Database | **PostgreSQL 14 or newer** | One database. Uses a native array column, so Postgres specifically — not SQL Server or MySQL |
| Object storage | S3-compatible bucket, Azure Blob container, or a writable file share | Stores offer photos. Currently ~a few hundred KB per item, 6 photos max, already compressed to WebP server-side |
| TLS | HTTPS termination in front of the app | The session cookie is issued with the `secure` flag in production, so the app will not work over plain HTTP |
| Scheduler | A daily HTTP call (see below) | Any cron, Windows Task Scheduler job, or platform scheduler |
| Outbound internet at runtime | **None required** | Deliberately removed; see "Work already completed" |
| Outbound internet at build time | Access to an npm registry | The internal Artifactory/Nexus mirror is fine — dependencies are all public packages |

Sizing: a single small application instance and a small Postgres instance are
ample. There is no horizontal-scale requirement; if the app is run as more than
one instance, note that sessions are cookie-based and hold no server state, so
that works without sticky sessions.

## Authentication — the main decision to make

**The application currently has no authentication at all.** The login screen is
a dropdown listing every user, and picking one assumes that identity. This was
deliberate for a prototype and is the single blocking item before any real use.

What we need from IT is an integration path — SAML, OIDC, or LDAP against the
corporate directory, whichever is standard here. On the application side, the
work is contained: a single module (`src/lib/session.ts`) exposes
`getCurrentUser()` and the rest of the application calls only that. User records
are matched by email address, so the directory needs to supply at minimum an
email, a display name, and ideally a department.

Related gaps worth knowing about before a security review: there is no
administrator role, no audit log, and no rate limiting. Any authenticated user
can post and claim, and only the owner of a listing can modify it — including
the fact that nobody can take down someone else's inappropriate listing.

## The scheduled job

Once a day the application needs one HTTP request. It finds listings whose
deadline has passed without a claim and notifies the owner.

```
GET https://<host>/api/cron/check-overdue
Authorization: Bearer <CRON_SECRET>
```

Any scheduler can do this — for example:

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  https://<host>/api/cron/check-overdue
```

The job is idempotent: running it twice in a day notifies nobody twice. Missing
a day delays reminders but corrupts nothing.

## Environment variables

Names only; see `.env.example` in the repository root. These must be supplied as
environment variables to the running process — the application reads nothing
from a config file.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string |
| `CRON_SECRET` | Yes | Shared secret for the scheduled job above |
| `BLOB_READ_WRITE_TOKEN` | Yes, while on the current storage | Credential for the image store |
| `IMAGE_HOST` | When storage moves | Hostname permitted to serve images |

`DATABASE_URL` and `BLOB_READ_WRITE_TOKEN` are credentials and should come from
whatever secret store is standard here, not from a checked-in file.

## Deployment

```bash
npm ci                 # install dependencies
npm run build          # generates the DB client, applies migrations, builds
npm start              # serves on port 3000
```

Database schema changes are applied by `prisma migrate deploy`, which runs as
part of `npm run build`. It is forward-only and idempotent, and it will not drop
data. Migrations are committed to the repository under `prisma/migrations/`.

Two notes for whoever runs the first deployment:

- **Against a brand-new empty database**, the build applies the initial
  migration and creates the schema. Nothing else is needed.
- **Against the existing prototype database**, which was created by an older
  mechanism, the schema already exists and must be marked as such once, before
  the first deploy: `npx prisma migrate resolve --applied 0_init`. Skipping this
  makes the first deploy fail on "table already exists".

If containerised deployment is preferred, adding `output: "standalone"` to
`next.config.ts` produces a self-contained bundle and is a one-line change.

## Work already completed to remove external dependencies

The prototype ran on Vercel and relied on several of its features. The following
has already been changed so the application can run anywhere:

- **Fonts and icons are served by the application itself.** The prototype loaded
  them from `fonts.googleapis.com`. On a network that blocks it, every icon in
  the interface would have rendered as raw text. There are now no outbound
  requests to the internet from a user's browser.
- **Image storage is isolated behind one module** (`src/lib/storage.ts`) with an
  upload and a delete function. Moving from the current provider to S3, Azure
  Blob or an internal share is a change to that one file plus its credentials —
  no other code refers to the storage provider.
- **Schema changes now use versioned migrations.** The prototype re-derived the
  schema on every deployment with a command that could silently drop columns and
  data. That is gone.
- **The image host is configurable** via `IMAGE_HOST` rather than hard-coded.
- **A database-wiping administrative endpoint was removed.** The prototype
  exposed a URL that would delete every record, authenticated by a secret passed
  as a query parameter. Test data is now loaded from the command line instead.

## What is still outstanding

| Item | Type | Notes |
|---|---|---|
| Authentication / SSO | **Blocking** | No auth exists today |
| Image storage implementation | **Blocking if photos are used** | One module to write once the target store is chosen |
| Email notifications | Product gap | Notifications are in-app only; users must visit the site to learn anything. `src/lib/notify.ts` is the seam |
| A defect in claim cancellation | Bug | Documented in `handoff/DATA_MODEL.md`; needs a decision before a pilot |
| Automated tests and CI | Engineering hygiene | Neither exists today |
| Data retention and privacy review | Compliance | The application stores employee names, emails and departments, and copies name and email into notification text |
| Backup policy | Ops | Standard Postgres backups; the object store holds the photos and needs its own |

## Estimated footprint

- One application instance, one small Postgres database, one storage bucket.
- No inbound internet exposure required — this is intended to be internal only.
- No licensing cost: all dependencies are open-source and publicly available.
