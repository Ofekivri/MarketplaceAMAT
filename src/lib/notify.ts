import { prisma } from "./db";

type NotifyInput = {
  userId: string;
  title: string;
  body: string;
  link?: string;
};

export async function notify(input: NotifyInput) {
  const notification = await prisma.notification.create({ data: input });
  console.log(
    `[notify] -> user=${input.userId} title="${input.title}" link=${input.link ?? "-"}`,
  );
  return notification;
}

export async function notifyAllExcept(
  excludeUserId: string,
  payload: Omit<NotifyInput, "userId">,
) {
  const others = await prisma.user.findMany({
    where: { id: { not: excludeUserId } },
    select: { id: true },
  });
  await Promise.all(
    others.map((u) => notify({ userId: u.id, ...payload })),
  );
}
