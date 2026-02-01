// app/actions/getUserReview.ts
"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function getUserReview(productId: bigint) {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.review.findUnique({
    where: {
      userId_productId: {
        userId: session.user.id,
        productId,
      },
    },
    select: {
      rating: true,
      review: true,
      anonymous: true,
    },
  });
}