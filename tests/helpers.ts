import { expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

let counter = 0;
const unique = () => `${Date.now()}-${counter++}`;

export async function makeUser(department = "Manufacturing B") {
  const id = unique();
  return prisma.user.create({
    data: {
      email: `test-${id}@example.invalid`,
      name: `Test User ${id}`,
      department,
    },
  });
}

export async function makeOffer(
  offeringUserId: string,
  overrides: Partial<{ itemName: string; estimatedValue: number }> = {},
) {
  const scrapDate = new Date();
  scrapDate.setDate(scrapDate.getDate() + 7);
  return prisma.offer.create({
    data: {
      offeringUserId,
      category: "OTHER",
      subCategory: "General",
      itemName: overrides.itemName ?? `Test Item ${unique()}`,
      description: "Created by the automated test suite.",
      quantity: 1,
      condition: "GOOD",
      location: "Test Location",
      scrapDate,
      estimatedValue: overrides.estimatedValue ?? 5000,
    },
  });
}

/** Signs in by setting the same cookie the mock login screen sets. */
export async function loginAs(page: Page, userId: string) {
  await page.context().addCookies([
    {
      name: "amat_user_id",
      value: userId,
      url: "http://localhost:3000",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

/**
 * Claims the offer currently on screen and waits until it has actually landed.
 *
 * Waiting on the outcome in the database rather than on the URL is deliberate:
 * the success banner strips its own query parameter once it fades, so
 * `?claimed=1` is a transient the test would be racing.
 */
export async function claimOnPage(page: Page, offerId: string) {
  const button = page.getByRole("button", { name: "Claim this" });
  await expect(button).toBeVisible();
  // Clicking mid-hydration submits the form twice: once natively and once
  // through React. The second submission finds the offer already claimed and
  // renders an error page.
  await page.waitForLoadState("networkidle");
  await button.click();
  await expect.poll(() => prisma.claim.count({ where: { offerId } })).toBe(1);
}

/**
 * Recomputes the two headline My Impact figures exactly as
 * src/app/analytics/page.tsx does, so a test can assert on them without
 * scraping the rendered chart.
 */
export async function impactOf(userId: string) {
  const claims = await prisma.claim.findMany({
    where: { claimingUserId: userId },
    include: { offer: true },
  });
  return {
    claimedCount: claims.length,
    claimedValue: claims.reduce((sum, c) => sum + c.offer.estimatedValue, 0),
  };
}
