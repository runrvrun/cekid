"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function createUlasan(data: {
  title: string;
  permalink: string;
  content: string;
  metaDescription: string;
  status: "DRAFT" | "PUBLISHED";
}) {
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
    if (existing) return { success: false, error: "Permalink sudah digunakan" };

    const ulasan = await prisma.ulasan.create({
      data: {
        title: data.title.trim(),
        permalink: data.permalink.trim(),
        content: data.content,
        metaDescription: data.metaDescription?.trim() || null,
        status: data.status,
        authorId: session.user!.id!,
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      },
    });

    return {
      success: true,
      data: { id: String(ulasan.id), permalink: ulasan.permalink },
    };
  } catch (err) {
    console.error("createUlasan error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menyimpan ulasan",
    };
  }
}
