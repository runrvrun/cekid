"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateUserName(userId: string, name: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
    return { success: false, error: "Unauthorized" };
  }

  const trimmed = name.trim();
  if (!trimmed) return { success: false, error: "Nama tidak boleh kosong" };

  await prisma.user.update({
    where: { id: userId },
    data: { name: trimmed },
  });

  revalidatePath("/admin/users");
  return { success: true };
}
