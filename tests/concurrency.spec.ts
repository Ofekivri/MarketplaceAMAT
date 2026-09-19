import { test, expect } from "@playwright/test";
import { prisma, makeUser, makeOffer, loginAs } from "./helpers";

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("two people claiming at the same moment cannot both win", async ({
  browser,
}) => {
  const owner = await makeUser();
  const first = await makeUser();
  const second = await makeUser();
  const offer = await makeOffer(owner.id);

  const open = async (userId: string) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, userId);
    await page.goto(`/offers/${offer.id}`);
    await expect(page.getByRole("button", { name: "Claim this" })).toBeVisible();
    return { context, page };
  };

  const a = await open(first.id);
  const b = await open(second.id);

  // Both have the page open and click without either reloading first.
  const submit = (p: (typeof a)["page"]) =>
    p
      .getByRole("button", { name: "Claim this" })
      .click()
      .then(() => p.waitForLoadState("networkidle"));
  await Promise.allSettled([submit(a.page), submit(b.page)]);

  await expect
    .poll(() => prisma.claim.count({ where: { offerId: offer.id } }))
    .toBe(1);

  const claims = await prisma.claim.findMany({ where: { offerId: offer.id } });
  expect([first.id, second.id]).toContain(claims[0].claimingUserId);

  const result = await prisma.offer.findUniqueOrThrow({
    where: { id: offer.id },
  });
  expect(result.status).toBe("CLAIMED");

  await a.context.close();
  await b.context.close();
});

test("the database refuses a second claim on the same offer", async () => {
  const owner = await makeUser();
  const first = await makeUser();
  const second = await makeUser();
  const offer = await makeOffer(owner.id);

  await prisma.claim.create({
    data: { offerId: offer.id, claimingUserId: first.id, status: "PENDING" },
  });

  // The unique constraint on Claim.offerId is what makes the race above safe.
  // If it is ever relaxed, this fails before anyone double-claims in production.
  await expect(
    prisma.claim.create({
      data: { offerId: offer.id, claimingUserId: second.id, status: "PENDING" },
    }),
  ).rejects.toMatchObject({ code: "P2002" });
});
