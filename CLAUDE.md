# Project notes for Claude

## Deployment

- Production deploys from branch **`claude/start-building-4qTZN`** (Vercel, `marketplace-amad`).
- Schema changes ship via `prisma db push --accept-data-loss` in the `build` script — no manual migration step.

## Workflow rules

- **Always ask before pushing anything that will land in prod.** That includes:
  - Merging a PR into `claude/start-building-4qTZN`
  - Pushing directly to `claude/start-building-4qTZN`
  - Force-pushing any branch already open in a PR targeting prod
- Pushing feature branches (e.g. `claude/<feature>-XXXX`) to `origin` is fine without asking — they don't reach prod until a PR is merged.
- Open PRs with `claude/start-building-4qTZN` as the base (not `main` — there is no `main`).
