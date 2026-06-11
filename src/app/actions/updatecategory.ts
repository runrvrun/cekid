"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateCategory(id: string, name: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
    return { success: false, error: "Unauthorized" };
  }

  const trimmed = name.trim();
  if (!trimmed) return { success: false, error: "Nama kategori wajib diisi" };

  const existing = await prisma.category.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" }, NOT: { id: BigInt(id) } },
  });
  if (existing) return { success: false, error: "Nama kategori sudah digunakan" };

  await prisma.category.update({
    where: { id: BigInt(id) },
    data: { name: trimmed },
  });

  revalidatePath("/admin/categories");
  return { success: true };
}
