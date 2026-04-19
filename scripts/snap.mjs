import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function snap() {
  const alice = await prisma.user.findUnique({
    where: { email: "alice@amat.example" },
  });
  const bob = await prisma.user.findUnique({
    where: { email: "bob@amat.example" },
  });

  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    args: ["--ignore-certificate-errors"],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1100, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await ctx.newPage();

  const shots = [
    { url: "http://localhost:3000/", file: "/tmp/01-landing.png", cookie: null, label: "Landing (logged out)" },
    { url: "http://localhost:3000/login", file: "/tmp/02-login.png", cookie: null, label: "Login picker" },
    { url: "http://localhost:3000/", file: "/tmp/03-dashboard-alice.png", cookie: alice.id, label: "Dashboard as Alice (Manufacturing B)" },
    { url: "http://localhost:3000/offers/new", file: "/tmp/04-new-offer.png", cookie: alice.id, label: "Post item form" },
    { url: "http://localhost:3000/", file: "/tmp/05-dashboard-bob.png", cookie: bob.id, label: "Dashboard as Bob (Procurement)" },
    { url: "http://localhost:3000/analytics", file: "/tmp/06-analytics.png", cookie: bob.id, label: "Analytics" },
  ];

  for (const s of shots) {
    await ctx.clearCookies();
    if (s.cookie) {
      await ctx.addCookies([
        {
          name: "amat_user_id",
          value: s.cookie,
          domain: "localhost",
          path: "/",
        },
      ]);
    }
    await page.goto(s.url, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    await page.screenshot({ path: s.file, fullPage: true });
    console.log(`✓ ${s.label} → ${s.file}`);
  }

  await browser.close();
  await prisma.$disconnect();
}

snap().catch((e) => {
  console.error(e);
  process.exit(1);
});
