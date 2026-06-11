"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function deleteUlasan(id: string) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.ulasan.delete({ where: { id: BigInt(id) } });
    revalidatePath("/admin/ulasan");

    return { success: true };
  } catch (err) {
    console.error("deleteUlasan error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menghapus ulasan",
    };
  }
}
