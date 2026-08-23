"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateCategory(
  id: string,
  name: string,
  parentId?: string | null
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
    return { success: false, error: "Unauthorized" };
  }

  const trimmed = name.trim();
  if (!trimmed) return { success: false, error: "Nama kategori wajib diisi" };

  const categoryId = BigInt(id);

  const existing = await prisma.category.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" }, NOT: { id: categoryId } },
  });
  if (existing) return { success: false, error: "Nama kategori sudah digunakan" };

  let parentIdBigInt: bigint | null = null;
  if (parentId) {
    if (BigInt(parentId) === categoryId) {
      return { success: false, error: "Kategori tidak boleh menjadi induk dirinya sendiri" };
    }
    const [parent, childCount] = await Promise.all([
      prisma.category.findUnique({ where: { id: BigInt(parentId) } }),
      prisma.category.count({ where: { parentId: categoryId } }),
    ]);
    if (!parent) return { success: false, error: "Kategori induk tidak ditemukan" };
    if (parent.parentId) {
      return { success: false, error: "Kategori induk tidak boleh punya induk lagi (maks. 2 tingkat)" };
    }
    if (childCount > 0) {
      return {
        success: false,
        error: "Kategori ini punya subkategori, tidak bisa dijadikan subkategori dari kategori lain",
      };
    }
    parentIdBigInt = parent.id;
  }

  await prisma.category.update({
    where: { id: categoryId },
    data: { name: trimmed, parentId: parentIdBigInt },
  });

  revalidatePath("/admin/categories");
  return { success: true };
}
