import { test, expect } from "@playwright/test";
import { prisma, makeUser, makeOffer, loginAs, claimOnPage } from "./helpers";

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("an offer can be claimed and completed, notifying both sides", async ({
  page,
}) => {
  const owner = await makeUser("Maintenance");
  const claimer = await makeUser("Procurement");
  const offer = await makeOffer(owner.id, { estimatedValue: 4200 });

  await loginAs(page, claimer.id);
  await page.goto(`/offers/${offer.id}`);
  await claimOnPage(page, offer.id);

  const claimed = await prisma.offer.findUniqueOrThrow({
    where: { id: offer.id },
    include: { claim: true },
  });
  expect(claimed.status).toBe("CLAIMED");
  expect(claimed.claim?.claimingUserId).toBe(claimer.id);
  expect(claimed.claim?.status).toBe("PENDING");

  // Both parties are told; the owner is given contact details for pickup.
  const ownerNote = await prisma.notification.findFirstOrThrow({
    where: { userId: owner.id },
    orderBy: { createdAt: "desc" },
  });
  expect(ownerNote.body).toContain(claimer.email);
  await expect
    .poll(() => prisma.notification.count({ where: { userId: claimer.id } }))
    .toBeGreaterThan(0);

  // Reload rather than relying on whatever the post-claim navigation left on
  // screen, so this half of the test is about completing and nothing else.
  await page.goto(`/offers/${offer.id}`);
  await page.waitForLoadState("networkidle");
  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "I Received This Item" }).click();
  await expect
    .poll(async () => {
      const o = await prisma.offer.findUniqueOrThrow({ where: { id: offer.id } });
      return o.status;
    })
    .toBe("COMPLETED");

  const completed = await prisma.offer.findUniqueOrThrow({
    where: { id: offer.id },
    include: { claim: true },
  });
  expect(completed.status).toBe("COMPLETED");
  expect(completed.claim?.status).toBe("COMPLETED");
  expect(completed.claim?.completedAt).not.toBeNull();
});

test("an owner is not offered their own item", async ({ page }) => {
  const owner = await makeUser();
  const offer = await makeOffer(owner.id);

  await loginAs(page, owner.id);
  await page.goto(`/offers/${offer.id}`);

  await expect(page.getByRole("button", { name: "Claim this" })).toHaveCount(0);
  await expect(page.getByText("This is your offer")).toBeVisible();
});

test("the dashboard hides your own listings", async ({ page }) => {
  const owner = await makeUser();
  const offer = await makeOffer(owner.id, { itemName: `Mine ${Date.now()}` });

  // Match on the link to the offer rather than its text: the "nothing found"
  // message echoes the search term, which includes the item name.
  const card = page.locator(`a[href^="/offers/${offer.id}"]`);

  await loginAs(page, owner.id);
  await page.goto(`/?q=${encodeURIComponent(offer.itemName)}`);
  await expect(card).toHaveCount(0);

  const other = await makeUser();
  await page.context().clearCookies();
  await loginAs(page, other.id);
  await page.goto(`/?q=${encodeURIComponent(offer.itemName)}`);
  await expect(card.first()).toBeVisible();
});
