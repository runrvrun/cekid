"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function addProductUpc(productId: string, upc: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Anda harus masuk untuk menambahkan barcode." };
  }

  const trimmed = upc.trim();
  if (!trimmed) {
    return { error: "Barcode tidak valid." };
  }

  const product = await prisma.product.findUnique({
    where: { id: BigInt(productId) },
    select: { upc: true },
  });

  if (!product) {
    return { error: "Produk tidak ditemukan." };
  }
  if (product.upc) {
    return { error: "Produk ini sudah memiliki barcode." };
  }

  await prisma.product.update({
    where: { id: BigInt(productId) },
    data: { upc: trimmed },
  });

  revalidatePath("/[slug]", "page");
  return { success: true };
}
