import { test, expect } from "@playwright/test";
import { prisma, makeUser, makeOffer, loginAs, impactOf } from "./helpers";

// Both tests here cover defects that shipped once. Cancelling a claim used to
// keep the claim row and merely flag it CANCELLED, which left the offer
// advertised as available but permanently unclaimable, and left the abandoned
// claim counting towards the claimer's My Impact totals forever.

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("a cancelled item can be claimed by someone else", async ({ page }) => {
  const owner = await makeUser();
  const firstClaimer = await makeUser();
  const secondClaimer = await makeUser();
  const offer = await makeOffer(owner.id);

  await loginAs(page, firstClaimer.id);
  await page.goto(`/offers/${offer.id}`);
  await page.getByRole("button", { name: "Claim this" }).click();
  await page.waitForURL(`**/offers/${offer.id}?claimed=1`);

  await page.goto("/claims");
  await page.getByRole("button", { name: "Cancel" }).first().click();
  await expect
    .poll(async () => {
      const o = await prisma.offer.findUniqueOrThrow({ where: { id: offer.id } });
      return o.status;
    })
    .toBe("AVAILABLE");

  // The offer is on the market again, so a different person must be able to take it.
  await page.context().clearCookies();
  await loginAs(page, secondClaimer.id);
  await page.goto(`/offers/${offer.id}`);
  await page.getByRole("button", { name: "Claim this" }).click();
  await page.waitForURL(`**/offers/${offer.id}?claimed=1`);

  const result = await prisma.offer.findUniqueOrThrow({
    where: { id: offer.id },
    include: { claim: true },
  });
  expect(result.status).toBe("CLAIMED");
  expect(result.claim?.claimingUserId).toBe(secondClaimer.id);
});

test("a cancelled claim stops counting towards My Impact", async ({ page }) => {
  const owner = await makeUser();
  const claimer = await makeUser();
  const offer = await makeOffer(owner.id, { estimatedValue: 18000 });

  expect(await impactOf(claimer.id)).toEqual({
    claimedCount: 0,
    claimedValue: 0,
  });

  await loginAs(page, claimer.id);
  await page.goto(`/offers/${offer.id}`);
  await page.getByRole("button", { name: "Claim this" }).click();
  await page.waitForURL(`**/offers/${offer.id}?claimed=1`);

  expect(await impactOf(claimer.id)).toEqual({
    claimedCount: 1,
    claimedValue: 18000,
  });

  await page.goto("/claims");
  await page.getByRole("button", { name: "Cancel" }).first().click();

  await expect.poll(() => impactOf(claimer.id)).toEqual({
    claimedCount: 0,
    claimedValue: 0,
  });
});

test("scrapping a claimed item clears the claim rather than stranding it", async ({
  page,
}) => {
  const owner = await makeUser();
  const claimer = await makeUser();
  const offer = await makeOffer(owner.id, { estimatedValue: 9000 });

  await loginAs(page, claimer.id);
  await page.goto(`/offers/${offer.id}`);
  await page.getByRole("button", { name: "Claim this" }).click();
  await page.waitForURL(`**/offers/${offer.id}?claimed=1`);

  // The owner scraps it anyway, through the real owner-side control.
  await page.context().clearCookies();
  await loginAs(page, owner.id);
  await page.goto(`/offers/${offer.id}/edit`);
  await page.getByRole("button", { name: "Mark as Scrapped" }).click();

  await expect
    .poll(async () => {
      const o = await prisma.offer.findUniqueOrThrow({ where: { id: offer.id } });
      return o.status;
    })
    .toBe("SCRAPPED");

  // The claimer never received the item, so it must not count as their impact.
  expect(await impactOf(claimer.id)).toEqual({
    claimedCount: 0,
    claimedValue: 0,
  });
});
