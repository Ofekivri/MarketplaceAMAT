// Bulk-extend every active offer's scrapDate by 30 days from today,
// and revive SCRAPPED offers back to AVAILABLE. Skips COMPLETED.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const newScrapDate = new Date();
newScrapDate.setDate(newScrapDate.getDate() + 30);

const [revived, extended] = await prisma.$transaction([
  prisma.offer.updateMany({
    where: { status: "SCRAPPED" },
    data: {
      scrapDate: newScrapDate,
      status: "AVAILABLE",
      scrappedAt: null,
      overdueNotifiedAt: null,
    },
  }),
  prisma.offer.updateMany({
    where: { status: { in: ["AVAILABLE", "CLAIMED"] } },
    data: { scrapDate: newScrapDate },
  }),
]);

console.log(`Revived ${revived.count} SCRAPPED offers`);
console.log(`Extended ${extended.count} AVAILABLE/CLAIMED offers`);
console.log(`New scrapDate: ${newScrapDate.toISOString()}`);

await prisma.$disconnect();
