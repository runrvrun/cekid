"use server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";

export async function uploadUlasanImage(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
    return { success: false, error: "Unauthorized" };
  }

  const file = formData.get("image") as File;
  if (!file || file.size === 0) {
    return { success: false, error: "Tidak ada file yang dipilih" };
  }

  const timestamp = new Date().toISOString().replace(/[-:.]/g, "_");
  const ext = file.type === "image/png" ? "png" : "jpg";
  const fileName = `ulasan/${timestamp}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const uploaded = await put(fileName, buffer, {
    contentType: file.type || "image/jpeg",
    access: "public",
  });

  return { success: true, url: uploaded.url };
}
