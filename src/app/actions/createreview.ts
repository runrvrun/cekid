"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * Add a review for a product.
 * Expects FormData with:
 * - product_id (required)
 * - rating (required, integer 1-5)
 * - text (optional)
 * - reviewer (optional)
 *
 * When adding a review:
 * - a new reviews row is created
 * - product.review_count is incremented by 1
 * - product.rating_sum is incremented by rating
 * - product.rating is recalculated = rating_sum / review_count
 */
export async function createReview(formData: FormData) {
  try {
    const rawProductId = formData.get("productId");
    const reviewRating = formData.get("rating");
    const reviewComment = (formData.get("review") as string) ?? null;
    const reviewer = (await auth())?.user?.id || null;

    const productId = rawProductId === null ? NaN : Number(String(rawProductId));
    const rating = reviewRating === null ? NaN : parseInt(String(reviewRating), 10);

    if (!Number.isInteger(productId) || Number.isNaN(productId)) {
      return { success: false, error: "Produk tidak valid" };
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return { success: false, error: "Rating harus antara 1 dan 5" };
    }

    // Use interactive transaction so the increment + average calculation is atomic
    const result = await prisma.$transaction(async (tx) => {
      // ensure product exists and not deleted
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { id: true },
      });
      if (!product) {
        throw new Error("Produk tidak ditemukan");
      }

      const review = await tx.review.create({
        data: {
          productId: productId,
          rating,
          review: reviewComment,
          userId: reviewer,
        },
      });

      // increment counters and get updated sums/counts
      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          reviewCount: { increment: 1 },
          ratingSum: { increment: rating },
        },
        select: {
          id: true,
          reviewCount: true,
          ratingSum: true,
        },
      });

      const rc = updated.reviewCount ?? 0;
      const rs = updated.ratingSum ?? 0;
      const newRating = rc > 0 ? Number((rs / rc).toFixed(2)) : 0;

      const finalProduct = await tx.product.update({
        where: { id: productId },
        data: {
          rating: newRating,
        },
      });

      return { review, product: finalProduct };
    });

    return {
      success: true,
      data: result,
      message: "Review berhasil ditambahkan",
    };
  } catch (err) {
    console.error("addReview error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menambah review",
    };
  }
}