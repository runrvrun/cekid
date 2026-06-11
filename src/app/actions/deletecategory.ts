"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function deleteCategory(id: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
    return { success: false, error: "Unauthorized" };
  }

  await prisma.category.delete({ where: { id: BigInt(id) } });

  revalidatePath("/admin/categories");
  return { success: true };
}
