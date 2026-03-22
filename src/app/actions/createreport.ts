"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function createReport(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Kamu harus login untuk melaporkan." };
  }

  const type = formData.get("type") as string;
  const reason = (formData.get("reason") as string)?.trim();
  const productId = formData.get("productId") as string | null;
  const reviewId = formData.get("reviewId") as string | null;

  if (!reason) {
    return { error: "Alasan laporan tidak boleh kosong." };
  }

  if (type === "PRODUCT" && !productId) {
    return { error: "ID produk tidak ditemukan." };
  }

  if (type === "REVIEW" && !reviewId) {
    return { error: "ID review tidak ditemukan." };
  }

  await prisma.report.create({
    data: {
      type: type as "PRODUCT" | "REVIEW",
      reason,
      productId: productId ? BigInt(productId) : null,
      reviewId: reviewId ? BigInt(reviewId) : null,
      reportedBy: session.user.id,
    },
  });

  return { success: true };
}
