import type { PrismaClient } from "@prisma/client";

type SeedOptions = { reset?: boolean };

const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

export async function seedDemoData(
  prisma: PrismaClient,
  opts: SeedOptions = {},
) {
  if (opts.reset) {
    await prisma.notification.deleteMany();
    await prisma.claim.deleteMany();
    await prisma.offer.deleteMany();
    await prisma.user.deleteMany();
  } else {
    const existing = await prisma.user.count();
    if (existing > 0) {
      return { skipped: true, existingUsers: existing };
    }
  }

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "alice@amat.example",
        name: "Alice Cohen",
        department: "Manufacturing B",
        role: "poster",
      },
    }),
    prisma.user.create({
      data: {
        email: "bob@amat.example",
        name: "Bob Levi",
        department: "Procurement",
        role: "claimer",
      },
    }),
    prisma.user.create({
      data: {
        email: "carol@amat.example",
        name: "Carol Mizrahi",
        department: "Maintenance",
        role: "poster",
      },
    }),
    prisma.user.create({
      data: {
        email: "dan@amat.example",
        name: "Dan Peretz",
        department: "Operations",
        role: "claimer",
      },
    }),
    prisma.user.create({
      data: {
        email: "eve@amat.example",
        name: "Eve Shapira",
        department: "R&D",
        role: "claimer",
      },
    }),
  ]);

  const [alice, , carol] = users;

  await prisma.offer.create({
    data: {
      offeringUserId: alice.id,
      itemName: "3x Office Chairs",
      description: "Like new, blue mesh, ergonomic. Bought 6 months ago.",
      quantity: 3,
      condition: "LIKE_NEW",
      location: "Building 2, 3rd Floor",
      scrapDate: daysFromNow(5),
      estimatedValue: 4500,
    },
  });

  await prisma.offer.create({
    data: {
      offeringUserId: carol.id,
      itemName: "2x Electric Motors",
      description: "Working condition, 3-phase, 5HP each.",
      quantity: 2,
      condition: "GOOD",
      location: "Building 1, Basement",
      scrapDate: daysFromNow(3),
      estimatedValue: 8000,
    },
  });

  await prisma.offer.create({
    data: {
      offeringUserId: alice.id,
      itemName: "Tools Set (various)",
      description: "Mixed hand tools, some with surface rust but functional.",
      quantity: 1,
      condition: "FAIR",
      location: "Building 3, Tool Room",
      scrapDate: daysFromNow(1),
      estimatedValue: 1500,
    },
  });

  return { skipped: false, users: users.length, offers: 3 };
}
