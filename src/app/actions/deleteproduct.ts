"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function deleteProduct(id: string) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.product.update({
      where: { id: BigInt(id) },
      data: { deletedAt: new Date() },
    });

    revalidatePath("/admin/products");
    revalidatePath("/[slug]", "page");

    return { success: true };
  } catch (err) {
    console.error("deleteProduct error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menghapus produk",
    };
  }
}
