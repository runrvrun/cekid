"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function resolveReport(reportId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
    return { error: "Tidak diizinkan." };
  }

  await prisma.report.update({
    where: { id: BigInt(reportId) },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
      resolvedBy: session.user.id,
    },
  });

  return { success: true };
}
