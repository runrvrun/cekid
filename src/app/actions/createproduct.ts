"use server";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { auth } from "@/lib/auth";

export async function createProduct(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const upc = formData.get("upc") as string;
    const description = formData.get("description") as string;
    const imageFile = formData.get("image") as File;
    const session = await auth();


    if (!name?.trim()) {
      return { success: false, error: "Nama Barang wajib diisi." };
    }

    let imageUrl: string | null = null;

    // Handle image upload if provided
    if (imageFile && imageFile.size > 0) {
      try {
        const timestamp = new Date().toISOString().replace(/[-:.]/g, "_");
        const fileName = `${timestamp}_${name.replace(/\s+/g, "_")}.jpg`;
        const uploadDir = join(process.cwd(), "public", "products");

        // Ensure directory exists
        await mkdir(uploadDir, { recursive: true });

        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const filePath = join(uploadDir, fileName);
        await writeFile(filePath, buffer);

        imageUrl = `/products/${fileName}`;
      } catch (uploadErr) {
        console.error("Image upload failed:", uploadErr);
        return {
          success: false,
          error: "Gagal mengunggah gambar",
        };
      }
    }

    // Create product in database
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        upc: upc?.trim() || null,
        description: description?.trim() || null,
        image: imageUrl,
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