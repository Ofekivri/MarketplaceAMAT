// Idempotent migration: convert the 5 canonical demo users to their current
// email + name. Runs as part of the Vercel build so prod picks up the rename
// without a DB reset. After every user has been migrated, subsequent runs
// match 0 rows and become a no-op.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const mapping = [
  { oldEmail: "alice@amat.example", email: "yaniv@amat.example", name: "Yaniv Wollman" },
  { oldEmail: "bob@amat.example",   email: "ofek@amat.example",  name: "Ofek Ivri" },
  { oldEmail: "carol@amat.example", email: "eli@amat.example",   name: "Eli Shemesh" },
  { oldEmail: "dan@amat.example",   email: "adam@amat.example",  name: "Adam Medos" },
  { oldEmail: "eve@amat.example",   email: "eigor@amat.example", name: "Eigor Shishov" },
];

try {
  for (const { oldEmail, email, name } of mapping) {
    const result = await prisma.user.updateMany({
      where: { email: oldEmail },
      data: { email, name },
    });
    console.log(`[sync-user-names] ${oldEmail} -> ${email} / ${name} (${result.count} row${result.count === 1 ? "" : "s"})`);
  }
} catch (err) {
  // Don't block the build on a transient DB issue.
  console.warn("[sync-user-names] skipped:", err?.message ?? err);
} finally {
  await prisma.$disconnect();
}
