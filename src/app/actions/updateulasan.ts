"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function updateUlasan(
  id: string,
  data: {
    title: string;
    permalink: string;
    content: string;
    metaDescription: string;
    status: "DRAFT" | "PUBLISHED";
  }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
      return { success: false, error: "Unauthorized" };
    }

    if (!data.title.trim()) return { success: false, error: "Judul wajib diisi" };
    if (!data.permalink.trim()) return { success: false, error: "Permalink wajib diisi" };

    const existing = await prisma.ulasan.findUnique({
      where: { permalink: data.permalink.trim() },
    });
    if (existing && String(existing.id) !== id) {
      return { success: false, error: "Permalink sudah digunakan" };
    }

    const current = await prisma.ulasan.findUnique({ where: { id: BigInt(id) } });
    if (!current) return { success: false, error: "Ulasan tidak ditemukan" };

    const publishedAt =
      data.status === "PUBLISHED" && !current.publishedAt
        ? new Date()
        : current.publishedAt;

    await prisma.ulasan.update({
      where: { id: BigInt(id) },
      data: {
        title: data.title.trim(),
        permalink: data.permalink.trim(),
        content: data.content,
        metaDescription: data.metaDescription?.trim() || null,
        status: data.status,
        publishedAt,
      },
    });

    return { success: true, data: { permalink: data.permalink.trim() } };
  } catch (err) {
    console.error("updateUlasan error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memperbarui ulasan",
    };
  }
}
