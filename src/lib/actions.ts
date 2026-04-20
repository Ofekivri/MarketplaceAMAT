"use server";

import { prisma } from "./db";
import { requireUser, setCurrentUser } from "./session";
import { notify, notifyAllExcept } from "./notify";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createOfferAction(formData: FormData) {
  const user = await requireUser();
  const itemName = String(formData.get("itemName") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 1);
  const condition = String(formData.get("condition") ?? "GOOD");
  const location = String(formData.get("location") ?? "").trim();
  const daysUntilScrap = Number(formData.get("daysUntilScrap") ?? 5);
  const estimatedValue = Number(formData.get("estimatedValue") ?? 0);

  if (!itemName || !location) {
    throw new Error("Item name and location are required");
  }

  const scrapDate = new Date();
  scrapDate.setDate(scrapDate.getDate() + daysUntilScrap);

  const offer = await prisma.offer.create({
    data: {
      offeringUserId: user.id,
      itemName,
      description,
      quantity,
      condition,
      location,
      scrapDate,
      estimatedValue,
    },
  });

  await notifyAllExcept(user.id, {
    title: `${user.department} is offering ${itemName}`,
    body: `${quantity}x at ${location}. Available until ${scrapDate.toLocaleDateString("en-GB")}.`,
    link: `/offers/${offer.id}`,
  });

  revalidatePath("/");
  redirect(`/offers/${offer.id}`);
}

export async function claimOfferAction(formData: FormData) {
  const user = await requireUser();
  const offerId = String(formData.get("offerId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!offerId) throw new Error("Missing offer id");

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { offeringUser: true },
  });
  if (!offer) throw new Error("Offer not found");
  if (offer.status !== "AVAILABLE") throw new Error("Offer is not available");
  if (offer.offeringUserId === user.id) {
    throw new Error("You cannot claim your own offer");
  }

  await prisma.$transaction([
    prisma.claim.create({
      data: {
        offerId,
        claimingUserId: user.id,
        notes,
        status: "PENDING",
      },
    }),
    prisma.offer.update({
      where: { id: offerId },
      data: { status: "CLAIMED" },
    }),
  ]);

  await notify({
    userId: offer.offeringUserId,
    title: `${user.department} claimed your ${offer.itemName}`,
    body: `Contact ${user.name} (${user.email}) to coordinate pickup at ${offer.location}.`,
    link: `/offers/${offer.id}`,
  });
  await notify({
    userId: user.id,
    title: `You claimed ${offer.itemName}`,
    body: `From ${offer.offeringUser.department}. Pickup at ${offer.location}.`,
    link: `/offers/${offer.id}`,
  });

  revalidatePath("/");
  revalidatePath(`/offers/${offerId}`);
}

export async function cancelClaimAction(formData: FormData) {
  const user = await requireUser();
  const offerId = String(formData.get("offerId") ?? "");
  if (!offerId) throw new Error("Missing offer id");

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { claim: true, offeringUser: true },
  });
  if (!offer || !offer.claim) throw new Error("Offer or claim not found");
  if (offer.claim.claimingUserId !== user.id) {
    throw new Error("Only the claimer can cancel their claim");
  }
  if (offer.claim.status === "COMPLETED") {
    throw new Error("Cannot cancel a completed claim");
  }

  await prisma.$transaction([
    prisma.claim.update({
      where: { id: offer.claim.id },
      data: { status: "CANCELLED" },
    }),
    prisma.offer.update({
      where: { id: offerId },
      data: { status: "AVAILABLE" },
    }),
  ]);

  await notify({
    userId: offer.offeringUserId,
    title: `Claim cancelled: ${offer.itemName}`,
    body: `${user.department} cancelled their claim. Item is back on the marketplace.`,
    link: `/offers/${offer.id}`,
  });

  revalidatePath("/");
  revalidatePath("/claims");
  revalidatePath(`/offers/${offerId}`);
}

export async function completeClaimAction(formData: FormData) {
  const user = await requireUser();
  const offerId = String(formData.get("offerId") ?? "");
  if (!offerId) throw new Error("Missing offer id");

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { claim: true },
  });
  if (!offer || !offer.claim) throw new Error("Offer or claim not found");
  if (offer.claim.claimingUserId !== user.id && offer.offeringUserId !== user.id) {
    throw new Error("Only the offering or claiming user can complete pickup");
  }

  await prisma.$transaction([
    prisma.claim.update({
      where: { id: offer.claim.id },
      data: { status: "COMPLETED" },
    }),
    prisma.offer.update({
      where: { id: offerId },
      data: { status: "COMPLETED" },
    }),
  ]);

  await notify({
    userId: offer.offeringUserId,
    title: `Pickup complete: ${offer.itemName}`,
    body: `Marked as picked up. Item saved from scrap.`,
    link: `/offers/${offer.id}`,
  });
  if (offer.offeringUserId !== offer.claim.claimingUserId) {
    await notify({
      userId: offer.claim.claimingUserId,
      title: `Pickup complete: ${offer.itemName}`,
      body: `Marked as picked up. Thanks for redeploying!`,
      link: `/offers/${offer.id}`,
    });
  }

  revalidatePath("/");
  revalidatePath("/claims");
  revalidatePath(`/offers/${offerId}`);
}

export async function markNotificationReadAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.notification.updateMany({
    where: { id, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/inbox");
}

export async function markAllReadAction() {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/inbox");
}

export async function switchUserAction(formData: FormData) {
  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) return;
  await setCurrentUser(userId);
  revalidatePath("/", "layout");
  redirect("/");
}
