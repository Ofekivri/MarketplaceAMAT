"use server";

import { prisma } from "./db";
import { requireUser, setCurrentUser } from "./session";
import { notify, notifyAllExcept } from "./notify";
import { isValidCategory, isValidSubCategory } from "./categories";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createOfferAction(formData: FormData) {
  const user = await requireUser();
  const categoryRaw = String(formData.get("category") ?? "").trim();
  const category = isValidCategory(categoryRaw) ? categoryRaw : "OTHER";
  const subCategoryRaw = String(formData.get("subCategory") ?? "").trim();
  const subCategory = isValidSubCategory(category, subCategoryRaw)
    ? subCategoryRaw
    : "";
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
      category,
      subCategory,
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

  const haystack = `${itemName} ${description} ${location}`.toLowerCase();
  const subs = await prisma.searchSubscription.findMany({
    where: { userId: { not: user.id } },
  });
  const matches = subs.filter((s) =>
    haystack.includes(s.query.toLowerCase()),
  );
  await Promise.all(
    matches.map((s) =>
      notify({
        userId: s.userId,
        title: `New match for "${s.query}"`,
        body: `${itemName} just posted by ${user.department} at ${location}.`,
        link: `/offers/${offer.id}`,
      }),
    ),
  );

  revalidatePath("/");
  redirect(`/offers/${offer.id}?posted=1`);
}

export async function createSearchSubscriptionAction(formData: FormData) {
  const user = await requireUser();
  const query = String(formData.get("query") ?? "").trim();
  if (!query) throw new Error("Search text is required");
  const existing = await prisma.searchSubscription.findFirst({
    where: { userId: user.id, query: { equals: query, mode: "insensitive" } },
  });
  if (!existing) {
    await prisma.searchSubscription.create({
      data: { userId: user.id, query },
    });
  }
  revalidatePath("/watchlist");
  redirect("/watchlist");
}

export async function deleteSearchSubscriptionAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.searchSubscription.deleteMany({
    where: { id, userId: user.id },
  });
  revalidatePath("/watchlist");
}

export async function updateOfferAction(formData: FormData) {
  const user = await requireUser();
  const offerId = String(formData.get("offerId") ?? "");
  if (!offerId) throw new Error("Missing offer id");

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { claim: { include: { claimingUser: true } } },
  });
  if (!offer) throw new Error("Offer not found");
  if (offer.offeringUserId !== user.id) {
    throw new Error("Only the owner can edit this offer");
  }
  if (offer.status === "SCRAPPED" || offer.status === "COMPLETED") {
    throw new Error(`Cannot edit a ${offer.status.toLowerCase()} offer`);
  }

  const categoryRaw = String(formData.get("category") ?? "").trim();
  const category = isValidCategory(categoryRaw) ? categoryRaw : offer.category;
  const subCategoryRaw = String(formData.get("subCategory") ?? "").trim();
  const subCategory = isValidSubCategory(category, subCategoryRaw)
    ? subCategoryRaw
    : "";
  const itemName = String(formData.get("itemName") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 1);
  const condition = String(formData.get("condition") ?? "GOOD");
  const location = String(formData.get("location") ?? "").trim();
  const estimatedValue = Number(formData.get("estimatedValue") ?? 0);
  const scrapDateRaw = String(formData.get("scrapDate") ?? "");

  if (!itemName || !location) {
    throw new Error("Item name and location are required");
  }
  const scrapDate = new Date(scrapDateRaw);
  if (Number.isNaN(scrapDate.getTime())) {
    throw new Error("Invalid scrap deadline");
  }

  await prisma.offer.update({
    where: { id: offerId },
    data: {
      category,
      subCategory,
      itemName,
      description,
      quantity,
      condition,
      location,
      scrapDate,
      estimatedValue,
    },
  });

  if (offer.claim && offer.claim.status !== "CANCELLED") {
    await notify({
      userId: offer.claim.claimingUserId,
      title: `Offer updated: ${itemName}`,
      body: `${user.department} updated details for an item you claimed.`,
      link: `/offers/${offerId}`,
    });
  }

  revalidatePath("/");
  revalidatePath(`/offers/${offerId}`);
  revalidatePath(`/offers/${offerId}/edit`);
  redirect(`/offers/${offerId}`);
}

