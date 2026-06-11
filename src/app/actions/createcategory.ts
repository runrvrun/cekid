"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createCategory(name: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
    return { success: false, error: "Unauthorized" };
  }

  const trimmed = name.trim();
  if (!trimmed) return { success: false, error: "Nama kategori wajib diisi" };

  const existing = await prisma.category.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" } },
  });
  if (existing) return { success: false, error: "Kategori sudah ada" };

  const category = await prisma.category.create({
    data: { name: trimmed },
    select: { id: true, name: true },
  });

  revalidatePath("/admin/categories");
  return { success: true, data: { id: String(category.id), name: category.name } };
}
