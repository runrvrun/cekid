"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateEmbedding } from "@/lib/embeddings";
import { sendAdminNotification } from "@/lib/sendadminnotif";
import { uploadImageToBlob } from "@/lib/blob";
import { parseNutritionFormData, hasNutritionData } from "@/lib/nutritionform";
import { calculateNutriLevel } from "@/lib/nutrigrade";

export async function createProduct(formData: FormData) {
  try {
    const name = (formData.get("name") as string)?.trim();
    const slug = formData.get("slug") as string;
    const upc = formData.get("upc") as string;
    const description = formData.get("description") as string;
    const imageFiles = formData.getAll("images") as File[];
    const mainImageIndex = parseInt((formData.get("mainImageIndex") as string) ?? "0") || 0;
    const nutritionImageFile = formData.get("nutritionImage") as File | null;
    const categoryIds = (formData.getAll("categoryId") as string[])
      .map((s) => BigInt(s))
      .filter(Boolean);
    const nutrition = parseNutritionFormData(formData);
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

    let nutritionImageUrl: string | null = null;
    if (nutritionImageFile && nutritionImageFile.size > 0) {
      try {
        nutritionImageUrl = await uploadImageToBlob(nutritionImageFile, name);
      } catch {
        return { success: false, error: "Gagal mengunggah foto label gizi" };
      }
    }

    const safeMainIndex = imageUrls.length > 0
      ? Math.min(mainImageIndex, imageUrls.length - 1)
      : 0;
    const embedding = await generateEmbedding(name, description);
    const isAdmin =
      session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR";

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          name,
          slug,
          upc: upc?.trim() || null,
          description: description?.trim() || null,
          embedding,
          userId: session?.user?.id || null,
          status: isAdmin ? "ACTIVE" : "PENDING",
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

      if (nutritionImageUrl) {
        await tx.productImage.create({
          data: {
            productId: p.id,
            url: nutritionImageUrl,
            isMain: false,
            kind: "NUTRITION_LABEL",
          },
        });
      }

      if (categoryIds.length > 0) {
        await tx.productCategory.createMany({
          data: categoryIds.map((categoryId) => ({ productId: p.id, categoryId })),
          skipDuplicates: true,
        });
      }

      if (hasNutritionData(nutrition)) {
        await tx.productNutrition.create({
          data: {
            productId: p.id,
            servingSizeValue: nutrition.servingSizeValue,
            servingSizeUnit: nutrition.servingSizeUnit,
            sugarPerServing: nutrition.sugarPerServing,
            sodiumPerServing: nutrition.sodiumPerServing,
            saturatedFatPerServing: nutrition.saturatedFatPerServing,
            sugarPer100: nutrition.sugarPer100,
            sodiumPer100: nutrition.sodiumPer100,
            saturatedFatPer100: nutrition.saturatedFatPer100,
            extra: nutrition.extra.length > 0 ? nutrition.extra : undefined,
            nutriLevel: calculateNutriLevel(nutrition),
          },
        });
      }

      return p;
    });

    await sendAdminNotification({
      subject: "New product created on beliga.id",
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
