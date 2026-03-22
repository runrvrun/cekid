"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function banUser(
  userId: string,
  options: { deleteContent: boolean }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "Hanya admin yang dapat memban pengguna." };
  }
  if (session.user.id === userId) {
    return { error: "Tidak bisa memban diri sendiri." };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (target?.role === "ADMIN") {
    return { error: "Tidak bisa memban sesama admin." };
  }

  await prisma.$transaction(async (tx) => {
    // Suspend the user
    await tx.user.update({
      where: { id: userId },
      data: { status: "SUSPENDED" },
    });

    // Kill all active sessions so they're signed out immediately
    await tx.session.deleteMany({ where: { userId } });

    if (options.deleteContent) {
      // Soft-delete all products
      await tx.product.updateMany({
        where: { userId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      // Hard-delete all reviews
      await tx.review.deleteMany({ where: { userId } });
    }
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function unbanUser(userId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "Hanya admin yang dapat mengangkat ban pengguna." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: "ACTIVE" },
  });

  revalidatePath("/admin/users");
  return { success: true };
}
