import { test, expect } from "@playwright/test";
import { prisma, makeUser, makeOffer, loginAs, claimOnPage } from "./helpers";

// Authorization here is ownership-based: there are no roles. These tests pin
// that down, because the checks live in Server Actions rather than in a
// middleware layer where they would be easy to spot.
//
// Note on coverage: these exercise the UI and the page-level guards. Invoking a
// Server Action directly with a forged identity is not practical from a test —
// Next requires internal action-id headers — so the server-side ownership
// checks in src/lib/actions.ts are not themselves covered here.

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("only the owner can reach the edit page", async ({ page }) => {
  const owner = await makeUser();
  const stranger = await makeUser();
  const offer = await makeOffer(owner.id);

  await loginAs(page, owner.id);
  await page.goto(`/offers/${offer.id}/edit`);
  await expect(page).toHaveURL(`/offers/${offer.id}/edit`);
  await expect(
    page.getByRole("button", { name: "Mark as Scrapped" }),
  ).toBeVisible();

  // A stranger is bounced back to the read-only offer page.
  await page.context().clearCookies();
  await loginAs(page, stranger.id);
  await page.goto(`/offers/${offer.id}/edit`);
  await expect(page).toHaveURL(`/offers/${offer.id}`);
  await expect(
    page.getByRole("button", { name: "Mark as Scrapped" }),
  ).toHaveCount(0);

  const unchanged = await prisma.offer.findUniqueOrThrow({
    where: { id: offer.id },
  });
  expect(unchanged.status).toBe("AVAILABLE");
});

test("a claim cannot be cancelled by anyone but the claimer", async ({
  page,
}) => {
  const owner = await makeUser();
  const claimer = await makeUser();
  const stranger = await makeUser();
  const offer = await makeOffer(owner.id);

  await loginAs(page, claimer.id);
  await page.goto(`/offers/${offer.id}`);
  await claimOnPage(page, offer.id);

  // Neither the owner nor an unrelated user is shown a cancel control.
  for (const user of [owner, stranger]) {
    await page.context().clearCookies();
    await loginAs(page, user.id);
    await page.goto("/claims");
    await expect(page.getByRole("button", { name: "Cancel" })).toHaveCount(0);
  }

  const still = await prisma.offer.findUniqueOrThrow({
    where: { id: offer.id },
    include: { claim: true },
  });
  expect(still.status).toBe("CLAIMED");
  expect(still.claim?.claimingUserId).toBe(claimer.id);
});
