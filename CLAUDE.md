# CLAUDE.md

## Workflow preferences

- **Always open a PR after pushing a feature branch.** After `git push`, open a pull request from the feature branch to the repo's default branch (`claude/start-building-4qTZN`) without being asked. Include a Summary and Test plan in the body.
- Default branch for PRs: `claude/start-building-4qTZN` (not `main`).
- Deployment: Vercel auto-deploys from the default branch — merging a PR ships to production at https://marketplace-amad.vercel.app.

## Repo conventions

- Styling uses Material You tokens: `bg-surface-container-lowest`, `text-on-surface`, `text-on-surface-variant`, `bg-primary`, `bg-tertiary`, etc. Avoid raw Tailwind grays on new pages.
- Shared display helpers live in `src/lib/display.ts` (`iconFor`, `conditionBadge`, `offerStatusColor`). Reuse, don't duplicate.
- Formatting helpers live in `src/lib/format.ts` (`formatDate`, `daysUntil`, `formatCondition`, `formatRelative`).
- Auth: `getCurrentUser()` from `src/lib/session.ts`. Redirect to `/login` when no session.
- Filters that scope data to the current user go on the server-side Prisma query, never client-side.
