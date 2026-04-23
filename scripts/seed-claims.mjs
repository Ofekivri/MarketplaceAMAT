// Seed a couple of claims by Bob so /claims has data for screenshots.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const bob = await prisma.user.findUnique({
  where: { email: "ofek@amat.example" },
});
if (!bob) throw new Error("Run prisma/seed.ts first");

await prisma.claim.deleteMany({ where: { claimingUserId: bob.id } });

// Bring two AVAILABLE offers into Bob's "To Collect"
const liveOffers = await prisma.offer.findMany({
  where: { status: "AVAILABLE", offeringUserId: { not: bob.id } },
  take: 2,
});
for (const offer of liveOffers) {
  await prisma.$transaction([
    prisma.claim.create({
      data: {
        offerId: offer.id,
        claimingUserId: bob.id,
        status: "PENDING",
      },
    }),
    prisma.offer.update({
      where: { id: offer.id },
      data: { status: "CLAIMED" },
    }),
  ]);
}

// Add a historical completed claim by reusing one offer if any remain
const extra = await prisma.offer.findFirst({
  where: { status: "AVAILABLE", offeringUserId: { not: bob.id } },
});
if (extra) {
  await prisma.$transaction([
    prisma.claim.create({
      data: {
        offerId: extra.id,
        claimingUserId: bob.id,
        status: "COMPLETED",
      },
    }),
    prisma.offer.update({
      where: { id: extra.id },
      data: { status: "COMPLETED" },
    }),
  ]);
}

const summary = await prisma.claim.findMany({
  where: { claimingUserId: bob.id },
  select: { status: true },
});
console.log(
  `Seeded ${summary.length} claims for Bob:`,
  summary.map((s) => s.status).join(", "),
);

await prisma.$disconnect();