export async function markOfferScrappedAction(formData: FormData) {
  const user = await requireUser();
  const offerId = String(formData.get("offerId") ?? "");
  if (!offerId) throw new Error("Missing offer id");

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { claim: true },
  });
  if (!offer) throw new Error("Offer not found");
  if (offer.offeringUserId !== user.id) {
    throw new Error("Only the owner can scrap this offer");
  }
  if (offer.status === "SCRAPPED") return;

  const ops = [
    prisma.offer.update({
      where: { id: offerId },
      data: { status: "SCRAPPED" },
    }),
  ];
  if (offer.claim && offer.claim.status !== "CANCELLED" && offer.claim.status !== "COMPLETED") {
    ops.push(
      prisma.claim.update({
        where: { id: offer.claim.id },
        data: { status: "CANCELLED" },
      }) as never,
    );
  }
  await prisma.$transaction(ops);

  if (offer.claim && offer.claim.status !== "CANCELLED" && offer.claim.status !== "COMPLETED") {
    await notify({
      userId: offer.claim.claimingUserId,
      title: `Offer scrapped: ${offer.itemName}`,
      body: `${user.department} marked this item as scrapped. Your claim was cancelled.`,
      link: `/offers/${offerId}`,
    });
  }

  revalidatePath("/");
  revalidatePath(`/offers/${offerId}`);
  redirect(`/offers/${offerId}`);
}

export async function deleteOfferAction(formData: FormData) {
  const user = await requireUser();
  const offerId = String(formData.get("offerId") ?? "");
  if (!offerId) throw new Error("Missing offer id");

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { claim: true },
  });
  if (!offer) throw new Error("Offer not found");
  if (offer.offeringUserId !== user.id) {
    throw new Error("Only the owner can delete this offer");
  }

  const claimerId =
    offer.claim && offer.claim.status !== "CANCELLED" && offer.claim.status !== "COMPLETED"
      ? offer.claim.claimingUserId
      : null;

  await prisma.$transaction([
    ...(offer.claim ? [prisma.claim.delete({ where: { id: offer.claim.id } })] : []),
    prisma.offer.delete({ where: { id: offerId } }),
  ]);

  if (claimerId) {
    await notify({
      userId: claimerId,
      title: `Offer removed: ${offer.itemName}`,
      body: `${user.department} deleted this item. It's no longer available.`,
    });
  }

  revalidatePath("/");
  redirect("/");
}

export async function addOfferImageAction(formData: FormData) {
  const user = await requireUser();
  const offerId = String(formData.get("offerId") ?? "");
  const file = formData.get("image");
  if (!offerId) throw new Error("Missing offer id");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No image provided");
  }
  if (file.size > 4 * 1024 * 1024) {
    throw new Error("Image must be under 4MB");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }

  const offer = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!offer) throw new Error("Offer not found");
  if (offer.offeringUserId !== user.id) {
    throw new Error("Only the owner can add images");
  }
  if (offer.images.length >= 6) {
    throw new Error("Maximum 6 images per offer");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

  await prisma.offer.update({
    where: { id: offerId },
    data: { images: { push: dataUrl } },
  });

  revalidatePath(`/offers/${offerId}`);
  revalidatePath(`/offers/${offerId}/edit`);
}

export async function removeOfferImageAction(formData: FormData) {
  const user = await requireUser();
  const offerId = String(formData.get("offerId") ?? "");
  const index = Number(formData.get("index") ?? -1);
  if (!offerId || index < 0) throw new Error("Missing offer id or index");

  const offer = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!offer) throw new Error("Offer not found");
  if (offer.offeringUserId !== user.id) {
    throw new Error("Only the owner can remove images");
  }
  if (index >= offer.images.length) throw new Error("Invalid image index");

  const next = offer.images.filter((_, i) => i !== index);
  await prisma.offer.update({
    where: { id: offerId },
    data: { images: { set: next } },
  });

  revalidatePath(`/offers/${offerId}`);
  revalidatePath(`/offers/${offerId}/edit`);
}

export async function setPrimaryOfferImageAction(formData: FormData) {
  const user = await requireUser();
  const offerId = String(formData.get("offerId") ?? "");
  const index = Number(formData.get("index") ?? -1);
  if (!offerId || index < 0) throw new Error("Missing offer id or index");

  const offer = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!offer) throw new Error("Offer not found");
  if (offer.offeringUserId !== user.id) {
    throw new Error("Only the owner can reorder images");
  }
  if (index >= offer.images.length) throw new Error("Invalid image index");
  if (index === 0) return;

  const next = [offer.images[index], ...offer.images.filter((_, i) => i !== index)];
  await prisma.offer.update({
    where: { id: offerId },
    data: { images: { set: next } },
  });

  revalidatePath(`/offers/${offerId}`);
  revalidatePath(`/offers/${offerId}/edit`);
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
