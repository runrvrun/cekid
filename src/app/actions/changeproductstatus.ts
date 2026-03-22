"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function changeProductStatus(
  productId: string,
  newStatus: "ACTIVE" | "PENDING" | "INACTIVE"
) {
  const session = await auth();
  if (
    session?.user?.role !== "ADMIN" &&
    session?.user?.role !== "MODERATOR"
  ) {
    return { error: "Tidak diizinkan." };
  }

  await prisma.product.update({
    where: { id: BigInt(productId) },
    data: { status: newStatus },
  });

  revalidatePath("/admin/products");
  return { success: true };
}
