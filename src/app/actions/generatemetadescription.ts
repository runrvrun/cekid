"use server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function generateMetaDescription(content: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
    return { success: false as const, error: "Unauthorized" };
  }

  if (!content.trim()) {
    return { success: false as const, error: "Tulis konten artikel terlebih dahulu" };
  }

  const plainText = content
    .replace(/<[^>]*>/g, " ")
    .replace(/\[product slug=[^\]]+\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3000);

  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "user",
        content: `Buat meta description SEO untuk artikel review produk berikut.

Syarat:
- Panjang 150-160 karakter (hitung dengan tepat)
- Bahasa Indonesia yang natural dan menarik
- Mengandung keyword produk utama
- Mendorong pengguna untuk mengklik
- Jangan gunakan tanda kutip
- Kembalikan teks meta description saja, tanpa penjelasan apapun

Konten artikel:
${plainText}`,
      },
    ],
    max_tokens: 80,
  });

  const text = (response.choices[0]?.message?.content?.trim() ?? "").slice(0, 160);
  return { success: true as const, text };
}
