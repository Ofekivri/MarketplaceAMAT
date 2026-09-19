# Design: screens, flows, permissions, business rules

Everything below is transcribed from the code as it stands, not from an intended
design. Where the code and the product intent appear to diverge, that is called
out rather than smoothed over.

The product is called **SecondLife**: a department posts an item it is about to
scrap, other departments see it and claim it in one click. The stated design
principle in the README is "Brutal Simplicity": post → notify → claim → pickup.

## Users and permissions

There is **no authentication**. `/login` shows a dropdown of every user in the
database; picking one sets an `amat_user_id` cookie (httpOnly, 30 days,
`secure` in production). Anyone who can reach the site can act as anyone.
Replacing this is the single largest piece of work before real use —
`src/lib/session.ts` is the seam, and `getCurrentUser()` / `requireUser()` are
the only two functions the rest of the app calls.

**There are no roles.** Every user has identical capabilities. Authorization is
decided per action by ownership of the row:

| Action | Who may do it |
|---|---|
| View the marketplace | Any logged-in user |
| Post an item | Any logged-in user |
| Claim an item | Any logged-in user **except** the item's owner |
| Cancel a claim | Only the user who made the claim, and not once completed |
| Mark pickup complete | The owner **or** the claimer |
| Edit, delete, scrap, reschedule an item | Only the owner |
| Add, remove, reorder photos | Only the owner |
| Edit at all | Blocked once the item is `SCRAPPED` or `COMPLETED` |

Every one of these checks is enforced server-side in `src/lib/actions.ts`, not
merely hidden in the UI — that part is sound. What is missing is any notion of
an administrator, a moderator, or a departmental approver. Nobody can edit or
remove another person's listing, including to take down something inappropriate.

## Screens

| Route | Name | What it shows |
|---|---|---|
| `/` | Dashboard | The marketplace. Every `AVAILABLE` offer **not** owned by the current user |
| `/login` | Mock login | User picker. No password |
| `/offers/new` | Curate New Asset | The posting form |
| `/offers/[id]` | Offer detail | Photos, specs, activity timeline, and the claim / complete / owner controls |
| `/offers/[id]/edit` | Edit offer | Owner-only edit form and photo management |
| `/my-offers` | My Offers | The current user's own listings, grouped by status |
| `/claims` | My Claims | "To Collect" and "Collected" |
| `/watchlist` | Watchlist | Saved searches and their unread matches |
| `/inbox` | Inbox | The 100 most recent notifications |
| `/analytics` | My Impact | A personal, not company-wide, contribution dashboard |

Shell: a left sidebar, a topbar with search, a notification bell and the user
switcher, and a bottom nav on mobile. Layout is server-rendered on every
request (`dynamic = "force-dynamic"`, `revalidate = 0`) — nothing is cached.

### Dashboard behaviour

- Shows only `AVAILABLE` offers, and never your own.
- Search matches case-insensitively against item name, description and location.
- Filter by category chips, each with a live count.
- Sort by deadline soonest (default), value highest, or recently posted.
- Pagination: 24 per page in grid view, 20 in list view.
- If a search returns nothing, a "Notify me" button offers to save it as a
  watchlist subscription.
- A banner states that everything is free — no budget, PO or transfer charge —
  and that listed values are reference only.

## The core flow

1. **Post.** The owner fills in name, description, category/subcategory,
   quantity, condition, location, estimated value, up to 6 photos, and a scrap
   deadline (quick presets or an explicit date; default 5 days out).
2. **Match.** On creation the item's name + description + location are matched
   against every *other* user's saved searches. Each hit creates a watchlist
   match and an inbox notification.
3. **Claim.** Another user opens the item and clicks Claim, optionally with a
   note. The offer flips to `CLAIMED`. The owner is notified and is given the
   claimer's **name and email** to arrange pickup; the claimer gets a
   confirmation. The app never schedules the pickup itself — coordination
   happens over email or in person.
4. **Complete.** Either party marks the pickup done. Offer becomes `COMPLETED`,
   the claim gets a `completedAt`, both parties are notified, and a celebration
   popup appears.

### Claiming is race-safe

