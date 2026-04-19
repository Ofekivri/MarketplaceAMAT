# Asset Alert System — MVP

Internal marketplace for Applied Materials Israel: a department posts an item it's about to scrap, other departments see it and can claim it in one click.

> "Brutal Simplicity": post → notify → claim → pickup. That's it.

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** for styling
- **Prisma** + **SQLite** (single file `prisma/dev.db`, zero infra)
- **Server Actions** for all mutations (no separate REST layer)
- Mock auth (pick-a-user dropdown), in-app notification inbox

LDAP/SSO and real email (SendGrid/Nodemailer) are intentionally deferred — `src/lib/session.ts` and `src/lib/notify.ts` are the seams to swap them in later.

## Run locally

```bash
npm install
npx prisma db push      # creates SQLite + tables
npm run seed            # loads 5 demo users + 3 sample offers
npm run dev             # http://localhost:3000
```

To wipe and reseed:

```bash
npm run db:reset
```

## Demo flow

1. Open http://localhost:3000/login → pick **Alice (Manufacturing B)**.
2. Click **+ Post item**, fill in the form, submit. Other departments are notified.
3. Click your name in the header → switch to **Bob (Procurement)**.
4. Open **Inbox** → see the new offer notification.
5. Open the offer, click **Claim this**. Both Alice and Bob get notified.
6. Switch back to Alice or stay as Bob, open the offer, click **Mark picked up**.
7. Open **Analytics** to see `1 offered, 1 claimed, ₪X saved`.

A scripted version of the same flow:

```bash
node scripts/smoke.mjs
```

## Project layout

```
prisma/
  schema.prisma          User, Offer, Claim, Notification
  seed.ts                demo data
src/
  app/
    layout.tsx           top nav + inbox bell
    page.tsx             dashboard (Live / Yours / Claims)
    login/page.tsx       mock user picker
    offers/new/page.tsx  post form
    offers/[id]/page.tsx detail + claim/complete buttons
    inbox/page.tsx       notification list
    analytics/page.tsx   metrics
  lib/
    db.ts                Prisma singleton
    session.ts           cookie-backed mock auth (swap to LDAP later)
    notify.ts            DB-backed notifications (swap to SendGrid later)
    actions.ts           Server Actions: createOffer / claim / complete
    format.ts            date helpers
scripts/
  smoke.mjs              end-to-end happy-path verification
```

## Out of scope (for the next iteration)

- Real email notifications (the `notify()` seam is ready)
- LDAP / SSO auth (the `session.ts` seam is ready)
- Photo uploads
- Search & filters
- Real-time push (Socket.io)
- ERP integration
- Mobile app / barcode scanning
