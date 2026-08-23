"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function dismissReviewPrompt() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { lastViewedProductDismissed: true },
  });

  return { success: true };
}
