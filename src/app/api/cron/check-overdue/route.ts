import { prisma } from "@/lib/db";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

// Daily sweep: find AVAILABLE offers whose scrapDate has passed without a
// claim, notify the owner once, and stamp overdueNotifiedAt so the next run
// skips them. Triggered by Vercel Cron (see vercel.json).
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const overdue = await prisma.offer.findMany({
    where: {
      status: "AVAILABLE",
      scrapDate: { lt: now },
      overdueNotifiedAt: null,
    },
    include: { offeringUser: true },
  });

  let notified = 0;
  for (const offer of overdue) {
    await notify({
      userId: offer.offeringUserId,
      title: `Deadline passed: ${offer.itemName}`,
      body: `Still have it, or is it gone? Confirm or reschedule on the offer page.`,
      link: `/offers/${offer.id}`,
    });
    await prisma.offer.update({
      where: { id: offer.id },
      data: { overdueNotifiedAt: now },
    });
    notified += 1;
  }

  return Response.json({
    checked: overdue.length,
    notified,
    at: now.toISOString(),
  });
}
