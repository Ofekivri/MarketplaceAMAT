# SecondLife — MVP

Internal marketplace for Applied Materials Israel: a department posts an item it's about to scrap, other departments see it and can claim it in one click.

> "Brutal Simplicity": post → notify → claim → pickup. That's it.

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** with a Material-style design token palette
- **Prisma** + **PostgreSQL** (Neon in production, Docker locally)
- **Server Actions** for all mutations (no separate REST layer)
- Mock auth (pick-a-user dropdown), in-app notification inbox

LDAP/SSO and real email (SendGrid/Nodemailer) are intentionally deferred — `src/lib/session.ts` and `src/lib/notify.ts` are the seams to swap them in later.

## Run locally

```bash
docker compose up -d        # starts Postgres on localhost:5432
npm install
npx prisma db push          # create the schema
npm run seed                # 5 demo users + 3 sample offers
npm run dev                 # http://localhost:3000
```

The default `.env` already points at the Docker container.

To wipe and reseed:

```bash
npm run db:reset
```

## Demo flow

1. Open http://localhost:3000/login → pick **Alice (Manufacturing B)**.
2. Click **Post Item**, fill in the form, submit. Other departments are notified.
3. Click your name in the header → switch to **Bob (Procurement)**.
4. Open **Inbox** → see the new offer notification.
5. Open the offer, click **Claim this**. Both Alice and Bob get notified.
6. Switch to **My Claims** and click **Mark Received**.
7. Open **Analytics** to see `1 offered, 1 claimed, ₪X saved`.

A scripted version of the same flow:

```bash
node scripts/smoke.mjs
```

## Deploying to Vercel

See [DEPLOY.md](./DEPLOY.md) — ~5 minute setup with Neon Postgres.

## Project layout

```
prisma/
  schema.prisma           User, Offer, Claim, Notification
  seed.ts                 demo data
src/
  app/
    layout.tsx            sidebar + topbar shell
    page.tsx              dashboard (bento grid + asset cards)
    login/page.tsx        mock user picker
    offers/new/page.tsx   "Curate New Asset" form
    offers/[id]/page.tsx  detail + claim/complete buttons
    claims/page.tsx       My Claims (To Collect + Collected history)
    inbox/page.tsx        notification list
    analytics/page.tsx    metrics
  components/
    Sidebar.tsx           left nav (active route highlight)
    TopBar.tsx            search + notifications + user chip
    MobileNav.tsx         bottom nav for small screens
  lib/
    db.ts                 Prisma singleton
    session.ts            cookie-backed mock auth (swap to LDAP later)
    notify.ts             DB-backed notifications (swap to SendGrid later)
    actions.ts            Server Actions: createOffer / claim / cancel / complete
    format.ts             date helpers
scripts/
  smoke.mjs               end-to-end happy-path verification
  seed-claims.mjs         one-off helper to give Bob some demo claims
  snap.mjs                Playwright screenshots of all pages
```

## Out of scope (for the next iteration)

- Real email notifications (the `notify()` seam is ready)
- LDAP / SSO auth (the `session.ts` seam is ready)
- Photo uploads
- Search & filters
- Real-time push (Socket.io)
- ERP integration
- Mobile app / barcode scanning
