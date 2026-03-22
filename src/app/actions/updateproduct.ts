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
    const categoryIds = (formData.getAll("categoryId") as string[])
      .map((s) => BigInt(s))
      .filter(Boolean);
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

      // Update isMain flags on ProductImage
      if (mainImageKey) {
        await tx.productImage.updateMany({
          where: { productId },
          data: { isMain: false },
        });

        if (mainImageKey.startsWith("existing:")) {
          const existingId = BigInt(mainImageKey.slice("existing:".length));
          await tx.productImage.update({
            where: { id: existingId },
            data: { isMain: true },
          });
        } else if (mainImageKey.startsWith("new:")) {
          const newIdx = parseInt(mainImageKey.slice("new:".length));
          const mainUrl = newImageUrls[newIdx];
          if (mainUrl) {
            await tx.productImage.updateMany({
              where: { productId, url: mainUrl },
              data: { isMain: true },
            });
          }
        }
      } else {
        // No main key: ensure at least one image is marked main
        const hasMain = await tx.productImage.findFirst({
          where: { productId, isMain: true },
        });
        if (!hasMain) {
          const first = await tx.productImage.findFirst({
            where: { productId },
            orderBy: { id: "asc" },
          });
          if (first) {
            await tx.productImage.update({
              where: { id: first.id },
              data: { isMain: true },
            });
          }
        }
      }

      // Sync categories: delete existing then re-create
      await tx.productCategory.deleteMany({ where: { productId } });
      if (categoryIds.length > 0) {
        await tx.productCategory.createMany({
          data: categoryIds.map((categoryId) => ({ productId, categoryId })),
          skipDuplicates: true,
        });
      }

      return tx.product.update({
        where: { id: productId },
        data: {
          name,
          slug: slug?.trim(),
          upc: upc?.trim() || null,
          description: description?.trim() || null,
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
