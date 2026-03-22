"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function changeRole(userId: string, newRole: "USER" | "MODERATOR" | "ADMIN") {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "Hanya admin yang dapat mengubah role." };
  }
  if (session.user.id === userId) {
    return { error: "Tidak bisa mengubah role diri sendiri." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  revalidatePath("/admin/users");
  return { success: true };
}
