import type { Page } from "@playwright/test";
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