Two people clicking Claim at the same moment cannot both win. The action runs
in a transaction that flips the status with a conditional `updateMany` guarded
on `status: "AVAILABLE"`, and a unique constraint on `Claim.offerId` backs it
up at the database level. The loser gets "Offer is not available". This is
genuinely well built.

### Cancelling returns the item to the market

Cancelling a claim deletes the claim row and sets the offer back to
`AVAILABLE`, so anyone else can take it. This used to mark the row `CANCELLED`
instead, which left the offer advertised as available but permanently
unclaimable — the unique `offerId` rejected every later claim — and left the
abandoned claim inflating the claimer's My Impact totals forever. Both are
covered by regression tests.

## Owner-side lifecycle controls

- **Extend the deadline** by 1–365 days, measured from the later of today or
  the current deadline, so extending an already-overdue item pushes it forward
  from today. An explicit future date can be set instead. Extending clears the
  overdue stamp so the owner can be reminded again.
- **Mark scrapped.** Sets `SCRAPPED` and `scrappedAt`, cancels any live claim
  and notifies the claimer.
- **Delete.** Removes the offer and its claim outright, notifying an active
  claimer. Photos in object storage are not cleaned up on delete — only on
  individual photo removal.

## Deadlines and the daily sweep

`GET /api/cron/check-overdue` runs once a day (09:00 UTC on Vercel Cron today).
It finds offers that are still `AVAILABLE`, whose `scrapDate` has passed, and
that have not yet been flagged; notifies the owner once each; and stamps
`overdueNotifiedAt` so the next run skips them. The endpoint requires
`Authorization: Bearer $CRON_SECRET`.

Overdue items are **not** automatically scrapped or hidden. They keep showing
on the dashboard with an "expired" indicator until the owner acts. Whether that
is the desired behaviour is a product decision worth confirming.

## Notification rules

All notifications are database rows shown in the in-app inbox. **No email is
ever sent** — `src/lib/notify.ts` writes the row and logs a line to the server
console. Users only find out by visiting the site, which materially limits a
"post → notify → claim" product and should be weighed when planning the pilot.

Notifications fire on: a new offer matching a saved search; your item being
claimed; your claim being registered; a claim on your item being cancelled; an
item you claimed being edited, scrapped or deleted; pickup completion (both
parties); and a passed deadline on your own listing.

## My Impact metrics

A per-user dashboard, not a company report. Definitions, all from
`src/app/analytics/page.tsx`:

- **Value rehomed** = the value of your own offers that reached `CLAIMED` or
  `COMPLETED`, plus the value of every item you have claimed. Note this counts
  both sides of your own activity and is not comparable to a company total.
- **Quarterly delta** compares this calendar quarter to the previous one.
- **Rank** positions you against every user by value this quarter.
- **Badges**: First Rescue (1 claim), Generous Giver (5 posts),
  Sustainability Champ ($10k diverted), Century Club ($100k).
- **Kg diverted** = value × 0.025.

> That 0.025 is a hard-coded constant in the source with no derivation. It is a
> plausible-looking sustainability figure produced by multiplying a money
> estimate by an invented factor. Do not put it in front of management or an
> ESG team without replacing it with a defensible number.

## Things the code shows are unfinished

- Authentication and any concept of an administrator.
- Email — the `notify()` seam exists and is unused.
- `PICKUP_SCHEDULED` is a claim status nothing ever sets.
- No audit log, rate limiting, or moderation path.
- `estimatedValue` has no currency attached anywhere in the model.

## Test coverage

`npm test` runs a Playwright suite against a real browser and a real database,
covering the path the product depends on: claim, complete, cancel and re-claim,
scrapping a claimed item, the ownership rules, and that two simultaneous claims
cannot both succeed. The tests drive the actual UI and Server Actions rather
than mocking them.

Not covered: posting through the form including photo upload, watchlist
matching, the overdue sweep, and the My Impact calculations beyond the two
headline figures. Invoking a Server Action with a forged identity is also not
covered — Next requires internal action-id headers — so the ownership checks
inside `src/lib/actions.ts` are verified only through the interface.
