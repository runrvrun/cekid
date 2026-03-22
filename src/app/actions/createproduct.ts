"use server";
import prisma from "@/lib/prisma";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { generateEmbedding } from "@/lib/embeddings";
import { sendAdminNotification } from "@/lib/sendadminnotif";

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

export async function createProduct(formData: FormData) {
  try {
    const name = (formData.get("name") as string)?.trim();
    const slug = formData.get("slug") as string;
    const upc = formData.get("upc") as string;
    const description = formData.get("description") as string;
    const imageFiles = formData.getAll("images") as File[];
    const mainImageIndex = parseInt((formData.get("mainImageIndex") as string) ?? "0") || 0;
    const categoryIds = (formData.getAll("categoryId") as string[])
      .map((s) => BigInt(s))
      .filter(Boolean);
    const session = await auth();

    if (!name) {
      return { success: false, error: "Nama Barang wajib diisi." };
    }

    // Upload all images
    const imageUrls: string[] = [];
    for (const file of imageFiles) {
      if (file && file.size > 0) {
        try {
          imageUrls.push(await uploadImageToBlob(file, name));
        } catch {
          return { success: false, error: "Gagal mengunggah gambar" };
        }
      }
    }

    const safeMainIndex = imageUrls.length > 0
      ? Math.min(mainImageIndex, imageUrls.length - 1)
      : 0;
    const embedding = await generateEmbedding(name, description);

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          name,
          slug,
          upc: upc?.trim() || null,
          description: description?.trim() || null,
          embedding,
          userId: session?.user?.id || null,
        },
      });

      if (imageUrls.length > 0) {
        await tx.productImage.createMany({
          data: imageUrls.map((url, i) => ({
            productId: p.id,
            url,
            isMain: i === safeMainIndex,
          })),
        });
      }

      if (categoryIds.length > 0) {
        await tx.productCategory.createMany({
          data: categoryIds.map((categoryId) => ({ productId: p.id, categoryId })),
          skipDuplicates: true,
        });
      }

      return p;
    });

    await sendAdminNotification({
      subject: "New product created on enakga",
      message: `Product: ${name}<br/>Description: ${description}`,
    });

    return { success: true, data: { slug: product.slug }, message: "Produk berhasil ditambahkan" };
  } catch (err) {
    console.error("createProduct error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menambah produk",
    };
  }
}
