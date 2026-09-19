# Data model

Source of truth: `prisma/schema.prisma`. The database is PostgreSQL; there is no
mock or in-memory layer — every screen reads and writes real rows.

## Entity overview

```
User 1──* Offer          a user posts surplus items
User 1──* Claim          a user claims someone else's item
Offer 1──1 Claim         at most one live claim per offer (DB-enforced)
User 1──* Notification   in-app inbox messages
User 1──* SearchSubscription 1──* SearchSubscriptionMatch *──1 Offer
```

## User

A person who can post or claim items. Created only by the seed script today —
there is no sign-up screen, because authentication is not implemented yet
(see `handoff/IT_REQUIREMENTS.md`).

| Field | Type | Notes |
|---|---|---|
| `id` | String | Primary key, `cuid()` |
| `email` | String | **Unique.** The natural key to match against a corporate directory when SSO is added |
| `name` | String | Display name |
| `department` | String | Free text. Shown on cards and in notifications; the closest thing to an org unit |
| `createdAt` | DateTime | |

There is **no password, no role and no permission field.** Authorization is
derived entirely from ownership of a row — see `handoff/DESIGN.md`.

## Offer

An item someone is about to scrap and is offering internally first.

| Field | Type | Notes |
|---|---|---|
| `id` | String | Primary key, `cuid()` |
| `offeringUserId` → `User` | String | Owner. Only this user may edit, delete, scrap or reschedule |
| `category` | String | One of the ids in `src/lib/categories.ts`, default `OTHER` |
| `subCategory` | String | Must belong to the chosen category; invalid values are silently stored as `""` |
| `itemName` | String | Required |
| `description` | String | |
| `quantity` | Int | |
| `condition` | String | `LIKE_NEW` \| `GOOD` \| `FAIR` \| `POOR`. Displayed as Excellent / Good / Fair / Salvage |
| `location` | String | Required. Free text, e.g. "Building 2, 3rd Floor" |
| `scrapDate` | DateTime | The deadline after which the item goes to salvage |
| `estimatedValue` | Int | Whole currency units. Drives every analytics figure — see the currency note below |
| `status` | String | `AVAILABLE` \| `CLAIMED` \| `COMPLETED` \| `SCRAPPED` |
| `images` | String[] | Ordered list of image URLs; the first is the thumbnail. Max 6 |
| `createdAt` / `updatedAt` | DateTime | |
| `scrappedAt` | DateTime? | Set when the owner marks the item scrapped |
| `overdueNotifiedAt` | DateTime? | Stamped by the daily sweep so the owner is nagged only once. Cleared when the deadline is extended |

Indexed on `category` and `status` — the two columns the dashboard filters by.

## Claim

A request to take an offered item. One row per offer, enforced by a unique
constraint on `offerId`; this is what makes concurrent claims safe.

| Field | Type | Notes |
|---|---|---|
| `id` | String | Primary key, `cuid()` |
| `offerId` → `Offer` | String | **Unique** — an offer can never have two claims |
| `claimingUserId` → `User` | String | Cannot be the offer's owner |
| `status` | String | `PENDING` \| `PICKUP_SCHEDULED` \| `COMPLETED` \| `CANCELLED` |
| `notes` | String? | Optional message from the claimer to the owner |
| `createdAt` / `updatedAt` | DateTime | |
| `completedAt` | DateTime? | Set when pickup is confirmed |

> **`PICKUP_SCHEDULED` is never written by any code path.** Claims are created
> as `PENDING` and move to `COMPLETED` or `CANCELLED`. Two queries still read it,
> so it is harmless, but it is an unimplemented state rather than a live one.
> Either build the scheduling step or drop the value.

> **Known defect — cancelling a claim makes the offer permanently unclaimable.**
> `cancelClaimAction` keeps the claim row and flips it to `CANCELLED`, then sets
> the offer back to `AVAILABLE`. The offer reappears on the dashboard, but the
> unique constraint on `offerId` means the next `claim.create` fails with a
> Prisma `P2002`, which the catch block reports to the user as "Offer is not
> available". So a cancelled item looks claimable to everyone and can never be
> claimed again.
>
> Both plausible fixes are small but they are different products: delete the
> claim row on cancel (simple, loses the audit trail) or replace the unique
> constraint with a partial index over live claims only (keeps history, needs a
> migration). This has been left alone deliberately — pick one before a pilot.

## Notification

An in-app inbox message. Nothing is emailed — see `src/lib/notify.ts`.

| Field | Type | Notes |
|---|---|---|
| `id` | String | Primary key, `cuid()` |
| `userId` → `User` | String | Recipient |
| `title` / `body` | String | Plain text, composed at the call site |
| `link` | String? | Relative in-app path, e.g. `/offers/<id>` |
| `readAt` | DateTime? | `null` = unread; drives the topbar badge |
| `createdAt` | DateTime | Inbox shows the 100 most recent |

Notification bodies embed the claimer's **name and email** so the owner can
arrange pickup. That is the only place personal data is copied into another
table — relevant to any privacy review.

## SearchSubscription and SearchSubscriptionMatch

A saved search ("tell me when someone posts a vacuum pump") and the offers that
matched it.

**SearchSubscription**

| Field | Type | Notes |
|---|---|---|
| `id` | String | Primary key, `cuid()` |
| `userId` → `User` | String | Indexed |
| `query` | String | Raw search text, matched case-insensitively |
| `createdAt` | DateTime | |

**SearchSubscriptionMatch**

| Field | Type | Notes |
|---|---|---|
| `id` | String | Primary key, `cuid()` |
| `subscriptionId` → `SearchSubscription` | String | Cascade delete |
| `offerId` → `Offer` | String | Cascade delete |
| `dismissedAt` | DateTime? | "Not what I searched for" hides it without deleting |
| `createdAt` | DateTime | |

Unique on `(subscriptionId, offerId)` so one offer matches a saved search once.

## Two things to decide before go-live

**Currency.** `estimatedValue` is a plain integer with no currency attached. The
schema previously commented "in NIS" while every screen renders it with a `$`.
The comment has been removed rather than guessing. Every analytics number —
value rehomed, the quarterly delta, the leaderboard, the badge thresholds
($10k / $100k) — is denominated in whatever this field means, so the unit needs
to be fixed deliberately and stated in the UI.

**Status values are plain strings, not database enums.** Prisma validates
nothing here and neither does Postgres; a typo in a future code path would be
stored happily. Converting the four status columns to real enums is a small,
contained change and a reasonable thing to do before the data matters.
