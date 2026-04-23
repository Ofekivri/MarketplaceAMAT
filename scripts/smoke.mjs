// Smoke test: exercise the offer → claim → complete flow against the seeded DB.
// Uses Prisma directly (bypasses Server Actions / cookies) to validate
// the data model and notification fan-out.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Reset state for a deterministic run
  await prisma.notification.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.offer.deleteMany();

  const alice = await prisma.user.findUnique({
    where: { email: "yaniv@amat.example" },
  });
  const bob = await prisma.user.findUnique({
    where: { email: "ofek@amat.example" },
  });
  if (!alice || !bob) throw new Error("Seed users missing");

  // 1. Alice posts
  const scrapDate = new Date();
  scrapDate.setDate(scrapDate.getDate() + 5);
  const offer = await prisma.offer.create({
    data: {
      offeringUserId: alice.id,
      itemName: "Smoke Test Chairs",
      description: "test",
      quantity: 3,
      condition: "LIKE_NEW",
      location: "Building 2",
      scrapDate,
      estimatedValue: 4500,
    },
  });
  const others = await prisma.user.findMany({
    where: { id: { not: alice.id } },
    select: { id: true },
  });
  await prisma.notification.createMany({
    data: others.map((u) => ({
      userId: u.id,
      title: `${alice.department} is offering Smoke Test Chairs`,
      body: "test",
      link: `/offers/${offer.id}`,
    })),
  });
  console.log(`✓ Posted offer ${offer.id}, fan-out to ${others.length} users`);

  // 2. Bob claims
  await prisma.$transaction([
    prisma.claim.create({
      data: { offerId: offer.id, claimingUserId: bob.id, status: "PENDING" },
    }),
    prisma.offer.update({
      where: { id: offer.id },
      data: { status: "CLAIMED" },
    }),
    prisma.notification.create({
      data: {
        userId: alice.id,
        title: `${bob.department} claimed your Smoke Test Chairs`,
        body: "test",
        link: `/offers/${offer.id}`,
      },
    }),
    prisma.notification.create({
      data: {
        userId: bob.id,
        title: "You claimed Smoke Test Chairs",
        body: "test",
        link: `/offers/${offer.id}`,
      },
    }),
  ]);
  console.log(`✓ Bob claimed; offer status flipped`);

  // 3. Mark complete
  const claim = await prisma.claim.findUnique({ where: { offerId: offer.id } });
  await prisma.$transaction([
    prisma.claim.update({
      where: { id: claim.id },
      data: { status: "COMPLETED" },
    }),
    prisma.offer.update({
      where: { id: offer.id },
      data: { status: "COMPLETED" },
    }),
  ]);
  console.log(`✓ Marked complete`);

  // 4. Verify analytics totals
  const offers = await prisma.offer.findMany();
  const claimed = offers.filter((o) =>
    ["CLAIMED", "COMPLETED"].includes(o.status),
  ).length;
  const valueSaved = offers
    .filter((o) => ["CLAIMED", "COMPLETED"].includes(o.status))
    .reduce((s, o) => s + o.estimatedValue, 0);
  console.log(
    `→ Analytics: ${offers.length} offered, ${claimed} claimed, ₪${valueSaved} saved`,
  );

  // 5. Verify notifications
  const aliceInbox = await prisma.notification.count({
    where: { userId: alice.id },
  });
  const bobInbox = await prisma.notification.count({
    where: { userId: bob.id },
  });
  console.log(`→ Inboxes: Alice=${aliceInbox}, Bob=${bobInbox}`);

  if (offers.length !== 1 || claimed !== 1 || valueSaved !== 4500) {
    throw new Error("Smoke test assertions failed");
  }
  if (aliceInbox < 1 || bobInbox < 2) {
    throw new Error("Notification assertions failed");
  }
  console.log("\n✅ Smoke test passed");
}

main()
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
