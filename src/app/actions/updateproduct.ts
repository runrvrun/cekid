"use server";
import prisma from "@/lib/prisma";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { generateEmbedding } from "@/lib/embeddings";

async function uploadImageToBlob(file: File, productName: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[-:.]/g, "_");
  const safeName = productName.replace(/\s+/g, "_");
  const fileName = `products/${timestamp}_${safeName}.jpg`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await put(fileName, buffer, {
    contentType: file.type || "image/jpeg",
    access: "public",
  });
  return uploaded.url;
}

export async function updateProduct(id: BigInt, formData: FormData) {
  try {
    const name = (formData.get("name") as string)?.trim();
    const slug = formData.get("slug") as string;
    const upc = formData.get("upc") as string;
    const description = formData.get("description") as string;
    const newImageFiles = formData.getAll("newImages") as File[];
    // "existing:{id}" | "new:{index}" | null
    const mainImageKey = formData.get("mainImageKey") as string | null;
    const deleteImageIds = (formData.getAll("deleteImageId") as string[]).map((s) => BigInt(s));
    const session = await auth();
    const productId = BigInt(String(id));

    if (!name) {
      return { success: false, error: "Nama Barang wajib diisi." };
    }

    // Upload new images
    const newImageUrls: string[] = [];
    for (const file of newImageFiles) {
      if (file && file.size > 0) {
        try {
          newImageUrls.push(await uploadImageToBlob(file, name));
        } catch {
          return { success: false, error: "Gagal mengunggah gambar" };
        }
      }
    }

    const embedding = await generateEmbedding(name, description);

    const product = await prisma.$transaction(async (tx) => {
      // Delete removed images
      if (deleteImageIds.length > 0) {
        await tx.productImage.deleteMany({
          where: { id: { in: deleteImageIds }, productId },
        });
      }

      // Add new images (not yet marked as main)
      if (newImageUrls.length > 0) {
        await tx.productImage.createMany({
          data: newImageUrls.map((url) => ({ productId, url, isMain: false })),
        });
      }

      // Determine and set the main image
      let mainImageUrl: string | null = null;

      if (mainImageKey) {
        // Clear all main flags for this product
        await tx.productImage.updateMany({
          where: { productId },
          data: { isMain: false },
        });

        if (mainImageKey.startsWith("existing:")) {
          const existingId = BigInt(mainImageKey.slice("existing:".length));
          const img = await tx.productImage.update({
            where: { id: existingId },
            data: { isMain: true },
          });
          mainImageUrl = img.url;
        } else if (mainImageKey.startsWith("new:")) {
          const newIdx = parseInt(mainImageKey.slice("new:".length));
          mainImageUrl = newImageUrls[newIdx] ?? null;
          if (mainImageUrl) {
            await tx.productImage.updateMany({
              where: { productId, url: mainImageUrl },
              data: { isMain: true },
            });
          }
        }
      } else {
        // No main key sent: keep current main, or fall back to first image
        const existingMain = await tx.productImage.findFirst({
          where: { productId, isMain: true },
        });
        if (existingMain) {
          mainImageUrl = existingMain.url;
        } else {
          const firstImage = await tx.productImage.findFirst({
            where: { productId },
            orderBy: { id: "asc" },
          });
          if (firstImage) {
            mainImageUrl = firstImage.url;
            await tx.productImage.update({
              where: { id: firstImage.id },
              data: { isMain: true },
            });
          }
        }
      }

      return tx.product.update({
        where: { id: productId },
        data: {
          name,
          slug: slug?.trim(),
          upc: upc?.trim() || null,
          description: description?.trim() || null,
          image: mainImageUrl,
          embedding,
          userId: session?.user?.id || null,
        },
      });
    });

    return { success: true, data: product, message: "Produk berhasil diubah" };
  } catch (err) {
    console.error("updateProduct error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal mengubah produk",
    };
  }
}
