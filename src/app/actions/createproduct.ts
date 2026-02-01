"use server";
import prisma from "@/lib/prisma";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { generateEmbedding } from "@/lib/embeddings";

export async function createProduct(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const upc = formData.get("upc") as string;
    const description = formData.get("description") as string;
    const imageFile = formData.get("image") as File;
    const session = await auth();

    if (!name?.trim()) {
      return { success: false, error: "Nama Barang wajib diisi." };
    }

    let imageUrl: string | null = null;

    // Upload image using Vercel Blob
    if (imageFile && imageFile.size > 0) {
      try {
        const timestamp = new Date().toISOString().replace(/[-:.]/g, "_");
        const safeName = name.replace(/\s+/g, "_");
        const fileName = `products/${timestamp}_${safeName}.jpg`;

        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploaded = await put(fileName, buffer, {
          contentType: imageFile.type || "image/jpeg",
          access: "public", // image becomes publicly accessible
        });

        imageUrl = uploaded.url; // URL from blob storage

      } catch (uploadErr) {
        console.error("Image upload failed:", uploadErr);
        return {
          success: false,
          error: "Gagal mengunggah gambar",
        };
      }
    }

    // Generate embedding for the product
     const embedding = await generateEmbedding(
    name,
    description
  );

    // Save product to database
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        slug: slug,
        upc: upc?.trim() || null,
        description: description?.trim() || null,
        image: imageUrl,
        embedding: embedding,
        userId: session?.user?.id || null,
      },
    });

    return {
      success: true,
      data: product,
      message: "Produk berhasil ditambahkan",
    };

  } catch (err) {
    console.error("createProduct error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menambah produk",
    };
  }
}
