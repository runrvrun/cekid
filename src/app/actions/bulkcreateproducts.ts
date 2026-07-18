"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateEmbedding } from "@/lib/embeddings";
import { detectProductFromImage } from "@/lib/productdetect";
import { uploadImageToBlob } from "@/lib/blob";
import { revalidatePath } from "next/cache";

type BulkResult = {
  fileName: string;
  success: boolean;
  name?: string;
  slug?: string;
  error?: string;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base || "produk";
  let suffix = 1;
  while (await prisma.product.findUnique({ where: { slug }, select: { id: true } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

export async function bulkCreateProducts(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
    return { error: "Tidak diizinkan." };
  }

  const files = (formData.getAll("images") as File[]).filter(
    (f) => f && f.size > 0
  );
  if (files.length === 0) {
    return { error: "Tidak ada gambar yang diunggah." };
  }

  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
  });
  const categoryNames = categories.map((c) => c.name);

  const results: BulkResult[] = [];

  for (const file of files) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");

      const detected = await detectProductFromImage(
        base64,
        file.type,
        categoryNames
      );

      const name = detected.name?.trim();
      if (!name) {
        results.push({
          fileName: file.name,
          success: false,
          error: "AI tidak dapat mendeteksi nama produk dari foto ini.",
        });
        continue;
      }

      const slug = await uniqueSlug(slugify(name));
      const imageUrl = await uploadImageToBlob(file, name);
      const embedding = await generateEmbedding(name, detected.description ?? "");

      const matchedCategoryIds = detected.categories
        .map((suggested) =>
          categories.find(
            (c) => c.name.toLowerCase() === suggested.toLowerCase()
          )
        )
        .filter((c): c is { id: bigint; name: string } => c !== undefined)
        .map((c) => c.id);

      const product = await prisma.$transaction(async (tx) => {
        const p = await tx.product.create({
          data: {
            name,
            slug,
            description: detected.description?.trim() || null,
            embedding,
            userId: session?.user?.id || null,
            status: "ACTIVE",
          },
        });

        await tx.productImage.create({
          data: { productId: p.id, url: imageUrl, isMain: true },
        });

        if (matchedCategoryIds.length > 0) {
          await tx.productCategory.createMany({
            data: matchedCategoryIds.map((categoryId) => ({
              productId: p.id,
              categoryId,
            })),
            skipDuplicates: true,
          });
        }

        return p;
      });

      results.push({ fileName: file.name, success: true, name, slug: product.slug });
    } catch (err) {
      console.error("bulkCreateProducts error:", file.name, err);
      results.push({
        fileName: file.name,
        success: false,
        error: err instanceof Error ? err.message : "Gagal membuat produk",
      });
    }
  }

  revalidatePath("/admin/products");
  return { results };
}
