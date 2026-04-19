import { PrismaClient } from "@prisma/client";
import { seedDemoData } from "../src/lib/seedData";

const prisma = new PrismaClient();

async function main() {
  // CLI seed always resets so it's a deterministic local "fresh start".
  const result = await seedDemoData(prisma, { reset: true });
  if (result.skipped) {
    console.log(`Skipped (${result.existingUsers} users already exist)`);
  } else {
    console.log(`Seeded ${result.users} users and ${result.offers} offers.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
